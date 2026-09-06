// Reports provider status so the UI can show an honest sandbox/live banner and,
// in sandbox, the approved synthetic test identities. No secrets are returned.
import { json, guard } from "@/lib/api/handler";
import { providerInfo, SANDBOX_HINT } from "@/lib/auth/aadhaar/provider";

export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  return guard(async () => {
    const info = providerInfo();
    return json({
      provider: info.name,
      live: info.live,
      configured: info.configured,
      note: info.note,
      // Only reveal test identities in non-live sandbox mode.
      sandbox: info.name === "sandbox" ? SANDBOX_HINT : null,
    });
  });
}
