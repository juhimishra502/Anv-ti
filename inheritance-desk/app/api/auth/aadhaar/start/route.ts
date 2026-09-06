// Step 1 of Aadhaar (sandbox) verification: explicit consent + request OTP to the
// Aadhaar-registered mobile. Binds the transaction to this browser via a hashed
// nonce cookie. The full Aadhaar number is used only to look up the sandbox identity
// and is NEVER logged, stored, returned, or sent anywhere — only the last 4 digits
// and a masked mobile are persisted.
import { randomBytes, createHash } from "node:crypto";
import { cookies } from "next/headers";
import { json, error, guard } from "@/lib/api/handler";
import { createAadhaarTxn } from "@/lib/db/repo";
import { newId } from "@/lib/db/index";
import { requestOtp, providerInfo } from "@/lib/auth/aadhaar/provider";

export const runtime = "nodejs";

export const AADHAAR_NONCE_COOKIE = "aadhaar_nonce";

export async function POST(request: Request): Promise<Response> {
  return guard(async () => {
    let body: { aadhaar?: unknown; consent?: unknown; language?: unknown };
    try {
      body = await request.json();
    } catch {
      return error("Invalid JSON body.");
    }
    if (body.consent !== true) return error("Explicit consent is required before verification.");
    if (typeof body.language !== "string" || !body.language) {
      return error("Please choose a language first.");
    }
    const aadhaar = typeof body.aadhaar === "string" ? body.aadhaar.replace(/\s/g, "") : "";

    const result = requestOtp(aadhaar);
    if (!result.ok) {
      const info = providerInfo();
      if (result.reason === "live_not_configured") {
        return error(
          "Live Aadhaar authentication is not configured on this server (no authorized UIDAI provider). It is disabled. Use sandbox mode or demo access.",
          503,
        );
      }
      if (result.reason === "invalid_format") return error("Enter a 12-digit number.");
      if (result.reason === "not_sandbox_identity") {
        return error(
          `This is ${info.name} mode — only approved synthetic test identities are accepted. See the on-screen hint.`,
        );
      }
      return error("Could not start verification.");
    }

    // Bind the transaction to this browser.
    const nonce = randomBytes(32).toString("hex");
    const nonceHash = createHash("sha256").update(nonce).digest("hex");
    const txnId = newId("atxn");
    await createAadhaarTxn({
      id: txnId,
      nonceHash,
      provider: providerInfo().name,
      last4: result.last4!,
      maskedMobile: result.maskedMobile!,
      ttlMinutes: 10,
    });

    const store = await cookies();
    store.set(AADHAAR_NONCE_COOKIE, nonce, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 600,
    });

    return json({
      txnId,
      maskedMobile: result.maskedMobile,
      provider: providerInfo().name,
      // never returns aadhaar
    });
  });
}
