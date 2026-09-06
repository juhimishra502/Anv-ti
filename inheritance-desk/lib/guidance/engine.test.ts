// Safety + behaviour tests for the TypeScript engine port. Run with:
//   node --test --experimental-strip-types
// (npm test). These assert the guardrails the product depends on.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createLookup } from "./engine.ts";
import type { Catalog } from "./types.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(here, "..", "..", "government-data");
const read = (name: string) => JSON.parse(readFileSync(path.join(dataDir, name), "utf8"));

const catalog: Catalog = {
  meta: read("catalog.json"),
  states: read("states.json"),
  sources: read("sources.json"),
  procedures: read("procedures.json"),
  assetTypes: read("asset-types.json"),
};
const { lookup } = createLookup(catalog);

test("catalogue loads with all 36 states/UTs", () => {
  assert.equal(catalog.states.length, 36);
});

test("nothing is ever execution-ready", () => {
  const results = [
    lookup({ assetType: "property", assetState: "DL", assetDistrict: "South Delhi", recordType: "revenue_land" }),
    lookup({ assetType: "bank_deposit", institution: "Central Bank of India", nomineeStatus: "registered" }),
    lookup({ assetType: "life_insurance" }),
  ];
  for (const r of results) {
    assert.equal(r.execution_available, false);
    for (const p of r.procedures) assert.equal(p.execution_available, false);
  }
});

test("property routes by asset location, not the user's residential state", () => {
  const r = lookup({
    assetType: "property",
    assetState: "DL",
    assetDistrict: "South Delhi",
    recordType: "revenue_land",
    userState: "MH",
    deceasedState: "KA",
  });
  assert.equal(r.jurisdiction_basis, "assetState");
  assert.equal(r.jurisdiction_state, "Delhi");
  assert.ok(r.procedures.some((p) => p.id === "dl-south-land"));
});

test("a different asset district does not reuse another jurisdiction's procedure", () => {
  const r = lookup({
    assetType: "property",
    assetState: "DL",
    assetDistrict: "North Delhi",
    recordType: "revenue_land",
  });
  assert.ok(!r.procedures.some((p) => p.id === "dl-south-land"));
});

test("state alone cannot pick a property procedure — it asks for district", () => {
  const r = lookup({ assetType: "property", assetState: "DL" });
  assert.equal(r.status, "needs_context");
  assert.ok(r.questions?.some((q) => q.field === "assetDistrict"));
});

test("a demat holding is never routed to a land office", () => {
  const r = lookup({ assetType: "shares", assetState: "DL", assetDistrict: "South Delhi" });
  assert.equal(r.service, "securities_transmission");
  assert.ok(!r.procedures.some((p) => p.service === "property_mutation"));
});

test("a dispute forces professional review", () => {
  const r = lookup({
    assetType: "property",
    assetState: "DL",
    assetDistrict: "South Delhi",
    recordType: "revenue_land",
    hasDispute: true,
  });
  assert.equal(r.status, "professional_review");
});

test("only the generic fallback asset routes straight to professional review", () => {
  // Truly-unclassified assets remain specialist_review -> professional_review.
  assert.equal(lookup({ assetType: "valuables" }).status, "professional_review");
});

test("dedicated specialist services give an orientation route, not blanket professional review", () => {
  // sovereign_gold_bond now maps to its own grounded service; with no institution
  // context yet it asks for context rather than dead-ending at professional_review.
  const r = lookup({ assetType: "sovereign_gold_bond" });
  assert.equal(r.service, "sovereign_gold_bond_transmission");
  assert.notEqual(r.status, "professional_review");
  assert.equal(r.execution_available, false);
});

test("a future asOf past the review date withholds action steps", () => {
  const r = lookup({
    assetType: "property",
    assetState: "DL",
    assetDistrict: "South Delhi",
    recordType: "revenue_land",
    asOf: "2027-01-01",
  });
  const card = r.procedures.find((p) => p.id === "dl-south-land");
  assert.ok(card);
  assert.equal(card!.status, "review_due");
  assert.equal(card!.steps.length, 0);
});

test("an unsupported state code is rejected, not guessed", () => {
  const r = lookup({ assetType: "property", assetState: "ZZ" });
  assert.equal(r.status, "invalid_state");
});

test("overseas country is sent to separate jurisdiction review", () => {
  const r = lookup({ country: "USA", assetType: "bank_deposit" });
  assert.equal(r.status, "outside_india");
});

test("death registration routes by the state where the death occurred", () => {
  const r = lookup({ service: "death_registration", deathState: "TN" });
  assert.equal(r.jurisdiction_basis, "deathState");
});
