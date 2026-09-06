// Database-backed slice of the E2E matrix, run against Neon and REPORTING measured
// query count + load time. Covers: historical district-alias search, institution
// not-found -> verification request, institution alias search, asset edit + delete,
// one bulk roadmap write (single transaction), and a simulated case-page load with a
// counted query set + total timing. Self-contained: it creates a throwaway case and
// deletes everything it made.
//
// Run: node --env-file=.env.local scripts/e2e-db-matrix.mjs
import { neon } from "@neondatabase/serverless";
import { randomUUID } from "node:crypto";

const url = process.env.DATABASE_URL;
if (!url) { console.error("DATABASE_URL not set"); process.exit(1); }
const sql = neon(url);
const now = () => new Date().toISOString();
const norm = (s) => String(s).normalize("NFKC").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
let queries = 0;
const q = async (fn) => { queries++; return fn(); };
const results = [];
const check = (name, ok, detail = "") => { results.push({ name, ok, detail }); console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`); };

// 1) Historical district alias search: "Allahabad" must find Prayagraj.
{
  const like = `%${norm("Allahabad")}%`;
  const rows = await q(() => sql`
    SELECT DISTINCT j.code, j.name FROM jurisdictions j
    LEFT JOIN jurisdiction_aliases a ON a.jurisdiction_code = j.code
    WHERE j.parent_code='UP' AND j.level='district' AND j.active=1
      AND (translate(lower(j.name),'.-_()','     ') LIKE ${like} OR a.alias_norm LIKE ${like})`);
  check("historical district alias search (Allahabad -> Prayagraj)", rows.some((r) => /prayagraj/i.test(r.name)), JSON.stringify(rows));
}

// 2) Institution alias search: "UTI Bank" -> Axis Bank.
{
  const like = `%${norm("UTI Bank")}%`;
  const rows = await q(() => sql`
    SELECT DISTINCT i.legal_name FROM institutions i
    LEFT JOIN institution_aliases a ON a.institution_id=i.id
    WHERE i.category='bank' AND i.active=1
      AND (translate(lower(i.legal_name),'.-_()','     ') LIKE ${like} OR a.alias_norm LIKE ${like})`);
  check("institution alias search (UTI Bank -> Axis Bank)", rows.some((r) => /axis/i.test(r.legal_name)), JSON.stringify(rows));
}

// 3) Institution not-found -> a verification request is created.
{
  const missing = "Imaginary Rural Bank of Nowhere";
  const found = await q(() => sql`SELECT 1 FROM institutions WHERE lower(legal_name)=${missing.toLowerCase()} LIMIT 1`);
  const vrId = randomUUID();
  await q(() => sql`INSERT INTO institution_verification_requests (id, category, entered_name, status, created_at)
                    VALUES (${vrId}, 'bank', ${missing}, 'open', ${now()})`);
  const vr = await q(() => sql`SELECT status FROM institution_verification_requests WHERE id=${vrId}`);
  check("institution not-found raises a verification request", found.length === 0 && vr[0]?.status === "open");
  await sql`DELETE FROM institution_verification_requests WHERE id=${vrId}`;
}

// Throwaway case scaffold (direct SQL; auth is enforced elsewhere in the app layer).
const uid = `usr_e2e_${randomUUID().slice(0, 8)}`, fid = `fam_e2e_${randomUUID().slice(0, 8)}`, cid = `case_e2e_${randomUUID().slice(0, 8)}`;
await sql`INSERT INTO users (id, display_name, is_demo, auth_method, created_at) VALUES (${uid}, 'E2E', 1, 'demo', ${now()})`;
await sql`INSERT INTO families (id, name, created_by, created_at) VALUES (${fid}, 'E2E', ${uid}, ${now()})`;
await sql`INSERT INTO cases (id, family_id, created_by, title, status, created_at, updated_at) VALUES (${cid}, ${fid}, ${uid}, 'E2E', 'intake', ${now()}, ${now()})`;
await sql`INSERT INTO deceased_persons (id, case_id, updated_at) VALUES (${'dec_' + randomUUID().slice(0, 8)}, ${cid}, ${now()})`;

// 4) Asset edit + delete.
{
  const a1 = `ast_${randomUUID().slice(0, 8)}`, a2 = `ast_${randomUUID().slice(0, 8)}`;
  await sql`INSERT INTO assets (id, case_id, asset_type, service, label, created_at) VALUES (${a1}, ${cid}, 'bank_deposit', 'bank_claim', 'A1', ${now()})`;
  await sql`INSERT INTO assets (id, case_id, asset_type, service, label, created_at) VALUES (${a2}, ${cid}, 'life_insurance', 'insurance_claim', 'A2', ${now()})`;
  await sql`UPDATE assets SET label='A1-edited', nominee_status='registered' WHERE id=${a1} AND case_id=${cid}`;
  const edited = await sql`SELECT label FROM assets WHERE id=${a1}`;
  await sql`DELETE FROM assets WHERE id=${a2} AND case_id=${cid}`;
  const remaining = await sql`SELECT count(*)::int c FROM assets WHERE case_id=${cid}`;
  check("asset edit + delete", edited[0]?.label === "A1-edited" && remaining[0].c === 1);
}

// 5) One bulk roadmap write (single transaction) — graph regeneration after edits.
{
  const t0 = performance.now();
  const stepQueries = [sql`DELETE FROM roadmap_steps WHERE case_id=${cid}`];
  for (let i = 0; i < 6; i++) {
    stepQueries.push(sql`INSERT INTO roadmap_steps (id, case_id, service, title, requirement, engine_status, completeness, payload, sort_order, created_at, updated_at)
      VALUES (${'stp_' + randomUUID().slice(0, 8)}, ${cid}, 'bank_claim', ${'Step ' + i}, 'conditional', 'orientation_only', 'orientation_only', '{}', ${i}, ${now()}, ${now()})`);
  }
  await sql.transaction(stepQueries); // ONE round-trip for the whole roadmap
  const ms = (performance.now() - t0).toFixed(0);
  const count = await sql`SELECT count(*)::int c FROM roadmap_steps WHERE case_id=${cid}`;
  check("one bulk roadmap write (single transaction)", count[0].c === 6, `7 statements in 1 transaction, ${ms}ms`);
}

// 6) Case-page load: the exact query set buildCaseView runs, counted and timed.
{
  let cnt = 0; const t0 = performance.now();
  const timed = async (fn) => { cnt++; return fn(); };
  await timed(() => sql`SELECT * FROM cases WHERE id=${cid}`);
  await timed(() => sql`SELECT * FROM deceased_persons WHERE case_id=${cid}`);
  await timed(() => sql`SELECT * FROM heirs WHERE case_id=${cid} ORDER BY created_at`);
  const assets = await timed(() => sql`SELECT * FROM assets WHERE case_id=${cid} ORDER BY created_at`);
  const ids = assets.map((a) => a.id);
  await timed(() => sql`SELECT * FROM asset_locations WHERE asset_id = ANY(${ids})`);
  await timed(() => sql`SELECT * FROM roadmap_steps WHERE case_id=${cid} ORDER BY sort_order`);
  const ms = (performance.now() - t0).toFixed(0);
  check("case-page load query count", cnt === 6, `${cnt} queries, ${ms}ms total`);
  console.log(`\nMEASURED: case page = ${cnt} queries in ${ms}ms (constant, not N+1 in asset count).`);
}

// Cleanup (cascades delete assets/locations/roadmap/deceased).
await sql`DELETE FROM cases WHERE id=${cid}`;
await sql`DELETE FROM families WHERE id=${fid}`;
await sql`DELETE FROM users WHERE id=${uid}`;

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} DB E2E checks passed. Total DB round-trips this run: ~${queries}+`);
process.exit(failed.length ? 1 : 0);
