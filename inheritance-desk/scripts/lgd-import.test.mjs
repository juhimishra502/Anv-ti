// Runnable check for the LGD importer's pure core (parse + validation + counts).
// Run: node --test scripts/lgd-import.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseAndValidate } from "./lgd-core.mjs";

const HEADER = "level,code,parent_code,name,active,aliases";

test("valid hierarchy: no blocking errors, counts by jurisdiction type", () => {
  const csv = [
    HEADER,
    "state,09,,Uttar Pradesh,1,",
    "district,09-001,09,Prayagraj,1,Allahabad",
    "subdistrict,09-001-01,09-001,Sadar,1,",
    "village,09-001-01-001,09-001-01,Rampur,1,",
  ].join("\n");
  const { counts, hasBlocking, records } = parseAndValidate(csv);
  assert.equal(hasBlocking, false);
  assert.deepEqual(counts, { state: 1, district: 1, subdistrict: 1, village: 1 });
  assert.equal(records.find((r) => r.code === "09-001").aliases[0], "Allahabad");
});

test("duplicate code is rejected", () => {
  const csv = [HEADER, "state,09,,Uttar Pradesh,1,", "state,09,,Dup,1,"].join("\n");
  const { errors, hasBlocking } = parseAndValidate(csv);
  assert.ok(hasBlocking);
  assert.deepEqual(errors.duplicates, ["09"]);
});

test("missing parent (not in file nor DB) is a blocking error", () => {
  const csv = [HEADER, "district,09-001,09,Prayagraj,1,"].join("\n");
  const { errors, hasBlocking } = parseAndValidate(csv, new Set());
  assert.ok(hasBlocking);
  assert.equal(errors.missing_parents[0].parent_code, "09");
});

test("missing parent is OK when the parent already exists in the DB", () => {
  const csv = [HEADER, "district,09-001,09,Prayagraj,1,"].join("\n");
  const { errors, hasBlocking } = parseAndValidate(csv, new Set(["09"]));
  assert.equal(hasBlocking, false);
  assert.equal(errors.missing_parents.length, 0);
});

test("cycle is detected", () => {
  const csv = [HEADER, "district,A,B,Aaa,1,", "district,B,A,Bbb,1,"].join("\n");
  const { errors, hasBlocking } = parseAndValidate(csv);
  assert.ok(hasBlocking);
  assert.ok(errors.cycles.length >= 1);
});

test("inactive rows are flagged (not blocking) and importable", () => {
  const csv = [HEADER, "state,09,,Uttar Pradesh,1,", "district,09-002,09,Old District,0,"].join("\n");
  const { errors, hasBlocking } = parseAndValidate(csv);
  assert.equal(hasBlocking, false);
  assert.deepEqual(errors.inactive, ["09-002"]);
});

test("malformed rows (bad level / missing name) are rejected", () => {
  const csv = [HEADER, "planet,09,,Mars,1,", "state,,,Nameless,1,"].join("\n");
  const { errors, hasBlocking } = parseAndValidate(csv);
  assert.ok(hasBlocking);
  assert.equal(errors.malformed.length, 2);
});
