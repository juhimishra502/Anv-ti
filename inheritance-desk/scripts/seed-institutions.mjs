// Seeds a verifiable, representative set of institutions per regulator category, so
// the database-backed selectors work. Flagged source='seed-public-list'. It creates
// NO claim packs: existence in a regulator list is not a verified claim pack.
// Extend by importing the full official regulator lists (same table shape).
//
// Run: node --env-file=.env.local scripts/seed-institutions.mjs
import { neon } from "@neondatabase/serverless";
import { randomUUID } from "node:crypto";

const url = process.env.DATABASE_URL;
if (!url) { console.error("DATABASE_URL not set"); process.exit(1); }
const sql = neon(url);
const nowIso = () => new Date().toISOString();
const norm = (s) =>
  String(s ?? "").normalize("NFKC").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");

// [category, regulator, [ [legal_name, short_name, ...aliases], ... ]]
const SEED = [
  ["bank", "RBI", [
    ["State Bank of India", "SBI"],
    ["Punjab National Bank", "PNB"],
    ["Bank of Baroda", "BoB"],
    ["Canara Bank", "Canara"],
    ["Union Bank of India", "Union Bank"],
    ["Bank of India", "BoI"],
    ["Central Bank of India", "CBI"],
    ["Indian Bank", "Indian Bank"],
    ["HDFC Bank", "HDFC"],
    ["ICICI Bank", "ICICI"],
    ["Axis Bank", "Axis", "UTI Bank"],
    ["Kotak Mahindra Bank", "Kotak"],
  ]],
  ["insurer", "IRDAI", [
    ["Life Insurance Corporation of India", "LIC"],
    ["HDFC Life Insurance Company", "HDFC Life"],
    ["ICICI Prudential Life Insurance Company", "ICICI Pru Life"],
    ["SBI Life Insurance Company", "SBI Life"],
    ["Max Life Insurance Company", "Max Life"],
    ["Bajaj Allianz Life Insurance Company", "Bajaj Allianz Life"],
  ]],
  ["amc", "AMFI", [
    ["SBI Funds Management Limited", "SBI Mutual Fund"],
    ["HDFC Asset Management Company", "HDFC Mutual Fund"],
    ["ICICI Prudential Asset Management Company", "ICICI Prudential Mutual Fund"],
    ["Nippon Life India Asset Management", "Nippon India Mutual Fund", "Reliance Mutual Fund"],
    ["Axis Asset Management Company", "Axis Mutual Fund"],
    ["UTI Asset Management Company", "UTI Mutual Fund"],
  ]],
  ["depository", "SEBI", [
    ["National Securities Depository Limited", "NSDL"],
    ["Central Depository Services (India) Limited", "CDSL"],
  ]],
  ["rta", "SEBI", [
    ["Computer Age Management Services Limited", "CAMS"],
    ["KFin Technologies Limited", "KFintech", "Karvy Fintech"],
    ["Link Intime India Private Limited", "Link Intime"],
  ]],
  ["sebi_intermediary", "SEBI", [
    ["Zerodha Broking Limited", "Zerodha"],
    ["ICICI Securities Limited", "ICICI Direct"],
  ]],
  ["epfo", "EPFO", [
    ["Employees' Provident Fund Organisation", "EPFO"],
  ]],
  ["nps", "PFRDA", [
    ["Protean eGov Technologies (NSDL CRA)", "Protean CRA", "NSDL CRA"],
    ["KFin Technologies CRA", "KFin CRA"],
  ]],
  ["india_post", "DoP", [
    ["India Post (Department of Posts)", "India Post"],
  ]],
  ["iepf", "MCA", [
    ["Investor Education and Protection Fund Authority", "IEPF Authority"],
  ]],
];

const version = new Date().toISOString().slice(0, 10);
const queries = [];
let n = 0, aliasN = 0;
for (const [category, regulator, list] of SEED) {
  for (const [legal, short, ...aliases] of list) {
    const id = `${category}:${norm(legal).replace(/\s+/g, "-")}`;
    queries.push(sql`
      INSERT INTO institutions (id, category, legal_name, short_name, regulator, active, source, source_version, created_at)
      VALUES (${id}, ${category}, ${legal}, ${short ?? null}, ${regulator}, 1, 'seed-public-list', ${version}, ${nowIso()})
      ON CONFLICT (id) DO UPDATE SET legal_name=excluded.legal_name, short_name=excluded.short_name, regulator=excluded.regulator, active=1`);
    n++;
    const allAliases = [short, ...aliases].filter(Boolean);
    queries.push(sql`DELETE FROM institution_aliases WHERE institution_id=${id}`);
    for (const a of allAliases) {
      queries.push(sql`INSERT INTO institution_aliases (id, institution_id, alias, alias_norm, created_at)
                       VALUES (${randomUUID()}, ${id}, ${a}, ${norm(a)}, ${nowIso()})`);
      aliasN++;
    }
  }
}
for (let i = 0; i < queries.length; i += 40) await sql.transaction(queries.slice(i, i + 40));

console.log(`Seeded ${n} institutions and ${aliasN} aliases across ${SEED.length} categories.`);
console.log("No claim packs created — existence in a list is not a verified claim pack.");
