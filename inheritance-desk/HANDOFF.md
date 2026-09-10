# Inheritance Desk — Engineering Handoff

Last reviewed: 6 September 2026  
Current branch: `main`  
Current HEAD: `9d14661 Bug fix`  
Repository: `https://github.com/juhimishra502/Anv-ti`

## 1. Product purpose

Inheritance Desk helps a family understand what to do after a death in India when the estate contains property, bank money, securities, insurance, pensions, bonds, vehicles, businesses, digital assets, or other benefits.

The product asks for the facts that change the route, selects the relevant jurisdiction and institution, and produces a source-cited roadmap. The roadmap explains the next action, likely documents, responsible authority, timing, fees when verified, source date, and unresolved items.

The product is an orientation service. It must not claim that a route is certified, legally sufficient, execution-ready, or guaranteed to succeed. The code deliberately withholds action steps when source coverage is stale or incomplete.

## 2. Current implementation status

Working in the current build:

- Next.js App Router application with TypeScript and React.
- Neon Postgres database accessed server-side with `@neondatabase/serverless`.
- Server-side sessions in an httpOnly cookie, backed by the `sessions` table.
- Demo sign-in for local review.
- Aadhaar sandbox flow with synthetic test identities and OTP `123456`.
- Live Aadhaar disabled until an authorised UIDAI AUA/KUA/ASA provider is configured.
- State, district, asset, institution, deceased-person, heir, document, and roadmap storage.
- Jurisdiction-aware rules engine for all 36 Indian states/UTs.
- State and asset routing that keeps user residence, deceased residence, place of death, and asset location separate.
- Conditional questionnaire with versioned answer snapshots.
- Connected roadmap/dependency graph with parallel asset tracks.
- Source citations, review dates, coverage labels, unresolved fields, and professional-review triggers.
- Groq-backed grounded chatbot, server-side only, streaming NDJSON responses.
- Browser speech read-aloud and voice input with language-aware capability checks.
- UI language selection on landing, sign-in, onboarding, and case screens.
- Hand-authored UI translations for English, Hindi, and Tamil; additional locale dictionaries exist and dynamic content can use Groq translation.
- Persistent global music player with autoplay attempt, first-interaction fallback, route continuity, mute, close, reopen, fade, seek, and voice ducking.
- Real clover-meadow photo background with glass UI, pointer depth, light/pollen motion, and reduced-motion support.
- Production Docker/Railway configuration and health endpoint.

The repository's older `README.md` and `MILESTONE-1.md` contain useful product history but have stale statements that describe SQLite and Claude. For runtime truth, follow the current source files and this document: the current database client is Neon and the chatbot provider is Groq.

## 3. Local setup

Requirements:

- Node 24 or newer.
- npm.
- A Neon Postgres database for anything that persists users, cases, or guidance data.

```bash
cd "/Users/juhimishra/Documents/Projects/Govt sector/inheritance-desk"
npm install
cp .env.local.example .env.local
npm run dev
```

The default URL is `http://localhost:3000`. To use the user's current browser port:

```bash
npm run dev -- --hostname 127.0.0.1 --port 3199
```

Do not run two Next dev servers against the same `.next` directory. If port 3199 is already owned by this repository, use that process or restart it before starting another one.

## 4. Environment variables

Copy `.env.local.example`. Never commit `.env.local`, database URLs, Groq keys, Aadhaar credentials, session secrets, or uploaded documents.

Required for a real persistent environment:

```text
DATABASE_URL=postgresql://...
SESSION_SECRET=<stable random secret>
```

Optional AI configuration:

```text
GROQ_API_KEY=...
GROQ_MODEL=openai/gpt-oss-120b
```

Optional Aadhaar configuration:

```text
AADHAAR_PROVIDER=sandbox
AADHAAR_AUA_CODE=...
AADHAAR_ASA_KEY=...
AADHAAR_LICENSE_KEY=...
```

The current sandbox accepts only the synthetic identities defined in `lib/auth/aadhaar/provider.ts`. It does not contact UIDAI. Do not present sandbox success as real Aadhaar verification. Live Aadhaar requires legal, contractual, security, and provider approval work outside this repository.

The local `.env.local` currently contains sensitive credentials. If those values have ever been shared, committed, screen-recorded, or pasted into an external service, rotate the Groq and Neon credentials immediately.

## 5. Runtime architecture

