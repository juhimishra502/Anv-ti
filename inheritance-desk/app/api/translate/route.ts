// Translate an array of dynamic (generated) strings into the user's locale, cached
// server-side. Requires sign-in. Returns { available, translations } — when the
// model is unavailable it returns the English source so the UI still renders.
import { json, error, guard } from "@/lib/api/handler";
import { translateBatch } from "@/lib/i18n/translate-server";
import { LOCALES } from "@/lib/i18n/locales";

export const runtime = "nodejs";

// No auth required: this translates the app's OWN canonical UI strings and reviewed
// dynamic content, so the landing/sign-in pages can render in the selected language
// before login. Results are cached and item-capped to bound cost.
const VALID = new Set(LOCALES.map((l) => l.code));
const MAX_ITEMS = 60;
const MAX_LEN = 4000;

export async function POST(request: Request): Promise<Response> {
  return guard(async () => {
    let body: { texts?: unknown; locale?: unknown; version?: unknown };
    try {
      body = await request.json();
    } catch {
      return error("Invalid JSON body.");
    }
    const locale = typeof body.locale === "string" && VALID.has(body.locale) ? body.locale : "en";
    const version = typeof body.version === "string" ? body.version.slice(0, 64) : "v1";
    if (!Array.isArray(body.texts)) return error("texts[] required.");
    if (body.texts.length > MAX_ITEMS) return error("Too many items.");
    const texts = body.texts.map((t) => (typeof t === "string" ? t.slice(0, MAX_LEN) : ""));
    const result = await translateBatch(texts, locale, version);
    return json(result);
  });
}
