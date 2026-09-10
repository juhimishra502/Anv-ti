"use client";
// Botanical editorial landing page. The existing case/auth flows remain behind the
// start-roadmap CTA; this page only presents their first entry point.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client/api";
import type { CaseSummary, SessionUser } from "@/lib/client/types";
import { useLocale } from "@/lib/i18n/context";
import { LanguageSelector } from "@/components/LanguageSelector";

const FEATURES = [
  ["♧", "Understand", "the process"],
  ["▣", "Identify", "what you own"],
  ["⌘", "See your", "roadmap"],
  ["◔", "Track", "progress"],
];

const ROADMAP_PREVIEW = [
  ["1", "Notify & obtain documents", "Inform authorities and collect essential documents.", "To do", "complete"],
  ["2", "Secure & access accounts", "Freeze, access and take control of accounts and services.", "To do", "todo"],
  ["3", "Settle & transfer assets", "Complete legal steps, pay dues and transfer assets.", "In progress", "progress"],
  ["4", "Close & move forward", "Close remaining accounts and preserve important records.", "Upcoming", "upcoming"],
];

export default function HomePage() {
  const router = useRouter();
  const { t } = useLocale();
  const startingRef = useRef(false);

  const [user, setUser] = useState<SessionUser | null>(null);
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
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
    <main className="botanical-landing" id="main">
      <section className="botanical-hero">
        <div className="botanical-butterflies" aria-hidden="true">
          <span className="butterfly-flight butterfly-morpho"><span className="butterfly" /></span>
          <span className="butterfly-flight butterfly-monarch"><span className="butterfly" /></span>
          <span className="butterfly-flight butterfly-swallowtail"><span className="butterfly" /></span>
        </div>
        <div className="botanical-breeze" aria-hidden="true">
          <span className="botanical-flower-sway botanical-flower-sway-left" />
          <span className="botanical-flower-sway botanical-flower-sway-right" />
        </div>
        <nav className="botanical-nav" aria-label={t("brand")}>
          <Link className="botanical-brand" href="/">
            <Image src="/images/anviti-rose-infinity.png" alt="" width={1774} height={887} priority />
            <span>Anvīti</span>
          </Link>
          <div className="botanical-nav-actions">
            <LanguageSelector compact />
            <button className="botanical-menu" onClick={() => setMenuOpen((o) => !o)} aria-expanded={menuOpen} aria-label="menu">☰</button>
            {menuOpen && (
              <div className="card menupanel botanical-menupanel">
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

        <div className="botanical-hero-copy">
          <h1>Guidance. Clarity.<br />Closure.</h1>
          <p>A calm, step-by-step orientation to help<br />your family handle assets after a death in India.</p>
          <button className="botanical-cta" onClick={onStartCase} disabled={busy}>{busy ? "…" : "Start your roadmap"}</button>
          {err && <p className="botanical-error" role="alert">{err}</p>}
        </div>

        <section className="botanical-feature-panel" aria-label="How Anvīti helps">
          <h2>Where would you like to begin?</h2>
          <div className="botanical-features">
            {FEATURES.map(([icon, lineOne, lineTwo]) => (
              <div className="botanical-feature" key={lineOne}>
                <span aria-hidden="true">{icon}</span>
                <strong>{lineOne}</strong>
                <small>{lineTwo}</small>
              </div>
            ))}
          </div>
          <p>♢ Private by design. Your data stays with you.</p>
        </section>
      </section>

      <section className="botanical-roadmap" aria-labelledby="roadmap-preview-title">
        <div className="botanical-roadmap-intro">
          <span>Your roadmap</span>
          <h2 id="roadmap-preview-title">A step-by-step path<br />for your family</h2>
        </div>
        <div className="botanical-roadmap-grid">
          <ol className="botanical-timeline">
            {ROADMAP_PREVIEW.map(([number, title, detail, status, tone]) => (
              <li className={`botanical-timeline-item botanical-timeline-${tone}`} key={number}>
                <span className="botanical-timeline-number">{number}</span>
                <div>
                  <strong>{title}</strong>
                  <p>{detail}</p>
                </div>
                <span className="botanical-status">{status}</span>
                <span aria-hidden="true">›</span>
              </li>
            ))}
          </ol>
          <aside className="botanical-glance">
            <h3>At a glance</h3>
            <dl>
              <div><dt>▣ Progress</dt><dd>2 of 8 steps</dd></div>
              <div><dt>◷ Estimated time</dt><dd>3–6 months</dd></div>
              <div><dt>♧ Things to do</dt><dd>5 tasks</dd></div>
            </dl>
            <button type="button" onClick={onStartCase}>View full roadmap&nbsp; →</button>
          </aside>
        </div>
      </section>

      <section className="botanical-reflection" aria-label="A moment of support">
        <p>“<br />We are here to simplify a difficult time<br />with clarity and compassion.</p>
      </section>

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
    </main>
  );
}
