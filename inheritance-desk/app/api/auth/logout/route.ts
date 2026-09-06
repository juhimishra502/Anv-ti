import { json, guard } from "@/lib/api/handler";
import { endSession } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function POST(): Promise<Response> {
  return guard(async () => {
    await endSession();
    return json({ ok: true });
  });
}
