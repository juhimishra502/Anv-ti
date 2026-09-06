// Dependent location lookup for searchable dropdowns. Returns child jurisdictions
// (e.g. districts of a state) from the local database — no live government call.
// Unseeded states return an empty list so the UI shows an honest "import pending /
// I don't know" state rather than a guessed district list.
import { json, guard } from "@/lib/api/handler";
import { searchJurisdictions } from "@/lib/db/repo";

export const runtime = "nodejs";

const LEVELS = new Set(["district", "subdistrict", "village", "local_body"]);

export async function GET(request: Request): Promise<Response> {
  return guard(async () => {
    const url = new URL(request.url);
    const parent = url.searchParams.get("parent") ?? "";
    const level = url.searchParams.get("level") ?? "district";
    const q = url.searchParams.get("q") ?? "";
    if (!parent) return json({ items: [] });
    if (!LEVELS.has(level)) return json({ items: [] });
    // Searchable, alias-aware (e.g. "Allahabad" matches Prayagraj). Children only,
    // so selecting a parent filters what shows. Values are stable jurisdiction codes.
    const items = (await searchJurisdictions(parent, level, q)).map((j) => ({
      code: j.code,
      name: j.name,
      name_local: j.name_local,
      lgd_code: j.lgd_code ?? null,
      source: j.source,
    }));
    return json({ items, imported: items.length > 0 });
  });
}
