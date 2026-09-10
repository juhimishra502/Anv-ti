"use client";
import { useMemo } from "react";
import type { JSX } from "react";
import type { GuidanceResult } from "@/lib/guidance/types";
import { StatusBadge, ExecutionBadge } from "./badges";
import { ReadAloud } from "./ReadAloud";
import { ProcedureDetail } from "./ProcedureDetail";
import { useLocale } from "@/lib/i18n/context";
import { useTranslated } from "@/lib/i18n/translate-client";

export function GuidanceCard({ result }: { result: GuidanceResult | null }): JSX.Element {
  const { t, locale } = useLocale();

  // Collect all dynamic strings for one batched translation call (cached server-side).
  const strings = useMemo(() => {
    if (!result) return [];
    const out: string[] = [];
    if (result.next_action) out.push(result.next_action);
    if (result.explanation) out.push(result.explanation);
    for (const q of result.questions ?? []) out.push(q.question);
    for (const p of result.procedures ?? []) {
      out.push(p.summary, p.limits, p.requirement_for_execution, ...p.steps, ...p.document_examples);
    }
    for (const w of result.warnings ?? []) out.push(w);
    return out;
  }, [result]);

  const version = result?.catalog_version ?? "v1";
  const tr = useTranslated(strings, version);

  if (!result) return <p className="muted small">No guidance payload available.</p>;

  const readable = [
    result.next_action ? `${t("yourNextStep")}: ${tr(result.next_action)}` : "",
    ...(result.procedures ?? []).map((p) => `${p.title}. ${tr(p.summary)}`),
  ]
    .filter(Boolean)
    .join(". ");

  return (
    <div className="stack guidance-stack">
      <div className="row">
        <StatusBadge status={result.status} />
        <ExecutionBadge />
        {result.jurisdiction_state && <span className="badge">{result.jurisdiction_state}</span>}
        <ReadAloud text={readable || "—"} label={t("readScreenAloud")} lang={locale === "en" ? "en-IN" : `${locale}-IN`} />
      </div>

      {result.next_action && (
        <div className="notice notice-info">
          <strong>{t("yourNextStep")}:</strong> {tr(result.next_action)}
        </div>
      )}

      {(result.questions ?? []).length > 0 && (
        <div>
          <strong>{t("confirmToRefine")}</strong>
          <ul className="clean">
            {result.questions!.map((q) => (
              <li key={q.field}>{tr(q.question)}</li>
            ))}
          </ul>
        </div>
      )}

      {(result.procedures ?? []).map((p) => (
        <div key={p.id} className="card" style={{ marginBottom: "0.6rem" }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <strong>{p.title}</strong>
            <StatusBadge status={p.status} />
          </div>
          <p className="small">{tr(p.summary)}</p>

          {p.steps.length > 0 && (
            <>
              <div className="small" style={{ fontWeight: 600 }}>
                {t("whatToDo")}
              </div>
              <ul className="clean">
                {p.steps.map((s, i) => (
                  <li key={i}>{tr(s)}</li>
                ))}
              </ul>
            </>
          )}

          {p.document_examples.length > 0 && (
            <p className="small">
              <strong>{t("exampleDocs")}</strong> {p.document_examples.map((d) => tr(d)).join("; ")}
            </p>
          )}

          {p.published_processing_time && (
            <p className="small">
              <strong>{p.published_processing_time.value} {p.published_processing_time.unit}</strong>.{" "}
              <span className="muted">{tr(p.published_processing_time.condition)}</span>
            </p>
          )}

          <p className="small" style={{ color: "var(--warn)" }}>
            <strong>{t("limits")}</strong> {tr(p.limits)}
          </p>
          <p className="small muted">{tr(p.requirement_for_execution)}</p>

          {/* Deep, source-backed detail when a procedure has been fully researched. */}
          {p.detail && <ProcedureDetail detail={p.detail} sources={p.sources ?? []} version={version} />}

          {(p.sources ?? []).length > 0 && (
            <div className="small muted">
              <strong>{t("officialSources")}</strong>
              <ul className="clean">
                {p.sources.map((src) => (
                  <li key={src.id}>
                    {src.url ? (
                      <a href={src.url} target="_blank" rel="noreferrer">
                        {src.title}
                      </a>
                    ) : (
                      src.title
                    )}{" "}
                    — {src.publisher}
                    {src.research_checked_on ? ` · ${src.research_checked_on}` : ""}
                    {src.snapshot_status !== "downloaded" ? ` · ${src.snapshot_status}` : ""}
                  </li>
                ))}
              </ul>
              <span>
                {p.last_source_reviewed} → {p.review_due}
              </span>
            </div>
          )}
        </div>
      ))}

      {result.directory && (
        <div className="notice">
          {result.directory.portal_url ? (
            <a href={result.directory.portal_url} target="_blank" rel="noreferrer">
              {result.directory.state}
            </a>
          ) : (
            <span>
              {result.directory.state}
              {result.directory.fallback_url && (
                <>
                  {" — "}
                  <a href={result.directory.fallback_url} target="_blank" rel="noreferrer">
                    directory
                  </a>
                </>
              )}
            </span>
          )}
          <div className="small muted">{tr(result.directory.note)}</div>
        </div>
      )}

      {(result.warnings ?? []).map((w, i) => (
        <p key={i} className="small" style={{ color: "var(--warn)" }}>
          ⚠ {tr(w)}
        </p>
      ))}
    </div>
  );
}
