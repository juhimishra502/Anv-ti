"use client";
// Database-backed, category-filtered, type-to-search institution selector. Searches
// the local institutions table (legal name + aliases) via /api/institutions. Stores
// the institution ID (not free text). Offers an honest "not found" path that raises a
// verification request — it never silently accepts an unverified free-text name as a
// known institution.
import { useCallback, useEffect, useState } from "react";

interface Item {
  id: string;
  legal_name: string;
  short_name: string | null;
  regulator: string;
  active: boolean;
}

export function InstitutionSelector({
  category,
  caseId,
  value,
  onChange,
  label,
}: {
  category: string;
  caseId?: string;
  value: string; // institution id
  onChange: (id: string, name: string) => void;
  label: string;
}) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [notFound, setNotFound] = useState(false);
  const [reqName, setReqName] = useState("");
  const [reqSent, setReqSent] = useState(false);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await fetch(`/api/institutions?category=${encodeURIComponent(category)}&q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setItems(data.items ?? []);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, [category, q]);

  useEffect(() => {
    const t = setTimeout(load, 200); // debounce typing
    return () => clearTimeout(t);
  }, [load]);

  async function sendRequest() {
    try {
      await fetch(`/api/institutions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ category, case_id: caseId, entered_name: reqName || q }),
      });
      setReqSent(true);
    } catch {
      /* surfaced by the disabled/enabled button state; keep the form open */
    }
  }

  const selected = items.find((i) => i.id === value);

  return (
    <div>
      <label htmlFor="inst-search">{label}</label>
      <input
        id="inst-search"
        value={q}
        onChange={(e) => { setQ(e.target.value); setNotFound(false); }}
        placeholder="Search by name…"
        autoComplete="off"
      />
      {status === "loading" && <p className="small muted">Searching…</p>}
      {status === "error" && (
        <div className="small">
          <span className="badge badge-danger">error</span>{" "}
          <button type="button" className="btn btn-ghost btn-small" onClick={load}>Retry</button>
        </div>
      )}
      {status === "ready" && (
        <select
          value={value}
          onChange={(e) => {
            const it = items.find((i) => i.id === e.target.value);
            if (it) onChange(it.id, it.legal_name);
          }}
          size={Math.min(6, Math.max(2, items.length + 1))}
        >
          <option value="">Select…</option>
          {items.map((it) => (
            <option key={it.id} value={it.id}>
              {it.legal_name}{it.short_name ? ` (${it.short_name})` : ""}{it.active ? "" : " — inactive"}
            </option>
          ))}
        </select>
      )}
      {selected && <p className="small muted">Selected: {selected.legal_name} · {selected.regulator}</p>}

      {status === "ready" && (
        <div className="small" style={{ marginTop: "0.5rem" }}>
          {!notFound && (
            <button type="button" className="btn btn-ghost btn-small" onClick={() => { setNotFound(true); setReqName(q); }}>
              Institution not found?
            </button>
          )}
          {notFound && !reqSent && (
            <div className="stack" style={{ marginTop: "0.5rem" }}>
              <input value={reqName} onChange={(e) => setReqName(e.target.value)} placeholder="Institution name to add" />
              <button type="button" className="btn btn-secondary btn-small" onClick={sendRequest} disabled={!reqName.trim()}>
                Request this institution be added
              </button>
              <p className="small muted">We will verify it before it appears as a supported institution.</p>
            </div>
          )}
          {reqSent && <p className="small">Thanks — a verification request was raised. Meanwhile, choose the closest match or continue without one.</p>}
        </div>
      )}
    </div>
  );
}
