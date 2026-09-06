// Database-backed institution selector. GET searches the local institutions table
// (legal name + aliases) filtered by category; POST raises a verification request for
// an institution the user could not find. No live regulator call at lookup time.
import { json, error, guard, requireUser } from "@/lib/api/handler";
import { searchInstitutions, createInstitutionVerificationRequest } from "@/lib/db/repo";

export const runtime = "nodejs";

const CATEGORIES = new Set([
  "bank", "insurer", "amc", "sebi_intermediary", "depository", "rta",
  "epfo", "nps", "india_post", "iepf",
]);

export async function GET(request: Request): Promise<Response> {
  return guard(async () => {
    const url = new URL(request.url);
    const category = url.searchParams.get("category");
    const q = url.searchParams.get("q") ?? "";
    if (category && !CATEGORIES.has(category)) return json({ items: [] });
    const items = (await searchInstitutions(category, q)).map((i) => ({
      id: i.id,
      legal_name: i.legal_name,
      short_name: i.short_name,
      category: i.category,
      regulator: i.regulator,
      active: i.active === 1,
    }));
    // Note: presence here is NOT a claim that a verified claim pack exists.
    return json({ items });
  });
}

export async function POST(request: Request): Promise<Response> {
  return guard(async () => {
    const user = await requireUser();
    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return error("Invalid JSON body.");
    }
    const enteredName = typeof body.entered_name === "string" ? body.entered_name.trim() : "";
    if (!enteredName) return error("Enter the institution name you could not find.");
    const req = await createInstitutionVerificationRequest({
      requestedBy: user.id,
      caseId: typeof body.case_id === "string" ? body.case_id : null,
      category: typeof body.category === "string" ? body.category : null,
      enteredName,
      details: typeof body.details === "string" ? body.details : null,
    });
    return json({ ok: true, request_id: req.id });
  });
}
