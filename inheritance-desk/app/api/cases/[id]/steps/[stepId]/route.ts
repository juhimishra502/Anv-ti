// Update a roadmap step's user-reported status. This is the family's own tracking —
// it is NOT an official/government status and never marks a claim execution-ready.
import { json, error, guard, requireUser } from "@/lib/api/handler";
import { assertCaseAccess, getRoadmapStep, setStepUserStatus, setStepTracking, audit } from "@/lib/db/repo";

export const runtime = "nodejs";

const ALLOWED_STATUS = new Set([
  "not_started",
  "in_progress",
  "documents_needed",
  "submitted",
  "awaiting_institution",
  "action_required",
  "completed",
  "on_hold",
]);

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string; stepId: string }> },
): Promise<Response> {
  return guard(async () => {
    const user = await requireUser();
    const { id, stepId } = await ctx.params;
    await assertCaseAccess(user.id, id);
    const step = await getRoadmapStep(stepId);
    if (!step || step.case_id !== id) return error("Step not found.", 404);
    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return error("Invalid JSON body.");
    }

    // Status update (optional).
    if ("user_status" in body) {
      const status = typeof body.user_status === "string" ? body.user_status : "";
      if (!ALLOWED_STATUS.has(status)) return error("Invalid status value.");
      await setStepUserStatus(stepId, status);
      await audit(user.id, id, "step.status_changed", `${step.service}:${status}`);
    }

    // Tracking fields (optional): submission record — the user's own tracking.
    const trackingKeys = ["submitted_at", "office", "ack_number", "method", "follow_up_date", "notes"] as const;
    const patch: Record<string, string | null> = {};
    for (const k of trackingKeys) {
      if (k in body) {
        const v = body[k];
        if (v != null && typeof v !== "string") return error(`Invalid value for ${k}.`);
        patch[k] = (v as string) ? (v as string).slice(0, 500) : null;
      }
    }
    if (Object.keys(patch).length) {
      await setStepTracking(stepId, patch);
      await audit(user.id, id, "step.tracking_updated", step.service);
    }

    return json({ ok: true, step_id: stepId });
  });
}
