// Conditional-branching checks for the schema-driven questionnaire.
// Run via `npm test` (node --test --experimental-strip-types).
import { test } from "node:test";
import assert from "node:assert/strict";
import { visibleFields, answersToDeceasedColumns, QUESTIONNAIRE, type QAnswers } from "./schema.ts";

const ids = (a: QAnswers) => new Set(visibleFields(a).map((f) => f.id));

test("will follow-ups appear only when a will exists", () => {
  assert.equal(ids({}).has("registered_will"), false);
  assert.equal(ids({ will: "none" }).has("registered_will"), false);
  const withWill = ids({ will: "exists" });
  for (const id of ["will_original_available", "registered_will", "executor", "witnesses"]) {
    assert.ok(withWill.has(id), `expected ${id} when will exists`);
  }
});

test("executor availability appears only when an executor is named", () => {
  assert.equal(ids({ will: "exists" }).has("executor_available"), false);
  assert.ok(ids({ will: "exists", executor: "yes" }).has("executor_available"));
});

test("letters of administration appear only when there is no will", () => {
  assert.ok(ids({ will: "none" }).has("letters_of_administration"));
  assert.equal(ids({ will: "exists" }).has("letters_of_administration"), false);
});

test("delayed-registration appears only when death is not registered", () => {
  assert.equal(ids({ death_registered: "yes" }).has("delayed_registration"), false);
  assert.ok(ids({ death_registered: "no" }).has("delayed_registration"));
});

test("overseas details appear only when an overseas person/asset exists", () => {
  assert.equal(ids({}).has("overseas_heir_country"), false);
  assert.ok(ids({ overseas_heirs: "yes" }).has("overseas_heir_country"));
  assert.equal(ids({}).has("overseas_assets_country"), false);
  assert.ok(ids({ overseas_assets: "yes" }).has("overseas_assets_country"));
});

test("minor-heir details appear only when a minor heir exists", () => {
  assert.equal(ids({}).has("minor_guardian"), false);
  assert.ok(ids({ minors: "yes" }).has("minor_guardian"));
});

test("certificate copies appear only when the certificate is available", () => {
  assert.equal(ids({}).has("certificate_copies"), false);
  assert.ok(ids({ death_certificate: "available" }).has("certificate_copies"));
});

test("objection or missing heir routes to professional review via dispute_status", () => {
  assert.equal(answersToDeceasedColumns({ objection: "yes" }).dispute_status, "yes");
  assert.equal(answersToDeceasedColumns({ missing_heir: "yes" }).dispute_status, "yes");
  // A plain "no" is preserved; only objection/missing-heir force "yes".
  assert.equal(answersToDeceasedColumns({ dispute: "no" }).dispute_status, "no");
  assert.equal(answersToDeceasedColumns({ dispute: "no", objection: "yes" }).dispute_status, "yes");
});

test("mapped fields land in the right deceased columns", () => {
  const cols = answersToDeceasedColumns({ full_name: "A B", death_state: "UP", will: "exists" });
  assert.equal(cols.full_name, "A B");
  assert.equal(cols.death_state, "UP");
  assert.equal(cols.will_status, "exists");
});

test("every field has a unique id and belongs to a known section", () => {
  const seen = new Set<string>();
  for (const f of QUESTIONNAIRE) {
    assert.ok(!seen.has(f.id), `duplicate field id: ${f.id}`);
    seen.add(f.id);
    assert.ok(["death", "legal", "heirs", "estate"].includes(f.section));
  }
});
