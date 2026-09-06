"use client";
// Browser Web Speech API wrappers (feature-detected, real). Speech recognition and
// synthesis are language-aware via BCP-47 tags. Support genuinely varies by
// browser/OS, so we detect per language and never claim support that isn't present.
//
// Configurable seam: for languages the browser can't recognise, server-side Groq
// Whisper (whisper-large-v3 / -turbo) is the intended STT fallback — wire it behind
// `NEXT_PUBLIC_STT_PROVIDER` later. This module ships the browser path.
import { useCallback, useEffect, useRef, useState } from "react";

// --- Minimal ambient typings (Web Speech API isn't in the standard TS DOM lib) ---
interface SpeechRecognitionResultLike {
  0: { transcript: string };
  isFinal: boolean;
}
interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResultLike>;
  resultIndex: number;
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function recognitionSupported(): boolean {
  return getRecognitionCtor() !== null;
}
export function synthesisSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** Voices whose lang matches the given BCP-47 tag (by primary subtag). */
export function voicesForLang(speechTag: string): SpeechSynthesisVoice[] {
  if (!synthesisSupported()) return [];
  const primary = speechTag.split("-")[0].toLowerCase();
  return window.speechSynthesis
    .getVoices()
    .filter((v) => v.lang.toLowerCase().startsWith(primary));
}

export interface VoiceSupport {
  recognition: boolean;
  synthesis: boolean;
}

/** Reactive support probe for one language (voices load async in some browsers). */
export function useVoiceSupport(speechTag: string): VoiceSupport {
  const [synthesis, setSynthesis] = useState(false);
  useEffect(() => {
    if (!synthesisSupported()) return;
    const update = () => setSynthesis(voicesForLang(speechTag).length > 0);
    update();
    window.speechSynthesis.onvoiceschanged = update;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [speechTag]);
  return { recognition: recognitionSupported(), synthesis };
}

// --- Speech recognition (push-to-talk) ---
export function useSpeechRecognition(lang: string) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);

  const stop = useCallback(() => {
    recRef.current?.stop();
    setListening(false);
  }, []);

  const start = useCallback(
    (onFinal: (text: string) => void, onInterim?: (text: string) => void) => {
      const Ctor = getRecognitionCtor();
      if (!Ctor) {
        setError("unsupported");
        return;
      }
      setError(null);
      const rec = new Ctor();
      rec.lang = lang;
      rec.continuous = false;
      rec.interimResults = true;
      let finalText = "";
      rec.onresult = (e) => {
        let interim = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const r = e.results[i];
          if (r.isFinal) finalText += r[0].transcript;
          else interim += r[0].transcript;
        }
        if (interim && onInterim) onInterim(interim);
      };
      rec.onerror = (ev) => {
        setError(ev.error || "error");
        setListening(false);
      };
      rec.onend = () => {
        setListening(false);
        if (finalText.trim()) onFinal(finalText.trim());
      };
      recRef.current = rec;
      try {
        rec.start();
        setListening(true);
      } catch {
        setError("error");
      }
    },
    [lang],
  );

  useEffect(() => () => recRef.current?.abort(), []);
  return { start, stop, listening, error, supported: recognitionSupported() };
}

// --- Speech synthesis (TTS) ---
export function useSpeechSynthesis() {
  const [speaking, setSpeaking] = useState(false);

  // Returns false when it will NOT speak — including when no voice matches a
  // non-English language (we never silently substitute an English voice).
  const speak = useCallback((text: string, opts: { lang: string; rate?: number }) => {
    if (!synthesisSupported() || !text) return false;
    const primary = opts.lang.split("-")[0].toLowerCase();
    const voice = voicesForLang(opts.lang)[0];
    if (!voice && primary !== "en") {
      // No voice for this language — refuse rather than speak English.
      return false;
    }
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = opts.lang;
    u.rate = opts.rate ?? 1;
    if (voice) u.voice = voice;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    setSpeaking(true);
    synth.speak(u);
    return true;
  }, []);

  const stop = useCallback(() => {
    if (synthesisSupported()) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  const pause = useCallback(() => {
    if (synthesisSupported()) window.speechSynthesis.pause();
  }, []);
  const resume = useCallback(() => {
    if (synthesisSupported()) window.speechSynthesis.resume();
  }, []);

  useEffect(() => () => {
    if (synthesisSupported()) window.speechSynthesis.cancel();
  }, []);

  return { speak, stop, pause, resume, speaking, supported: synthesisSupported() };
}
