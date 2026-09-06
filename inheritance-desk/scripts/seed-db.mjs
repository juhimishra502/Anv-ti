// Seeds the jurisdictions table with all 36 states/UTs (from the catalogue) and the
// small set of PROJECT-VERIFIED districts. Idempotent (ON CONFLICT DO NOTHING);
// full district/subdistrict coverage comes from the official LGD import, not here.
// Run: node --env-file=.env.local scripts/seed-db.mjs
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set. Run with: node --env-file=.env.local scripts/seed-db.mjs");
  process.exit(1);
}
const sql = neon(url);

// Districts verified within this project (Delhi's 11 revenue districts are official;
// the rest are the confirmed pilots).
const VERIFIED_DISTRICTS = {
  DL: [
    "New Delhi", "North Delhi", "South Delhi", "East Delhi", "West Delhi",
    "Central Delhi", "North East Delhi", "North West Delhi", "South West Delhi",
    "South East Delhi", "Shahdara",
  ],
  TN: ["Chennai"],
  MH: ["Mumbai Suburban", "Mumbai City"],
  KA: ["Bengaluru Urban"],
  UP: ["Lucknow"],
};

const states = JSON.parse(readFileSync(new URL("../government-data/states.json", import.meta.url), "utf8"));

let s = 0;
for (const st of states) {
  await sql.query(
    `INSERT INTO jurisdictions (code, level, parent_code, name, source)
     VALUES ($1, 'state', NULL, $2, 'catalog') ON CONFLICT (code) DO NOTHING`,
    [st.code, st.name],
  );
  s++;
}
let d = 0;
for (const [stateCode, districts] of Object.entries(VERIFIED_DISTRICTS)) {
  for (let i = 0; i < districts.length; i++) {
    await sql.query(
      `INSERT INTO jurisdictions (code, level, parent_code, name, source)
       VALUES ($1, 'district', $2, $3, 'project-verified') ON CONFLICT (code) DO NOTHING`,
      [`${stateCode}-D${i + 1}`, stateCode, districts[i]],
    );
    d++;
  }
}
console.log(`Seeded ${s} states/UTs and ${d} verified districts.`);
