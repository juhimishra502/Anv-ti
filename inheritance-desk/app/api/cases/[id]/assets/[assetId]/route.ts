// Edit (PATCH) or remove (DELETE) an asset before the roadmap is generated. The
// service is re-resolved from the asset-type map on edit. Authorization is enforced
// via the family membership check, plus a check that the asset belongs to the case.
import { json, error, guard, requireUser } from "@/lib/api/handler";
import { assertCaseAccess, assetInCase, updateAsset, removeAsset } from "@/lib/db/repo";
import { buildCaseView } from "@/lib/cases/service";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string; assetId: string }> },
): Promise<Response> {
  return guard(async () => {
    const user = await requireUser();
    const { id, assetId } = await ctx.params;
    await assertCaseAccess(user.id, id);
    if (!(await assetInCase(id, assetId))) return error("Asset not found in this case.", 404);
    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return error("Invalid JSON body.");
    }
    const str = (k: string) => (typeof body[k] === "string" ? (body[k] as string) : undefined);
    const loc = (body.location ?? undefined) as Record<string, unknown> | undefined;
    const locStr = (k: string) => (loc && typeof loc[k] === "string" ? (loc[k] as string) : undefined);
    await updateAsset(assetId, {
      label: str("label"),
      institution: str("institution"),
      institution_id: str("institution_id"),
      nominee_status: str("nominee_status"),
      holding_mode: str("holding_mode"),
      record_type: str("record_type"),
      authority: str("authority"),
      scheme: str("scheme"),
      details_json: str("details_json"),
      location: loc
        ? {
            state_code: locStr("state_code"),
            district: locStr("district"),
            municipality: locStr("municipality"),
            tehsil_taluk: locStr("tehsil_taluk"),
            village_ward: locStr("village_ward"),
            property_identifier: locStr("property_identifier"),
          }
        : undefined,
    });
    return json(await buildCaseView(id));
  });
}

export async function DELETE(
  _request: Request,
  ctx: { params: Promise<{ id: string; assetId: string }> },
): Promise<Response> {
  return guard(async () => {
    const user = await requireUser();
    const { id, assetId } = await ctx.params;
    await assertCaseAccess(user.id, id);
    await removeAsset(id, assetId);
    return json(await buildCaseView(id));
  });
}
