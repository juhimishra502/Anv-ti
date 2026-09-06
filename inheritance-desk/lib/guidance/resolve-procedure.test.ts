// State-aware routing tests: UP content only for UP; honest fallback for other states;
// national routes for institution assets; and a hard guarantee that a non-UP case
// never contains any UP procedure text.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createLookup } from "./engine.ts";
import { resolveProcedure } from "./resolve-procedure.ts";

const dir = new URL("../../government-data/", import.meta.url);
const read = (f: string) => JSON.parse(readFileSync(new URL(f, dir), "utf8"));
const catalog = {
  meta: read("catalog.json"), states: read("states.json"), sources: read("sources.json"),
  procedures: read("procedures.json"), assetTypes: read("asset-types.json"),
};
const { lookup } = createLookup(catalog);
const UP_WORDS = /uttar pradesh|lucknow|upbhulekh|rccms|lekhpal|varasat|up revenue code|dakhil|khatauni/i;

test("Case 1: UP + land allows UP Varasat content", () => {
  const r = resolveProcedure({ assetType: "property", service: "property_mutation", assetState: "UP", assetDistrict: "Lucknow", recordType: "revenue_land" }, lookup);
  assert.equal(r.stateName, "Uttar Pradesh");
  assert.equal(r.verified, true);
  assert.equal(r.routeStatus, "verified_orientation");
  assert.match(JSON.stringify(r), UP_WORDS); // UP content is allowed here
});

test("Case 2: Arunachal Pradesh + land = honest AR fallback, ZERO UP content", () => {
  const r = resolveProcedure({ assetType: "property", service: "property_mutation", assetState: "AR", residenceState: "AR", deathState: "AR" }, lookup);
  assert.equal(r.stateName, "Arunachal Pradesh");
  assert.equal(r.verified, false);
  assert.equal(r.routeStatus, "state_fallback");
  assert.ok(r.fallback);
  assert.match(r.fallback!.message, /not yet verified/i);
  assert.ok(r.fallback!.missing.includes("office"));
  assert.doesNotMatch(JSON.stringify(r), UP_WORDS); // <-- the bug: no UP anywhere
  assert.equal(r.compact.chips.state, "Arunachal Pradesh");
  assert.match(r.compact.chips.status, /Arunachal Pradesh fallback/);
});

test("Case 3: Arunachal Pradesh + bank = national route, no UP property/heir fallback", () => {
  const r = resolveProcedure({ assetType: "bank_deposit", service: "bank_claim", institution: "State Bank of India", residenceState: "AR", deathState: "AR" }, lookup);
  assert.equal(r.scope, "national");
  assert.equal(r.routeStatus, "national");
  assert.equal(r.fallback, null);
  assert.doesNotMatch(JSON.stringify(r), UP_WORDS);
});

test("Case 4: Tamil Nadu + property = TN only (TN procedure or TN fallback), never UP", () => {
  const r = resolveProcedure({ assetType: "property", service: "property_mutation", assetState: "TN", residenceState: "TN" }, lookup);
  assert.equal(r.stateName, "Tamil Nadu");
  assert.doesNotMatch(JSON.stringify(r), UP_WORDS);
  assert.ok(r.routeStatus === "verified_orientation" || r.routeStatus === "state_fallback");
  if (r.routeStatus === "state_fallback") assert.equal(r.fallback!.stateName, "Tamil Nadu");
});

test("Case 5: mixed assets each use their own selected state", () => {
  const prop = resolveProcedure({ assetType: "property", service: "property_mutation", assetState: "TN" }, lookup);
  const bank = resolveProcedure({ assetType: "bank_deposit", service: "bank_claim", institution: "HDFC Bank", residenceState: "KA" }, lookup);
  const vehicle = resolveProcedure({ assetType: "vehicle", service: "vehicle_transmission", assetState: "MH" }, lookup);
  assert.equal(prop.stateName, "Tamil Nadu");
  assert.equal(bank.scope, "national");
  assert.doesNotMatch(JSON.stringify(prop), UP_WORDS);
  assert.doesNotMatch(JSON.stringify(bank), UP_WORDS);
  assert.doesNotMatch(JSON.stringify(vehicle), UP_WORDS);
});

test("Case 6: compact card is 5-second sized for every asset", () => {
  for (const q of [
    { assetType: "property", service: "property_mutation", assetState: "AR" },
    { assetType: "bank_deposit", service: "bank_claim", institution: "SBI" },
    { assetType: "nps", service: "nps_claim" },
  ]) {
    const r = resolveProcedure(q, lookup);
    assert.ok(r.compact.heading.length > 0);
    assert.ok(r.compact.bullets.length <= 2, "max 2 bullets");
    assert.ok(r.compact.chips.status.length > 0);
  }
});

test("a blank-state property in a selected-state case uses the selected state (not blank, not UP)", () => {
  const r = resolveProcedure({ assetType: "property", service: "property_mutation", residenceState: "AR", deathState: "AR" }, lookup);
  assert.equal(r.stateName, "Arunachal Pradesh");
  assert.doesNotMatch(JSON.stringify(r), UP_WORDS);
});
