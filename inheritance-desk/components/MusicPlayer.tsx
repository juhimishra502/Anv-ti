"use client";
// Large, persistent bottom music player (root layout) — matches the reference's
// composition: a compact inheritance-journey preview on the left, a big circular
// play/pause control, and a long progress bar with a coloured completed section that
// also seeks. Talks only to the single global audio controller (useAudio), so it
// keeps playing across login and the questionnaire without restarting. Fully
// keyboard-accessible, 44px+ targets, localized labels.
import { useAudio } from "@/lib/audio/audio-context";
import { useLocale } from "@/lib/i18n/context";
import { usePathname } from "next/navigation";

function fmt(s: number): string {
  if (!Number.isFinite(s) || s <= 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function MusicPlayer() {
  const {
    ready, enabled, closed, playing, muted, position, duration,
    toggle, play, setMuted, seek, closeSound, reopenSound,
  } = useAudio();
  const { t } = useLocale();
  const pathname = usePathname();
  if (!ready) return null;

  const isLanding = pathname === "/";

  // The questionnaire and every other product screen keeps only one explicit
  // sound switch. The full transport belongs exclusively to the landing page.
  if (!isLanding) {
    const soundOn = !closed && !muted && playing;
    return (
      <button
        type="button"
        className="mp-sound-toggle"
        onClick={() => {
          if (closed) reopenSound();
          else if (muted) { setMuted(false); if (!playing) play(); }
          else setMuted(true);
        }}
        aria-pressed={soundOn}
        aria-label={soundOn ? t("muteMusic") : t("unmuteMusic")}
      >
        <span aria-hidden>{soundOn ? "🔊" : "🔇"}</span>
      </button>
    );
  }

  const pct = duration > 0 ? Math.min(100, (position / duration) * 100) : 0;

  return (
    <section className="mp" aria-label={t("musicControls")}>
      {/* Big circular play/pause — music controls only (no roadmap chips) */}
      <button
        type="button"
        className="mp-play"
        onClick={toggle}
        aria-pressed={playing}
        aria-label={!enabled ? t("enterWithSound") : playing ? t("pauseMusic") : t("playMusic")}
      >
        <span aria-hidden>{playing ? "❚❚" : "►"}</span>
      </button>

      {/* Long progress bar with coloured completed section (also seeks) */}
      <div className="mp-progress-wrap">
        <div className="mp-track" aria-hidden>
          <div className="mp-fill" style={{ width: `${pct}%` }} />
        </div>
        <input
          className="mp-seek"
          type="range"
          min={0}
          max={Math.max(1, Math.floor(duration))}
          step={1}
          value={Math.floor(position)}
          onChange={(e) => seek(parseFloat(e.target.value))}
          aria-label="Seek"
          aria-valuetext={`${fmt(position)} / ${fmt(duration)}`}
        />
        <span className="mp-time">{fmt(position)} / {fmt(duration)}</span>
      </div>

      <button
        type="button"
        className="mp-mute"
        onClick={() => setMuted(!muted)}
        aria-pressed={muted}
        aria-label={muted ? t("unmuteMusic") : t("muteMusic")}
      >
        <span aria-hidden>{muted ? "🔇" : "🔊"}</span>
      </button>

      <button
        type="button"
        className="mp-close"
        onClick={closeSound}
        aria-label={t("closeSound")}
      >
        <span aria-hidden>✕</span>
      </button>
    </section>
  );
}
