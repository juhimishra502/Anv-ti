# PRD: Leakfinder

| | |
|---|---|
| **Owner** | Juhi Mishra |
| **Date** | 2026-09-03 |
| **Status** | Draft v1 |
| **Type** | B2G govt AI web app (portfolio) |
| **Stack** | Next.js (App Router) · server API route → Groq (`openai/gpt-oss-120b`) · Vercel |
| **Build budget** | 1–2 days |

## 1. Problem

India's urban local bodies (ULBs) collected only **~₹39,000 cr** of property tax in FY24 — against an
estimated **₹12–15 lakh cr/year** of potential if collection reached even the developing-country
average of 0.7% of GDP. India sits at ~0.15–0.2% of GDP vs the OECD's ~1.1%. The root cause is not
rates or law — it's **coverage and assessment accuracy**: cities collect only 5–20% of potential
because ~half of properties are missing from the roll or under-assessed (Bengaluru's BBMP has ~49%
coverage). Where cities have fixed the *data*, revenue jumps: Kanpur went from ₹28 cr → ₹130 cr
(~4.6x) after GIS mapping; Mandav (MP) saw +191% demand; a BBMP drone survey found ₹318 cr of
evasion across 13,600 properties.

**The pain in one line:** *A municipal revenue officer knows properties are under-taxed but has no
fast way to point at which ones and how much money is on the table.*

## 2. Goals

- Turn a ward's property roll into a **ranked list of likely revenue leaks** in under a minute.
- Quantify the opportunity: a headline **₹ recoverable/year** for the ward.
- Give each flag a **plain-language reason** an officer can act on and defend.
- Prove the *reasoning + revenue-quantification* layer works before any GIS/drone investment.

## 3. Non-Goals (v1 scope fence)

- ❌ Live satellite / drone / GIS computer-vision ingestion (the production wedge — Roadmap, not v1).
- ❌ Integration with any ULB billing system, DB, or payment rails.
- ❌ Auth, user accounts, multi-ward portfolios, saved history.
- ❌ Issuing legally-binding demand notices or assessments (this is decision *support*, not authority).
- ❌ Being right about the exact rupee to the paisa — v1 produces defensible *estimates* to triage, not final assessments.
- ❌ Fraud/criminal determination — flags are "review these," never "these people are guilty."

## 4. Solution / core flow

1. Empty state teaches the flow + a **"Load sample ward"** button (bundled synthetic Ward 17 data).
2. Officer loads the sample ward **or** pastes/uploads a property CSV.
3. Reveal-the-process loading ("Reading the roll… comparing declared vs observed… estimating recoverable ₹…").
4. Server route → Groq (`openai/gpt-oss-120b`, JSON mode) → typed `LeakReport` JSON.
5. Success: lead with **total ₹ recoverable** (big), then a ranked leak list with type, severity, confidence, per-property ₹, and reasoning.
6. Error: plain language, says what to do (fix the CSV / try the sample / retry).

## 5. User stories

- As a **revenue officer**, I load my ward's roll, so that I see which properties are likely under-taxed and by how much.
- As a **municipal commissioner**, I see a headline ₹-recoverable number, so that I can justify a field-survey budget.
- As an **officer**, I read the reason per flag, so that I can prioritise site visits without guessing.

## 6. Success metrics

- **Primary (case-study impact metric):** total **₹ recoverable/year surfaced** across the demo ward(s).
- Secondary: % of seeded leaks correctly flagged (precision proxy on the synthetic set); ≥3 real reactions from dogfood users.

## 7. Risks

- **Catastrophic:** false accusation / over-confident "this is fraud." → Mitigation: outputs are "review" flags with confidence + a visible disclaimer; model biased to caution.
- Rupee estimates read as authoritative. → Framed as triage estimates; disclaimer; "estimated" labels.
- Garbage CSV in → garbage out. → Input validation + a known-good sample ward.
- Cost/abuse on a public demo link. → Server-side key + rate limit + input size cap.

## 8. Open questions

- Which assessment basis to assume when the roll doesn't state it (Unit Area Value vs Capital Value vs ARV)? v1 assumes ARV-style and says so.
- Right confidence threshold before a flag is shown to a field team — tune with a real ULB.

## 9. AI behavior + disclaimer

- **Prompt intent:** compare each property's *declared* attributes against *observed/expected* signals, flag only material discrepancies, estimate recoverable ₹/year with transparent reasoning, return structured JSON. Never invent properties or observations not in the input.
- **Bias:** toward caution — when evidence is weak, lower the confidence or omit the flag; never assert fraud or certainty.
- **Disclaimer (visible):** "Estimates for triage only. Leakfinder flags properties to *review*, not confirmed evasion or final assessments. Verify by field survey before any demand notice."
