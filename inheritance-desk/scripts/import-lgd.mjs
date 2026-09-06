// Import official Local Government Directory (LGD) administrative areas into the
// Neon `jurisdictions` (+ `jurisdiction_aliases`) tables, recording each run in
// `jurisdiction_import_runs`. Idempotent (upsert by code). No data is fabricated:
// this ONLY ingests the official file you provide.
//
// The official download at https://lgdirectory.gov.in/demo/downloadDirectory.do is
// CAPTCHA-gated and cannot be fetched headlessly. Download it manually, then map the
// official columns to a CSV with a header row and these columns (any order):
//
//   level,code,parent_code,name,name_local,lgd_code,parent_lgd_code,state_code,active,effective_date,aliases
//     level         ∈ state | district | subdistrict | village | local_body
//     code          stable key used across the app (use the LGD code for LGD rows)
//     parent_code   the code of the parent row (state's code for a district, etc.)
//     active        1 (default) or 0 for de-activated/merged records
//     aliases       semicolon-separated historical/alternate names (optional)
//
// Usage:
//   node --env-file=.env.local scripts/import-lgd.mjs <lgd.csv> [--mode full|modification] [--version v]
//
//   full          upsert every row; LGD rows NOT in the file are marked inactive.
//   modification  upsert only the rows in the file (default); nothing deactivated implicitly.
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { parseAndValidate, norm } from "./lgd-core.mjs";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL not set. Run with: node --env-file=.env.local scripts/import-lgd.mjs <lgd.csv>");
  process.exit(1);
}
const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
const mode = args.includes("--mode") ? args[args.indexOf("--mode") + 1] : "modification";
const version = (args.includes("--version") ? args[args.indexOf("--version") + 1] : null) || new Date().toISOString().slice(0, 10);
if (!file) {
  console.error("Usage: node --env-file=.env.local scripts/import-lgd.mjs <lgd.csv> [--mode full|modification]");
  process.exit(1);
}
if (!["full", "modification"].includes(mode)) {
  console.error(`Invalid --mode ${mode}; use full or modification.`);
  process.exit(1);
}

const sql = neon(url);
const nowIso = () => new Date().toISOString();

const raw = readFileSync(file, "utf8");
// ---- Parse + validate in memory before any write (pure core, DB-free) --------
const dbCodes = new Set((await sql`SELECT code FROM jurisdictions`).map((x) => x.code));
const { records, errors, hasBlocking, empty } = parseAndValidate(raw, dbCodes);
if (empty) { console.error("Empty file."); process.exit(1); }

// ---- Record the run, then write ---------------------------------------------
const runId = randomUUID();
await sql`INSERT INTO jurisdiction_import_runs (id, mode, source, source_version, source_file, started_at, status)
          VALUES (${runId}, ${mode}, 'lgd', ${version}, ${file}, ${nowIso()}, 'running')`;

if (hasBlocking) {
  await sql`UPDATE jurisdiction_import_runs SET status='failed', finished_at=${nowIso()}, errors=${JSON.stringify(errors)} WHERE id=${runId}`;
  console.error("Import aborted — blocking validation errors:");
  console.error(JSON.stringify(errors, null, 2));
  process.exit(2);
}

const counts = {};
for (const rec of records) {
  await sql`
    INSERT INTO jurisdictions
      (code, level, parent_code, name, name_local, aliases, lgd_code, parent_lgd_code, state_code, active, effective_date, source, version, import_date, import_run_id, review_date)
    VALUES
      (${rec.code}, ${rec.level}, ${rec.parent_code}, ${rec.name}, ${rec.name_local}, ${JSON.stringify(rec.aliases)},
       ${rec.lgd_code}, ${rec.parent_lgd_code}, ${rec.state_code}, ${rec.active}, ${rec.effective_date},
       'lgd', ${version}, ${nowIso()}, ${runId}, ${new Date().toISOString().slice(0, 10)})
    ON CONFLICT (code) DO UPDATE SET
      level=excluded.level, parent_code=excluded.parent_code, name=excluded.name, name_local=excluded.name_local,
      aliases=excluded.aliases, lgd_code=excluded.lgd_code, parent_lgd_code=excluded.parent_lgd_code,
      state_code=excluded.state_code, active=excluded.active, effective_date=excluded.effective_date,
      source='lgd', version=excluded.version, import_date=excluded.import_date, import_run_id=excluded.import_run_id`;
  // Aliases: replace this jurisdiction's LGD alias rows with the file's set.
  await sql`DELETE FROM jurisdiction_aliases WHERE jurisdiction_code=${rec.code} AND source='lgd'`;
  for (const alias of rec.aliases) {
    await sql`INSERT INTO jurisdiction_aliases (id, jurisdiction_code, alias, alias_norm, kind, source, created_at)
              VALUES (${randomUUID()}, ${rec.code}, ${alias}, ${norm(alias)}, 'historical', 'lgd', ${nowIso()})`;
  }
  counts[rec.level] = (counts[rec.level] ?? 0) + 1;
}

// Full mode: LGD rows not present in this file are de-activated (not deleted, to
// preserve any case references and merger/rename lineage).
let deactivated = 0;
if (mode === "full") {
  const codes = records.map((r) => r.code);
  const res = await sql`UPDATE jurisdictions SET active=0
                        WHERE source='lgd' AND active=1 AND code <> ALL(${codes})`;
  deactivated = res.length ?? 0;
}

await sql`UPDATE jurisdiction_import_runs SET status='completed', finished_at=${nowIso()},
          counts=${JSON.stringify(counts)}, errors=${JSON.stringify(errors)},
          notes=${`mode=${mode}; deactivated=${deactivated}; inactive_in_file=${errors.inactive.length}`}
          WHERE id=${runId}`;

console.log(`LGD import (${mode}) run ${runId} completed.`);
console.log("Imported/updated by jurisdiction type:", JSON.stringify(counts));
if (mode === "full") console.log(`De-activated (absent from file): ${deactivated}`);
if (errors.inactive.length) console.log(`Rows marked inactive in file: ${errors.inactive.length}`);