```text
app/layout.tsx
  Environment                  global photographic scene
  LocaleProvider               locale and translation state
  AudioProvider                one global HTML audio element
  Depth3D                      pointer coordinates -> CSS variables
  route page                   landing, sign-in, onboarding, case/roadmap
  MusicPlayer                  persistent controls

app/page.tsx                    landing questionnaire and auth entry
app/signin/page.tsx             Aadhaar sandbox/live boundary and demo access
app/onboarding/[id]/page.tsx    conditional deceased/heir questionnaire + assets
app/case/[id]/page.tsx          roadmap, graph, asset tracks, chatbot, documents

app/api/*                       authenticated route handlers
lib/db/*                        Neon client, schema, repository, authorization
lib/guidance/*                  source-backed rules engine and roadmap builder
lib/questionnaire/*             versioned conditional intake schema
lib/assets/*                    per-asset intake schemas and validation
lib/ai/chat.ts                  grounded Groq streaming assistant
lib/i18n/*                      locale state and translations
lib/voice/*                     browser speech capability helpers
government-data/*               versioned research catalogue and source snapshots
```

All case routes must call `requireUser()` and `assertCaseAccess()`. The database uses one trusted server-side Neon role; there is no browser database client and no Postgres RLS in the current build. Application-level family membership is therefore a critical security boundary.

## 6. User journey

1. Landing page: user selects state, district, asset type, and language. District is dependent on the selected state and comes from `/api/jurisdictions`.
2. User starts a case. A signed-out user sees the sign-in/demo choice. A signed-in user goes directly to case creation.
3. Sign-in: demo access creates a clearly marked demo account. Aadhaar sandbox requires consent, a synthetic identity, OTP, nonce-cookie binding, expiry, retry limit, and a one-use transaction.
4. Onboarding: the user answers the conditional schema in `lib/questionnaire/schema.ts`. Hidden fields are not shown; relevant follow-ups appear only when their trigger is satisfied.
5. Asset intake: the user adds each asset. Property collects location and record details. Financial and specialist assets collect their own institution/scheme/nomination/holding fields.
6. Roadmap generation: one transaction replaces roadmap nodes, stores questionnaire and answer versions, and writes an audit event. The client navigates only after the transaction succeeds.
7. Case page: the user sees a connected journey graph, current next step, parallel asset tracks, compact cards, expandable detail, source links, status controls, documents, voice/read-aloud, and grounded chat.
8. User-reported progress is stored as tracking data. It is never presented as official government status.

## 7. Jurisdiction and rules engine

The engine must never choose a procedure using only the user's residential state.

- Property and land records route by asset location.
- Legal-heir/succession routes use the deceased person's residence where applicable.
- Death registration uses the place where death occurred.
- Bank, insurer, AMC, DP/RTA, EPFO, NPS, postal, employer, and pension routes use institution/scheme facts.
- Overseas and digital assets route to specialist review unless a verified source-backed route exists.
- Disputes, minors, missing heirs, contested wills, foreign complexity, and other triggers add professional review rather than silently selecting a shortcut.

`government-data/states.json` contains all 36 states/UTs. Coverage varies. A state with only directory information must return an explicit fallback, never copied instructions from Uttar Pradesh or another pilot state.

The source pack includes national and selected operational pilot research for Delhi, Maharashtra, Tamil Nadu, Karnataka, and Uttar Pradesh. The deep property example is Uttar Pradesh Varasat/succession mutation. Pilot office fields are verified individually; unknown fees, officer names, addresses, hours, and SLAs remain marked unresolved.

Important data files:

- `government-data/catalog.json`: procedure catalogue.
- `government-data/procedures.json`: procedure records.
- `government-data/sources.json`: source ledger.
- `government-data/states.json`: state/UT coverage.
- `government-data/asset-types.json`: asset taxonomy.
- `government-data/operational-pilot/`: office records, research status, snapshots, hashes.
- `government-data/COVERAGE.md`: honest coverage explanation.
- `government-data/SYNC_POLICY.md`: source freshness and publication rules.

Never add an office, fee, form, official, deadline, or legal requirement from a blog or memory. Add it to the source ledger, capture retrieval date and hash, run validation, and keep it unavailable for execution until the review policy permits publication.

## 8. Database

The runtime database is Neon Postgres. Apply the schema with:

```bash
node --env-file=.env.local scripts/apply-schema.mjs
```

