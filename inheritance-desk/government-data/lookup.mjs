// Server-side, dependency-free reference lookup. No network calls or personal-data persistence.
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const normalize = value => typeof value === 'string'
  ? value.normalize('NFKC').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ')
  : '';
const unknown = value => value == null || value === '' || ['unknown', 'i don t know', 'not sure'].includes(normalize(value));
const label = {
  assetState: 'Select the state/UT where this asset is located.',
  assetDistrict: 'Select the district where this property is located.',
  deceasedState: 'Select the deceased person’s state of residence before death.',
  deceasedDistrict: 'Enter the deceased person’s district of residence before death.',
  deathState: 'Select the state/UT where the death occurred.',
  deathDistrict: 'Enter the district where the death occurred.',
  deathRegistrationStatus: 'Has the death already been registered?',
  recordType: 'Identify the record: revenue land, municipal tax or another record.',
  authority: 'Confirm the authority responsible for this record.',
  institution: 'Identify the bank, insurer, AMC, registrar or depository participant.',
  nomineeStatus: 'Confirm whether a nominee is registered, absent or unknown.',
  holdingMode: 'Confirm sole/joint holding and, for investments, physical/demat custody.',
  willStatus: 'Confirm whether a will exists or needs to be located.',
  courtOrderStatus: 'Confirm whether any court order restricts this claim.',
  scheme: 'Identify the specific savings, employment or retirement scheme.',
  sector: 'Identify the NPS sector and subscriber circumstances.',
  employmentStatus: 'Confirm employment and scheme membership at the relevant date.',
  policyStatus: 'Confirm the insurer’s policy status and relevant policy terms.'
};

