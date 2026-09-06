"use client";
import { useMemo, useRef, useState } from "react";
import type { RoadmapStepView } from "@/lib/client/types";
import { api } from "@/lib/client/api";
import { useLocale } from "@/lib/i18n/context";
import { useTranslated } from "@/lib/i18n/translate-client";
import { GuidanceCard } from "./GuidanceCard";
import { ReadAloud } from "./ReadAloud";
import { RequirementBadge } from "./badges";

/** The 5-second compact card: one heading, ≤2 bullets, and office/fee/timeline/status
 *  chips. Full legal detail stays behind "View details". Voice reads only this
 *  localized compact text (not the hidden long detail). Applies to EVERY asset. */
function CompactCard({ payload, version, lang }: { payload: RoadmapStepView["payload"]; version: string; lang: string }) {
  const { t } = useLocale();
  const compact = payload?.compact;
  const fallback = payload?.fallback ?? null;
  const strings = useMemo(() => {
    if (!compact) return [];
    return [compact.heading, ...compact.bullets, compact.chips.office, compact.chips.fee, compact.chips.timeline, compact.chips.status, ...(fallback ? [fallback.message] : [])];
  }, [compact, fallback]);
  const tr = useTranslated(strings, version);
  if (!compact) return null;
  const readable = `${tr(compact.heading)}. ${compact.bullets.map((b) => tr(b)).join(" ")}`;
  return (
    <div className="stack" style={{ gap: "0.5rem", marginTop: "0.5rem" }}>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center", gap: "0.4rem" }}>
        <strong>{tr(compact.heading)}</strong>
        <ReadAloud text={readable} label={t("readScreenAloud")} lang={lang} />
      </div>
      <ul className="clean small" style={{ margin: 0 }}>
        {compact.bullets.slice(0, 2).map((b, i) => (
          <li key={i}>• {tr(b)}</li>
        ))}
      </ul>
      <div className="row small" style={{ gap: "0.4rem", flexWrap: "wrap" }}>
        {compact.chips.state && <span className="badge badge-info">{compact.chips.state}</span>}
        <span className="badge">🏛 {tr(compact.chips.office)}</span>
        <span className="badge">💰 {tr(compact.chips.fee)}</span>
        <span className="badge">⏱ {tr(compact.chips.timeline)}</span>
        <span className={`badge ${fallback ? "badge-warn" : "badge-ok"}`}>{tr(compact.chips.status)}</span>
      </div>
      {fallback && (
        <div className="notice notice-warn small" role="note">
          {tr(fallback.message)}
          <div className="muted" style={{ marginTop: "0.25rem" }}>
            Missing: {fallback.missing.join(", ")}
          </div>
        </div>
      )}
    </div>
  );
}

const STATUS_OPTIONS = [
  ["not_started", "Not started"],
  ["in_progress", "In progress"],
  ["documents_needed", "Gathering documents"],
  ["submitted", "Submitted"],
  ["awaiting_institution", "Awaiting institution"],
  ["action_required", "Action required"],
  ["on_hold", "On hold"],
  ["completed", "Completed (my own record)"],
] as const;

export interface CaseDoc {
  id: string;
  label: string | null;
  original_name: string | null;
  size: number;
}

/** Documents this step needs, pulled from the grounded payload (detail docs +
 *  document examples). Never fabricated — only what the engine returned. */
function neededDocs(step: RoadmapStepView): string[] {
  const p = step.payload;
  if (!p) return [];
  const out = new Set<string>();
  for (const pr of p.procedures ?? []) {
    for (const d of (pr.detail?.documents ?? []) as Array<string | { name?: string }>) {
      const name = typeof d === "string" ? d : d?.name;
      if (name) out.add(name.trim());
    }
    for (const e of pr.document_examples ?? []) if (e) out.add(e.trim());
  }
  return [...out].slice(0, 14);
}

