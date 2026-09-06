// Aadhaar authentication provider boundary.
//
// COMPLIANCE / HONESTY:
//  - LIVE Aadhaar authentication is DISABLED. It requires being an authorized
//    requesting entity (AUA/KUA) operating through an ASA, with UIDAI approval for
//    this specific purpose. Those credentials are not configured here, so `live`
//    always reports not-configured and performs no authentication.
//  - The SANDBOX provider below is clearly labelled and uses synthetic, non-real
//    test identities only. It NEVER performs real Aadhaar verification and must not
//    be presented as such.
//  - Mandatory Aadhaar for a private service is generally NOT permitted; the app
//    therefore keeps a non-Aadhaar path (demo access) and does not force this flow.
import "server-only";

export type ProviderName = "sandbox" | "live";

export interface ProviderInfo {
  name: ProviderName;
  live: boolean;
  configured: boolean;
  note: string;
}

const SANDBOX_OTP = "123456";

// Synthetic, clearly-non-real test identities (NOT valid Aadhaar numbers). Each maps
// to a fake registered mobile. Only these are accepted in sandbox mode.
const SANDBOX_IDENTITIES: Record<string, { mobile: string }> = {
  "999999990019": { mobile: "9000000019" },
  "999988887777": { mobile: "9000007777" },
  "999900001234": { mobile: "9000001234" },
};

function selected(): ProviderName {
  return process.env.AADHAAR_PROVIDER === "live" ? "live" : "sandbox";
}

function liveConfigured(): boolean {
  // A real integration would need these (names illustrative). None are set here.
  return !!(process.env.AADHAAR_AUA_CODE && process.env.AADHAAR_ASA_KEY && process.env.AADHAAR_LICENSE_KEY);
}

export function providerInfo(): ProviderInfo {
  const name = selected();
  if (name === "live") {
    return {
      name,
      live: true,
      configured: liveConfigured(),
      note: liveConfigured()
        ? "Live Aadhaar provider configured."
        : "Live Aadhaar authentication is not configured (no authorized AUA/KUA/ASA credentials). It is disabled.",
    };
  }
  return {
    name: "sandbox",
    live: false,
    configured: true,
    note: "Sandbox mode — synthetic identities only. This is NOT real Aadhaar verification.",
  };
}

export function maskMobile(mobile: string): string {
  const last4 = mobile.slice(-4);
  return `XXXXXX${last4}`;
}

export interface RequestOtpResult {
  ok: boolean;
  reason?: string;
  maskedMobile?: string;
  last4?: string;
}

/** Validate + "send" an OTP to the Aadhaar-registered mobile. Returns masked refs only. */
export function requestOtp(aadhaar: string): RequestOtpResult {
  const info = providerInfo();
  if (info.live && !info.configured) {
    return { ok: false, reason: "live_not_configured" };
  }
  const digits = (aadhaar || "").replace(/\s/g, "");
  if (!/^\d{12}$/.test(digits)) {
    return { ok: false, reason: "invalid_format" };
  }
  if (info.name === "sandbox") {
    const identity = SANDBOX_IDENTITIES[digits];
    if (!identity) return { ok: false, reason: "not_sandbox_identity" };
    return { ok: true, maskedMobile: maskMobile(identity.mobile), last4: digits.slice(-4) };
  }
  // Live path is unreachable while unconfigured; a real provider call would go here.
  return { ok: false, reason: "live_not_configured" };
}

/** Verify the OTP. Sandbox uses a fixed test OTP; live would validate the provider response. */
export function verifyOtp(otp: string): boolean {
  const info = providerInfo();
  if (info.name === "sandbox") return otp === SANDBOX_OTP;
  return false; // live not configured
}

export const SANDBOX_HINT = {
  identities: Object.keys(SANDBOX_IDENTITIES),
  otp: SANDBOX_OTP,
};
