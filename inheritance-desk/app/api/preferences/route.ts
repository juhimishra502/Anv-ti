// Language & voice preferences for the signed-in user. Before login the client uses
// localStorage; after login the choice is persisted here so it survives refresh and
// devices. Adding assets never touches this, so the preference is not reset.
import { json, error, guard, requireUser } from "@/lib/api/handler";
import { getLanguagePreference, setLanguagePreference } from "@/lib/db/repo";
import { LOCALES } from "@/lib/i18n/locales";

export const runtime = "nodejs";

const VALID = new Set(LOCALES.map((l) => l.code));

export async function GET(): Promise<Response> {
  return guard(async () => {
    const user = await requireUser();
    const pref = await getLanguagePreference(user.id);
    return json(pref ?? { ui_language: "en", voice_enabled: 0, low_bandwidth: 0 });
  });
}

export async function PATCH(request: Request): Promise<Response> {
  return guard(async () => {
    const user = await requireUser();
    let body: { ui_language?: unknown; voice_enabled?: unknown; low_bandwidth?: unknown };
    try {
      body = await request.json();
    } catch {
      return error("Invalid JSON body.");
    }
    const patch: { ui_language?: string; voice_enabled?: boolean; low_bandwidth?: boolean } = {};
    if (typeof body.ui_language === "string") {
      if (!VALID.has(body.ui_language)) return error("Unsupported language.");
      patch.ui_language = body.ui_language;
    }
    if (typeof body.voice_enabled === "boolean") patch.voice_enabled = body.voice_enabled;
    if (typeof body.low_bandwidth === "boolean") patch.low_bandwidth = body.low_bandwidth;
    // Preserve existing values for fields not provided.
    const current = await getLanguagePreference(user.id);
    await setLanguagePreference(user.id, {
      ui_language: patch.ui_language ?? current?.ui_language ?? "en",
      voice_enabled: patch.voice_enabled ?? !!current?.voice_enabled,
      low_bandwidth: patch.low_bandwidth ?? !!current?.low_bandwidth,
    });
    return json(await getLanguagePreference(user.id));
  });
}
