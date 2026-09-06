# Milestone 1 — status & honest coverage

This tracks what is **built and verified**, what is **imported research**, and what is
**deliberately deferred**. It follows the spec's rule: passing software tests is never
presented as legal or operational verification.

## Built & working (software)

| Area | Status | Where |
|---|---|---|
| Real auth + server-side sessions | ✅ | `lib/auth/session.ts`, `app/api/auth/*` |
| Real relational DB + migrations | ✅ `node:sqlite` | `lib/db/index.ts`, `lib/db/schema.ts` |
| Normalized entities | ✅ | `lib/db/schema.ts` |
| Authorization (family-membership gate) | ✅ | `repo.assertCaseAccess`, all case routes |
| Jurisdiction-aware guidance engine | ✅ port of reviewed reference | `lib/guidance/engine.ts` |
| All 36 states/UTs + honest coverage status | ✅ | `government-data/states.json`, `/api/reference` |
| Independent user / deceased / death / asset jurisdictions | ✅ | schema + onboarding + roadmap |
| Personalized roadmap w/ citations & limits | ✅ | `lib/guidance/roadmap.ts`, `components/GuidanceCard.tsx` |
| One-question onboarding, read-aloud, a11y | ✅ | `app/onboarding`, `components/ReadAloud.tsx` |
| Asset inventory (all categories → services) | ✅ | `app/api/cases/[id]/assets`, `AddAssetForm` |
| Case tracking (user-reported step status) | ✅ | `app/api/cases/[id]/steps/[stepId]` |
| Grounded AI chatbot (Claude) + honest unavailable state | ✅ | `lib/ai/chat.ts`, `components/Chatbot.tsx` |
| Engine safety tests + catalogue integrity tests | ✅ | `lib/guidance/engine.test.ts`, `government-data/lookup.test.mjs` |

## Imported research (NOT certified for execution)

From `government-data/` (research inputs, not approved production rules):
- 36 state/UT records; most are **directory-only**.
- 12 source-backed **orientation** procedures (death registration; Chennai heir routing;
  South Delhi land mutation; MCD tax-name change; bank/securities/mutual-fund/insurance/EPFO/
  NPS/postal claim routing).
- 5 office records with **per-field** verification status (published vs. conflicting vs.
  not-verified).
- Source snapshots with SHA-256 integrity; some downloads failed and are labelled honestly.
- **0 procedures certified execution-ready. No phone call, office visit, or real application
  has been made.**

## Deliberately deferred (not faked)

**Milestone 2** — Supabase/Postgres + row-level security (swap `node:sqlite`); document vault
with malware scan + OCR + confirmation; family invitations, roles, document visibility;
cross-family isolation tests at the data layer.

**Milestone 3** — verified accepting-authority/institution checklists; professional legal
review; transparent billing (free orientation → fixed-price self-service → scoped assisted
service); human caseworker escalation. Pricing stays configurable, unvalidated hypotheses.

**Milestone 4** — full multi-script i18n and reviewed translations; admin/research console
(source import, extraction review, conflict resolution, translation review, versioned publish,
coverage matrix); scheduled source-sync with change detection and review queues.

**AI/voice caveats** — the chatbot is a real **Groq** integration (`groq-sdk`, server-side,
streaming); with no `GROQ_API_KEY` it is honestly unavailable. Read-aloud uses the browser's
built-in TTS. A full conversational voice assistant (STT + provider TTS + critical-field
confirmation) is not yet built.

## How to verify (software only)

```bash
npm run typecheck && npm test && npm run test:catalog && npm run build
```

These prove software behaviour under tested conditions. They do **not** verify legal accuracy,
office details, or that any government process will succeed.
