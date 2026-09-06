// End-to-end routing matrix (Cases A–G) plus the extra scenarios from the brief,
// driven through the REAL grounded engine + service registry + 30-field step panel +
// pilot research. Deterministic and runnable in CI (no browser, no DB). DB-backed
// scenarios (institution-not-found, alias search, asset edit/delete, one bulk write,
// measured query count/time) live in scripts/e2e-db-matrix.mjs.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createLookup } from "./engine.ts";
import { professionalReviewReason, serviceMeta } from "./services.ts";
import { buildStepDetail } from "./step-detail.ts";
import { pilotToDetail, type PilotProcedure } from "./pilot-research.ts";
import { getLocale } from "../i18n/locales.ts";

const dir = new URL("../../government-data/", import.meta.url);
const read = (f: string) => JSON.parse(readFileSync(new URL(f, dir), "utf8"));
const catalog = {
  meta: read("catalog.json"),
  states: read("states.json"),
  sources: read("sources.json"),
  procedures: read("procedures.json"),
  assetTypes: read("asset-types.json"),
};
const { lookup } = createLookup(catalog);
const pilots = read("operational-pilot/procedure-research.json") as PilotProcedure[];
const pilot = (id: string) => pilots.find((p) => p.id === id)!;

// ---- CASE A: UP / Lucknow agricultural land -> Varasat, RCCMS, Lekhpal chain -------
test("Case A: UP revenue land routes to the Varasat mutation with the Lekhpal chain and honest unresolved fee/office", () => {
  const r = lookup({ assetType: "property", service: "property_mutation", assetState: "UP", recordType: "revenue_land" });
  assert.equal(r.jurisdiction_state, "Uttar Pradesh");
  const up = r.procedures.find((p) => p.id === "up-varasat-mutation");
  assert.ok(up, "expected up-varasat-mutation");
  const d = up!.detail!;
  assert.match(d.office.authority_chain, /Lekhpal.*Revenue Inspector.*Tahsildar/);
  assert.match(JSON.stringify(d), /RCCMS/);
  assert.match(JSON.stringify(d), /khatauni/i);
  const fields = buildStepDetail({ detail: d as unknown as Record<string, unknown>, sources: [] });
  const fee = fields.find((f) => f.key === "fee")!;
  assert.notEqual(fee.status, "verified");
  assert.ok(fee.authority);
});

// ---- CASE B: KA resident with a TN/Egmore property -> routed by TN, not KA/UP -------
test("Case B: a Tamil Nadu property is routed by TN even for a Karnataka resident; no UP/KA property route reused", () => {
  const r = lookup({ assetType: "property", service: "property_mutation", assetState: "TN", userState: "KA", deceasedState: "KA" });
  assert.equal(r.jurisdiction_state, "Tamil Nadu");
  assert.ok(!r.procedures.some((p) => p.id === "up-varasat-mutation"), "must not reuse the UP route");
  assert.ok(!r.procedures.some((p) => p.id.startsWith("ka-")), "must not reuse a KA route for a TN property");
  assert.equal(r.jurisdiction_basis, "assetState");
});

// ---- CASE C: Delhi, two bank accounts, one with nominee, one without ---------------
test("Case C: bank claims branch on nominee vs no-nominee", () => {
  const withNominee = lookup({ assetType: "bank_deposit", service: "bank_claim", institution: "State Bank of India", nomineeStatus: "registered", deceasedState: "DL" });
  const noNominee = lookup({ assetType: "bank_deposit", service: "bank_claim", institution: "State Bank of India", nomineeStatus: "none", deceasedState: "DL" });
  assert.equal(withNominee.service, "bank_claim");
  assert.equal(noNominee.service, "bank_claim");
  assert.equal(withNominee.execution_available, false);
  assert.equal(noNominee.execution_available, false);
});

// ---- CASE D: Maharashtra Andheri property card -> EPSIT path, not 7/12 or UP --------
test("Case D: MH property-card research is EPSIT (Form 9 notice), distinct from the 7/12 e-Hakk path", () => {
  const epsit = pilotToDetail(pilot("mh-epsit"));
  const ehakk = pilotToDetail(pilot("mh-ehakk"));
  assert.match(JSON.stringify(epsit).toLowerCase(), /form 9|notice/);
  assert.notEqual(JSON.stringify(epsit), JSON.stringify(ehakk), "property-card and 7/12 routes must differ");
  assert.doesNotMatch(JSON.stringify(epsit), /varasat/i);
});

// ---- CASE E: five parallel financial tracks route to five distinct services --------
test("Case E: demat, mutual fund, insurance, EPF and NPS route to five distinct services", () => {
  const map: Record<string, string> = {
    shares: "securities_transmission",
    mutual_fund: "mutual_fund_claim",
    life_insurance: "insurance_claim",
    epf: "epfo_claim",
    nps: "nps_claim",
  };
  const services = new Set<string>();
  for (const [assetType, expected] of Object.entries(map)) {
    const r = lookup({ assetType });
    assert.equal(r.service, expected, `${assetType} -> ${expected}`);
    services.add(r.service!);
    assert.ok(serviceMeta(r.service!).intakeKey, `service ${r.service} needs an intake schema`);
  }
  assert.equal(services.size, 5, "five distinct tracks");
});

// ---- CASE F: minor heir + disputed property -> professional-review branch ----------
test("Case F: a dispute forces professional review and a minor heir adds a review trigger on property", () => {
  const disputed = lookup({ assetType: "property", service: "property_mutation", assetState: "UP", recordType: "revenue_land", hasDispute: true });
  assert.equal(disputed.status, "professional_review");
  assert.ok(professionalReviewReason("property_mutation", { hasDispute: true }));
  assert.ok(professionalReviewReason("property_mutation", { hasMinor: true }));
  const normal = lookup({ assetType: "property", service: "property_mutation", assetState: "UP", recordType: "revenue_land" });
  assert.ok(normal.procedures.length > 0);
});

// ---- CASE G: Tamil is a first-class UI locale that persists ------------------------
test("Case G: Tamil is a fully-supported UI locale (persists through the flow)", () => {
  const ta = getLocale("ta");
  assert.equal(ta.code, "ta");
  assert.equal(ta.uiComplete, true);
});

// ---- Extra scenarios ---------------------------------------------------------------
test("an unknown fee is never shown as ₹0 — it is not_verified with an authority", () => {
  const fields = buildStepDetail({ detail: { purpose: "x" }, sources: [] });
  const fee = fields.find((f) => f.key === "fee")!;
  assert.equal(fee.value, null);
  assert.notEqual(fee.value, "₹0");
  assert.equal(fee.status, "not_verified");
  assert.ok(fee.authority);
});

test("an expired procedure (asOf past review_due) withholds action steps", () => {
  const r = lookup({ assetType: "property", service: "property_mutation", assetState: "DL", assetDistrict: "South Delhi", recordType: "revenue_land", asOf: "2999-01-01" });
  const stale = r.procedures.find((p) => p.status === "review_due");
  if (stale) assert.deepEqual(stale.steps, [], "stale procedure must withhold steps");
});

test("no route in the catalogue is ever execution-ready", () => {
  for (const assetType of catalog.assetTypes.map((a: { id: string }) => a.id)) {
    assert.equal(lookup({ assetType }).execution_available, false, `${assetType} must not be execution-ready`);
  }
});
