// Checks the 30-field step-detail template: fixed count/order, honest unknowns, and
// population from a real researched detail (UP Varasat).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildStepDetail, STEP_DETAIL_FIELD_COUNT } from "./step-detail.ts";

const EXPECTED_ORDER = [
  "why_applies", "expected_result", "prerequisites", "action_sequence", "who_may_apply",
  "required_documents", "conditional_documents", "form_name", "form_download", "online_link",
  "offline_method", "responsible_authority", "office_name", "office_address", "service_counter",
  "officer_role", "telephone", "email", "public_hours", "appointment", "fee", "payment_method",
  "published_timeline", "estimated_timeline", "notice_hearing", "acknowledgement",
  "completion_evidence", "correction_appeal", "sources", "verification_status",
];

test("there are exactly 30 fields, in the fixed order", () => {
  assert.equal(STEP_DETAIL_FIELD_COUNT, 30);
  const fields = buildStepDetail({});
  assert.equal(fields.length, 30);
  assert.deepEqual(fields.map((f) => f.key), EXPECTED_ORDER);
  fields.forEach((f, i) => assert.equal(f.n, i + 1));
});

test("an empty detail yields honest not-verified fields with authority + rest-safe", () => {
  const fields = buildStepDetail({ detail: {}, routeSafe: true });
  const addr = fields.find((f) => f.key === "office_address")!;
  assert.equal(addr.status, "not_verified");
  assert.equal(addr.value, null);
  assert.ok(addr.missing_field);
  assert.ok(addr.authority && addr.authority.length > 0);
  assert.equal(addr.rest_safe, true);
});

test("an unusable route marks fields not-safe-to-follow", () => {
  const fields = buildStepDetail({ detail: {}, routeSafe: false });
  assert.ok(fields.every((f) => f.rest_safe === false));
});

test("the real UP Varasat detail populates the structured fields (no giant paragraph)", () => {
  const procs = JSON.parse(readFileSync(new URL("../../government-data/procedures.json", import.meta.url), "utf8"));
  const up = procs.find((p: { id: string }) => p.id === "up-varasat-mutation");
  assert.ok(up?.detail, "UP Varasat detail must exist");
  const fields = buildStepDetail({
    detail: up.detail,
    sources: [{ id: "up-revenue-code", title: "UP Revenue Code", publisher: "Govt of UP", url: "https://example.gov.in" }],
  });
  const byKey = Object.fromEntries(fields.map((f) => [f.key, f]));
  assert.equal(byKey.why_applies.status, "verified");
  assert.ok((byKey.action_sequence.value ?? "").length > 0);
  assert.equal(byKey.prerequisites.status, "verified");
  // Lucknow office address is a verified example in the pack.
  assert.notEqual(byKey.office_name.status, "not_verified");
  // Unresolved fields are surfaced in field 30.
  assert.match(byKey.verification_status.value ?? "", /unresolved|no unresolved/i);
});
