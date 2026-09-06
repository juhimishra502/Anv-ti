"use client";
// Landing page — meadow-photograph hero (rendered by the global <Environment/> behind
// every page) inside a thin rounded white frame, a large centred editorial-serif
// heading, a small black primary CTA, and a large translucent glass questionnaire
// panel showing the first step (state, district, language, voice, continue). The
// large bottom music player is global (root layout). Real HTML controls throughout —
// nothing baked into an image, no 3D. The auth/case flow is preserved exactly.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client/api";
import type { CaseSummary, ReferenceData, SessionUser } from "@/lib/client/types";
import { useLocale } from "@/lib/i18n/context";
import { LanguageSelector } from "@/components/LanguageSelector";
import { DistrictDropdown } from "@/components/DistrictDropdown";

export default function HomePage() {
  const router = useRouter();
  const { t } = useLocale();
  const startingRef = useRef(false);

  const [user, setUser] = useState<SessionUser | null>(null);
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [reference, setReference] = useState<ReferenceData | null>(null);
  const [stateCode, setStateCode] = useState("");
  const [district, setDistrict] = useState("");
  const [assetType, setAssetType] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    api.get<ReferenceData>("/api/reference").then(setReference).catch(() => {});
    (async () => {
      try {
        const me = await api.get<{ user: SessionUser | null }>("/api/auth/me");
        setUser(me.user);
        if (me.user) {
          const list = await api.get<{ cases: CaseSummary[] }>("/api/cases");
          setCases(list.cases);
        }
      } catch { /* not signed in */ }
    })();
  }, []);

  async function startDemo(): Promise<SessionUser | null> {
    const res = await api.post<{ user: SessionUser }>("/api/auth/demo", {});
    setUser(res.user);
    try {
      const list = await api.get<{ cases: CaseSummary[] }>("/api/cases");
      setCases(list.cases);
    } catch { /* ignore */ }
    return res.user;
  }

  async function beginCase(preUser?: SessionUser | null) {
    if (startingRef.current) return;
    startingRef.current = true;
    setBusy(true);
    setErr(null);
    try {
      const u = preUser ?? user ?? (await startDemo());
      if (!u) throw new Error("Could not sign in. Please try again.");
      const res = await api.post<{ case: CaseSummary }>("/api/cases", { title: "Our family case" });
      router.push(`/onboarding/${res.case.id}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not start.");
      setBusy(false);
      startingRef.current = false;
    }
  }

  function onStartCase() {
    if (user) void beginCase();
    else setAuthOpen(true);
  }

  async function demoFromModal() {
    if (startingRef.current) return;
    setErr(null);
    try {
      const u = await startDemo();
      setAuthOpen(false);
      await beginCase(u);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not start.");
    }
  }

  async function logout() {
    await api.post("/api/auth/logout", {});
    setUser(null);
    setCases([]);
    setMenuOpen(false);
  }

  return (
    <div className="meadow">
      {/* The photograph remains the actual background. These transparent layers give
          the real UI a calm sense of depth without replacing it with a generated scene. */}
      <div className="meadow-depth" aria-hidden="true">
        <span className="meadow-light meadow-light-one" />
        <span className="meadow-light meadow-light-two" />
        <span className="meadow-mote meadow-mote-one" />
        <span className="meadow-mote meadow-mote-two" />
        <span className="meadow-mote meadow-mote-three" />
        <span className="meadow-mote meadow-mote-four" />
        <span className="meadow-mote meadow-mote-five" />
      </div>
      <div className="meadow-frame" id="main">
        {/* Floating nav inside the frame */}
        <nav className="meadow-nav" aria-label={t("brand")}>
          <Link className="meadow-brand" href="/">
            <svg className="meadow-mark" viewBox="0 0 48 48" aria-hidden="true">
              <path d="M24 42V22M24 30c-8 0-14-4-14-12 8 0 14 4 14 12ZM24 27c0-9 5-15 13-15 0 9-5 15-13 15ZM24 18c-5 0-9-4-9-9 5 0 9 4 9 9Z" />
            </svg>
            {t("brand")}
          </Link>
          <div className="meadow-nav-right">
            <LanguageSelector compact />
            <button className="meadow-menu" onClick={() => setMenuOpen((o) => !o)} aria-expanded={menuOpen} aria-label="menu">☰</button>
            {menuOpen && (
              <div className="card menupanel meadow-menupanel">
                {user ? (
                  <div className="stack">
                    <strong className="small">{t("yourCases")}</strong>
                    {cases.length === 0 && <span className="small muted">—</span>}
                    {cases.map((c) => <Link key={c.id} href={`/case/${c.id}`} className="small">{c.title}</Link>)}
                    <hr className="hr" />
                    <button className="btn btn-ghost btn-small" onClick={logout}>{t("signOut")}</button>
                  </div>
                ) : (
                  <div className="stack">
                    <Link className="btn btn-small" href="/signin">{t("signInWithAadhaar")}</Link>
                    <button className="btn btn-secondary btn-small" onClick={() => setAuthOpen(true)}>{t("startDemo")}</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </nav>

        {/* Centred editorial heading + primary CTA */}
        <div className="meadow-hero">
          <h1 className="meadow-heading"><span>{t("heroTitle")}</span><br /><span>{t("heroSub")}</span></h1>
          <button className="meadow-cta" onClick={onStartCase} disabled={busy}>{busy ? "…" : t("ctaPrimary")}</button>
        </div>

        {/* Large translucent glass questionnaire panel — a horizontal row of four
            fields, centred title above and Continue below, trust labels along the base. */}
        <form className="glass" onSubmit={(e) => { e.preventDefault(); onStartCase(); }}>
          <h2 className="glass-h">{t("glassHeading")}</h2>

          <div className="glass-fields">
            <div className="gf">
              <label htmlFor="q-state" className="glass-label">{t("qSelectState")}</label>
              <select id="q-state" className="glass-field" value={stateCode} onChange={(e) => { setStateCode(e.target.value); setDistrict(""); }}>
                <option value="">{t("qSelectState")}</option>
                {reference?.states.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
              </select>
            </div>
            <div className="gf gf-district">
              <DistrictDropdown stateCode={stateCode || undefined} value={district} onChange={setDistrict} label={t("qSelectDistrict")} />
            </div>
            <div className="gf">
              <label htmlFor="q-asset" className="glass-label">{t("qSelectAsset")}</label>
              <select id="q-asset" className="glass-field" value={assetType} onChange={(e) => setAssetType(e.target.value)}>
                <option value="">{t("qSelectAsset")}</option>
                {reference?.asset_types.map((a) => <option key={a.id} value={a.id}>{a.id.replace(/_/g, " ")}</option>)}
              </select>
            </div>
            <div className="gf">
              <span className="glass-label">{t("navLanguage")}</span>
              <LanguageSelector compact />
            </div>
          </div>

          <button type="submit" className="glass-continue" disabled={busy}>{busy ? "…" : `${t("ctaPrimary")} →`}</button>
          {err && <p className="small" style={{ color: "var(--danger)", textAlign: "center" }}>{err}</p>}

          <div className="glass-trust">
            <span><b aria-hidden>⌾</b> {t("trustSources")}</span>
            <span><b aria-hidden>⌁</b> {t("trustVoice")}</span>
            <span><b aria-hidden>⌖</b> {t("trustState")}</span>
          </div>
        </form>
      </div>

      {/* Sign-in modal */}
      {authOpen && (
        <div role="dialog" aria-modal="true" aria-label={t("signInToSave")} onClick={() => setAuthOpen(false)}
          style={{ position: "fixed", inset: 0, zIndex: 100, display: "grid", placeItems: "center", background: "rgba(20,33,15,0.45)", backdropFilter: "blur(4px)" }}>
          <div className="card" onClick={(e) => e.stopPropagation()} style={{ width: "min(420px, 92vw)", margin: 0 }}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <h2 style={{ margin: 0 }}>{t("ctaPrimary")}</h2>
              <button className="btn btn-ghost btn-small" onClick={() => setAuthOpen(false)} aria-label="Close">✕</button>
            </div>
            <p className="small muted">{t("signInToSave")}</p>
            <div className="stack" style={{ marginTop: "0.6rem" }}>
              <Link className="btn" href="/signin">{t("signInWithAadhaar")}</Link>
              <button className="btn btn-secondary" onClick={demoFromModal} disabled={busy}>{busy ? "…" : t("startDemo")}</button>
            </div>
            <p className="small muted" style={{ marginTop: "0.6rem" }}>{t("importantNotice")}</p>
          </div>
        </div>
      )}
    </div>
  );
}
