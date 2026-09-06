import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";
import { SYSTEM_PROMPT } from "@/lib/prompt";
import type { PropertyRecord } from "@/lib/types";

// Groq's OpenAI-compatible chat API. Model is overridable via GROQ_MODEL.
// Default: openai/gpt-oss-120b (flagship open model on GroqCloud, strong reasoning).
const MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

// --- crude in-memory rate limit (per serverless instance; a demo speed bump) ---
const hits = new Map<string, { n: number; t: number }>();
function limited(ip: string, max = 10, windowMs = 60_000) {
  const now = Date.now();
  const rec = hits.get(ip);
  if (!rec || now - rec.t > windowMs) {
    hits.set(ip, { n: 1, t: now });
    return false;
  }
  rec.n += 1;
  return rec.n > max;
}

const MAX_PROPERTIES = 200;

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "anon";
  if (limited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a minute and try again." },
      { status: 429 },
    );
  }

  const body = await req.json().catch(() => null);
  const properties = body?.properties as PropertyRecord[] | undefined;
  const wardName = typeof body?.wardName === "string" ? body.wardName.slice(0, 120) : "Ward";

  if (!Array.isArray(properties) || properties.length === 0) {
    return NextResponse.json(
      { error: "No properties to analyze. Load the sample ward or upload a roll CSV." },
      { status: 400 },
    );
  }
  if (properties.length > MAX_PROPERTIES) {
    return NextResponse.json(
      { error: `Too many rows (${properties.length}). This demo analyzes up to ${MAX_PROPERTIES} properties at a time.` },
      { status: 400 },
    );
  }

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json(
      { error: "Server is missing its GROQ_API_KEY. Set it in the environment and retry." },
      { status: 500 },
    );
  }

  try {
    const groq = new Groq(); // reads GROQ_API_KEY server-side only
    const completion = await groq.chat.completions.create({
      model: MODEL,
      temperature: 0.2,
      max_tokens: 8000,
      response_format: { type: "json_object" }, // guarantees valid JSON
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Ward name: ${wardName}\n\nProperty roll (JSON):\n${JSON.stringify(properties)}`,
        },
      ],
    });

    const text = completion.choices[0]?.message?.content ?? "{}";
    const report = JSON.parse(text);
    return NextResponse.json(report);
  } catch (err) {
    console.error("analyze route error:", err);
    return NextResponse.json(
      { error: "Something went wrong analyzing that ward. Please try again." },
      { status: 500 },
    );
  }
}
