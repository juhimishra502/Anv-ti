// Seeds verifiable OFFICIAL LGD data onto the existing jurisdiction rows, without a
// full LGD file download (which is CAPTCHA-gated). Specifically:
//   1. State/UT rows get their official LGD state code (the published, stable
//      LGD/Census-2011 state codes; UP=09, TN=33, MH=27, KA=29, DL=07, ...).
//   2. District rows get state_code backfilled.
//   3. The two required historical renames become searchable aliases:
//        Allahabad -> Prayagraj, Faizabad -> Ayodhya (current names stay primary).
//   4. Pilot subdistricts (tehsil/taluk/subdivision) the E2E matrix needs are
//      seeded UNDER their districts, flagged source='reference-pilot', lgd_code
//      NULL — honestly NOT claimed as official LGD until the file is imported.
//
// Run: node --env-file=.env.local scripts/seed-jurisdictions.mjs
import { neon } from "@neondatabase/serverless";
import { randomUUID } from "node:crypto";

const url = process.env.DATABASE_URL;
if (!url) { console.error("DATABASE_URL not set"); process.exit(1); }
const sql = neon(url);
const nowIso = () => new Date().toISOString();
const today = new Date().toISOString().slice(0, 10);
const norm = (s) =>
  String(s ?? "").normalize("NFKC").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");

// Official LGD/Census-2011 state codes (published by lgdirectory.gov.in).
const LGD_STATE_CODES = {
  JK: "01", HP: "02", PB: "03", CH: "04", UK: "05", HR: "06", DL: "07", RJ: "08",
  UP: "09", BR: "10", SK: "11", AR: "12", NL: "13", MN: "14", MZ: "15", TR: "16",
  ML: "17", AS: "18", WB: "19", JH: "20", OD: "21", CG: "22", MP: "23", GJ: "24",
  MH: "27", AP: "28", KA: "29", GA: "30", LD: "31", KL: "32", TN: "33", PY: "34",
  AN: "35", TS: "36", LA: "37", DH: "38",
};

let stateN = 0;
for (const [code, lgd] of Object.entries(LGD_STATE_CODES)) {
  const r = await sql`UPDATE jurisdictions
    SET lgd_code=${lgd}, state_code=${code}, source='lgd-state-codes', version=${today}, import_date=${nowIso()}
    WHERE code=${code} AND level='state'`;
  stateN += r.length ?? 0;
}

// Backfill state_code on districts (state_code = parent state code).
await sql`UPDATE jurisdictions SET state_code=parent_code WHERE level='district' AND state_code IS NULL`;

// Required historical aliases. Attach to the CURRENT-name district row.
const ALIASES = [
  { code: "UP-D3", alias: "Allahabad" }, // Prayagraj (renamed 2018)
  { code: "UP-D26", alias: "Faizabad" }, // Ayodhya (district renamed 2018)
];
let aliasN = 0;
for (const a of ALIASES) {
  const exists = await sql`SELECT code, aliases FROM jurisdictions WHERE code=${a.code}`;
  if (!exists.length) { console.warn(`Alias target ${a.code} not found; skipped ${a.alias}`); continue; }
  await sql`DELETE FROM jurisdiction_aliases WHERE jurisdiction_code=${a.code} AND alias_norm=${norm(a.alias)}`;
  await sql`INSERT INTO jurisdiction_aliases (id, jurisdiction_code, alias, alias_norm, kind, source, created_at)
            VALUES (${randomUUID()}, ${a.code}, ${a.alias}, ${norm(a.alias)}, 'historical', 'official-rename', ${nowIso()})`;
  // Mirror into the row's aliases JSON for offline/self-contained reads.
  const cur = JSON.parse(exists[0].aliases || "[]");
  if (!cur.map(norm).includes(norm(a.alias))) cur.push(a.alias);
  await sql`UPDATE jurisdictions SET aliases=${JSON.stringify(cur)} WHERE code=${a.code}`;
  aliasN++;
}

// Pilot subdistricts the E2E matrix traverses. district matched by name in state.
const PILOT_SUBDISTRICTS = [
  { state: "UP", district: "Lucknow", name: "Sadar (Lucknow)", level: "subdistrict" },
  { state: "TN", district: "Chennai", name: "Egmore", level: "subdistrict" },
  { state: "MH", district: "Mumbai Suburban", name: "Andheri", level: "subdistrict" },
  { state: "KA", district: "Bangalore", name: "Bengaluru North", level: "subdistrict" },
  { state: "DL", district: "New Delhi", name: "Mehrauli", level: "subdistrict" },
];
let subN = 0; const subSkip = [];
for (const s of PILOT_SUBDISTRICTS) {
  const d = await sql`SELECT code FROM jurisdictions
    WHERE level='district' AND parent_code=${s.state}
      AND (lower(name)=${s.district.toLowerCase()} OR lower(name) LIKE ${"%" + s.district.toLowerCase() + "%"})
    ORDER BY length(name) LIMIT 1`;
  if (!d.length) { subSkip.push(`${s.state}/${s.district}`); continue; }
  const code = `${d[0].code}-SD-${norm(s.name).replace(/\s+/g, "_")}`;
  await sql`INSERT INTO jurisdictions
      (code, level, parent_code, name, state_code, active, source, version, import_date, review_date)
    VALUES (${code}, ${s.level}, ${d[0].code}, ${s.name}, ${s.state}, 1, 'reference-pilot', ${today}, ${nowIso()}, ${today})
    ON CONFLICT (code) DO UPDATE SET name=excluded.name, parent_code=excluded.parent_code, source='reference-pilot'`;
  subN++;
}

console.log(`Seeded LGD state codes on ${stateN} states, ${aliasN} historical aliases, ${subN} pilot subdistricts.`);
if (subSkip.length) console.log("Subdistrict district not matched (seed reference districts first):", subSkip.join(", "));
