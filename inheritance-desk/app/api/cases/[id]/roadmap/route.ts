// Build the case's roadmap and return a SMALL success payload the client can
// navigate with. The whole roadmap is generated and saved in one transaction inside
// regenerateRoadmap (idempotent by case + answer version). A correlation id flows
// from the client header through the server logs and into the audit row.
import { json, guard, requireUser } from "@/lib/api/handler";
import { assertCaseAccess } from "@/lib/db/repo";
import { regenerateRoadmap } from "@/lib/cases/service";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  return guard(async () => {
    const user = await requireUser();          // -> 401 Response when signed out
    const { id } = await ctx.params;
    await assertCaseAccess(user.id, id);        // -> 403 when not a case member
    const correlationId = req.headers.get("x-correlation-id") || randomUUID();

    const t0 = Date.now();
    try {
      const result = await regenerateRoadmap(id, { actorUserId: user.id, correlationId });
      console.log(
        `[roadmap] ${correlationId} OK case=${id} user=${user.id} nodes=${result.nodeCount} reused=${result.reused} ${Date.now() - t0}ms`,
      );
      // Only after the transaction has committed.
      return json({ success: true, caseId: result.caseId, journeyUrl: result.journeyUrl, correlationId });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Roadmap generation failed.";
      console.error(`[roadmap] ${correlationId} FAILED case=${id} user=${user.id} ${Date.now() - t0}ms`, e);
      return json({ success: false, error: message, correlationId }, 500);
    }
  });
}
