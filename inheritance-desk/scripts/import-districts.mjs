// Seeds the jurisdictions table with districts for EVERY state/UT from a public
// reference dataset (sab99r/Indian-States-And-Districts). Marked source
// 'reference-dataset' — this is NOT the official LGD (which carries stable LGD codes);
// it makes the dependent district dropdowns usable everywhere until LGD ingestion.
// Run: node --env-file=.env.local scripts/import-districts.mjs
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";

const url = process.env.DATABASE_URL;
if (!url) { console.error("DATABASE_URL not set"); process.exit(1); }
const sql = neon(url);

const DATA_URL = "https://raw.githubusercontent.com/sab99r/Indian-States-And-Districts/master/states-and-districts.json";
const states = JSON.parse(readFileSync(new URL("../government-data/states.json", import.meta.url), "utf8"));

const norm = (s) => s.toLowerCase().replace(/\(.*?\)/g, "").replace(/[^a-z]/g, "");
// Build normalized-name -> code from official catalogue names + aliases.
const codeByName = new Map();
for (const st of states) {
  codeByName.set(norm(st.name), st.code);
  for (const a of st.aliases ?? []) codeByName.set(norm(a), st.code);
}
function resolve(stateName) {
  const n = norm(stateName);
  if (n.includes("dadra") || n.includes("daman")) return "DH"; // merged UT
  return codeByName.get(n) ?? null;
}

const res = await fetch(DATA_URL);
const raw = await res.json();
const dataset = Array.isArray(raw) ? raw : raw.states; // { states: [{ state, districts }] }

// Manual additions the older dataset lacks.
const EXTRA = {
  LA: ["Leh", "Kargil"], // Ladakh (UT since 2019)
  AN: ["Nicobar", "North and Middle Andaman", "South Andaman"], // not in the dataset
};

// Clear existing districts, then insert fresh (reference dataset).
await sql`DELETE FROM jurisdictions WHERE level = 'district'`;

const matched = {};
const unmatched = [];
for (const entry of dataset) {
  const code = resolve(entry.state);
  if (!code) { unmatched.push(entry.state); continue; }
  matched[code] = (matched[code] ?? []).concat(entry.districts);
}
for (const [code, list] of Object.entries(EXTRA)) matched[code] = (matched[code] ?? []).concat(list);

let total = 0;
for (const [code, list] of Object.entries(matched)) {
  const uniq = [...new Set(list.map((d) => d.trim()).filter(Boolean))].sort();
  const queries = uniq.map((name, i) =>
    sql`INSERT INTO jurisdictions (code, level, parent_code, name, source)
        VALUES (${`${code}-D${i + 1}`}, 'district', ${code}, ${name}, 'reference-dataset')
        ON CONFLICT (code) DO UPDATE SET name = excluded.name, source = excluded.source`,
  );
  // Neon transaction batches (chunk to keep each request reasonable).
  for (let i = 0; i < queries.length; i += 50) await sql.transaction(queries.slice(i, i + 50));
  total += uniq.length;
}

const covered = Object.keys(matched).length;
console.log(`Seeded ${total} districts across ${covered}/${states.length} states/UTs.`);
if (unmatched.length) console.log("Unmatched dataset states:", unmatched.join(", "));
const missing = states.filter((s) => !matched[s.code]).map((s) => s.code);
if (missing.length) console.log("States/UTs with NO districts:", missing.join(", "));
