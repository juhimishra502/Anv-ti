# Inheritance Desk: government-data handoff

This package supplies the state lookup and evidence for the first app milestone. It does not build or deploy the app.

## What is assembled

- 36 state/UT entries: 28 states and 8 UTs, with accepted name aliases.
- A source-indexed land-record directory from the Department of Land Resources.
- 30 asset categories, including explicit specialist-review categories.
- 12 source-based orientation records: national/institution routing plus limited Chennai and Delhi information.
- 15 cited source records; 9 original HTML/PDF snapshots were downloaded successfully. See `SOURCE_GUIDE.md` for originals, missing downloads and known conflicts.
- An offline, dependency-free Node.js lookup module and a test suite.

All states resolve to a structured answer. **This is not 36 complete inheritance checklists.** Most local coverage is directory-only; none is approved for managed execution. Unknown, expired and unsupported combinations produce explicit review/help states. Government websites and legal currency cannot be guaranteed forever.

## Files

| File | Purpose |
|---|---|
| `catalog.json` | Version, scope and refresh policy |
| `states.json` | Names, internal codes, aliases, DoLR directory references and honest portal status |
| `asset-types.json` | Asset category → service mapping |
| `procedures.json` | Jurisdiction conditions, source summaries, questions, evidence and review dates |
| `sources.json` | Source provenance, original-snapshot path, hash and download status |
| `source-documents/` | Successfully downloaded original government/reference files |
| `SOURCE_GUIDE.md` | Human-readable source inventory and material limitations |
| `lookup.mjs` / `lookup.d.mts` | Server-side matching reference and TypeScript declarations |
| `lookup.test.mjs` | State coverage, context isolation, fallback and integrity tests |
| `integrity.json` | SHA-256 for catalogue data and included original snapshots |
| `SYNC_POLICY.md` | Refresh, review, publication and failure handling |

## Run locally

Use Node.js 20+; verified with Node.js 24. No npm installation or government connection is required.

```sh
node --test government-data/lookup.test.mjs
node government-data/lookup.mjs '{"assetState":"Tamil Nadu","assetType":"property"}'
node government-data/lookup.mjs '{"assetState":"Karnataka","service":"legal_heir_certificate","deceasedState":"Tamil Nadu","deceasedDistrict":"Chennai"}'
```

The normal runtime uses today's date. `asOf` exists for deterministic tests; a production API must set the date server-side, not accept an earlier date from the user to bypass review expiry.

## Input behaviour

- `assetState` is where the asset is located. It is never silently replaced with `userState`.
- `legal_heir_certificate` routes on `deceasedState` and `deceasedDistrict`.
- `death_registration` routes on `deathState` and `deathDistrict`.
- Financial services route on institution, scheme and holding details. Being in the same state does not make one bank's policy apply to another bank.
- `recordType`: use `revenue_land` or `municipal_tax` for the limited Delhi examples. MCD additionally requires `authority: "MCD"`.
- `nomineeStatus: "registered"` selects the limited Central Bank example only when `institution: "Central Bank of India"`; remaining context is still required.
- Unknown input fields should remain absent or `"unknown"`. Invalid state spellings return a choice request; there is no fuzzy guess.
- Query each asset independently using its ID; retain the association in the app. Never reuse a global state result across different assets.

## Next.js integration

Use `createLookup()` with static JSON imports in a server-only module. This avoids relying on dynamic filesystem paths after serverless bundling:

```ts
import 'server-only';
import { createLookup } from './government-data/lookup.mjs';
import meta from './government-data/catalog.json';
import states from './government-data/states.json';
import sources from './government-data/sources.json';
import procedures from './government-data/procedures.json';
import assetTypes from './government-data/asset-types.json';

export const guidance = createLookup({ meta, states, sources, procedures, assetTypes });
```

The bundle includes `lookup.d.mts` for the `.mjs` module and `lookup.d.ts` as a compatible type-contract copy. Run the app's own type check after integration.

An authenticated API validates an explicit allowlist of request fields, derives the user from the session, authorizes the selected estate/asset and passes server-owned context to `guidance.lookup()`. Reject client `asOf`; use the server clock. Do not expose unrestricted source fetching or mutate the catalogue from this endpoint.

Cache guidance only by complete relevant context plus catalogue version and freshness state. A state-only cache key is incorrect. Resolve each asset separately; cancel/discard stale requests when users change selection. Use `Cache-Control: private, no-store` for personalized API responses unless a reviewed private caching strategy is implemented.

Keep `source-documents/` outside the public web directory. Raw HTML contains third-party scripts/styles and must not be executed or injected. Display vetted text summaries and safe official links; add a controlled document viewer only if needed.

## Limits and next work

The DoLR directory marks four states as not having a listed RoR URL: Arunachal Pradesh, Meghalaya, Mizoram and Nagaland. This does not mean those states have no land services. Four other entries have URL format/domain/protocol concerns; original values are retained but not promoted to an application URL.

The 30-day review interval is a product policy. Expired rules retain citations but withhold action steps. Refetching alone cannot approve a procedure. No automatic sync job is running.

Before real execution, assemble complete authority/institution checklists, resolve the source conflicts in `SYNC_POLICY.md`, validate local operating coverage and implement production authentication, document permissions and professional review. Do not relabel this pack as legally validated national coverage.
