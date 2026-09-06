"use client";
// Renders the deep, source-backed detail for a researched procedure. It tolerates
// two shapes: the full structured schema (office/fees/timeline/outcome as objects,
// documents as {name,required,note}) AND a simpler branch shape (office/fees absent,
// documents/timeline/outcome as plain strings). Missing sections are skipped rather
// than crashing. All prose is translated through /api/translate. Unverified facts show
// an explicit "To be confirmed" chip — never fabricated.
import { useMemo } from "react";
import type { JSX } from "react";
import type { SourceRecord, FactRef } from "@/lib/guidance/types";
import { useTranslated } from "@/lib/i18n/translate-client";
import { buildStepDetail } from "@/lib/guidance/step-detail";

// Loose view of a detail object (data at rest may be full or simplified).
interface LooseDoc { name?: string; required?: string; note?: string }
interface LooseDetail {
  purpose?: string;
  applicability?: string;
  who_may_apply?: string;
  prerequisites?: string[];
  actions?: string[];
  online_channel?: { label: string; url: string; note?: string } | null;
  offline_channel?: string | null;
  form?: { name: string | null; note?: string } | string | null;
  documents?: (LooseDoc | string)[];
  documents_note?: string;
  office?: Record<string, unknown> | null;
  fees?: unknown[] | null;
  fees_note?: string;
  timeline?: { published?: string; notice_objection?: string; delay_help?: string } | string | null;
  outcome?: { result?: string; how_to_check?: string; unlocks?: string; correction_appeal?: string } | string | null;
  evidence?: ({ source_id?: string; page_section?: string } | string)[] | string | null;
  last_verified?: string | null;
  unresolved?: string[];
}

const isFact = (v: unknown): v is FactRef =>
  !!v && typeof v === "object" && "status" in (v as Record<string, unknown>);
const asDoc = (d: LooseDoc | string): LooseDoc => (typeof d === "string" ? { name: d, required: "typical" } : d);

