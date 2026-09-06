"use client";
// Voice assistant available throughout the journey (before and after login).
//
// - Before login (mode="general"): reads the current screen's purpose aloud and gives
//   GENERAL help only. It never asks for or accepts Aadhaar/OTP or case data.
// - After login (mode="case"): answers grounded questions via the streaming Groq
//   chat endpoint, then speaks the answer in the selected language.
//
// Speech uses the browser Web Speech API, feature-detected per language. If a
// language isn't supported for recognition/playback, we say so and fall back to text.
// Recognition is always stopped before the assistant speaks, so it never records its
// own output. Raw audio is not stored.
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale } from "@/lib/i18n/context";
import {
  useSpeechRecognition,
  useSpeechSynthesis,
  useVoiceSupport,
} from "@/lib/voice/speech";

const CONSENT_KEY = "id_mic_consent";

type Mode = "general" | "case";

export function VoiceAssistant({
  mode,
  screenHelp,
  caseId,
  currentAsset,
  open: controlledOpen,
  onOpenChange,
  hideTrigger = false,
}: {
  mode: Mode;
  screenHelp: string;
  caseId?: string;
  currentAsset?: string;
  /** Controlled open state (e.g. opened by an external orb). */
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
  /** Hide the built-in floating orb trigger when an external trigger is used. */
  hideTrigger?: boolean;
}) {
  const { t, info, locale } = useLocale();
  const support = useVoiceSupport(info.speechTag);
  const rec = useSpeechRecognition(info.speechTag);
  const tts = useSpeechSynthesis();

  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = (o: boolean) => {
    setInternalOpen(o);
    onOpenChange?.(o);
  };
  const [consented, setConsented] = useState<boolean>(() => {
    try {
      return localStorage.getItem(CONSENT_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [transcript, setTranscript] = useState("");
  const [answer, setAnswer] = useState("");
  const [phase, setPhase] = useState<"idle" | "listening" | "processing" | "speaking">("idle");
  const [rate, setRate] = useState(1);
  const [voiceNote, setVoiceNote] = useState<string | null>(null);
  const lastAnswerRef = useRef("");

  // Changing language cancels any queued/ongoing speech and recognition so we never
  // continue speaking the previous language.
  useEffect(() => {
    tts.stop();
    rec.stop();
    // Resetting the indicator is the intended sync when the language changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPhase("idle");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  function grantConsent() {
    try {
      localStorage.setItem(CONSENT_KEY, "1");
    } catch {
      /* ignore */
    }
    setConsented(true);
  }

  const speak = useCallback(
    (text: string) => {
      rec.stop(); // never record our own output
      lastAnswerRef.current = text;
      setAnswer(text);
      setVoiceNote(null);
      if (tts.supported && support.synthesis) {
        setPhase("speaking");
        const ok = tts.speak(text, { lang: info.speechTag, rate });
        if (!ok) {
          // No voice for this language — show text instead of speaking English.
          setVoiceNote(t("voiceUnsupported"));
          setPhase("idle");
        }
        // phase resets via tts.speaking flag; approximate with a fallback timer-free reset
        const check = setInterval(() => {
          if (!tts.speaking) {
            setPhase("idle");
            clearInterval(check);
          }
        }, 400);
      } else {
        setPhase("idle");
      }
    },
    [rec, tts, support.synthesis, info.speechTag, rate, t],
  );

  async function askCase(question: string) {
    if (!caseId) return;
    setPhase("processing");
    try {
      const res = await fetch(`/api/cases/${caseId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, assetId: currentAsset || undefined, locale }),
      });
      if (!res.ok || !res.body) {
        speak("I could not reach the assistant. Please try again, or read the guidance on screen.");
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let text = "";
      let unavailable = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf("\n")) >= 0) {
          const raw = buffer.slice(0, nl).trim();
          buffer = buffer.slice(nl + 1);
          if (!raw) continue;
          try {
            const ev = JSON.parse(raw);
            if (ev.type === "delta") text += ev.text;
            else if (ev.type === "unavailable" || ev.type === "error") unavailable = ev.reason;
          } catch {
            /* ignore partial */
          }
        }
      }
      speak(text || unavailable || "No grounded answer was available.");
    } catch {
      speak("Something went wrong reaching the assistant.");
    }
  }

  function handleFinal(text: string) {
    setTranscript(text);
    setPhase("idle");
    // We show the transcript for review/edit; the user confirms with "Ask".
  }

  function startListening() {
    if (!consented) return;
    setTranscript("");
    setAnswer("");
    tts.stop();
    setPhase("listening");
    rec.start(handleFinal, (interim) => setTranscript(interim));
  }
  function stopListening() {
    rec.stop();
    if (phase === "listening") setPhase("idle");
  }

  function submit() {
    const q = transcript.trim();
    if (!q) return;
    if (mode === "case") {
      askCase(q);
    } else {
      // Pre-login: general help only. No case data, no Groq case context.
      speak(
        `${t("importantNotice")} — To get step-by-step help for a specific case, please sign in first.`,
      );
    }
  }

  const busy = phase === "processing";

  return (
    <div style={{ position: "fixed", left: "1rem", bottom: "1rem", width: open ? "min(380px, 92vw)" : "auto", zIndex: 50 }}>
      {!open && !hideTrigger && (
        <button
          className={`orb${phase === "listening" ? " listening" : ""}`}
          onClick={() => setOpen(true)}
          aria-expanded={false}
          aria-label={t("talkToAssistant")}
          title={t("talkToAssistant")}
        >
          🎙
        </button>
      )}
      {open && (
        <div className="card" style={{ marginBottom: 0, boxShadow: "0 10px 30px rgba(0,0,0,0.25)" }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <strong>🎙 {t("talkToAssistant")}</strong>
            <button className="btn btn-ghost btn-small" onClick={() => { tts.stop(); rec.stop(); setOpen(false); }} aria-label="Close">
              ✕
            </button>
          </div>

          {/* Read the screen aloud — works with TTS only, no mic needed */}
          <div className="row" style={{ marginTop: "0.4rem" }}>
            <button
              className="btn btn-secondary btn-small"
              onClick={() => speak(screenHelp)}
              disabled={!support.synthesis}
            >
              🔊 {t("readScreenAloud")}
            </button>
            {(tts.speaking || phase === "speaking") && (
              <button className="btn btn-ghost btn-small" onClick={() => { tts.stop(); setPhase("idle"); }}>
                ⏹ {t("stop")}
              </button>
            )}
          </div>

          {!support.synthesis && !support.recognition && (
            <p className="notice notice-danger small" style={{ marginTop: "0.5rem" }}>
              {t("voiceUnsupported")}
            </p>
          )}
          {voiceNote && (
            <p className="notice notice-info small" style={{ marginTop: "0.5rem" }}>
              🔇 {voiceNote}
            </p>
          )}

          {/* Mic consent gate */}
          {!consented ? (
            <div className="notice notice-info small" style={{ marginTop: "0.6rem" }}>
              <strong>{t("micConsentTitle")}</strong>
              <p style={{ margin: "0.4rem 0" }}>{t("micConsentBody")}</p>
              <button className="btn btn-small" onClick={grantConsent} disabled={!support.recognition}>
                {t("allowMic")}
              </button>
              {!support.recognition && (
                <p className="muted" style={{ marginTop: "0.4rem" }}>{t("voiceUnsupported")}</p>
              )}
            </div>
          ) : (
            <>
              <div className="row" style={{ marginTop: "0.6rem" }}>
                <button
                  className="btn"
                  onClick={() => (phase === "listening" ? stopListening() : startListening())}
                  aria-pressed={phase === "listening"}
                  disabled={!support.recognition || busy}
                  style={{ flex: 1 }}
                >
                  {phase === "listening" ? `🔴 ${t("listening")} — ${t("stop")}` : `🎙 ${t("talkToAssistant")}`}
                </button>
              </div>
              <p className="small muted" style={{ margin: "0.35rem 0" }}>
                {phase === "processing"
                  ? t("processing")
                  : phase === "speaking"
                    ? t("speaking")
                    : "Tap to start, tap again to stop — then review and send."}
              </p>
              {rec.error === "not-allowed" && (
                <p className="notice notice-danger small">{t("micDenied")}</p>
              )}
              {rec.error === "unsupported" && (
                <p className="notice notice-danger small">{t("voiceUnsupported")}</p>
              )}

              {/* Editable transcript + confirm before acting */}
              {(transcript || phase === "listening") && (
                <div style={{ marginTop: "0.4rem" }}>
                  <label className="small">{t("you")}</label>
                  <textarea rows={2} value={transcript} onChange={(e) => setTranscript(e.target.value)} />
                  <button className="btn btn-small" onClick={submit} disabled={busy || !transcript.trim()}>
                    {t("yesSave")} / {t("send")}
                  </button>
                </div>
              )}
            </>
          )}

          {/* Answer + playback controls */}
          {answer && (
            <div style={{ marginTop: "0.6rem" }}>
              <label className="small">{t("assistant")}</label>
              <div className="small" style={{ whiteSpace: "pre-wrap" }}>{answer}</div>
              <div className="row" style={{ marginTop: "0.4rem", alignItems: "center" }}>
                <button className="btn btn-ghost btn-small" onClick={() => speak(lastAnswerRef.current)}>↻ Replay</button>
                <button className="btn btn-ghost btn-small" onClick={tts.pause}>⏸</button>
                <button className="btn btn-ghost btn-small" onClick={tts.resume}>▶</button>
                <button className="btn btn-ghost btn-small" onClick={() => { tts.stop(); setPhase("idle"); }}>⏹</button>
                <label className="small" style={{ margin: 0 }}>
                  {t("speed")}
                  <input
                    type="range"
                    min={0.6}
                    max={1.4}
                    step={0.1}
                    value={rate}
                    onChange={(e) => setRate(Number(e.target.value))}
                    style={{ width: 80, marginLeft: 6 }}
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
