// Add an asset to the estate. The service route is resolved from the catalogue's
// asset-type map (never guessed). Adding an asset regenerates the roadmap.
import { json, error, guard, requireUser } from "@/lib/api/handler";
import { assertCaseAccess, addAsset } from "@/lib/db/repo";
import { loadCatalog } from "@/lib/guidance/catalog";
import { buildCaseView } from "@/lib/cases/service";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  return guard(async () => {
    const user = await requireUser();
    const { id } = await ctx.params;
    await assertCaseAccess(user.id, id);
    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return error("Invalid JSON body.");
    }
    const assetType = typeof body.asset_type === "string" ? body.asset_type : "";
    const map = new Map(loadCatalog().assetTypes.map((t) => [t.id, t.service]));
    const service = map.get(assetType);
    if (!service) return error("Unknown asset_type. Use one from /api/reference.");

    const str = (k: string) => (typeof body[k] === "string" ? (body[k] as string) : undefined);
    const loc = (body.location ?? {}) as Record<string, unknown>;
    const locStr = (k: string) => (typeof loc[k] === "string" ? (loc[k] as string) : undefined);

    await addAsset(id, {
      asset_type: assetType,
      service,
      label: str("label"),
      institution: str("institution"),
      institution_id: str("institution_id"),
      nominee_status: str("nominee_status"),
      holding_mode: str("holding_mode"),
      record_type: str("record_type"),
      authority: str("authority"),
      scheme: str("scheme"),
      details_json: str("details_json"),
      location: {
        state_code: locStr("state_code"),
        district: locStr("district"),
        municipality: locStr("municipality"),
        tehsil_taluk: locStr("tehsil_taluk"),
        village_ward: locStr("village_ward"),
        property_identifier: locStr("property_identifier"),
      },
    });
    // Roadmap is generated once at the end of onboarding, not on every asset add.
    return json(await buildCaseView(id), 201);
  });
}