export function RoadmapStep({
  step,
  index,
  phaseLabel,
  jurisdiction,
  institution,
  caseDocs = [],
  onDocsChanged,
}: {
  step: RoadmapStepView;
  index: number;
  phaseLabel?: string;
  jurisdiction?: string;
  institution?: string;
  caseDocs?: CaseDoc[];
  onDocsChanged?: () => void;
}) {
  const { t, locale } = useLocale();
  const [status, setStatus] = useState(step.user_status);
  const [saving, setSaving] = useState(false);

  const done = step.derived_done === 1 || status === "completed";
  const [open, setOpen] = useState(index === 0 && !done);

  const [track, setTrack] = useState({
    submitted_at: step.submitted_at ?? "",
    office: step.office ?? "",
    ack_number: step.ack_number ?? "",
    follow_up_date: step.follow_up_date ?? "",
    notes: step.notes ?? "",
  });
  const [savedTick, setSavedTick] = useState(false);

  const docs = useMemo(() => neededDocs(step), [step]);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Match an uploaded document to a checklist item by label (case-insensitive).
  function uploadedFor(docName: string): CaseDoc | undefined {
    const key = docName.toLowerCase().replace(/[.\s]+$/g, "");
    return caseDocs.find((d) => (d.label ?? "").toLowerCase().includes(key.slice(0, 24)));
  }

  async function updateStatus(next: string) {
    setSaving(true);
    setStatus(next);
    try {
      await api.patch(`/api/cases/${step.case_id}/steps/${step.id}`, { user_status: next });
    } catch {
      setStatus(step.user_status);
    } finally {
      setSaving(false);
    }
  }

  async function saveTracking() {
    setSaving(true);
    setSavedTick(false);
    try {
      await api.patch(`/api/cases/${step.case_id}/steps/${step.id}`, track);
      setSavedTick(true);
      setTimeout(() => setSavedTick(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  async function uploadDoc(docName: string, file: File) {
    setUploadingFor(docName);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("label", docName.replace(/[.\s]+$/g, ""));
      await fetch(`/api/cases/${step.case_id}/documents`, { method: "POST", body: fd });
      onDocsChanged?.();
    } finally {
      setUploadingFor(null);
    }
  }

  return (
    <div id={`step-${step.id}`} className="card" style={{ scrollMarginTop: "5rem", ...(done ? { opacity: 0.9 } : {}) }}>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <div className="stack" style={{ gap: "0.25rem" }}>
          <div className="row" style={{ gap: "0.4rem", flexWrap: "wrap" }}>
            {phaseLabel && <span className="badge badge-info">{phaseLabel}</span>}
            <strong>{step.title}</strong>
            {done ? (
              <span className="badge badge-ok">✓ {step.derived_done === 1 ? "Completed" : "Completed (my record)"}</span>
            ) : (
              <RequirementBadge requirement={step.requirement} />
            )}
          </div>
          {(jurisdiction || institution) && (
            <div className="row small muted" style={{ gap: "0.4rem", flexWrap: "wrap" }}>
              {institution && <span>🏛 {institution}</span>}
              {jurisdiction && <span className="badge">{jurisdiction}</span>}
            </div>
          )}
        </div>
        <button className="btn btn-ghost btn-small" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          {open ? t("hideDetails") : t("showDetails")}
        </button>
      </div>

      {step.derived_done === 1 && (
        <p className="small" style={{ color: "var(--ok)", margin: "0.4rem 0 0" }}>
          Based on your answers, this is already done. It stays here for reference and is not your next action.
        </p>
      )}

      <div className="row" style={{ marginTop: "0.5rem" }}>
        <label htmlFor={`status-${step.id}`} style={{ margin: 0 }}>
          {t("myProgress")}:
        </label>
        <select id={`status-${step.id}`} value={status} disabled={saving} onChange={(e) => updateStatus(e.target.value)} style={{ maxWidth: 280 }}>
          {STATUS_OPTIONS.map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <span className="small muted">{t("notOfficialStatus")}</span>
      </div>

      {/* 5-second compact card (heading + ≤2 bullets + chips). Same format for every asset. */}
      <CompactCard
        payload={step.payload}
        version={step.payload?.catalog_version ?? "v1"}
        lang={locale === "en" ? "en-IN" : `${locale}-IN`}
      />

      {open && (
        <>
          <hr className="hr" />
          <GuidanceCard result={step.payload} />

          {/* Documents for THIS step — checklist + inline upload (in the roadmap). */}
          {docs.length > 0 && (
            <>
              <hr className="hr" />
              <div className="small" style={{ fontWeight: 600, marginBottom: "0.4rem" }}>
                {t("docsForThisStep")}
              </div>
              <ul className="clean small">
                {docs.map((docName) => {
                  const up = uploadedFor(docName);
                  return (
                    <li key={docName} className="row" style={{ justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
                      <span>{up ? "✅" : "⬜"} {docName}</span>
                      <span className="row" style={{ gap: "0.3rem" }}>
                        {up ? (
                          <a className="btn btn-ghost btn-small" href={`/api/cases/${step.case_id}/documents/${up.id}/file`} target="_blank" rel="noreferrer">
                            {t("viewDoc")}
                          </a>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="btn btn-ghost btn-small"
                              disabled={uploadingFor === docName}
                              onClick={() => fileRefs.current[docName]?.click()}
                            >
                              {uploadingFor === docName ? t("uploading") : `⬆ ${t("uploadDoc")}`}
                            </button>
                            <input
                              ref={(el) => { fileRefs.current[docName] = el; }}
                              type="file"
                              accept="application/pdf,image/jpeg,image/png,image/webp,image/heic"
                              style={{ display: "none" }}
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) void uploadDoc(docName, f);
                                e.target.value = "";
                              }}
                            />
                          </>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <p className="small muted">🔒 {t("scanNote")}</p>
            </>
          )}

          {/* Submission tracking — the user's own record. */}
          <hr className="hr" />
          <details>
            <summary className="small" style={{ cursor: "pointer", fontWeight: 600 }}>{t("myTracking")}</summary>
            <div className="row" style={{ gap: "0.6rem", marginTop: "0.5rem" }}>
              <div style={{ flex: 1, minWidth: 150 }}>
                <label className="small">{t("submittedOn")}</label>
                <input type="date" value={track.submitted_at} onChange={(e) => setTrack({ ...track, submitted_at: e.target.value })} />
              </div>
              <div style={{ flex: 1, minWidth: 150 }}>
                <label className="small">{t("followUpDate")}</label>
                <input type="date" value={track.follow_up_date} onChange={(e) => setTrack({ ...track, follow_up_date: e.target.value })} />
              </div>
            </div>
            <label className="small">{t("officeWhere")}</label>
            <input value={track.office} onChange={(e) => setTrack({ ...track, office: e.target.value })} />
            <label className="small">{t("ackNumber")}</label>
            <input value={track.ack_number} onChange={(e) => setTrack({ ...track, ack_number: e.target.value })} />
            <label className="small">{t("notesLabel")}</label>
            <textarea rows={2} value={track.notes} onChange={(e) => setTrack({ ...track, notes: e.target.value })} />
            <div className="row" style={{ marginTop: "0.5rem" }}>
              <button className="btn btn-small" onClick={saveTracking} disabled={saving}>{t("save")}</button>
              {savedTick && <span className="small" style={{ color: "var(--ok)" }}>✓ {t("saved")}</span>}
            </div>
          </details>
        </>
      )}
    </div>
  );
}
