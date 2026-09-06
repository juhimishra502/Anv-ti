// Demo access for local review. This is CLEARLY LABELLED as demo in the UI and is
// NOT real government authentication.
import { json, guard } from "@/lib/api/handler";
import { startSession } from "@/lib/auth/session";
import { createUser, recordConsent } from "@/lib/db/repo";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  return guard(async () => {
    let displayName = "Demo family coordinator";
    try {
      const body = (await request.json()) as { displayName?: string };
      if (body?.displayName && typeof body.displayName === "string") {
        displayName = body.displayName.slice(0, 80);
      }
    } catch {
      // no body is fine
    }
    const user = await createUser({ displayName, isDemo: true });
    await recordConsent(user.id, "demo_data", true);
    await startSession(user.id);
    return json({ user: { id: user.id, display_name: user.display_name, is_demo: !!user.is_demo } });
  });
}
