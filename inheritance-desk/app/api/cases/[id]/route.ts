import { json, error, guard, requireUser } from "@/lib/api/handler";
import { assertCaseAccess } from "@/lib/db/repo";
import { buildCaseView } from "@/lib/cases/service";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  return guard(async () => {
    const user = await requireUser();
    const { id } = await ctx.params;
    await assertCaseAccess(user.id, id); // 403 if not a member of the owning family
    const view = await buildCaseView(id);
    if (!view) return error("Case not found.", 404);
    return json(view);
  });
}
