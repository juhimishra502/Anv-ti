"use client";
// Private document vault for a case: upload (camera/file), view (owner-only stream),
// delete (two-step confirm), and a checklist of documents the case may need. Files
// never appear at a public URL — viewing goes through the ownership-checked API.
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale } from "@/lib/i18n/context";

interface Doc {
  id: string;
  label: string | null;
  original_name: string | null;
  mime: string;
  size: number;
  scan_status: string;
  created_at: string;
}

function sizeKb(n: number) {
  return n < 1024 * 1024 ? `${Math.round(n / 1024)} KB` : `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentVault({ caseId, suggestedDocs }: { caseId: string; suggestedDocs: string[] }) {
  const { t } = useLocale();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/cases/${caseId}/documents`);
      if (r.ok) setDocs((await r.json()).documents ?? []);
    } catch {
      /* ignore */
    }
  }, [caseId]);

  useEffect(() => {
    let alive = true;
    fetch(`/api/cases/${caseId}/documents`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (alive && d) setDocs(d.documents ?? []);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [caseId]);

  async function upload(file: File) {
    setBusy(true);
    setErr(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (label.trim()) fd.append("label", label.trim());
      const r = await fetch(`/api/cases/${caseId}/documents`, { method: "POST", body: fd });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setErr(data.error || "Upload failed.");
      } else {
        setDocs(data.documents ?? []);
        setLabel("");
        if (fileRef.current) fileRef.current.value = "";
      }
    } catch {
      setErr("Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    try {
      await fetch(`/api/cases/${caseId}/documents/${id}`, { method: "DELETE" });
      setConfirmId(null);
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <h2>{t("documentsTitle")}</h2>
      <p className="small muted">{t("docVaultIntro")}</p>

      {suggestedDocs.length > 0 && (
        <details style={{ margin: "0.5rem 0" }}>
          <summary className="small" style={{ cursor: "pointer", fontWeight: 600 }}>
            {t("docChecklist")}
          </summary>
          <ul className="clean small muted" style={{ marginTop: "0.4rem" }}>
            {suggestedDocs.map((d, i) => (
              <li key={i}>
                <button
                  type="button"
                  className="btn btn-ghost btn-small"
                  style={{ padding: "0.1rem 0.3rem" }}
                  onClick={() => setLabel(d)}
                  title="Use as the label for your next upload"
                >
                  + {d}
                </button>
              </li>
            ))}
          </ul>
          <p className="small muted">{t("reuseNote")}</p>
        </details>
      )}

      {/* Upload */}
      <div className="stack" style={{ marginTop: "0.5rem" }}>
        <label htmlFor="doc-label">{t("labelDoc")}</label>
        <input
          id="doc-label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Death certificate"
          list="doc-suggestions"
        />
        {suggestedDocs.length > 0 && (
          <datalist id="doc-suggestions">
            {suggestedDocs.map((d, i) => (
              <option key={i} value={d} />
            ))}
          </datalist>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf,image/jpeg,image/png,image/webp,image/heic"
          capture="environment"
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void upload(f);
          }}
        />
        {busy && <p className="small muted">{t("uploading")}</p>}
        {err && <div className="notice notice-danger small">{err}</div>}
      </div>

      {/* List */}
      <hr className="hr" />
      {docs.length === 0 ? (
        <p className="muted small">{t("noDocs")}</p>
      ) : (
        <ul className="clean">
          {docs.map((d) => (
            <li key={d.id} className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
              <span className="small">
                <strong>{d.label || d.original_name || "document"}</strong>{" "}
                <span className="muted">· {sizeKb(d.size)}</span>
              </span>
              <span className="row" style={{ gap: "0.3rem" }}>
                <a
                  className="btn btn-ghost btn-small"
                  href={`/api/cases/${caseId}/documents/${d.id}/file`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {t("viewDoc")}
                </a>
                {confirmId === d.id ? (
                  <button className="btn btn-small" style={{ background: "var(--danger)", borderColor: "var(--danger)" }} onClick={() => remove(d.id)} disabled={busy}>
                    {t("confirmDelete")}
                  </button>
                ) : (
                  <button className="btn btn-ghost btn-small" onClick={() => setConfirmId(d.id)}>
                    {t("deleteDoc")}
                  </button>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="small muted" style={{ marginTop: "0.5rem" }}>🔒 {t("scanNote")}</p>
    </div>
  );
}
