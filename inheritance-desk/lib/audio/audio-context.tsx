"use client";
// ONE global background-music controller for the whole app. A single <audio> element
// lives in the root layout (this provider), so playback continues seamlessly across
// route changes (landing → auth → questionnaire) with no restart and no duplicate
// instances. Playback position, mute and volume persist in sessionStorage. Voice/TTS
// ducks the music through a shared state, and the tab-visibility API pauses/resumes.
//
// Audible autoplay is attempted once. When a browser blocks it, the same track starts
// on the first pointer, touch, or keyboard interaction. Closing sound is remembered for
// the current browser session and suppresses both automatic paths.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

const SRC = "/inheritance-track.mp3";
const K = {
  enabled: "id_audio_enabled",
  muted: "id_audio_muted",
  volume: "id_audio_volume",
  pos: "id_audio_pos",
  playing: "id_audio_playing",
  closed: "id_audio_closed",
};
const FADE_MS = 1000;
const DUCK_FACTOR = 0.12; // music drops to ~12% while speech plays

function ss(key: string): string | null {
  try { return sessionStorage.getItem(key); } catch { return null; }
}
function ssSet(key: string, val: string) {
  try { sessionStorage.setItem(key, val); } catch { /* storage unavailable */ }
}

export interface AudioApi {
  ready: boolean;
  enabled: boolean;   // the user has opted into sound at least once
  closed: boolean;    // the user closed sound for this browser session
  playing: boolean;
  muted: boolean;
  volume: number;     // 0..1 (the user's chosen level, independent of ducking)
  ducked: boolean;
  position: number;   // current playback time (seconds), reactive
  duration: number;   // track length (seconds), reactive
  seek: (seconds: number) => void;
  /** Start audible playback (must be called from a user gesture). */
  enableAndPlay: () => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  setMuted: (m: boolean) => void;
  setVolume: (v: number) => void;
  closeSound: () => void;
  reopenSound: () => void;
  /** Voice/TTS ducking: lower music while speaking, then restore. Ref-counted. */
  duck: () => void;
  unduck: () => void;
  /** currentTime of the track (timing source for audio-reactive visuals); 0 if idle. */
  getCurrentTime: () => number;
}

const Ctx = createContext<AudioApi | null>(null);

