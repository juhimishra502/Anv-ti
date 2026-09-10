"use client";
// Connected dependency-graph roadmap. Derives a phase graph from the case view:
// Phase 1 death record → Phase 2 establish authority → Phase 3 parallel asset tracks
// → Phase 5 estate closure. Nodes carry status (completed / current / available /
// blocked / conditional / professional-review) computed from prerequisites + answers.
// Arrows show order; asset tracks run in parallel. Selecting a node opens its detail.
import { useMemo } from "react";
import type { CaseView, RoadmapStepView } from "@/lib/client/types";
import { useLocale } from "@/lib/i18n/context";
import { useTranslated } from "@/lib/i18n/translate-client";

export type NodeStatus = "completed" | "current" | "available" | "blocked" | "conditional" | "professional";

export interface GraphNode {
  id: string;
  step: RoadmapStepView;
  phase: 1 | 2 | 3 | 5;
  prereq: string[];
  status: NodeStatus;
  blockedReason?: string;
  assetLabel?: string;
  jurisdiction?: string;
}

function isDone(s: RoadmapStepView): boolean {
  return s.derived_done === 1 || s.user_status === "completed";
}

/** Build the phase graph + prerequisites + status from the case view. */
export function buildGraph(view: CaseView): GraphNode[] {
  const roadmap = view.roadmap;
  const death = roadmap.find((s) => s.service === "death_registration");
  const legal = roadmap.find((s) => s.service === "legal_heir_certificate");
  const assetSteps = roadmap.filter(
    (s) => !["death_registration", "legal_heir_certificate"].includes(s.service),
  );
  const assetMap = new Map(view.assets.map((a) => [a.id, a]));

  const nodes: GraphNode[] = [];
  if (death) nodes.push({ id: death.id, step: death, phase: 1, prereq: [], status: "available" });
  if (legal) nodes.push({ id: legal.id, step: legal, phase: 2, prereq: death ? [death.id] : [], status: "available" });
  for (const a of assetSteps) {
    const asset = a.asset_id ? assetMap.get(a.asset_id) : undefined;
    // Asset claims need the death certificate; a no-nomination claim also needs authority.
    const prereq = death ? [death.id] : [];
    nodes.push({
      id: a.id,
      step: a,
      phase: 3,
      prereq,
      status: "available",
      assetLabel: asset?.label ?? a.title,
      jurisdiction: asset?.location?.state_code ?? undefined,
    });
  }
  // Synthetic closure node once there are assets.
  if (assetSteps.length > 0) {
    // (kept lightweight — closure is a guidance milestone, no procedure record)
  }

  // Compute status from prerequisites + engine signals.
  const doneIds = new Set(nodes.filter((n) => isDone(n.step)).map((n) => n.id));
  let currentAssigned = false;
  for (const n of nodes.sort((a, b) => a.phase - b.phase)) {
    if (isDone(n.step)) { n.status = "completed"; continue; }
    const prereqMet = n.prereq.every((p) => doneIds.has(p));
    if (!prereqMet) {
      n.status = "blocked";
      n.blockedReason = "Complete the earlier step first.";
      continue;
    }
    if (n.step.engine_status === "professional_review") { n.status = "professional"; continue; }
    if (["needs_context", "review_due", "local_review_required"].includes(n.step.engine_status)) {
      n.status = "conditional"; continue;
    }
    if (!currentAssigned) { n.status = "current"; currentAssigned = true; }
    else n.status = "available";
  }
  return nodes;
}

const STATUS_LABEL: Record<NodeStatus, string> = {
  completed: "Done", current: "Do this now", available: "Available",
  blocked: "Blocked", conditional: "Needs detail", professional: "Professional review",
};

function NodeCard({ n, selected, onSelect, tr }: {
  n: GraphNode; selected: boolean; onSelect: (id: string) => void; tr: (s: string) => string;
}) {
  return (
    <button
      type="button"
      className={`jg-node jg-${n.status}${selected ? " jg-selected" : ""}`}
      onClick={() => onSelect(n.id)}
      aria-current={n.status === "current"}
    >
      <span className={`jg-badge jg-b-${n.status}`}>{STATUS_LABEL[n.status]}</span>
      <span className="jg-title">{tr(n.step.title)}</span>
      {(n.jurisdiction || n.assetLabel) && (
        <span className="jg-sub">{n.jurisdiction ? `${n.jurisdiction} · ` : ""}{n.step.service.replace(/_/g, " ")}</span>
      )}
    </button>
  );
}

export function JourneyGraph({
  view, selectedId, onSelect,
}: {
  view: CaseView; selectedId: string | null; onSelect: (id: string) => void;
}) {
  const { t } = useLocale();
  const nodes = useMemo(() => buildGraph(view), [view]);
  const version = view.roadmap[0]?.payload?.catalog_version ?? "v1";
  const titles = useMemo(() => nodes.map((n) => n.step.title), [nodes]);
  const tr = useTranslated(titles, version);

  if (nodes.length === 0) return null;
  const phase1 = nodes.filter((n) => n.phase === 1);
  const phase2 = nodes.filter((n) => n.phase === 2);
  const phase3 = nodes.filter((n) => n.phase === 3);
  const total = nodes.length;
  const done = nodes.filter((n) => n.status === "completed").length;

  const renderPhase = (label: string, list: GraphNode[], tone: "record" | "inherits" | "assets", parallel?: boolean) =>
    list.length === 0 ? null : (
      <div className={`jg-phase jg-phase-${tone}`}>
        <div className="jg-phase-label">{label}</div>
        <div className={parallel ? "jg-track jg-parallel" : "jg-track"}>
          {list.map((n) => (
            <NodeCard key={n.id} n={n} selected={n.id === selectedId} onSelect={onSelect} tr={tr} />
          ))}
        </div>
      </div>
    );

  return (
    <div className="jg-wrap">
      <div className="jg-progress">
        <span className="small muted">{t("journeyMap")}</span>
        <span className="small">{done}/{total}</span>
        <div className="jg-bar"><div style={{ width: `${total ? (done / total) * 100 : 0}%` }} /></div>
      </div>
      <div className="jg-scroll">
        <div className="jg-flow">
          {renderPhase(t("phaseDeath"), phase1, "record")}
          {phase2.length > 0 && <div className="jg-arrow" aria-hidden>→</div>}
          {renderPhase(t("phaseLegal"), phase2, "inherits")}
          {phase3.length > 0 && <div className="jg-arrow" aria-hidden>→</div>}
          {renderPhase(t("phaseAssets"), phase3, "assets", true)}
        </div>
      </div>
    </div>
  );
}
