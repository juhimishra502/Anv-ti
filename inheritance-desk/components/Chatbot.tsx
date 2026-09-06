"use client";
// Persistent, collapsible assistant. Streams the grounded /chat endpoint (NDJSON)
// and renders tokens live. When the server has no Groq credentials it shows the
// honest unavailable state returned by the API (it does NOT fake a reply).
import { useEffect, useRef, useState } from "react";
import type { AssetView } from "@/lib/client/types";
import { useLocale } from "@/lib/i18n/context";

interface Citation {
  title: string;
  publisher: string;
  url: string;
  checked_on: string | null;
}

interface Msg {
  role: "user" | "assistant";
  content: string;
  unavailable?: boolean;
  streaming?: boolean;
  citations?: Citation[];
}

type StreamEvent =
  | { type: "meta"; citations: Citation[]; grounding_status: string }
  | { type: "delta"; text: string }
  | { type: "done" }
  | { type: "unavailable"; reason: string; citations: Citation[] }
  | { type: "error"; reason: string; citations: Citation[] };

export function Chatbot({ caseId, assets }: { caseId: string; assets: AssetView[] }) {
  const { t, locale } = useLocale();
  const [open, setOpen] = useState(false);
  const [assetId, setAssetId] = useState("");
  const [question, setQuestion] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const ctrlRef = useRef<AbortController | null>(null);

  // Changing language aborts any in-flight answer so a previous-language response
  // cannot arrive after the switch.
  useEffect(() => {
    ctrlRef.current?.abort();
  }, [locale]);

  function patchLast(patch: (m: Msg) => Msg) {
    setMsgs((all) => all.map((m, i) => (i === all.length - 1 ? patch(m) : m)));
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q || busy) return;
    const history = msgs
      .filter((m) => !m.unavailable && m.content)
      .map((m) => ({ role: m.role, content: m.content }));
    setQuestion("");
    setBusy(true);
    // Add the user message and an empty assistant placeholder to stream into.
    setMsgs((m) => [...m, { role: "user", content: q }, { role: "assistant", content: "", streaming: true }]);

    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    try {
      const res = await fetch(`/api/cases/${caseId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, assetId: assetId || undefined, history, locale }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        const txt = await res.text().catch(() => "");
        let reason = `Request failed (${res.status}).`;
        try {
          reason = JSON.parse(txt).error || reason;
        } catch {
          /* keep default */
        }
        patchLast((m) => ({ ...m, content: reason, unavailable: true, streaming: false }));
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf("\n")) >= 0) {
          const raw = buffer.slice(0, nl).trim();
          buffer = buffer.slice(nl + 1);
          if (!raw) continue;
          let ev: StreamEvent;
          try {
            ev = JSON.parse(raw) as StreamEvent;
          } catch {
            continue;
          }
          handleEvent(ev);
        }
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return; // language changed
      patchLast((m) => ({
        ...m,
        content: err instanceof Error ? err.message : "Connection error.",
        unavailable: true,
        streaming: false,
      }));
    } finally {
      patchLast((m) => (m.streaming ? { ...m, streaming: false } : m));
      setBusy(false);
    }
  }

  function handleEvent(ev: StreamEvent) {
    if (ev.type === "meta") {
      patchLast((m) => ({ ...m, citations: ev.citations }));
    } else if (ev.type === "delta") {
      patchLast((m) => ({ ...m, content: m.content + ev.text }));
    } else if (ev.type === "done") {
      patchLast((m) => ({ ...m, streaming: false }));
    } else if (ev.type === "unavailable" || ev.type === "error") {
      patchLast((m) => ({ ...m, content: ev.reason, unavailable: true, streaming: false, citations: ev.citations }));
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        right: "1rem",
        bottom: "1rem",
        width: open ? "min(420px, 92vw)" : "auto",
        zIndex: 50,
      }}
    >
      {!open && (
        <button className="btn" onClick={() => setOpen(true)} aria-expanded={false}>
          💬 {t("askAssistant")}
        </button>
      )}
      {open && (
        <div className="card" style={{ marginBottom: 0, boxShadow: "0 10px 30px rgba(0,0,0,0.25)" }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <strong>{t("assistantTitle")}</strong>
            <button className="btn btn-ghost btn-small" onClick={() => setOpen(false)} aria-label="Close assistant">
              ✕
            </button>
          </div>
          <p className="small muted">{t("assistantIntro")}</p>

          {assets.length > 0 && (
            <div>
              <label htmlFor="chat-asset" className="small">
                {t("aboutWhichAsset")}
              </label>
              <select id="chat-asset" value={assetId} onChange={(e) => setAssetId(e.target.value)}>
                <option value="">{t("generalCase")}</option>
                {assets.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label || a.asset_type.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div ref={scrollRef} style={{ maxHeight: 300, overflowY: "auto", margin: "0.75rem 0" }} aria-live="polite">
            {msgs.length === 0 && <p className="small muted">{t("askToBegin")}</p>}
            {msgs.map((m, i) => (
              <div key={i} style={{ marginBottom: "0.6rem" }}>
                <div className="small" style={{ fontWeight: 700 }}>
                  {m.role === "user" ? t("you") : t("assistant")}
                </div>
                <div
                  className={m.unavailable ? "notice notice-danger small" : "small"}
                  style={{ whiteSpace: "pre-wrap" }}
                >
                  {m.content || (m.streaming ? "…" : "")}
                </div>
                {m.citations && m.citations.length > 0 && (
                  <ul className="clean small muted">
                    {m.citations.map((c, j) => (
                      <li key={j}>
                        <a href={c.url} target="_blank" rel="noreferrer">
                          {c.title}
                        </a>{" "}
                        — {c.publisher}
                        {c.checked_on ? ` · checked ${c.checked_on}` : ""}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          <form onSubmit={send} className="stack">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. What is my first step for a bank account?"
              rows={2}
            />
            <button className="btn" type="submit" disabled={busy}>
              {busy ? t("thinking") : t("send")}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
