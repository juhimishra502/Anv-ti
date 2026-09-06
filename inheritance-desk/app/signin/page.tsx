"use client";
// Aadhaar sign-in flow. Clearly labelled SANDBOX; live Aadhaar is disabled until an
// authorized UIDAI provider is configured. Aadhaar and OTP are entered manually (a
// production build would prefer a provider-hosted collection screen). Nothing
// sensitive is stored client-side; values are sent once over POST and never logged.
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client/api";
import { useLocale } from "@/lib/i18n/context";
import { FloatingNav } from "@/components/FloatingNav";
import { GlassShell } from "@/components/GlassShell";
import { VoiceAssistant } from "@/components/VoiceAssistant";

interface ProviderInfo {
  provider: string;
  live: boolean;
  configured: boolean;
  note: string;
  sandbox: { identities: string[]; otp: string } | null;
}

export default function SignInPage() {
  const router = useRouter();
  const { t, locale } = useLocale();
  const [info, setInfo] = useState<ProviderInfo | null>(null);
  const [stage, setStage] = useState<"aadhaar" | "otp">("aadhaar");
  const [aadhaar, setAadhaar] = useState("");
  const [consent, setConsent] = useState(false);
  const [txnId, setTxnId] = useState("");
  const [maskedMobile, setMaskedMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    api.get<ProviderInfo>("/api/auth/aadhaar/info").then(setInfo).catch(() => {});
  }, []);

  async function requestOtp(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!consent) {
      setErr("Please read and give consent first.");
      return;
    }
    setBusy(true);
    try {
      const res = await api.post<{ txnId: string; maskedMobile: string }>("/api/auth/aadhaar/start", {
        aadhaar,
        consent: true,
        language: locale,
      });
      setTxnId(res.txnId);
      setMaskedMobile(res.maskedMobile);
      setAadhaar(""); // do not keep the number in memory longer than needed
      setStage("otp");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not start verification.");
    } finally {
      setBusy(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/aadhaar/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txnId, otp }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        router.push("/");
        return;
      }
      if (typeof data.remaining_attempts === "number") setRemaining(data.remaining_attempts);
      setErr(data.error || "Verification failed.");
    } catch {
      setErr("Verification failed.");
    } finally {
      setBusy(false);
    }
  }

  const screenHelp =
    "This is the Aadhaar sign-in screen. It is a sandbox and does not perform real verification. You choose a language, give consent, enter a test identity, then an OTP. You can also go back and use demo access.";

  return (
    <>
      <FloatingNav />

      <main id="main" className="container" style={{ maxWidth: 620 }}>
        <GlassShell wide={false}>
        <h1>{t("signInWithAadhaar")}</h1>

        {info && (
          <div className={info.live && !info.configured ? "notice notice-danger" : "notice"}>
            <strong>{info.provider === "sandbox" ? "SANDBOX" : "LIVE"} mode.</strong> {info.note}
          </div>
        )}

        <div className="notice notice-info small">
          You are verifying <strong>your own</strong> Aadhaar (the applicant), not the deceased
          person&apos;s. We only store a masked reference. We never ask you to speak or share your
          Aadhaar number or OTP with the voice assistant.
        </div>

        {err && <div className="notice notice-danger small">{err}</div>}

        {stage === "aadhaar" ? (
          <form onSubmit={requestOtp} className="card stack">
            <div>
              <label htmlFor="aadhaar">Aadhaar number (12 digits)</label>
              <input
                id="aadhaar"
                inputMode="numeric"
                autoComplete="off"
                value={aadhaar}
                onChange={(e) => setAadhaar(e.target.value)}
                placeholder="Sandbox test identity"
              />
            </div>

            {info?.sandbox && (
              <p className="small muted">
                Sandbox test identities: {info.sandbox.identities.join(", ")}. Test OTP:{" "}
                <strong>{info.sandbox.otp}</strong>.
              </p>
            )}

            <label className="row" style={{ alignItems: "flex-start", gap: "0.5rem", fontWeight: 400 }}>
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                style={{ width: "auto", minHeight: "auto", marginTop: 4 }}
              />
              <span className="small">
                I understand this sends a one-time password to the Aadhaar-registered mobile and I
                consent to this verification. (Sandbox: no real message is sent.)
              </span>
            </label>

            <button className="btn" type="submit" disabled={busy}>
              {busy ? "…" : "Send OTP"}
            </button>
            <Link className="btn btn-ghost btn-small" href="/">
              ← {t("orDemo")}
            </Link>
          </form>
        ) : (
          <form onSubmit={verify} className="card stack">
            <p className="small">
              An OTP was requested for <strong>{maskedMobile}</strong>. Enter it below.
            </p>
            <div>
              <label htmlFor="otp">One-time password</label>
              <input
                id="otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
            </div>
            {remaining !== null && <p className="small muted">Attempts remaining: {remaining}</p>}
            <button className="btn" type="submit" disabled={busy}>
              {busy ? "…" : "Verify & sign in"}
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-small"
              onClick={() => {
                setStage("aadhaar");
                setOtp("");
                setTxnId("");
                setErr(null);
                setRemaining(null);
              }}
            >
              ← Start again
            </button>
          </form>
        )}
        </GlassShell>
      </main>

      <VoiceAssistant mode="general" screenHelp={screenHelp} />
    </>
  );
}
