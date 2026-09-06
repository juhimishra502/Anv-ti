"use client";
// Persistent, accessible background-music control. Rendered once (root layout) so it
// appears on the landing, authentication and questionnaire without duplicating audio.
// Talks only to the single global controller (useAudio). 44×44px touch targets, full
// keyboard support and ARIA labels; the selected UI language localises every label.
import { useState } from "react";
import { useAudio } from "@/lib/audio/audio-context";
import { useLocale } from "@/lib/i18n/context";

export function MusicControls() {
  const { ready, enabled, playing, muted, volume, toggle, setMuted, setVolume } = useAudio();
  const { t } = useLocale();
  const [openVol, setOpenVol] = useState(false);

  if (!ready) return null;

  // Localised where a key exists; falls back to clear English otherwise.
  const label = (k: string, fallback: string) => {
    try { const v = (t as (x: string) => string)(k); return v && v !== k ? v : fallback; } catch { return fallback; }
  };

  return (
    <div className="music-controls" role="group" aria-label={label("musicControls", "Background music controls")}>
      {!enabled ? (
        <button type="button" className="mc-btn mc-enter" onClick={toggle} aria-label={label("enterWithSound", "Enter with sound")}>
          <span aria-hidden>♪</span>
          <span className="mc-enter-text">{label("enterWithSound", "Enter with sound")}</span>
        </button>
      ) : (
        <>
          <button type="button" className="mc-btn" onClick={toggle} aria-pressed={playing}
            aria-label={playing ? label("pauseMusic", "Pause music") : label("playMusic", "Play music")}>
            <span aria-hidden>{playing ? "❚❚" : "►"}</span>
          </button>
          <button type="button" className="mc-btn" onClick={() => setMuted(!muted)} aria-pressed={muted}
            aria-label={muted ? label("unmuteMusic", "Unmute music") : label("muteMusic", "Mute music")}>
            <span aria-hidden>{muted ? "🔇" : "🔊"}</span>
          </button>
          <button type="button" className="mc-btn mc-vol-toggle" onClick={() => setOpenVol((o) => !o)} aria-expanded={openVol}
            aria-label={label("volume", "Volume")}>
            <span aria-hidden>≈</span>
          </button>
          <input type="range" className={`mc-vol${openVol ? " open" : ""}`} min={0} max={1} step={0.05} value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))} aria-label={label("volume", "Volume")} />
        </>
      )}
    </div>
  );
}
