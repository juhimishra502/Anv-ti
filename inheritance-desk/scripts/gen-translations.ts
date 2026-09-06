// Pre-generates static UI dictionaries for every non-reviewed locale by translating
// the canonical English catalogue once (via the running app's /api/translate → Groq)
// and writing lib/i18n/generated/<locale>.json. Shipping these makes the whole UI
// switch language INSTANTLY and completely — no per-load runtime translation.
// Run (server must be up on :3199):
//   node --experimental-strip-types scripts/gen-translations.ts
import { writeFileSync, mkdirSync } from "node:fs";
import { CANONICAL, MESSAGE_IDS } from "../lib/i18n/messages.ts";

const TARGETS = ["bn", "te", "mr", "kn", "gu", "pa", "ml", "or", "ur"];
const BASE = process.env.BASE_URL || "http://localhost:3199";
const VERSION = "gen-2026-09-05";
const CHUNK = 40;

const ids = MESSAGE_IDS;
const enVals = ids.map((k) => CANONICAL[k]);

mkdirSync(new URL("../lib/i18n/generated/", import.meta.url), { recursive: true });

for (const locale of TARGETS) {
  const translated: string[] = [];
  for (let i = 0; i < enVals.length; i += CHUNK) {
    const batch = enVals.slice(i, i + CHUNK);
    const res = await fetch(`${BASE}/api/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale, version: VERSION, texts: batch }),
    });
    const data = await res.json();
    if (!data.translations || data.translations.length !== batch.length) {
      console.error(`FAILED ${locale} chunk @${i}:`, JSON.stringify(data).slice(0, 160));
      process.exit(1);
    }
    translated.push(...data.translations);
  }
  const dict: Record<string, string> = {};
  ids.forEach((k, i) => { dict[k] = translated[i]; });
  const file = new URL(`../lib/i18n/generated/${locale}.json`, import.meta.url);
  writeFileSync(file, JSON.stringify(dict, null, 2) + "\n");
  console.log(`${locale}: wrote ${ids.length} strings`);
}
console.log("done");
