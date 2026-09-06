# Inheritance Desk — Milestone 1

Accessible, **source-grounded** guidance for families in India claiming and transferring
assets after a death. This is a working application with a real database, backend,
authentication, a jurisdiction-aware rules engine, and an AI assistant — **not** a landing
page, static dashboard, or scripted chatbot.

> **Honesty first.** Every route in this build is **orientation only**. No procedure is
> certified for execution. The app never invents government procedures, fees, officials,
> integrations, or legal requirements, and it surfaces its own coverage limits everywhere.

## What works in Milestone 1

- **Real auth + session** over a real DB (clearly-labelled demo access for local review).
- **Jurisdiction-aware guidance engine** (`lib/guidance/engine.ts`) — a faithful port of the
  reviewed reference in `government-data/lookup.mjs`. It routes property by asset location,
  heir certificates by the deceased's residence, death registration by place of death, and
  financial claims by institution — **never** by the user's residential state. It withholds
  action steps when a source review is due, forces professional review on disputes/specialist
  assets, and asks targeted follow-up questions instead of guessing.
- **All 36 states/UTs** present and selectable, each with an honest coverage status
  (`directory_only`, `partial_information`, …). Missing states are never populated by copying
  another state's procedure.
- **Real relational database** via Node's built-in SQLite (`node:sqlite`) with **migrations**
  and normalized entities (users, families, cases, deceased, heirs, assets, asset locations,
  roadmap steps, consent, audit). The three jurisdictions (user residence / deceased residence
  / place of death) are stored independently.
- **Personalized roadmap** generated from the grounded engine, with per-step source citations,
  review dates, coverage limits, warnings, and a prominent "Your next step".
- **Accessible UI**: one-question-at-a-time onboarding, large controls, visible focus,
  keyboard support, low-literacy layout, and **real read-aloud** via the browser's Web Speech
  API (honest disabled state where unsupported).
- **Grounded AI chatbot** wired to **Groq** (official `groq-sdk`, server-side only). Answers are
  constrained to cited sources for the user's case; retrieved content is treated as untrusted
  data (prompt-injection defense). Responses **stream** (NDJSON) with a request timeout and
  graceful rate-limit handling. **With no API key it shows an honest unavailable state — it
  never fakes a reply.** `GROQ_API_KEY` is read on the server and never reaches the browser.
- **Authorization** enforced at the data layer: a user can only reach a case through family
  membership (`assertCaseAccess`).
- **Language selection** (native scripts) on landing, sign-in, onboarding and the header;
  persists before/after login and survives adding assets; independent of jurisdiction. UI chrome
  is hand-authored for English, Hindi **and Tamil**. Dynamic/generated content (roadmap, procedure
  detail) is translated on demand by Groq via `/api/translate`, cached by locale + catalogue
  version + source hash; with no key it returns the labelled English source (never a fake).
- **Voice assistant** (push-to-talk + read-aloud) throughout, before and after login, via the
  browser Web Speech API (feature-detected, no self-recording, mic consent, editable transcript,
  replay/pause/stop/speed). Grounded answers come from Groq and are spoken in the chosen language.
  It **never silently speaks English** — with no voice for the language it shows an in-language
  note and keeps text; speech is cancelled when the language changes.
- **Consistent step status**: `requirement` (required/conditional/optional) and completion are
  separate; `derived_done` (e.g. death registered *and* certificate obtained) drives badges, the
  progress dropdown and the next-action picker together — no contradictory states.
- **One fully-sourced deep procedure**: UP succession land mutation (Varasat) — legal basis
  (U.P. Revenue Code 2006 ss.33–35), exact actions, documents (required/conditional), authority
  chain (Lekhpal → Revenue Inspector → Tahsildar), evidence links, and an `unresolved` list. One
  office is **verified** as a concrete example — Sadar (Lucknow) tehsil phone `9454416505` /
  email `tehsadar.lu-up@gov.in` from the official `lucknow.nic.in` directory — while fee, street
  address, officer name and hours stay **"To be confirmed"** (no primary source located; blog fee
  figures conflict and are not used). Rendered via `components/ProcedureDetail.tsx`.
- **Aadhaar sign-in** — sandbox-labelled flow (language → consent → OTP → verify → session) with
  live authentication **disabled** until an authorized UIDAI provider is configured. Demo access
  retained and isolated; only masked references stored; no full Aadhaar/OTP in logs, storage or
  Groq. No PAN is collected anywhere.
- **Tests**: engine safety/parity tests + the shipped catalogue integrity tests.

## Setup

Requires **Node 24+** (for built-in `node:sqlite`; verified on v24.19).

```bash
cd inheritance-desk
npm install
cp .env.local.example .env.local   # optional — nothing here is required to run
npm run dev                         # http://localhost:3000
```

Click **Start demo access**, create a case, answer the short onboarding, then add assets to
see the personalized, source-cited roadmap. The database is created automatically at
`data/inheritance.db` on first request.

### Enabling the AI assistant (optional)

Set `GROQ_API_KEY` in `.env.local` (get one at console.groq.com). Optionally set `GROQ_MODEL`
(defaults to `llama-3.3-70b-versatile`). Without a key, the chatbot returns an honest "not
configured" state and the source-cited guidance still works. The key is used server-side only.

## Verify

```bash
npm run typecheck     # tsc --noEmit
npm test              # engine safety tests (node --test)
npm run test:catalog  # shipped catalogue integrity tests
npm run build         # production build
```

## Architecture

```
app/                     Next.js App Router (UI + route handlers)
  api/…                  auth, cases, deceased, assets, roadmap, steps, chat, guidance, reference
lib/guidance/            engine.ts (pure), lookup.ts (server IO), roadmap.ts, catalog.ts, types.ts
lib/db/                  index.ts (node:sqlite + migrations), schema.ts, repo.ts (+ authz)
lib/ai/chat.ts           grounded Groq integration (streaming) + honest unavailable state
lib/cases/service.ts     case view + roadmap regeneration
components/              accessible UI (read-aloud, guidance card, roadmap step, chatbot, …)
government-data/          the imported research pack (states, procedures, sources, offices, snapshots)
```

## Honest limitations (deferred to later milestones)

See `MILESTONE-1.md` for the full status. In short, these are **not built yet** and are not
faked anywhere:

- **Milestone 2**: Supabase/Postgres + row-level security (replaces `node:sqlite`); document
  vault with malware scanning/OCR; family invitations & granular permissions.
- **Milestone 3**: verified execution-ready checklists, billing, human caseworker escalation.
- **Milestone 4**: full multi-script i18n & translation review; admin/research console;
  scheduled source-sync jobs and review queues.

No procedure has been confirmed by a phone call, office visit, or real application. The
research pack covers selected jurisdictions in Delhi, Maharashtra, Tamil Nadu and Karnataka at
an orientation level, plus national financial-claim orientation; everything else is
directory-only.
