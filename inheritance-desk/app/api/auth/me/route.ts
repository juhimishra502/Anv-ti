import { json, guard } from "@/lib/api/handler";
import { getCurrentUser } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  return guard(async () => {
    const user = await getCurrentUser();
    if (!user) return json({ user: null });
    return json({
      user: { id: user.id, display_name: user.display_name, is_demo: !!user.is_demo },
    });
  });
}
