// Applies lib/db/schema.sql to the Neon database in DATABASE_URL.
// Run: node --env-file=.env.local scripts/apply-schema.mjs
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set. Run with: node --env-file=.env.local scripts/apply-schema.mjs");
  process.exit(1);
}

const sql = neon(url);
const raw = readFileSync(new URL("../lib/db/schema.sql", import.meta.url), "utf8");
// Strip full-line comments, then split into individual statements (no ';' appears
// inside string literals in this schema, so a plain split is safe here).
const body = raw
  .split("\n")
  .filter((l) => !l.trim().startsWith("--"))
  .join("\n");
const statements = body
  .split(";")
  .map((s) => s.trim())
  .filter(Boolean);

let ok = 0;
for (const stmt of statements) {
  try {
    await sql.query(stmt);
    ok++;
  } catch (err) {
    console.error("FAILED statement:\n", stmt.slice(0, 120), "\n->", err.message);
    process.exit(1);
  }
}
console.log(`Applied ${ok}/${statements.length} statements to Neon.`);