export function ProcedureDetail({
  detail,
  sources,
  version,
}: {
  detail: unknown;
  sources: SourceRecord[];
  version: string;
}): JSX.Element {
  const d = useMemo(() => (detail ?? {}) as LooseDetail, [detail]);
  const srcMap = useMemo(() => new Map(sources.map((s) => [s.id, s])), [sources]);

  // The canonical 30-field structured panel (never one paragraph). Unknown values are
  // shown explicitly as "Not yet verified" with the authority that can confirm them.
  const stepFields = useMemo(
    () => buildStepDetail({ detail: d as Record<string, unknown>, sources: sources.map((s) => ({ id: s.id, title: s.title, publisher: s.publisher, url: s.url })) }),
    [d, sources],
  );

  const docs = useMemo(() => (d.documents ?? []).map(asDoc), [d.documents]);
  const office = useMemo(() => (d.office && typeof d.office === "object" ? (d.office as Record<string, unknown>) : null), [d.office]);
  const fees = useMemo(() => (Array.isArray(d.fees) ? (d.fees as Array<Record<string, unknown>>) : []), [d.fees]);
  const officeExamples = useMemo(() => (office && Array.isArray(office.examples) ? (office.examples as Array<Record<string, unknown>>) : []), [office]);
  const timelineObj = d.timeline && typeof d.timeline === "object" ? d.timeline : null;
  const timelineStr = typeof d.timeline === "string" ? d.timeline : null;
  const outcomeObj = d.outcome && typeof d.outcome === "object" ? d.outcome : null;
  const outcomeStr = typeof d.outcome === "string" ? d.outcome : null;
  const evidenceArr = Array.isArray(d.evidence) ? d.evidence : [];
  const evidenceStr = typeof d.evidence === "string" ? d.evidence : null;
  const formName = typeof d.form === "string" ? d.form : d.form?.name ?? null;
  const formNote = typeof d.form === "object" && d.form ? d.form.note : undefined;

  const fnotes = (v: unknown): string[] => (isFact(v) && v.note ? [v.note] : []);

  // Collect every translatable string for one batched call (all guarded).
  const strings = useMemo(() => {
    const s: (string | undefined)[] = [
      "Purpose & who can apply", "Exact steps", "Documents", "Where to go & whom to contact",
      "Fees", "Timeline", "Outcome", "Evidence & verification", "Still to be confirmed",
      "To be confirmed", "Apply online", "In person", "Form", "Responsible authority",
      "Who handles it", "Which office", "Grievance / appeal", "Required", "Conditional", "Typical",
      "Office address", "Officer", "Phone", "Email", "Public hours", "Verified example (one tehsil)",
      "Result", "How to check", "What it unlocks", "Corrections & appeal", "Last verified",
      "Notice / objection", "If it is delayed", "Not published",
      d.purpose, d.applicability, d.who_may_apply,
      ...(d.prerequisites ?? []), ...(d.actions ?? []),
      d.offline_channel ?? "", d.online_channel?.note ?? "", formNote ?? "",
      ...docs.map((x) => x.name ?? ""), ...docs.map((x) => x.note ?? ""), d.documents_note,
      timelineStr ?? "", timelineObj?.notice_objection, timelineObj?.delay_help,
      outcomeStr ?? "", outcomeObj?.result, outcomeObj?.how_to_check, outcomeObj?.unlocks, outcomeObj?.correction_appeal,
      ...(d.unresolved ?? []),
    ];
    if (office) {
      s.push(
        office.authority_chain as string, office.responsible as string, office.jurisdiction_rule as string,
        (office.grievance as string) ?? "",
        ...fnotes(office.address), ...fnotes(office.officer_name), ...fnotes(office.phone), ...fnotes(office.hours),
      );
      for (const ex of officeExamples) {
        s.push(ex.label as string, ...fnotes(ex.address), ...fnotes(ex.officer), ...fnotes(ex.phone), ...fnotes(ex.email), ...fnotes(ex.hours));
      }
    }
    for (const f of fees) s.push(f.label as string, (f.basis as string) ?? "", (f.note as string) ?? "");
    if (d.fees_note) s.push(d.fees_note);
    return s.filter(Boolean) as string[];
  }, [d, docs, office, officeExamples, fees, timelineObj, timelineStr, outcomeObj, outcomeStr, formNote]);

  const tr = useTranslated(strings, version);

  const factRow = (label: string, fact: unknown) =>
    isFact(fact) ? (
      <li>
        <strong>{tr(label)}:</strong>{" "}
        {fact.value && fact.status === "published" ? fact.value : <span className="badge badge-warn">{tr("To be confirmed")}</span>}
        {fact.note && <span className="small muted"> — {tr(fact.note)}</span>}
      </li>
    ) : null;

  const sectionStyle = { marginTop: "0.8rem" };

  return (
    <div className="stack" style={{ borderTop: "1px solid var(--border)", paddingTop: "0.6rem" }}>
      {/* Canonical 30-field structured panel. Each field is discrete; unknowns are
          explicit ("Not yet verified") with the authority that can confirm them. */}
      <details style={{ marginTop: "0.4rem" }}>
        <summary className="small"><strong>{tr("All 30 detail fields")}</strong></summary>
        <ol className="clean small" style={{ marginTop: "0.4rem" }}>
          {stepFields.map((f) => (
            <li key={f.key} style={{ marginBottom: "0.35rem" }}>
              <strong>{f.n}. {tr(f.label)}:</strong>{" "}
              {f.status === "verified" ? (
                <span>{f.value}</span>
              ) : (
                <span>
                  <span className="badge badge-warn">{tr(f.status === "to_be_confirmed" ? "To be confirmed" : "Not yet verified")}</span>
                  {f.value && <span> {f.value}</span>}
                  <span className="small muted">
                    {" "}— {tr("confirm with")} {tr(f.authority ?? "the responsible office")}
                    {f.last_checked ? ` · ${tr("last checked")} ${f.last_checked}` : ""}
                    {" · "}{f.rest_safe ? tr("the rest of the route is safe to follow") : tr("do not rely on this route until confirmed")}
                  </span>
                </span>
              )}
            </li>
          ))}
        </ol>
      </details>

      {/* Purpose */}
      {(d.purpose || d.applicability || d.who_may_apply || (d.prerequisites ?? []).length > 0) && (
        <div style={sectionStyle}>
          <h3 style={{ fontSize: "1rem" }}>{tr("Purpose & who can apply")}</h3>
          {d.purpose && <p className="small">{tr(d.purpose)}</p>}
          {d.applicability && <p className="small muted">{tr(d.applicability)}</p>}
          {d.who_may_apply && <p className="small">{tr(d.who_may_apply)}</p>}
          {(d.prerequisites ?? []).length > 0 && (
            <ul className="clean small">{d.prerequisites!.map((p, i) => <li key={i}>{tr(p)}</li>)}</ul>
          )}
        </div>
      )}

      {/* Steps */}
      {((d.actions ?? []).length > 0 || d.online_channel || d.offline_channel || formName) && (
        <div style={sectionStyle}>
          <h3 style={{ fontSize: "1rem" }}>{tr("Exact steps")}</h3>
          {(d.actions ?? []).length > 0 && <ol className="clean small">{d.actions!.map((a, i) => <li key={i}>{tr(a)}</li>)}</ol>}
          {d.online_channel && (
            <p className="small">
              <strong>{tr("Apply online")}:</strong>{" "}
              <a href={d.online_channel.url} target="_blank" rel="noreferrer">{d.online_channel.label}</a>
              {d.online_channel.note && <span className="muted"> — {tr(d.online_channel.note)}</span>}
            </p>
          )}
          {d.offline_channel && <p className="small"><strong>{tr("In person")}:</strong> {tr(d.offline_channel)}</p>}
          {formName && (
            <p className="small">
              <strong>{tr("Form")}:</strong> {formName}
              {formNote && <span className="muted"> — {tr(formNote)}</span>}
            </p>
          )}
        </div>
      )}

      {/* Documents */}
      {docs.length > 0 && (
        <div style={sectionStyle}>
          <h3 style={{ fontSize: "1rem" }}>{tr("Documents")}</h3>
          <ul className="clean small">
            {docs.map((doc, i) => (
              <li key={i}>
                {tr(doc.name ?? "")}{" "}
                <span className={`badge ${doc.required === "required" ? "badge-danger" : "badge-warn"}`}>
                  {tr(doc.required === "required" ? "Required" : doc.required === "conditional" ? "Conditional" : "Typical")}
                </span>
                {doc.note && <span className="muted"> — {tr(doc.note)}</span>}
              </li>
            ))}
          </ul>
          {d.documents_note && <p className="small muted">{tr(d.documents_note)}</p>}
        </div>
      )}

      {/* Office (only when present) */}
      {office && (
        <div style={sectionStyle}>
          <h3 style={{ fontSize: "1rem" }}>{tr("Where to go & whom to contact")}</h3>
          <ul className="clean small">
            {office.responsible ? <li><strong>{tr("Who handles it")}:</strong> {tr(office.responsible as string)}</li> : null}
            {office.authority_chain ? <li><strong>{tr("Responsible authority")}:</strong> {tr(office.authority_chain as string)}</li> : null}
            {office.jurisdiction_rule ? <li><strong>{tr("Which office")}:</strong> {tr(office.jurisdiction_rule as string)}</li> : null}
            {factRow("Office address", office.address)}
            {factRow("Officer", office.officer_name)}
            {factRow("Phone", office.phone)}
            {factRow("Public hours", office.hours)}
            {office.grievance ? <li><strong>{tr("Grievance / appeal")}:</strong> {tr(office.grievance as string)}</li> : null}
          </ul>
          {officeExamples.map((ex, i) => (
            <div key={i} className="notice notice-info small" style={{ marginTop: "0.5rem" }}>
              <strong>{tr("Verified example (one tehsil)")}: {tr((ex.label as string) ?? "")}</strong>
              <ul className="clean" style={{ marginTop: "0.3rem" }}>
                {factRow("Phone", ex.phone)}
                {factRow("Email", ex.email)}
                {factRow("Office address", ex.address)}
                {factRow("Officer", ex.officer)}
                {factRow("Public hours", ex.hours)}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Fees (only when present) */}
      {(fees.length > 0 || d.fees_note) && (
        <div style={sectionStyle}>
          <h3 style={{ fontSize: "1rem" }}>{tr("Fees")}</h3>
          {fees.length > 0 && (
            <ul className="clean small">
              {fees.map((f, i) => (
                <li key={i}>
                  <strong>{tr(f.label as string)}:</strong>{" "}
                  {f.amount && f.status === "published" ? (f.amount as string) : <span className="badge badge-warn">{tr("To be confirmed")}</span>}
                  {f.basis ? <span className="muted"> — {tr(f.basis as string)}</span> : null}
                  {f.note ? <div className="muted">{tr(f.note as string)}</div> : null}
                </li>
              ))}
            </ul>
          )}
          {d.fees_note && <p className="small muted">{tr(d.fees_note)}</p>}
        </div>
      )}

      {/* Timeline */}
      {(timelineObj || timelineStr) && (
        <div style={sectionStyle}>
          <h3 style={{ fontSize: "1rem" }}>{tr("Timeline")}</h3>
          {timelineStr ? (
            <p className="small">{tr(timelineStr)}</p>
          ) : (
            <ul className="clean small">
              <li>{timelineObj!.published ? timelineObj!.published : <span className="badge badge-warn">{tr("Not published")}</span>}</li>
              {timelineObj!.notice_objection && <li><strong>{tr("Notice / objection")}:</strong> {tr(timelineObj!.notice_objection)}</li>}
              {timelineObj!.delay_help && <li><strong>{tr("If it is delayed")}:</strong> {tr(timelineObj!.delay_help)}</li>}
            </ul>
          )}
        </div>
      )}

      {/* Outcome */}
      {(outcomeObj || outcomeStr) && (
        <div style={sectionStyle}>
          <h3 style={{ fontSize: "1rem" }}>{tr("Outcome")}</h3>
          {outcomeStr ? (
            <p className="small">{tr(outcomeStr)}</p>
          ) : (
            <ul className="clean small">
              {outcomeObj!.result && <li><strong>{tr("Result")}:</strong> {tr(outcomeObj!.result)}</li>}
              {outcomeObj!.how_to_check && <li><strong>{tr("How to check")}:</strong> {tr(outcomeObj!.how_to_check)}</li>}
              {outcomeObj!.unlocks && <li><strong>{tr("What it unlocks")}:</strong> {tr(outcomeObj!.unlocks)}</li>}
              {outcomeObj!.correction_appeal && <li><strong>{tr("Corrections & appeal")}:</strong> {tr(outcomeObj!.correction_appeal)}</li>}
            </ul>
          )}
        </div>
      )}

      {/* Evidence */}
      {(evidenceArr.length > 0 || evidenceStr) && (
        <div style={sectionStyle}>
          <h3 style={{ fontSize: "1rem" }}>{tr("Evidence & verification")}</h3>
          {evidenceStr ? (
            <p className="small muted">{evidenceStr}</p>
          ) : (
            <ul className="clean small muted">
              {evidenceArr.map((e, i) => {
                if (typeof e === "string") return <li key={i}>{e}</li>;
                const src = e.source_id ? srcMap.get(e.source_id) : undefined;
                return (
                  <li key={i}>
                    {src?.url ? <a href={src.url} target="_blank" rel="noreferrer">{src.title}</a> : e.source_id}
                    {src ? ` — ${src.publisher}` : ""}{e.page_section ? ` · ${e.page_section}` : ""}
                  </li>
                );
              })}
            </ul>
          )}
          {d.last_verified && <p className="small muted">{tr("Last verified")}: {d.last_verified}</p>}
        </div>
      )}

      {/* Unresolved */}
      {(d.unresolved ?? []).length > 0 && (
        <div className="notice" style={sectionStyle}>
          <strong>{tr("Still to be confirmed")}</strong>
          <ul className="clean small">{d.unresolved!.map((u, i) => <li key={i}>{tr(u)}</li>)}</ul>
        </div>
      )}
    </div>
  );
}
