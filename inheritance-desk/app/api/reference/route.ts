// Static reference data for dropdowns: all 36 states/UTs (with coverage status) and
// the asset-type -> service map. Coverage status is surfaced honestly per state.
import { json, guard } from "@/lib/api/handler";
import { loadCatalog } from "@/lib/guidance/catalog";

export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  return guard(async () => {
    const catalog = loadCatalog();
    return json({
      catalog_version: catalog.meta.catalog_version,
      coverage_note: catalog.meta.coverage,
      states: catalog.states
        .map((s) => ({
          code: s.code,
          name: s.name,
          type: s.type,
          procedure_coverage: s.procedure_coverage,
          execution_available: s.execution_available,
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
      asset_types: catalog.assetTypes,
    });
  });
}
