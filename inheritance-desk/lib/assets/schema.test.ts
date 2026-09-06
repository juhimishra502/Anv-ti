// Checks the per-asset sub-questionnaires: coverage, targets, and key fields.
import { test } from "node:test";
import assert from "node:assert/strict";
import { ASSET_SCHEMAS, assetSchema, type AField } from "./schema.ts";
import { SERVICES } from "../guidance/services.ts";

const ids = (fs: AField[]) => new Set(fs.map((f) => f.id));

test("every service intake key resolves to a non-empty schema", () => {
  for (const meta of Object.values(SERVICES)) {
    if (!meta.intakeKey) continue;
    const fs = assetSchema(meta.intakeKey);
    assert.ok(fs.length > 0, `intake key ${meta.intakeKey} (service ${meta.id}) has no fields`);
  }
});

test("property collects location hierarchy, record type and the required record docs", () => {
  const s = ids(ASSET_SCHEMAS.property);
  for (const id of ["state_code", "district", "subdistrict", "village_ward", "urban_rural", "record_type", "record_doc", "identifier", "ownership", "title_document", "mortgage", "tenancy", "litigation"]) {
    assert.ok(s.has(id), `property missing ${id}`);
  }
});

test("bank schema captures nomination, joint holding, survivorship, value band, minor, dispute", () => {
  const s = ids(ASSET_SCHEMAS.bank);
  for (const id of ["institution", "account_type", "nominee_status", "holding_mode", "survivorship_mandate", "value_band", "minor_claimant", "dispute"]) {
    assert.ok(s.has(id), `bank missing ${id}`);
  }
});

test("demat schema captures NSDL/CDSL, DP, client id, RTA, nomination and non-resident heir", () => {
  const s = ids(ASSET_SCHEMAS.demat);
  for (const id of ["depository", "institution", "dp_id", "client_id", "issuer", "rta", "nominee_status", "non_resident_heir"]) {
    assert.ok(s.has(id), `demat missing ${id}`);
  }
});

test("insurance schema captures insurer, policy, nominee, assignee, status, death nature, original", () => {
  const s = ids(ASSET_SCHEMAS.insurance);
  for (const id of ["institution", "policy_type", "policy_number", "nominee_status", "assignee", "policy_status", "death_nature", "original_policy"]) {
    assert.ok(s.has(id), `insurance missing ${id}`);
  }
});

test("epfo and nps schemas capture their scheme-specific identifiers", () => {
  assert.ok(ids(ASSET_SCHEMAS.epfo).has("uan"));
  assert.ok(ids(ASSET_SCHEMAS.nps).has("pran"));
});

test("dedicated schemas exist for the specialist asset classes", () => {
  for (const key of ["ppf", "gsec", "sgb", "corporate_bond", "locker", "vehicle", "gratuity", "family_pension", "sole_proprietorship", "partnership", "llp", "private_company", "unlisted_shares", "employer_benefit", "overseas", "digital", "crypto", "liability", "unclaimed"]) {
    assert.ok((ASSET_SCHEMAS[key]?.length ?? 0) > 0, `missing schema for ${key}`);
  }
});

test("every institution field names a regulator category; targets are well-formed", () => {
  for (const [key, fs] of Object.entries(ASSET_SCHEMAS)) {
    for (const f of fs) {
      if (f.type === "institution") assert.ok(f.institutionCategory, `${key}.${f.id} institution field has no category`);
      if (f.target) assert.match(f.target, /^(col:[a-z_]+|loc:[a-z_]+|inst)$/, `${key}.${f.id} bad target ${f.target}`);
    }
  }
});
