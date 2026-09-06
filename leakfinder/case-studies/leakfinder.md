# Leakfinder — a 1-page case study

**Live demo:** _<add Vercel URL after deploy>_ · **Built in:** 1 day · **Role:** solo (PM + build)

## The problem

India's cities are broke while sitting on the money. Urban local bodies collected only **~₹39,000 cr**
of property tax in FY24 — against an estimated **₹12–15 lakh cr/year** of potential if collection
reached even the developing-country average of 0.7% of GDP. India sits at ~0.15–0.2% of GDP; the OECD
average is ~1.1%. The cause isn't rates or law — it's **coverage and assessment accuracy**: cities
collect only 5–20% of potential because roughly half of properties are missing from the roll or
under-assessed (Bengaluru's BBMP has ~49% coverage). Where cities fixed the *data*, revenue jumped:
Kanpur went ₹28 cr → ₹130 cr (~4.6x) after GIS mapping; Mandav (MP) saw +191% demand; a BBMP drone
survey found ₹318 cr of evasion across 13,600 properties. **A revenue officer knows properties are
under-taxed — but has no fast way to point at which ones, and how much money is on the table.**

## Who I talked to / how I validated

_(To capture on first live run + dogfood — 3 concrete reactions. Do not invent them; record real ones.)_
- Ran the sample ward (28 properties) end-to-end — record the total ₹ recoverable it surfaced: **₹____**.
- Show a revenue officer / civic-tech contact the ranked list — note whether the top flag matches their intuition.
- Feed a real (or public) ward roll as CSV — note one leak it caught that a manual scan would miss.

**What the demo is built to surface (by design, on the sample ward):** a prime-market shop unrevised
since 2011 (stale assessment), a 2-storey house that is now a 5-storey commercial complex on the roll
(under-declared floors + usage shift — the single biggest leak), and an occupied showroom with an
assessed value but **zero collection recorded**.

## The key tradeoff I made (what I cut, and why)

**I cut the satellite/drone computer-vision pipeline — the thing everyone assumes is the product — and
built the reasoning layer on structured roll data instead.** The proven ROI (Kanpur, Mandav, BBMP) is
real but every one of those took a full imagery-and-field-survey program to get there. That's a
6–12 month, crores-scale bet. The *un-proven* question for a v1 isn't "can we detect buildings from
the sky" — it's "**given the discrepancies, can we rank the leaks and quantify the ₹ well enough that
an officer trusts where to send a field team?**" Leakfinder answers that in a day, on data cities
already have, for the price of a Groq API call. Imagery becomes a signal you feed in later — it's on the
roadmap, not the risk you take first. I also deliberately made every output a "**review this**" flag
with a confidence level and a visible disclaimer, never a fraud verdict: in government, a false
accusation is a far more expensive error than a missed rupee.

## Impact

- **Primary metric:** total **₹ recoverable/year surfaced** per ward. On the 28-property sample ward,
  the seeded leaks represent roughly **₹5–6 lakh/year** of recoverable tax — from one small ward.
  _(Record the exact figure your live run produces.)_ Extrapolated, that is the ₹12–15 lakh cr/year
  national gap this attacks.
- **Speed:** roll → ranked, quantified leak list in **under a minute**, vs. a manual desk review.

## What I'd do next

- **Wire in one real signal:** utility-load or building-footprint data for a single ward to move flags
  from "declared vs declared-observed" to independently-sourced evidence — the wedge to a paid pilot.
- **Instrument precision/recall:** with a ULB partner, track what % of flagged properties a field
  survey confirms — the number that converts a demo into a procurement.
- **Pricing:** success-fee on recovered revenue (a small % of collections uplift) — aligns incentives
  and needs zero upfront budget from a cash-starved ULB.

---

### Sources (problem sizing & ROI)
- Municipal property-tax collection & ₹12–15 lakh cr potential: RBI/15th Finance Commission municipal-finance data; ORF, World Bank "Property Taxation in India."
- Coverage gap (5–20% of potential; BBMP ~49%): World Bank; The Daily Brief (Zerodha).
- Pilot ROI: Kanpur GIS (Geospatial World), Mandav MP GIS study, BBMP drone survey (₹318 cr / 13,600 properties).
