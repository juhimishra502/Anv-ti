// Step 2: verify the OTP. Enforces session binding (nonce cookie), expiry, retry
// limit and single-use (replay prevention). Only on a genuine provider-verified
// result does it create/authenticate the account and issue a session. A client-side
// success flag or Aadhaar format alone never counts as authentication.
//
// The OTP is never logged or stored.
import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { json, error, guard } from "@/lib/api/handler";
import {
  getAadhaarTxn,
  bumpAadhaarAttempts,
  setAadhaarStatus,
  createUser,
} from "@/lib/db/repo";
import { verifyOtp } from "@/lib/auth/aadhaar/provider";
import { startSession } from "@/lib/auth/session";
import { AADHAAR_NONCE_COOKIE } from "../start/route";

export const runtime = "nodejs";

const MAX_ATTEMPTS = 5;

export async function POST(request: Request): Promise<Response> {
  return guard(async () => {
    let body: { txnId?: unknown; otp?: unknown };
    try {
      body = await request.json();
    } catch {
      return error("Invalid JSON body.");
    }
    const txnId = typeof body.txnId === "string" ? body.txnId : "";
    const otp = typeof body.otp === "string" ? body.otp.trim() : "";
    if (!txnId || !otp) return error("Missing transaction or OTP.");

    const txn = await getAadhaarTxn(txnId);
    if (!txn) return error("Verification session not found. Start again.", 404);

    // Single-use: a consumed/verified/failed/expired txn cannot be replayed.
    if (txn.status !== "otp_sent") return error("This verification can no longer be used. Start again.", 409);

    // Expiry.
    if (new Date(txn.expires_at).getTime() < Date.now()) {
      await setAadhaarStatus(txnId, "expired");
      return error("The OTP has expired. Please start again.", 400);
    }

    // Session binding: the nonce cookie must match this transaction.
    const store = await cookies();
    const nonce = store.get(AADHAAR_NONCE_COOKIE)?.value ?? "";
    const nonceHash = nonce ? createHash("sha256").update(nonce).digest("hex") : "";
    if (!nonceHash || nonceHash !== txn.nonce_hash) {
      return error("This verification was started in a different session.", 400);
    }

    // Retry limit.
    const attempts = await bumpAadhaarAttempts(txnId);
    if (attempts > MAX_ATTEMPTS) {
      await setAadhaarStatus(txnId, "failed");
      return error("Too many incorrect attempts. Please start again.", 429);
    }

    if (!verifyOtp(otp)) {
      const remaining = Math.max(0, MAX_ATTEMPTS - attempts);
      return json({ ok: false, remaining_attempts: remaining, error: "Incorrect OTP." }, 400);
    }

    // Success — create a verified account (real integration would key on the
    // provider's reference token, never on the Aadhaar number itself).
    const user = await createUser({
      displayName: `Verified user ••${txn.aadhaar_last4 ?? ""}`,
      isDemo: false,
      authMethod: txn.provider === "sandbox" ? "aadhaar_sandbox" : "aadhaar",
    });
    await setAadhaarStatus(txnId, "consumed", user.id);
    await startSession(user.id);
    store.delete(AADHAAR_NONCE_COOKIE);

    return json({
      ok: true,
      user: { id: user.id, display_name: user.display_name, is_demo: false },
      sandbox: txn.provider === "sandbox",
    });
  });
}