The schema is in `lib/db/schema.sql`. Main entities:

- `users`, `sessions`, `language_preferences`, `consents`
- `families`, `family_members`, `cases`
- `deceased_persons`, `heirs`
- `assets`, `asset_locations`
- `roadmap_steps`, `questionnaire_schemas`
- `jurisdictions`, `jurisdiction_aliases`, import-run tables
- `institutions`, institution claim/procedure tables
- `documents`, `document_blobs`
- `aadhaar_verifications`
- `audit_events`

`lib/db/repo.ts` is the data-access and authorization layer. Keep all server-side queries there or in a clearly bounded service. Do not put `DATABASE_URL` in client code.

The repository still contains migration/recovery scripts referencing the old SQLite prototype. They are historical or migration tools, not the current runtime database. Confirm the target database before running any migration script.

## 9. API map

Authentication:

- `POST /api/auth/demo`
- `POST /api/auth/aadhaar/start`
- `POST /api/auth/aadhaar/verify`
- `GET /api/auth/aadhaar/info`
- `GET /api/auth/me`
- `POST /api/auth/logout`

Reference and guidance:

- `GET /api/reference`
- `GET /api/jurisdictions?parent=<state>&level=district`
- `POST /api/guidance`
- `GET/POST /api/institutions`
- `POST /api/translate`

Cases and roadmap:

- `GET/POST /api/cases`
- `GET/PATCH /api/cases/[id]`
- `GET/PATCH /api/cases/[id]/deceased`
- `GET/POST/PATCH/DELETE /api/cases/[id]/assets`
- `PATCH/DELETE /api/cases/[id]/assets/[assetId]`
- `POST /api/cases/[id]/roadmap`
- `GET/PATCH /api/cases/[id]/steps/[stepId]`
- `GET/POST /api/cases/[id]/documents`
- `GET/DELETE /api/cases/[id]/documents/[docId]`
- `GET /api/cases/[id]/documents/[docId]/file`
- `POST /api/cases/[id]/chat`
- `GET /api/health`

Route handlers use `guard()` for consistent errors and `requireUser()` for authentication. Case-specific routes must enforce membership before reading or writing data.

## 10. AI, language, and voice

`lib/ai/chat.ts` retrieves source-grounded context and sends it to Groq. It streams metadata, deltas, and completion markers as NDJSON. Without `GROQ_API_KEY`, the UI shows an honest unavailable state.

The assistant must not invent missing government information. Source content is untrusted data and must not be allowed to override system constraints. Keep prompts bounded by the case query and cited catalogue records.

`lib/i18n/messages.ts` is the canonical UI message set. Generated dictionaries are in `lib/i18n/generated/`. The selected locale is persisted through `/api/preferences`. Dynamic procedure text can be translated on demand, but a missing translation must fall back to labelled source English rather than pretending it is translated.

`lib/voice/speech.ts`, `components/VoiceAssistant.tsx`, and `components/ReadAloud.tsx` use browser Web Speech APIs. Browser voice availability differs by OS and language. The UI must state when a requested voice is unavailable and must never silently speak English as if it were the selected language.

Audio is controlled by `lib/audio/audio-context.tsx`. It owns the only `<audio>` element and is mounted in `app/layout.tsx`, so route changes do not restart music. Browser autoplay policy can reject immediate audible playback; the provider then starts on the first user interaction. Closing sound is session-scoped and can be reopened.

## 11. UI and visual system

The landing UI lives in `app/page.tsx` and its main styles are near the `Meadow landing` section of `app/globals.css`.

- `public/images/clover-meadow.jpg` is the real photographic background.
- `Environment` provides the global scene behind routes.
- `Depth3D` publishes `--mx` and `--my` from pointer movement.
- Landing depth layers add light and pollen above the photo.
- Glass, frame, hero, form, and buttons use CSS perspective and depth.
- `prefers-reduced-motion: reduce` disables idle motion and perspective transitions.
- `public/inheritance-track.mp3` supplies the landing music.

Keep the UI functional HTML. Do not flatten controls into the reference screenshot. Keep labels, focus states, keyboard operation, large touch targets, and visible fallback/error states.

## 12. Testing and verification

Run before merging:

```bash
npx tsc --noEmit --incremental false
npm run lint
npm test
npm run test:catalog
npm run build
```

