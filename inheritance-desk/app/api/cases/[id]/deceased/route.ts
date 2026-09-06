// Update the deceased context (onboarding answers). The three jurisdictions stay
// independent. Any change regenerates the grounded roadmap.
import { json, error, guard, requireUser } from "@/lib/api/handler";
import { assertCaseAccess, updateDeceased, saveQuestionnaireAnswers, type Deceased } from "@/lib/db/repo";
import { buildCaseView } from "@/lib/cases/service";
import { QUESTIONNAIRE_VERSION } from "@/lib/questionnaire/schema";

export const runtime = "nodejs";

const FIELDS: (keyof Deceased)[] = [
  "full_name",
  "residence_state",
  "residence_district",
  "death_state",
  "death_district",
  "death_date",
  "death_registered",
  "death_certificate",
  "will_status",
  "certificate_copies",
  "will_registered",
  "executor_present",
  "probate_status",
  "dispute_status",
  "applicant_relationship",
  "nri_status",
];

export async function PATCH(
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
    const patch: Partial<Deceased> = {};
    for (const field of FIELDS) {
      if (field in body) {
        const v = body[field];
        if (v != null && typeof v !== "string") return error(`Invalid value for ${field}.`);
        (patch as Record<string, unknown>)[field] = v ?? null;
      }
    }
    // NOTE: the roadmap is regenerated once at the end of onboarding (the
    // "Build my roadmap" action → POST /roadmap), not on every answer — regenerating
    // per step made each save take ~12s of DB round-trips.
    await updateDeceased(id, patch);
    // The full schema-driven answer set (conditional fields included) is stored as
    // JSON alongside the typed columns, tagged with the questionnaire schema version.
    if (typeof body.answers_json === "string") {
      const version = typeof body.questionnaire_version === "string" ? body.questionnaire_version : QUESTIONNAIRE_VERSION;
      await saveQuestionnaireAnswers(id, body.answers_json, version);
    }
    return json(await buildCaseView(id));
  });
}
