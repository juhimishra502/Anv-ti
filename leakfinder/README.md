# Leakfinder

Find the property tax a city is already owed. Leakfinder turns a ward's property tax roll into a
**ranked list of likely under-taxed properties** and an estimated **₹ recoverable per year** — using
**Groq** (`openai/gpt-oss-120b` by default) to compare declared vs. observed floors, area, and usage.

- **Product spec:** [`specs/01-leakfinder.md`](specs/01-leakfinder.md)
- **PM case study:** [`case-studies/leakfinder.md`](case-studies/leakfinder.md)

## Run locally

```bash
npm install
cp .env.local.example .env.local   # then add your GROQ_API_KEY (free at console.groq.com/keys)
npm run dev                          # http://localhost:3000
```

Click **Load sample ward** (bundled synthetic data), or **Upload roll CSV**
(see [`public/sample-ward.csv`](public/sample-ward.csv) for the format).

## How it works

- `app/page.tsx` — single screen, four states (empty / loading / success / error).
- `app/api/analyze/route.ts` — the **only** place the model is called (Groq chat completions).
  `GROQ_API_KEY` stays server-side; input is validated + size-capped; a basic per-IP rate limit
  protects the demo; JSON mode guarantees valid JSON back.
- `lib/prompt.ts` — analysis prompt + the exact JSON output shape the model must return.
- `lib/sampleWard.ts` / `lib/csv.ts` / `lib/types.ts` — demo data, CSV parsing, shared types.

## Deploy (Vercel)

1. Push to a GitHub repo.
2. Import it in Vercel.
3. Set `GROQ_API_KEY` as a project **Environment Variable** (not `NEXT_PUBLIC_`).
4. Deploy — confirm the sample-ward flow works on the live URL.

## Scope (v1)

Deliberately **not** in v1: satellite/drone CV ingestion, ULB billing/DB integration, auth, and any
authority to issue demand notices. Outputs are triage *review* flags with confidence + a disclaimer —
never fraud verdicts. See the case study for the reasoning behind that cut.
