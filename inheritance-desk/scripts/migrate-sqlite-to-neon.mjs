// One-time recovery: copy all rows from the old node:sqlite database
// (data/inheritance.db) into Neon. Idempotent — every insert uses
// ON CONFLICT DO NOTHING, so it will not clobber rows already in Neon and can be
// re-run safely. Tables are copied in foreign-key-safe order.
// Run: node --env-file=.env.local scripts/migrate-sqlite-to-neon.mjs
import { DatabaseSync } from "node:sqlite";
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL not set. Run with: node --env-file=.env.local scripts/migrate-sqlite-to-neon.mjs");
  process.exit(1);
}
const sqlite = new DatabaseSync("data/inheritance.db");
const sql = neon(url);

// FK-safe order (parents before children).
const ORDER = [
  "users",
  "families",
  "family_members",
  "cases",
  "deceased_persons",
  "heirs",
  "assets",
  "asset_locations",
  "roadmap_steps",
  "sessions",
  "language_preferences",
  "consents",
  "aadhaar_verifications",
  "jurisdictions",
  "translations",
  "documents",
  "audit_events",
];

const existing = new Set(
  sqlite
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    .all()
    .map((r) => r.name),
);

let grandTotal = 0;
for (const table of ORDER) {
  if (!existing.has(table)) continue;
  const rows = sqlite.prepare(`SELECT * FROM ${table}`).all();
  if (rows.length === 0) continue;
  const cols = Object.keys(rows[0]);
  const colList = cols.map((c) => `"${c}"`).join(", ");
  let inserted = 0;
  for (const row of rows) {
    const values = cols.map((c) => row[c]);
    const placeholders = cols.map((_, i) => `$${i + 1}`).join(", ");
    try {
      await sql.query(
        `INSERT INTO ${table} (${colList}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
        values,
      );
      inserted++;
    } catch (err) {
      console.error(`  ! ${table} row failed:`, err.message);
    }
  }
  console.log(`${table}: copied ${inserted}/${rows.length}`);
  grandTotal += inserted;
}
console.log(`\nDone. ${grandTotal} rows copied into Neon.`);
