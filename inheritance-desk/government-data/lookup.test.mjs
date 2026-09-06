import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { loadCatalog, createLookup, lookupGuidance } from './lookup.mjs';

const data = loadCatalog();
const engine = createLookup(data);
const lookup = q => engine.lookup({ asOf: '2026-09-03', ...q });

test('all 36 state/UT names, codes and registered aliases resolve', () => {
  assert.equal(data.states.filter(s => s.type === 'state').length,28);
  assert.equal(data.states.filter(s => s.type === 'ut').length,8);
  for (const state of data.states) for (const alias of [state.name,state.code,...state.aliases]) {
    assert.equal(engine.normalizeState(alias)?.code,state.code,alias);
  }
});
test('every state × asset category returns useful output without an external service', () => {
  for (const state of data.states) for (const type of data.assetTypes) {
    const r = lookup({ assetState:state.code,assetType:type.id });
    assert.ok(!['invalid_input','invalid_state','catalog_unavailable'].includes(r.status),`${state.code}/${type.id}`);
    assert.ok(r.next_action);
    assert.equal(r.execution_available,false);
  }
});
test('normalization handles whitespace and historical labels, but does not guess unknown states', () => {
  assert.equal(engine.normalizeState('  TAMILNADU  ').code,'TN');
  assert.equal(engine.normalizeState('Orissa').code,'OD');
  assert.equal(engine.normalizeState('IN-KA').code,'KA');
  assert.equal(lookup({ assetState:'Karnatak' }).status,'invalid_state');
  assert.equal(lookup({ assetState:'', userState:'KA' }).jurisdiction_state,null);
});
test('asset state is independent of user residence and other properties', () => {
  const queries = ['DL','TN','KA'].map(assetState => ({ assetState,userState:'MH' }));
  assert.deepEqual(queries.map(q => lookup(q).jurisdiction_state),['Delhi','Tamil Nadu','Karnataka']);
});
test('legal-heir route uses deceased residence, never asset/user state', () => {
  const base = { service:'legal_heir_certificate',assetState:'KA',userState:'MH' };
  const missing = lookup(base);
  assert.equal(missing.jurisdiction_state,null);
  assert.ok(missing.questions.some(q => q.field==='deceasedState'));
  const matched=lookup({...base,deceasedState:'TN',deceasedDistrict:'Chennai'});
  assert.equal(matched.jurisdiction_state,'Tamil Nadu');
  assert.deepEqual(matched.procedures.map(p=>p.id),['tn-chennai-heirs']);
  assert.equal(lookup({...base,deceasedState:'TN',deceasedDistrict:'Madurai'}).procedures.length,0);
});
test('death registration uses place of occurrence and withholds steps when context is missing', () => {
  const r=lookup({service:'death_registration',assetState:'DL',userState:'TN',deathState:'KA'});
  assert.equal(r.jurisdiction_state,'Karnataka');
  assert.ok(r.questions.some(q=>q.field==='deathDistrict'));
  assert.deepEqual(r.procedures[0].steps,[]);
});
test('South Delhi is scoped to district and revenue-land record', () => {
  const base={assetState:'DL',assetDistrict:'South Delhi',recordType:'revenue_land'};
  assert.ok(lookup(base).procedures.some(p=>p.id==='dl-south-land'));
  assert.ok(!lookup(base).questions.some(q=>q.field==='authority'),'Do not request MCD context for a known revenue-land record');
  assert.ok(!lookup({...base,assetDistrict:'North Delhi'}).procedures.some(p=>p.id==='dl-south-land'));
  assert.ok(!lookup({...base,recordType:'municipal_tax',authority:'NDMC'}).procedures.some(p=>p.id==='dl-south-land'||p.id==='dl-mcd-tax'));
  assert.ok(lookup({...base,recordType:'municipal_tax',authority:'MCD'}).procedures.some(p=>p.id==='dl-mcd-tax'));
});
test('bank-specific example does not leak into another bank', () => {
  const base={assetType:'bank_deposit',nomineeStatus:'registered',holdingMode:'sole',courtOrderStatus:'none',willStatus:'none'};
  assert.ok(lookup({...base,institution:'Central Bank of India'}).procedures.some(p=>p.id==='central-bank-nominee'));
  const other=lookup({...base,institution:'State Bank of India'});
  assert.ok(!other.procedures.some(p=>p.id==='central-bank-nominee'));
  assert.equal(other.jurisdiction_basis,'institution_or_scheme');
});
test('stale catalogue exposes sources but withholds actionable steps and document examples', () => {
  const r=lookup({service:'legal_heir_certificate',deceasedState:'TN',deceasedDistrict:'Chennai',asOf:'2027-01-01'});
  assert.equal(r.status,'review_due');
  assert.equal(r.procedures[0].steps.length,0);
  assert.ok(r.procedures[0].sources.length);
});
test('dispute and foreign assets cannot become executable instructions', () => {
  const r=lookup({service:'legal_heir_certificate',deceasedState:'TN',deceasedDistrict:'Chennai',hasDispute:true});
  assert.equal(r.status,'professional_review');assert.deepEqual(r.procedures[0].steps,[]);
  assert.equal(lookup({country:'United States',assetState:'California'}).status,'outside_india');
});
test('missing, malformed and non-government directory targets have explicit fallbacks', () => {
  for (const state of data.states.filter(s=>s.portal_status!=='listed_not_individually_checked')) {
    const r=lookup({assetState:state.code});assert.equal(r.directory.portal_url,null);assert.ok(r.directory.fallback_url);
  }
});
test('input validation and catalogue validation fail safely', () => {
  assert.equal(engine.lookup(null).status,'invalid_input');
  assert.equal(engine.lookup([]).status,'invalid_input');
  assert.equal(lookup({asOf:'2026-02-30'}).status,'invalid_input');
  assert.equal(lookup({assetType:'made_up'}).status,'invalid_input');
  assert.equal(lookup({hasDispute:'false'}).status,'invalid_input');
  const broken=structuredClone(data);broken.procedures[0].source_ids=['absent'];
  assert.throws(()=>createLookup(broken));
  assert.ok(lookupGuidance({assetState:'KA'}).status);
});
test('downloaded source documents are present and match their recorded hashes', () => {
  for (const source of data.sources.filter(s=>s.snapshot_status==='downloaded')) {
    const file=new URL(source.snapshot_path,import.meta.url);
    assert.ok(existsSync(file));
    const hash=createHash('sha256').update(readFileSync(file)).digest('hex');
    assert.equal(hash,source.sha256,source.id);
  }
});
test('all published data and original documents match the integrity manifest', () => {
  const manifest=JSON.parse(readFileSync(new URL('./integrity.json',import.meta.url),'utf8'));
  for (const [path,expected] of Object.entries(manifest.files)) {
    assert.equal(createHash('sha256').update(readFileSync(new URL(path,import.meta.url))).digest('hex'),expected,path);
  }
});