The current test suite covers state/UT resolution, asset routing, stale-source safety, pilot procedures, professional-review triggers, questionnaire conditionals, 30-field step details, translations, catalogue integrity, and service registrations. The last verified application suite reported 121 passing tests; the catalogue suite reported 14 passing tests.

Visual tests are in `tests/visual/screens.spec.ts`. They require a running browser environment and may need snapshot updates after intentional visual changes. Do not update snapshots just to hide a regression; inspect the screenshots first.

For live checks:

1. Open `http://localhost:3199/`.
2. Hard refresh after restarting the dev server.
3. Confirm the landing form, district dependency, language selector, music controls, and auth entry.
4. Confirm an Arunachal Pradesh property case does not display Uttar Pradesh procedure content.
5. Confirm a Tamil selection changes UI and voice capability handling.
6. Confirm roadmap generation does not leave the button stuck if an API request fails.
7. Confirm a signed-in user cannot access another user's case URL.

## 13. Deployment

The repository includes `Dockerfile`, `docker-entrypoint.sh`, `railway.json`, `.railwayignore`, and a health route at `/api/health`. `next.config.ts` uses `output: "standalone"` for the container build.

For Railway or another container host:

1. Build from the repository root.
2. Set `DATABASE_URL`, `SESSION_SECRET`, and optional `GROQ_*` variables in the platform secret manager.
3. Keep `AADHAAR_PROVIDER=sandbox` until a legally authorised live provider is contracted and tested.
4. Run the schema against the production Neon database before accepting traffic.
5. Verify `/api/health`, sign-in, case creation, roadmap generation, and database writes.
6. Do not copy the local `.env.local` into the image or commit it to Git.

The production build is a Next standalone server. The exact start command should follow `docker-entrypoint.sh` and the platform configuration rather than a local dev command.

## 14. Security and privacy handoff

- Never log full Aadhaar numbers, OTPs, database URLs, Groq keys, uploaded document contents, or session IDs.
- Store only masked Aadhaar references and provider transaction metadata.
- Keep Aadhaar sandbox visibly labelled.
- Use secure cookies in production and a stable random `SESSION_SECRET`.
- Keep all Neon queries server-side.
- Preserve case membership checks on every case route.
- Add malware scanning, OCR isolation, retention controls, encryption review, and granular family permissions before accepting real documents.
- Rotate any credential that appears in a screenshot, chat, commit, terminal capture, or external service.

## 15. Known limitations and next milestones

The current product is a strong orientation MVP, not a government filing service.

Still required before a paid production launch:

- Replace or formally validate the current Neon/server-role security model with stronger isolation and audited access controls.
- Add document upload scanning, OCR, file retention, and per-family permissions.
- Complete verified procedures and current office records beyond the pilot jurisdictions.
- Build a source-admin console, review queue, scheduled sync, conflict resolution, and publish/version workflow.
- Finish reviewed translations and production-quality STT/TTS for all promised languages.
- Contract an authorised Aadhaar provider before enabling live authentication.
- Add transparent billing, refunds, human support, professional referral agreements, and legal terms.
- Add monitoring, rate limiting, backups, incident response, and privacy/security review.
- Run visual regression updates after the final landing design is approved.

Do not label the service “execution-ready” until the accepting authority, current form, fee, office, SLA, and source freshness are verified for the exact asset and district. The existing `execution_available` and `execution_approved` fields should remain false until that review is complete.

## 16. Safe first handoff tasks

The next engineer should work in this order:

1. Confirm the deployed environment and Neon schema with `/api/health` and a non-sensitive demo case.
2. Add CI that runs typecheck, lint, tests, catalogue validation, and build on every pull request.
3. Reconcile stale README/MILESTONE wording with this handoff, especially SQLite versus Neon and Claude versus Groq.
4. Add an admin-only data-review workflow before importing more state or institution procedures.
5. Add end-to-end authorization and document-security tests before enabling real user documents.
6. Only then expand verified jurisdiction and institution coverage.

## 17. Source of truth when documents disagree

Use this order:

1. Current source code and database schema for runtime behavior.
2. `government-data/SYNC_POLICY.md`, source manifest, hashes, and reviewed catalogue records for guidance data.
3. This handoff for system context and known limitations.
4. `README.md`, `MILESTONE-1.md`, and old Claude summaries for historical context only.

When in doubt, preserve the honest fallback and mark the field unresolved. A missing answer is safer than a confident invented office, fee, form, timeline, or legal requirement.
