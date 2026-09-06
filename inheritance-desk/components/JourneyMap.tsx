"use client";
// The journey grouped into phases: death record → heir/estate → each asset as its OWN
// track. Every track shows its individual step-by-step flow (each asset transfers
// differently), colour-coded by status, translated into the active locale. Selecting a
// track jumps to its full detail below. Keyboard-accessible; reduced-motion friendly.
import { useMemo, useState } from "react";
import type { RoadmapStepView } from "@/lib/client/types";
import { useLocale } from "@/lib/i18n/context";
import { useTranslated } from "@/lib/i18n/translate-client";

function statusOf(s: RoadmapStepView): { cls: string; dot: string; label: string } {
  if (s.derived_done === 1 || s.user_status === "completed") return { cls: "jt-done", dot: "#1a7a4c", label: "✓" };
  if (s.engine_status === "professional_review") return { cls: "jt-review", dot: "#a32020", label: s.engine_status.replace(/_/g, " ") };
  if (["needs_context", "review_due", "local_review_required"].includes(s.engine_status))
    return { cls: "jt-wait", dot: "#8a5a00", label: s.engine_status.replace(/_/g, " ") };
  return { cls: "jt-active", dot: "#1f6feb", label: s.engine_status.replace(/_/g, " ") };
}

function subStepsOf(s: RoadmapStepView): string[] {
  const p = s.payload;
  return (p?.procedures?.[0]?.steps ?? []).slice(0, 8);
}

export function JourneyMap({ steps }: { steps: RoadmapStepView[] }) {
  const { t } = useLocale();
  const [zoom, setZoom] = useState(1);

  const death = steps.filter((s) => s.service === "death_registration");
  const heir = steps.filter((s) => s.service === "legal_heir_certificate");
  const assets = steps.filter((s) => !["death_registration", "legal_heir_certificate"].includes(s.service));
  const order = [...death, ...heir, ...assets];

  // Batch-translate every visible title + sub-step for the active locale.
  const strings = useMemo(() => {
    const out: string[] = [];
    for (const s of order) {
      out.push(s.title);
      for (const x of subStepsOf(s)) out.push(x);
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steps]);
  const version = steps[0]?.payload?.catalog_version ?? "v1";
  const tr = useTranslated(strings, version);
  const num = (id: string) => order.findIndex((s) => s.id === id) + 1;

  if (steps.length === 0) return null;

  const renderTrack = (s: RoadmapStepView) => {
    const st = statusOf(s);
    const subs = subStepsOf(s);
    return (
      <div key={s.id} className={`jtrack ${st.cls}`}>
        <a href={`#step-${s.id}`} className="jtrack-head">
          <span className="jt-num">{num(s.id)}</span>
          <span className="jt-title">{tr(s.title)}</span>
          <span className="jt-status" style={{ color: st.dot }}>{st.label}</span>
        </a>
        {subs.length > 0 ? (
          <ol className="jt-subs">
            {subs.map((x, i) => (
              <li key={i} className="jt-sub">{tr(x)}</li>
            ))}
          </ol>
        ) : (
          <p className="jt-sub muted" style={{ paddingLeft: "1.4rem" }}>{tr(s.payload?.next_action ?? "")}</p>
        )}
      </div>
    );
  };

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h2>{t("journeyMap")}</h2>
        <div className="row" style={{ gap: "0.3rem" }}>
          <button className="btn btn-ghost btn-small" onClick={() => setZoom((z) => Math.max(0.8, z - 0.1))} aria-label="Zoom out">−</button>
          <button className="btn btn-ghost btn-small" onClick={() => setZoom((z) => Math.min(1.2, z + 0.1))} aria-label="Zoom in">+</button>
        </div>
      </div>
      <p className="small muted">{t("mapHint")}</p>
      <div className="jflow" style={{ fontSize: `${zoom}rem` }}>
        {death.length > 0 && (
          <section className="jphase">
            <h3 className="jphase-h">{t("phaseDeath")}</h3>
            {death.map(renderTrack)}
          </section>
        )}
        {heir.length > 0 && (
          <section className="jphase">
            <h3 className="jphase-h">{t("phaseLegal")}</h3>
            {heir.map(renderTrack)}
          </section>
        )}
        {assets.length > 0 && (
          <section className="jphase">
            <h3 className="jphase-h">{t("phaseAssets")}</h3>
            <div className="jtracks">{assets.map(renderTrack)}</div>
          </section>
        )}
      </div>
    </div>
  );
}