export function useAudio(): AudioApi {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAudio must be used within <AudioProvider>");
  return c;
}

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeRaf = useRef<number | null>(null);
  const duckCount = useRef(0);
  const wasPlayingOnHide = useRef(false);
  const autoplaySetup = useRef(false);

  const [ready, setReady] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [closed, setClosed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMutedState] = useState(false);
  const [volume, setVolumeState] = useState(0.6);
  const [ducked, setDucked] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  const seek = useCallback((seconds: number) => {
    const a = audioRef.current;
    if (!a || !Number.isFinite(a.duration)) return;
    a.currentTime = Math.max(0, Math.min(a.duration, seconds));
    setPosition(a.currentTime);
    ssSet(K.pos, String(a.currentTime));
  }, []);

  // Effective element volume = user volume * (ducked ? DUCK_FACTOR : 1), 0 when muted.
  const applyVolume = useCallback((base: number, isMuted: boolean, isDucked: boolean) => {
    const a = audioRef.current;
    if (!a) return;
    a.muted = isMuted;
    a.volume = Math.max(0, Math.min(1, base * (isDucked ? DUCK_FACTOR : 1)));
  }, []);

  const cancelFade = () => {
    if (fadeRaf.current) cancelAnimationFrame(fadeRaf.current);
    fadeRaf.current = null;
  };

  // Fade the element's *gain* toward a multiple of the user volume over `ms`.
  const fade = useCallback((toFactor: number, ms: number, after?: () => void) => {
    const a = audioRef.current;
    if (!a) { after?.(); return; }
    cancelFade();
    const start = performance.now();
    const from = volume > 0 ? a.volume / volume : 0; // current factor
    const step = (now: number) => {
      const k = Math.min(1, (now - start) / ms);
      const factor = from + (toFactor - from) * k;
      a.volume = Math.max(0, Math.min(1, volume * factor));
      if (k < 1) { fadeRaf.current = requestAnimationFrame(step); }
      else { fadeRaf.current = null; after?.(); }
    };
    fadeRaf.current = requestAnimationFrame(step);
  }, [volume]);

  // Restore persisted preferences once, on mount (one-time init from sessionStorage).
  useEffect(() => {
    const v = parseFloat(ss(K.volume) ?? "");
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!Number.isNaN(v)) setVolumeState(Math.max(0, Math.min(1, v)));
    setMutedState(ss(K.muted) === "1");
    setEnabled(ss(K.enabled) === "1");
    setClosed(ss(K.closed) === "1");
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const doPlay = useCallback(async (): Promise<boolean> => {
    const a = audioRef.current;
    if (!a) return false;
    cancelFade();
    a.volume = 0;
    try {
      await a.play();
      setEnabled(true);
      setPlaying(true);
      ssSet(K.enabled, "1");
      ssSet(K.playing, "1");
      fade(ducked ? DUCK_FACTOR : 1, FADE_MS);
      return true;
    } catch {
      setPlaying(false);
      ssSet(K.playing, "0");
      return false;
    }
  }, [fade, ducked]);

  const enableAndPlay = useCallback(() => {
    setEnabled(true);
    setClosed(false);
    ssSet(K.enabled, "1");
    ssSet(K.closed, "0");
    void doPlay();
  }, [doPlay]);

  const pause = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    ssSet(K.pos, String(a.currentTime));
    fade(0, FADE_MS, () => {
      a.pause();
      setPlaying(false);
      ssSet(K.playing, "0");
    });
  }, [fade]);

  const play = useCallback(() => {
    setEnabled(true);
    setClosed(false);
    ssSet(K.enabled, "1");
    ssSet(K.closed, "0");
    void doPlay();
  }, [doPlay]);
  const toggle = useCallback(() => { if (playing) pause(); else play(); }, [playing, pause, play]);

  const setMuted = useCallback((m: boolean) => {
    setMutedState(m);
    ssSet(K.muted, m ? "1" : "0");
    applyVolume(volume, m, ducked);
  }, [applyVolume, volume, ducked]);

  const setVolume = useCallback((v: number) => {
    const nv = Math.max(0, Math.min(1, v));
    setVolumeState(nv);
    ssSet(K.volume, String(nv));
    applyVolume(nv, muted, ducked);
  }, [applyVolume, muted, ducked]);

  const closeSound = useCallback(() => {
    const a = audioRef.current;
    setClosed(true);
    setEnabled(false);
    ssSet(K.closed, "1");
    ssSet(K.enabled, "0");
    if (!a) return;
    ssSet(K.pos, String(a.currentTime));
    fade(0, 650, () => {
      a.pause();
      setPlaying(false);
      ssSet(K.playing, "0");
    });
  }, [fade]);

  const reopenSound = useCallback(() => {
    autoplaySetup.current = true;
    setClosed(false);
    setEnabled(true);
    ssSet(K.closed, "0");
    ssSet(K.enabled, "1");
    void doPlay();
  }, [doPlay]);

  // Attempt audible playback immediately. If browser policy blocks it, start on the
  // first genuine interaction anywhere on the page. This setup runs once so pressing
  // Pause later never causes an automatic restart.
  useEffect(() => {
    if (!ready || closed || autoplaySetup.current) return;
    autoplaySetup.current = true;
    let disposed = false;
    const eventOptions = { capture: true } as const;
    const removeFallback = () => {
      document.removeEventListener("pointerdown", onFirstInteraction, eventOptions);
      document.removeEventListener("touchstart", onFirstInteraction, eventOptions);
      document.removeEventListener("keydown", onFirstInteraction, eventOptions);
    };
    const onFirstInteraction = () => {
      removeFallback();
      void doPlay();
    };
    // Register first so an interaction that happens while the autoplay promise is
    // resolving is never lost. Successful autoplay removes these listeners again.
    document.addEventListener("pointerdown", onFirstInteraction, eventOptions);
    document.addEventListener("touchstart", onFirstInteraction, eventOptions);
    document.addEventListener("keydown", onFirstInteraction, eventOptions);
    void doPlay().then((started) => {
      if (started || disposed) removeFallback();
    });
    return () => {
      disposed = true;
      removeFallback();
    };
  }, [ready, closed, doPlay]);

  // Ref-counted ducking so multiple speech sources compose correctly.
  const duck = useCallback(() => {
    duckCount.current += 1;
    if (duckCount.current === 1) { setDucked(true); fade(DUCK_FACTOR, 250); }
  }, [fade]);
  const unduck = useCallback(() => {
    duckCount.current = Math.max(0, duckCount.current - 1);
    if (duckCount.current === 0) { setDucked(false); fade(1, 400); }
  }, [fade]);

  const getCurrentTime = useCallback(() => audioRef.current?.currentTime ?? 0, []);

  // Persist position + on unload; pause on tab hide, resume on show.
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const savePos = () => { if (a.currentTime) ssSet(K.pos, String(a.currentTime)); };
    const onTime = () => { setPosition(a.currentTime); if (a.duration && !duration) setDuration(a.duration); };
    a.addEventListener("timeupdate", onTime);
    const onVis = () => {
      if (document.hidden) {
        wasPlayingOnHide.current = playing;
        if (playing) { savePos(); a.pause(); }
      } else if (wasPlayingOnHide.current) {
        void doPlay();
      }
    };
    const posTimer = window.setInterval(savePos, 3000);
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", savePos);
    return () => {
      window.clearInterval(posTimer);
      a.removeEventListener("timeupdate", onTime);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", savePos);
    };
  }, [playing, doPlay, duration]);

  // Restore position once metadata is available.
  const onLoadedMeta = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (a.duration) setDuration(a.duration);
    const pos = parseFloat(ss(K.pos) ?? "");
    if (!Number.isNaN(pos) && pos > 0 && pos < (a.duration || Infinity)) { a.currentTime = pos; setPosition(pos); }
    applyVolume(volume, muted, false);
  }, [applyVolume, volume, muted]);

  const api = useMemo<AudioApi>(() => ({
    ready, enabled, closed, playing, muted, volume, ducked, position, duration, seek,
    enableAndPlay, play, pause, toggle, setMuted, setVolume, closeSound, reopenSound,
    duck, unduck, getCurrentTime,
  }), [ready, enabled, closed, playing, muted, volume, ducked, position, duration, seek, enableAndPlay, play, pause, toggle, setMuted, setVolume, closeSound, reopenSound, duck, unduck, getCurrentTime]);

  return (
    <Ctx.Provider value={api}>
      {/* The single, app-wide audio element. loop keeps it continuous; a small MP3
          loop seam is masked by low volume at the boundary. Never rendered per-route. */}
      <audio ref={audioRef} src={SRC} loop preload="auto" onLoadedMetadata={onLoadedMeta} aria-hidden="true" />
      {children}
    </Ctx.Provider>
  );
}
