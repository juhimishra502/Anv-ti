"use client";
import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client/api";
import type { CaseView, ReferenceData } from "@/lib/client/types";
import { useLocale } from "@/lib/i18n/context";
import { FloatingNav } from "@/components/FloatingNav";
import { VoiceAssistant } from "@/components/VoiceAssistant";
import { DistrictDropdown } from "@/components/DistrictDropdown";
import { AddAssetForm } from "@/components/AddAssetForm";
import {
  QUESTIONNAIRE_VERSION,
  SECTIONS,
  visibleFields,
  answersToDeceasedColumns,
  type QAnswers,
} from "@/lib/questionnaire/schema";

export default function OnboardingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { t } = useLocale();
  const [reference, setReference] = useState<ReferenceData | null>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<QAnswers>({});
  const [current, setCurrent] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [stage, setStage] = useState<"questions" | "assets">("questions");
  const [building, setBuilding] = useState(false);
  const [assets, setAssets] = useState<CaseView["assets"]>([]);

  async function buildRoadmap() {
    if (building) return;
    setBuilding(true);
    setErr(null);
    // One correlation id per attempt: sent to the server, echoed in its logs + audit row.
    const correlationId =
      typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
    try {
      const res = await api.post<{ success?: boolean; journeyUrl?: string; error?: string }>(
        `/api/cases/${id}/roadmap`,
        {},
        { "X-Correlation-Id": correlationId },
      );
      // Navigate ONLY on a committed success with a journey URL.
      if (!res || res.success !== true || !res.journeyUrl) {
        throw new Error(res?.error || t("journeyBuildFailed"));
      }
      router.replace(res.journeyUrl); // exactly once, on success
    } catch (e) {
      // Show the real (translated) failure + the server detail and correlation ref.
      const detail = e instanceof Error ? e.message : "";
      setErr(detail ? `${t("journeyBuildFailed")} — ${detail} (ref ${correlationId})` : t("journeyBuildFailed"));
      setBuilding(false); // stay on the page; the error + Retry are shown below
    }
  }

  useEffect(() => {
    api.get<ReferenceData>("/api/reference").then(setReference).catch(() => setErr("Could not load reference data."));
  }, []);

  // Conditional flow: only fields whose showIf passes are shown.
  const visible = useMemo(() => visibleFields(answers), [answers]);
  const total = visible.length;
  const q = visible[Math.min(step, total - 1)];
  const progress = useMemo(() => Math.round(((step + 1) / total) * 100), [step, total]);
  const chosenState = (answers.last_residence_state || answers.death_state) as string | undefined;
  const sectionTitle = SECTIONS.find((s) => s.id === q?.section)?.title ?? "";

  function recordAndNext(value: string | null) {
    const v = value === "__unknown__" ? null : value;
    const nextAnswers = { ...answers, [q.id]: v };
    setAnswers(nextAnswers);
    setCurrent("");
    const nextVisible = visibleFields(nextAnswers);
    if (step < nextVisible.length - 1) setStep((s) => s + 1);
    else void save(nextAnswers);
  }

  async function save(all: QAnswers) {
    setBusy(true);
    setErr(null);
    try {
      // Map to the deceased columns the engine reads, and store the full answer set.
      const payload = {
        ...answersToDeceasedColumns(all),
        answers_json: JSON.stringify(all),
        questionnaire_version: QUESTIONNAIRE_VERSION,
      };
      const view = await api.patch<CaseView>(`/api/cases/${id}/deceased`, payload);
      setAssets(view.assets ?? []);
      setStage("assets"); // collect assets before showing the journey
      setBusy(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not save answers.");
      setBusy(false);
    }
  }

  if (!q && stage === "questions") return null;
  const screenHelp = q ? `${q.label}. ${q.help ?? ""}` : "";

  return (
    <>
      <FloatingNav stateCode={chosenState}>
        <Link className="btn btn-ghost btn-small" href={`/case/${id}`}>
          {t("skipForNow")}
        </Link>
      </FloatingNav>

      <main id="main" className="container" style={{ maxWidth: 640 }}>
        {stage === "assets" && (
          <div className="card">
            <h1 style={{ fontSize: "1.35rem" }}>{t("transferStageTitle")}</h1>
            <p className="muted">{t("transferStageIntro")}</p>
            {reference && <AddAssetForm caseId={id} reference={reference} onUpdated={(v) => setAssets(v.assets)} />}
            {assets.length > 0 && (
              <>
                <hr className="hr" />
                <strong className="small">
                  {t("addedSoFar")} ({assets.length})
                </strong>
                <ul className="clean">
                  {assets.map((a) => (
                    <li key={a.id} className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                      <span>
                        {a.label || a.asset_type.replace(/_/g, " ")}{" "}
                        <span className="small muted">· {a.service.replace(/_/g, " ")}</span>
                      </span>
                      <button
                        type="button"
                        className="btn btn-ghost btn-small"
                        onClick={async () => {
                          try {
                            const view = await api.del<CaseView>(`/api/cases/${id}/assets/${a.id}`);
                            setAssets(view.assets);
                          } catch {
                            setErr("Could not remove that asset.");
                          }
                        }}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {err && (
              <div className="notice notice-danger small" role="alert" style={{ marginTop: "1rem" }}>
                <div>{err}</div>
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  style={{ marginTop: "0.5rem" }}
                  onClick={buildRoadmap}
                  disabled={building}
                >
                  {building ? "…" : t("retry")}
                </button>
              </div>
            )}
            <button
              className="btn"
              style={{ marginTop: "1rem" }}
              onClick={buildRoadmap}
              disabled={assets.length === 0 || building}
              title={assets.length === 0 ? t("noAssets") : undefined}
            >
              {building ? "…" : t("generateJourney")}
            </button>
          </div>
        )}

        {stage === "questions" && (
          <>
            <div className="small muted" aria-hidden>
              {sectionTitle} · {t("stepOf").replace("{n}", String(step + 1)).replace("{total}", String(total))}
            </div>
            <div
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              style={{ height: 8, background: "var(--surface-2)", borderRadius: 999, margin: "0.5rem 0 1.25rem" }}
            >
              <div style={{ width: `${progress}%`, height: "100%", background: "var(--primary)", borderRadius: 999 }} />
            </div>

            {err && <div className="notice notice-danger small">{err}</div>}

            <div className="card">
              <h1 style={{ fontSize: "1.35rem" }}>{q.label}</h1>
              {q.help && <p className="muted">{q.help}</p>}

              {q.type === "text" && (
                <input value={current} onChange={(e) => setCurrent(e.target.value)} autoFocus placeholder="…" />
              )}
              {q.type === "number" && (
                <input type="number" min={0} value={current} onChange={(e) => setCurrent(e.target.value)} />
              )}
              {q.type === "date" && <input type="date" value={current} onChange={(e) => setCurrent(e.target.value)} />}
              {q.type === "state" && (
                <select value={current} onChange={(e) => setCurrent(e.target.value)}>
                  <option value="">{t("assetTypeSelect")}</option>
                  {reference?.states.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.name}
                    </option>
                  ))}
                </select>
              )}
              {q.type === "district" && (
                <DistrictDropdown
                  stateCode={(answers[q.parentStateId!] as string | undefined) || undefined}
                  value={current}
                  onChange={setCurrent}
                  label={t("district")}
                />
              )}
              {(q.type === "choice" || q.type === "yesno") && (
                <div className="stack">
                  {q.choices!.map((c) => (
                    <button
                      key={c.value}
                      className="btn btn-secondary"
                      style={{ width: "100%", justifyContent: "flex-start" }}
                      onClick={() => recordAndNext(c.value)}
                      disabled={busy}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              )}

              <div className="row" style={{ marginTop: "1rem", justifyContent: "space-between" }}>
                <button className="btn btn-ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0 || busy}>
                  ← {t("back")}
                </button>
                <div className="row">
                  {q.allowUnknown && (
                    <button className="btn btn-secondary" onClick={() => recordAndNext(null)} disabled={busy}>
                      {t("iDontKnow")}
                    </button>
                  )}
                  {q.type !== "choice" && q.type !== "yesno" && (
                    <button className="btn" onClick={() => recordAndNext(current || null)} disabled={busy}>
                      {step < total - 1 ? `${t("next")} →` : busy ? "…" : t("finish")}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <p className="small muted">{t("changeLater")}</p>
          </>
        )}
      </main>

      <VoiceAssistant mode="general" screenHelp={screenHelp} />
    </>
  );
}