function freeze(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

export function loadCatalog(base = new URL('./', import.meta.url)) {
  const read = name => JSON.parse(readFileSync(new URL(name, base), 'utf8'));
  return { meta: read('catalog.json'), states: read('states.json'),
    sources: read('sources.json'), procedures: read('procedures.json'), assetTypes: read('asset-types.json') };
}

export function createLookup(inputData) {
  const data = freeze(structuredClone(inputData));
  if (data.meta.schema_version !== 1 || data.states.length !== 36) throw Error('Unsupported/incomplete catalogue');
  const sources = new Map(data.sources.map(s => [s.id, s]));
  const aliases = new Map();
  const stateCodes = new Set();
  for (const state of data.states) {
    if (stateCodes.has(state.code)) throw Error('Duplicate state');
    stateCodes.add(state.code);
    for (const alias of [state.code, `IN-${state.code}`, state.name, ...state.aliases]) {
      const key = normalize(alias);
      if (aliases.has(key) && aliases.get(key).code !== state.code) throw Error(`Ambiguous state alias: ${alias}`);
      aliases.set(key, state);
    }
  }
  const ids = new Set();
  for (const p of data.procedures) {
    if (ids.has(p.id) || !p.source_ids.length || p.source_ids.some(id => !sources.has(id))) throw Error('Invalid procedure/source reference');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(p.review_due) || !Number.isFinite(Date.parse(p.review_due))) throw Error('Invalid review date');
    if (p.execution_available !== false) throw Error('This orientation pack must not authorize execution');
    ids.add(p.id);
  }
  const types = new Map(data.assetTypes.map(t => [t.id, t.service]));
  const services = new Set([...types.values(), 'death_registration', 'legal_heir_certificate']);
  const normalizeState = value => aliases.get(normalize(value)) ?? null;

  function lookup(query = {}) {
    if (!query || typeof query !== 'object' || Array.isArray(query)) return invalid('Provide an object containing asset/context fields.');
    for (const key of Object.keys(query)) {
      if (key !== 'hasDispute' && typeof query[key] !== 'string' && query[key] != null) return invalid(`Invalid value for ${key}.`);
      if (typeof query[key] === 'string' && query[key].length > 300) return invalid(`Value too long for ${key}.`);
    }
    if (query.hasDispute != null && typeof query.hasDispute !== 'boolean') return invalid('hasDispute must be boolean.');
    if (query.country && !['india', 'in'].includes(normalize(query.country))) return {
      status: 'outside_india', message: 'This catalogue covers India. Overseas assets require a separate jurisdiction review.',
      procedures: [], execution_available: false
    };
    const ctx = { ...query };
    for (const field of ['assetState','userState','deceasedState','deathState']) {
      if (unknown(ctx[field])) { delete ctx[field]; continue; }
      const state = normalizeState(ctx[field]);
      if (!state) return { status: 'invalid_state', field, message: 'Choose a state/UT from the supported list.',
        states: data.states.map(({ code, name }) => ({ code, name })), procedures: [], execution_available: false };
      ctx[field] = state.code;
    }
    const today = new Date().toISOString().slice(0, 10);
    const asOf = query.asOf ?? today;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(asOf) || !Number.isFinite(Date.parse(asOf)) || new Date(asOf).toISOString().slice(0,10) !== asOf) return invalid('Use a valid YYYY-MM-DD asOf date.');
    const assetType = query.assetType ?? 'property';
    if (!types.has(assetType)) return invalid('Unknown assetType; use asset-types.json.');
    const service = query.service ?? types.get(assetType);
    if (!services.has(service)) return invalid('Unknown service.');
    const basis = service === 'death_registration' ? 'deathState'
      : service === 'legal_heir_certificate' ? 'deceasedState'
      : service === 'property_mutation' ? 'assetState' : null;
    const scopeState = basis ? normalizeState(ctx[basis]) : null;
    const questions = new Set();
    if (basis && !scopeState) questions.add(basis);
    const cards = [];
    for (const p of data.procedures.filter(p => p.service === service)) {
      let reject = false;
      const missingMatch = [];
      for (const [key, expected] of Object.entries(p.match)) {
        if (unknown(ctx[key])) {
          if (key.endsWith('State')) reject = true;
          else missingMatch.push(key);
        } else if (normalize(ctx[key]) !== normalize(expected)) reject = true;
      }
      if (reject) continue;
      if (missingMatch.length) { missingMatch.forEach(key => questions.add(key)); continue; }
      const missing = p.needed_context.filter(key => unknown(ctx[key]));
      missing.forEach(key => questions.add(key));
      const stale = asOf > p.review_due || asOf < p.last_source_reviewed;
      const ready = !stale && missing.length === 0 && !query.hasDispute;
      cards.push({ ...p, steps: ready ? p.steps : [], document_examples: ready ? p.document_examples : [],
        status: stale ? 'review_due' : missing.length ? 'needs_context' : 'orientation_only',
        missing_context: missing, sources: p.source_ids.map(id => sources.get(id)),
        requirement_for_execution: 'Professional/authority validation still required. This lookup does not determine eligibility.' });
    }
    const directory = service === 'property_mutation' && scopeState ? {
      state: scopeState.name, source_id: 'dolr-directory', source: sources.get('dolr-directory'),
      portal_url: scopeState.portal_url, portal_as_published: scopeState.portal_as_published,
      portal_status: scopeState.portal_status, fallback_url: scopeState.fallback_url,
      note: 'Land-record directory entry only; not necessarily the inheritance application portal. Individual link availability is not guaranteed.'
    } : null;
    let status = query.hasDispute || service === 'specialist_review' ? 'professional_review'
      : questions.size ? 'needs_context'
      : cards.some(p => p.status === 'review_due') ? 'review_due'
      : cards.length ? 'orientation_only' : 'local_review_required';
    const prompts = [...questions].map(field => ({ field, question: label[field] ?? `Confirm ${field}.` }));
    const next = status === 'professional_review' ? 'Arrange qualified review before making legal or financial decisions.'
      : prompts[0]?.question ?? (status === 'review_due' ? 'Recheck the source documents before relying on these instructions.'
      : cards[0]?.steps[0] ?? 'Use the official source directory to identify the responsible office and obtain its current death-case checklist.');
    return {
      catalog_version: data.meta.catalog_version, status, service, as_of: asOf,
      selected_asset_state: normalizeState(ctx.assetState)?.name ?? null,
      jurisdiction_state: scopeState?.name ?? null, jurisdiction_basis: basis ?? 'institution_or_scheme',
      execution_available: false, completeness: 'orientation_only',
      explanation: basis ? `This service uses ${basis}; the user's current residence does not override it.`
        : 'Financial/scheme routing is selected by institution and holding circumstances, not by the user’s residential state.',
      next_action: next, questions: prompts, procedures: cards, directory,
      warnings: ['No route in this starter catalogue is certified for execution.',
        ...(cards.some(p => p.status === 'review_due') ? ['Source review is due; action steps and document examples are withheld.'] : []),
        ...(!cards.length ? ['A complete reviewed checklist for this combination has not been assembled.'] : [])]
    };
  }
  const invalid = message => ({ status: 'invalid_input', message, procedures: [], execution_available: false });
  return { lookup, normalizeState, states: data.states };
}

let defaultLookup;
export function lookupGuidance(query) {
  try { defaultLookup ??= createLookup(loadCatalog()); return defaultLookup.lookup(query); }
  catch { return { status: 'catalog_unavailable', message: 'Guidance is temporarily unavailable. Retry or contact support.', procedures: [], execution_available: false }; }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  let query;
  try { query = JSON.parse(process.argv[2] ?? '{"assetState":"Tamil Nadu"}'); }
  catch { console.error('Pass a valid JSON object.'); process.exitCode = 1; }
  if (query) console.log(JSON.stringify(lookupGuidance(query), null, 2));
}
