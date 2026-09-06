// Checks for the dedicated specialist-service registry + professional-review triggers.
import { test } from "node:test";
import assert from "node:assert/strict";
import { SERVICES, serviceMeta, professionalReviewReason } from "./services.ts";

const REQUIRED = [
  "ppf_death_claim", "corporate_bond_transmission", "sovereign_gold_bond_transmission",
  "vehicle_transmission", "sole_proprietorship_succession", "partnership_interest_succession",
  "llp_interest_succession", "private_company_share_transmission", "unlisted_share_transmission",
  "family_pension_claim", "gratuity_death_claim", "employer_benefit_claim",
  "overseas_asset_succession", "digital_account_legacy", "cryptoasset_recovery",
  "estate_liability_resolution",
];

test("all 16 dedicated services are registered with an intake schema key", () => {
  for (const id of REQUIRED) {
    assert.ok(SERVICES[id], `missing service ${id}`);
    assert.equal(SERVICES[id].id, id);
    assert.ok(SERVICES[id].intakeKey, `service ${id} has no intake key`);
  }
});

test("a recorded dispute triggers professional review on any service", () => {
  assert.ok(professionalReviewReason("bank_claim", { hasDispute: true }));
  assert.ok(professionalReviewReason("property_mutation", { hasDispute: true }));
});

test("a missing heir triggers a court/legal review note", () => {
  assert.match(professionalReviewReason("bank_claim", { hasMissingHeir: true }) ?? "", /missing/i);
});

test("a minor heir triggers review on property but not on a routine bank claim", () => {
  assert.ok(professionalReviewReason("property_mutation", { hasMinor: true }));
  assert.equal(professionalReviewReason("bank_claim", { hasMinor: true }), null);
});

test("inherently complex services always suggest review; routine ones do not by default", () => {
  assert.ok(professionalReviewReason("llp_interest_succession", {}));
  assert.ok(professionalReviewReason("cryptoasset_recovery", {}));
  assert.equal(professionalReviewReason("bank_claim", {}), null);
  assert.equal(professionalReviewReason("mutual_fund_claim", {}), null);
});

test("professional review never blanks a service label (route stays informational)", () => {
  for (const id of REQUIRED) assert.ok(serviceMeta(id).label.length > 0);
});
