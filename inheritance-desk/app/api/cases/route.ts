import { json, error, guard, requireUser } from "@/lib/api/handler";
import { createCaseForUser, listCasesForUser } from "@/lib/db/repo";

export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  return guard(async () => {
    const user = await requireUser();
    return json({ cases: await listCasesForUser(user.id) });
  });
}

export async function POST(request: Request): Promise<Response> {
  return guard(async () => {
    const user = await requireUser();
    let title = "New case";
    try {
      const body = (await request.json()) as { title?: string };
      if (body?.title && typeof body.title === "string") title = body.title.slice(0, 120);
    } catch {
      // default title
    }
    if (!title.trim()) return error("A case title is required.");
    const created = await createCaseForUser(user.id, title.trim());
    return json({ case: created }, 201);
  });
}
