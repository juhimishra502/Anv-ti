"use client";
import { use, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/client/api";
import type { CaseView, ReferenceData } from "@/lib/client/types";
import { RoadmapStep, type CaseDoc } from "@/components/RoadmapStep";
import { JourneyGraph, buildGraph } from "@/components/JourneyGraph";
import { AddAssetForm } from "@/components/AddAssetForm";
import { Chatbot } from "@/components/Chatbot";
import { ReadAloud } from "@/components/ReadAloud";
import { VoiceAssistant } from "@/components/VoiceAssistant";
import { FloatingNav } from "@/components/FloatingNav";
import { DocumentVault } from "@/components/DocumentVault";
import { useLocale } from "@/lib/i18n/context";
import { useTranslated } from "@/lib/i18n/translate-client";

export default function CasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t, locale } = useLocale();
  const [view, setView] = useState<CaseView | null>(null);
  const [reference, setReference] = useState<ReferenceData | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [docs, setDocs] = useState<CaseDoc[]>([]);

  const loadDocs = useCallback(() => {
    fetch(`/api/cases/${id}/documents`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setDocs(d.documents ?? []); })
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    (async () => {
      try {
        const [v, r] = await Promise.all([
          api.get<CaseView>(`/api/cases/${id}`),
          api.get<ReferenceData>("/api/reference"),
        ]);
        setView(v);
        setReference(r);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Could not load case.");
      } finally {
        setLoading(false);
      }
    })();
    loadDocs();
  }, [id, loadDocs]);

  // Next action = first step that is not done (neither derived-done nor user-completed).
  const nextStep = view?.roadmap.find((s) => s.derived_done !== 1 && s.user_status !== "completed");
  // Suggested documents for this case (from the matched procedures' document lists).
  const suggestedDocs = Array.from(
    new Set(
      (view?.roadmap ?? []).flatMap((s) => {
        const p = s.payload;
        const fromExamples = (p?.procedures ?? []).flatMap((pr) => pr.document_examples ?? []);
        const fromDetail = (p?.procedures ?? []).flatMap((pr) =>
          (pr.detail?.documents ?? []).map((d) => d.name),
        );
        return [...fromExamples, ...fromDetail];
      }),
    ),
  ).slice(0, 24);
  const nextActionSrc = nextStep?.payload?.next_action ?? nextStep?.title ?? "";
  const trNext = useTranslated(nextActionSrc ? [nextActionSrc] : [], reference?.catalog_version ?? "v1");
  const nextActionText = trNext(nextActionSrc);

  // Dependency graph + selected node (drives the connected journey + detail panel).
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const graph = useMemo(() => (view ? buildGraph(view) : []), [view]);
  const currentNode = graph.find((n) => n.status === "current") ?? graph.find((n) => n.status !== "completed") ?? graph[0];
  // Effective selection: the user's pick, else default to the current node (no effect needed).
  const effectiveSelectedId = selectedId ?? currentNode?.id ?? null;
  const assetById = useMemo(() => new Map((view?.assets ?? []).map((a) => [a.id, a])), [view]);
  const selectedStep = view?.roadmap.find((s) => s.id === effectiveSelectedId) ?? currentNode?.step ?? null;
  const selectedAsset = selectedStep?.asset_id ? assetById.get(selectedStep.asset_id) : undefined;

  return (
    <>
      <FloatingNav stateCode={view?.deceased?.residence_state}>
        <Link className="btn btn-ghost btn-small" href={`/onboarding/${id}`}>
          {t("editCaseDetails")}
        </Link>
      </FloatingNav>

      <main id="main" className="container container-wide">
        {loading && <p className="muted">{t("loading")}</p>}
        {err && <div className="notice notice-danger">{err}</div>}

        {view && (
          <>
            <div className="page-shell">
              <h1>{view.case.title}</h1>
              {view.deceased && (
                <p className="small muted" style={{ marginTop: "-0.2rem" }}>
                  {view.deceased.full_name ? `${view.deceased.full_name} · ` : ""}
                  Residence: {view.deceased.residence_state ?? "—"} · Death:{" "}
                  {view.deceased.death_state ?? "—"} · Registered:{" "}
                  {view.deceased.death_registered ?? "unknown"}
                </p>
              )}

              {view.roadmap.length === 0 && <p className="muted">{t("roadmapEmpty")}</p>}

              {view.roadmap.length > 0 && (
                <>
                  {/* Current step summary */}
                  {currentNode && currentNode.status !== "completed" && (
                    <div className="jg-current-panel">
                      <span className="k">{t("yourNextStep")}</span>
                      <div className="v">{nextActionText}</div>
                      <div className="meta">
                        {currentNode.jurisdiction && <span>📍 {currentNode.jurisdiction}</span>}
                        <span>{currentNode.step.service.replace(/_/g, " ")}</span>
                        <ReadAloud
                          text={`${t("yourNextStep")}. ${nextActionText}`}
                          label={t("readScreenAloud")}
                          lang={locale === "en" ? "en-IN" : `${locale}-IN`}
                        />
                      </div>
                    </div>
                  )}

                  {/* Connected dependency-graph journey */}
                  <JourneyGraph view={view} selectedId={effectiveSelectedId} onSelect={setSelectedId} />

                  {/* Selected node detail (full structured step) */}
                  {selectedStep && (
                    <div style={{ marginTop: "1rem" }}>
                      <RoadmapStep
                        key={selectedStep.id}
                        step={selectedStep}
                        index={0}
                        jurisdiction={selectedAsset?.location?.state_code ?? undefined}
                        institution={selectedAsset?.institution ?? undefined}
                        caseDocs={docs}
                        onDocsChanged={loadDocs}
                      />
                    </div>
                  )}
                </>
              )}

              {/* Reminders */}
              {(() => {
                const today = new Date().toISOString().slice(0, 10);
                const rem = view.roadmap
                  .filter((s) => s.follow_up_date)
                  .sort((a, b) => (a.follow_up_date! < b.follow_up_date! ? -1 : 1));
                if (rem.length === 0) return null;
                return (
                  <div className="card" style={{ marginTop: "1rem" }}>
                    <h2>{t("reminders")}</h2>
                    <ul className="clean">
                      {rem.map((s) => {
                        const overdue = s.follow_up_date! < today;
                        const isToday = s.follow_up_date === today;
                        return (
                          <li key={s.id} className="row" style={{ justifyContent: "space-between" }}>
                            <button className="btn btn-ghost btn-small" onClick={() => setSelectedId(s.id)}>{s.title}</button>
                            <span className={`badge ${overdue ? "badge-danger" : isToday ? "badge-warn" : "badge-info"}`}>
                              {overdue ? t("overdue") : isToday ? t("dueToday") : t("upcoming")} · {s.follow_up_date}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })()}

              {/* Manage assets & documents — secondary, collapsed so the roadmap stays the focus */}
              <details className="card" style={{ marginTop: "1.6rem" }}>
                <summary style={{ cursor: "pointer", fontWeight: 700 }}>
                  {t("assetsBenefits")} · {t("documentsTitle")}
                </summary>
                <div style={{ marginTop: "0.8rem" }}>
                  {view.assets.length > 0 ? (
                    <ul className="clean">
                      {view.assets.map((a) => (
                        <li key={a.id}>
                          <strong>{a.label || a.asset_type.replace(/_/g, " ")}</strong>{" "}
                          <span className="small muted">
                            · {a.service.replace(/_/g, " ")}
                            {a.location?.state_code ? ` · ${a.location.state_code}` : ""}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="muted">{t("noAssets")}</p>
                  )}
                  <h3 style={{ marginTop: "1rem" }}>{t("addAssetTitle")}</h3>
                  {reference && (
                    <AddAssetForm caseId={id} reference={reference} onUpdated={(v) => setView(v)} />
                  )}
                  <div style={{ marginTop: "1rem" }}>
                    <DocumentVault caseId={id} suggestedDocs={suggestedDocs} />
                  </div>
                </div>
              </details>

              <p className="small muted" style={{ marginTop: "1rem" }}>
                {t("orientationOnly")} {reference?.coverage_note}
              </p>
            </div>

            <Chatbot caseId={id} assets={view.assets} />
            <VoiceAssistant
              mode="case"
              caseId={id}
              screenHelp={`${view.case.title}. ${nextStep ? `${t("yourNextStep")}: ${nextStep.payload?.next_action ?? nextStep.title}` : ""}`}
            />
          </>
        )}
      </main>
    </>
  );
}
