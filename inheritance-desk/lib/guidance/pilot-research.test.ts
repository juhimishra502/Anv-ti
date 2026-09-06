// Verifies the verified pilot research imports for all five states with provenance,
// and that the specific known unresolved/conflict points are preserved (never invented
// away). Pure test: reads the JSON packs directly.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { pilotToDetail, pilotProvenance, type PilotProcedure, type ManifestEntry } from "./pilot-research.ts";

const dir = new URL("../../government-data/", import.meta.url);
const pilots = JSON.parse(readFileSync(new URL("operational-pilot/procedure-research.json", dir), "utf8")) as PilotProcedure[];
const manifest = JSON.parse(readFileSync(new URL("operational-pilot/source-manifest.json", dir), "utf8")) as ManifestEntry[];
const procedures = JSON.parse(readFileSync(new URL("procedures.json", dir), "utf8")) as Array<{ id: string; detail?: { unresolved?: string[] } }>;

const get = (id: string) => pilots.find((p) => p.id === id)!;
const unresolvedText = (id: string) => (pilotToDetail(get(id)).unresolved as string[]).join(" || ").toLowerCase();

test("all four pilot states plus UP are represented", () => {
  const states = new Set(pilots.map((p) => p.state));
  for (const s of ["DL", "TN", "MH", "KA"]) assert.ok(states.has(s), `missing pilot state ${s}`);
  const up = procedures.find((p) => p.id === "up-varasat-mutation");
  assert.ok(up?.detail?.unresolved?.length, "UP Varasat detail with unresolved fields must exist");
});

test("Delhi Mehrauli: attestation conflict and 14-vs-21-day SLA conflict preserved", () => {
  const t = unresolvedText("dl-smc");
  assert.match(t, /attestation/);
  assert.match(t, /14|21/);
  assert.match(t, /conflict/);
});

test("Tamil Nadu Egmore: incumbent, hours, eligibility, SLA and upload rules preserved", () => {
  const t = unresolvedText("tn-heir");
  assert.match(t, /officer|incumbent|hours/);
  assert.match(t, /sla|application sla|processing/);
  assert.match(t, /upload|eligibility|g\.?o\.?/);
});

test("Maharashtra Andheri: charges, hours and appeal details preserved", () => {
  const t = unresolvedText("mh-epsit");
  assert.match(t, /fee|charge/);
  assert.match(t, /hours|contact/);
  assert.match(t, /appeal/);
});

test("Karnataka Bengaluru North: hobli counter, address, hours and fee components preserved", () => {
  const t = unresolvedText("ka-familytree");
  assert.match(t, /counter|address|hours|incumbent/);
  assert.match(t, /fee|e-stamp|rate/);
});

test("Uttar Pradesh Lucknow: fee, address, officer, hours, form and SLA preserved", () => {
  const up = procedures.find((p) => p.id === "up-varasat-mutation")!;
  const t = (up.detail!.unresolved ?? []).join(" || ").toLowerCase();
  assert.match(t, /fee/);
  assert.match(t, /address|officer|hours/);
  assert.match(t, /form/);
  assert.match(t, /processing-time|sla|statewide/);
});

test("provenance carries snapshot hashes and retrieval dates from the manifest", () => {
  const prov = pilotProvenance(get("dl-smc"), manifest);
  assert.ok(prov.length > 0);
  assert.ok(prov.some((p) => p.snapshot_sha256 && p.url), "expected at least one source with a snapshot hash + URL");
});

test("no pilot procedure is marked execution-approved", () => {
  for (const p of pilots) assert.equal(p.execution_approved, false, `${p.id} must not be execution-approved`);
});
