"use client";
// Asset wizard. For a chosen asset type it renders that type's sub-questionnaire
// (lib/assets/schema.ts), collects a database-selected institution and a dependent
// state -> district -> subdistrict location, and lets the user Save draft, Add,
// go Back, and (via the caller's list) edit or remove assets before the roadmap.
import { useCallback, useEffect, useState } from "react";
import type { CaseView, ReferenceData } from "@/lib/client/types";
import { api } from "@/lib/client/api";
import { useLocale } from "@/lib/i18n/context";
import { InstitutionSelector } from "./InstitutionSelector";
import { assetSchema, type AField } from "@/lib/assets/schema";
import { serviceMeta } from "@/lib/guidance/services";

type Answers = Record<string, string | null | undefined>;

const draftKey = (caseId: string) => `asset-draft:${caseId}`;

// Dependent jurisdiction select: fetches children of `parentCode` at `level`. Option
// value is the jurisdiction CODE; it reports back both the code (to drive the child
// level) and the display name (stored for the grounded engine, which matches names).
function JurisdictionSelect({
  parentCode, level, valueCode, onPick, label,
}: {
  parentCode: string | undefined;
  level: "district" | "subdistrict";
  valueCode: string;
  onPick: (code: string, name: string) => void;
  label: string;
}) {
  const [items, setItems] = useState<{ code: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const load = useCallback(async () => {
    if (!parentCode) { setItems([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/jurisdictions?parent=${encodeURIComponent(parentCode)}&level=${level}`);
      const data = await res.json();
      setItems(data.items ?? []);
    } catch { setItems([]); } finally { setLoading(false); }
  }, [parentCode, level]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);
  return (
    <div>
      <label>{label}</label>
      <select value={valueCode} disabled={!parentCode || loading} onChange={(e) => {
        const it = items.find((i) => i.code === e.target.value);
        onPick(e.target.value, it?.name ?? "");
      }}>
        <option value="">{loading ? "…" : "Select…"}</option>
        {items.map((i) => <option key={i.code} value={i.code}>{i.name}</option>)}
      </select>
      {parentCode && !loading && items.length === 0 && <p className="small muted">Not yet imported for this parent.</p>}
    </div>
  );
}

export function AddAssetForm({
  caseId, reference, onUpdated,
}: {
  caseId: string;
  reference: ReferenceData;
  onUpdated: (view: CaseView) => void;
}) {
  const { t } = useLocale();
  const [assetType, setAssetType] = useState("");
  const [label, setLabel] = useState("");
  const [answers, setAnswers] = useState<Answers>({});
  // Codes tracked for the dependent location chain (names go into answers for the engine).
  const [stateCode, setStateCode] = useState("");
  const [districtCode, setDistrictCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [savedDraft, setSavedDraft] = useState(false);

  const service = reference.asset_types.find((a) => a.id === assetType)?.service;
  const intakeKey = service ? serviceMeta(service).intakeKey : null;
  const fields = assetSchema(intakeKey);
  const visibleFields = fields.filter((f) => !f.showIf || f.showIf(answers));

  // Restore a saved draft (per-viewer convenience).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey(caseId));
      if (raw) {
        const d = JSON.parse(raw);
        if (d.assetType) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setAssetType(d.assetType); setLabel(d.label ?? ""); setAnswers(d.answers ?? {});
        }
      }
    } catch { /* ignore unavailable storage */ }
  }, [caseId]);

  function reset() {
    setAssetType(""); setLabel(""); setAnswers({}); setStateCode(""); setDistrictCode("");
    try { localStorage.removeItem(draftKey(caseId)); } catch { /* ignore */ }
  }

  function setAnswer(id: string, v: string | null) {
    setAnswers((a) => ({ ...a, [id]: v }));
    setSavedDraft(false);
  }

  function saveDraft() {
    try {
      localStorage.setItem(draftKey(caseId), JSON.stringify({ assetType, label, answers }));
      setSavedDraft(true);
    } catch { setErr("Could not save the draft in this browser."); }
  }

  // Build the API payload from the field targets.
  function buildPayload() {
    const payload: Record<string, unknown> = { asset_type: assetType, label: label || undefined };
    const location: Record<string, string> = {};
    const details: Record<string, string> = {};
    for (const f of fields) {
      const v = answers[f.id];
      if (v == null || v === "") continue;
      const target = f.target ?? "";
      if (target.startsWith("col:")) payload[target.slice(4)] = v;
      else if (target.startsWith("loc:")) location[target.slice(4)] = v;
      else if (target === "inst") { payload.institution_id = v; payload.institution = answers[`${f.id}__name`] ?? v; }
      else details[f.id] = v;
    }
    if (stateCode) location.state_code = stateCode;
    if (Object.keys(location).length) payload.location = location;
    if (Object.keys(details).length) payload.details_json = JSON.stringify(details);
    return payload;
  }

  async function submit() {
    if (!assetType) { setErr("Choose an asset type."); return; }
    setBusy(true); setErr(null);
    try {
      const view = await api.post<CaseView>(`/api/cases/${caseId}/assets`, buildPayload());
      onUpdated(view);
      reset();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not save the asset.");
    } finally {
      setBusy(false);
    }
  }

  function renderField(f: AField) {
    const v = (answers[f.id] ?? "") as string;
    if (f.type === "institution") {
      return (
        <InstitutionSelector
          key={f.id}
          category={f.institutionCategory!}
          caseId={caseId}
          value={v}
          label={f.label}
          onChange={(id, name) => { setAnswer(f.id, id); setAnswers((a) => ({ ...a, [`${f.id}__name`]: name })); }}
        />
      );
    }
    if (f.type === "state") {
      return (
        <div key={f.id}>
          <label>{f.label}</label>
          <select value={stateCode} onChange={(e) => { setStateCode(e.target.value); setDistrictCode(""); setAnswer(f.id, reference.states.find((s) => s.code === e.target.value)?.name ?? null); }}>
            <option value="">Select…</option>
            {reference.states.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
          </select>
        </div>
      );
    }
    if (f.type === "district") {
      return <JurisdictionSelect key={f.id} parentCode={stateCode || undefined} level="district" valueCode={districtCode}
        label={f.label} onPick={(code, name) => { setDistrictCode(code); setAnswer(f.id, name || null); }} />;
    }
    if (f.type === "subdistrict") {
      return <JurisdictionSelect key={f.id} parentCode={districtCode || undefined} level="subdistrict" valueCode={(answers[`${f.id}__code`] ?? "") as string}
        label={f.label} onPick={(code, name) => { setAnswers((a) => ({ ...a, [`${f.id}__code`]: code, [f.id]: name || null })); }} />;
    }
    if (f.type === "yesno" || f.type === "choice" || f.type === "value_band") {
      return (
        <div key={f.id}>
          <label htmlFor={f.id}>{f.label}</label>
          {f.help && <p className="small muted">{f.help}</p>}
          <select id={f.id} value={v} onChange={(e) => setAnswer(f.id, e.target.value || null)}>
            <option value="">Select…</option>
            {f.choices!.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
      );
    }
    return (
      <div key={f.id}>
        <label htmlFor={f.id}>{f.label}</label>
        {f.help && <p className="small muted">{f.help}</p>}
        <input id={f.id} type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"} value={v} onChange={(e) => setAnswer(f.id, e.target.value || null)} />
      </div>
    );
  }

  return (
    <form className="stack" onSubmit={(e) => { e.preventDefault(); void submit(); }}>
      {err && <div className="notice notice-danger small">{err}</div>}

      <div>
        <label htmlFor="assetType">{t("assetType")}</label>
        <select id="assetType" value={assetType} onChange={(e) => { setAssetType(e.target.value); setAnswers({}); setStateCode(""); setDistrictCode(""); }}>
          <option value="">{t("assetTypeSelect")}</option>
          {reference.asset_types.map((a) => (
            <option key={a.id} value={a.id}>{a.id.replace(/_/g, " ")}</option>
          ))}
        </select>
        {service && <p className="small muted">Route: {serviceMeta(service).label}</p>}
      </div>

      {assetType && (
        <>
          <div>
            <label htmlFor="label">{t("shortLabel")}</label>
            <input id="label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. SBI savings account" />
          </div>
          {visibleFields.map(renderField)}

          <div className="row" style={{ gap: "0.5rem", flexWrap: "wrap" }}>
            <button type="button" className="btn btn-ghost" onClick={reset} disabled={busy}>← {t("back")}</button>
            <button type="button" className="btn btn-secondary" onClick={saveDraft} disabled={busy}>
              {savedDraft ? "Draft saved" : "Save draft"}
            </button>
            <button type="submit" className="btn" disabled={busy}>
              {busy ? "…" : t("addToEstate")}
            </button>
          </div>
        </>
      )}
    </form>
  );
}
