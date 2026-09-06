"use client";
// Real text-to-speech using the browser's built-in Web Speech API (no external
// service, no key). Degrades to a disabled state with an honest label when the
// browser has no speech synthesis.
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { voicesForLang } from "@/lib/voice/speech";
import { useAudio } from "@/lib/audio/audio-context";

// Hydration-safe client-capability read: false on the server, correct on the client.
function useSpeechSupported(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => typeof window !== "undefined" && "speechSynthesis" in window,
    () => false,
  );
}

export function ReadAloud({ text, label = "Read this aloud", lang = "en-IN" }: { text: string; label?: string; lang?: string }) {
  const supported = useSpeechSupported();
  const [speaking, setSpeaking] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const audio = useAudio();
  const duckedRef = useRef(false);

  // Duck the music while speaking; always restore, even on cancel/error/unmount.
  const startDuck = () => { if (!duckedRef.current) { duckedRef.current = true; audio.duck(); } };
  const endDuck = () => { if (duckedRef.current) { duckedRef.current = false; audio.unduck(); } };

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      endDuck();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!supported) {
    return (
      <span className="small muted" title="This browser does not offer built-in speech.">
        🔇 Read-aloud unavailable in this browser
      </span>
    );
  }

  function toggle() {
    const synth = window.speechSynthesis;
    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      endDuck();
      return;
    }
    synth.cancel();
    const primary = lang.split("-")[0].toLowerCase();
    if (primary !== "en" && voicesForLang(lang).length === 0) {
      // No voice for this language — do not read out in English silently.
      setNote("🔇");
      return;
    }
    setNote(null);
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = 0.98;
    const voice = voicesForLang(lang)[0];
    if (voice) u.voice = voice;
    u.onend = () => { setSpeaking(false); endDuck(); };
    u.onerror = () => { setSpeaking(false); endDuck(); };
    setSpeaking(true);
    startDuck();
    synth.speak(u);
  }

  return (
    <button
      type="button"
      className="btn btn-ghost btn-small"
      onClick={toggle}
      aria-pressed={speaking}
      title={note ? "Voice not available for this language in your browser" : undefined}
    >
      {note ? `🔇 ${label}` : speaking ? "⏹ Stop" : `🔊 ${label}`}
    </button>
  );
}
