// Case-level orchestration: assemble a full case view and regenerate the grounded
// roadmap whenever the deceased context or asset inventory changes.
import "server-only";
import { createHash } from "node:crypto";
import {
  getCase,
  getDeceased,
  listAssets,
  listHeirs,
  listRoadmap,
  commitRoadmap,
  type CaseRow,
  type Deceased,
} from "@/lib/db/repo";
import { generateRoadmap } from "@/lib/guidance/roadmap";
import { QUESTIONNAIRE, QUESTIONNAIRE_VERSION } from "@/lib/questionnaire/schema";

export interface RoadmapResult {
  caseId: string;
  journeyUrl: string;
  nodeCount: number;
  reused: boolean;
}

/**
 * Generate and persist a case's roadmap. Idempotent by (case, answer_version): the
 * version is stamped in the SAME transaction as the steps, so a matching stamp means
 * a complete roadmap already exists and we return it without rewriting. Everything is
 * written in one transaction (commitRoadmap), and the small result is all the caller
 * needs to navigate — no full case-view re-serialization on the click path.
 */
export async function regenerateRoadmap(
  caseId: string,
  opts?: { actorUserId?: string | null; correlationId?: string },
): Promise<RoadmapResult> {
  const correlationId = opts?.correlationId ?? "no-cid";
  const [deceased, assets, existing] = await Promise.all([
    getDeceased(caseId),
    listAssets(caseId),
    getCase(caseId),
  ]);
  // Verify the generation received the authenticated actor, the case, and every asset.
  console.log(
    `[roadmap] ${correlationId} inputs user=${opts?.actorUserId ?? "?"} case=${caseId} assets=[${assets.map((a) => a.id).join(",")}]`,
  );
  const version = deceased?.questionnaire_version ?? QUESTIONNAIRE_VERSION;
  const answerVersion = createHash("sha256")
    .update(`${version}::${deceased?.answers_json ?? ""}::${deceased?.dispute_status ?? ""}::${assets.map((a) => a.id).sort().join(",")}`)
    .digest("hex")
    .slice(0, 16);
  const journeyUrl = `/case/${caseId}`;

  if (existing?.answer_version === answerVersion) {
    return { caseId, journeyUrl, nodeCount: -1, reused: true };
  }

  const steps = generateRoadmap(deceased, assets);
  await commitRoadmap({
    caseId,
    steps: steps.map((s) => ({
      asset_id: s.asset_id,
      procedure_id: s.procedure_id,
      service: s.service,
      title: s.title,
      requirement: s.requirement,
      engine_status: s.engine_status,
      completeness: s.completeness,
      execution_available: s.execution_available,
      derived_done: s.derived_done ? 1 : 0,
      payload: s.payload,
      sort_order: s.sort_order,
    })),
    questionnaireVersion: version,
    answerVersion,
    schemaJson: JSON.stringify({ version, fields: QUESTIONNAIRE.map((f) => f.id) }),
    actorUserId: opts?.actorUserId ?? null,
    correlationId,
    validAssetIds: new Set(assets.map((a) => a.id)),
  });
  return { caseId, journeyUrl, nodeCount: steps.length, reused: false };
}

export interface CaseView {
  case: CaseRow;
  deceased: Deceased | null;
  heirs: Awaited<ReturnType<typeof listHeirs>>;
  assets: Awaited<ReturnType<typeof listAssets>>;
  roadmap: Array<
    Omit<Awaited<ReturnType<typeof listRoadmap>>[number], "payload"> & { payload: unknown }
  >;
}

export async function buildCaseView(caseId: string): Promise<CaseView | null> {
  const row = await getCase(caseId);
  if (!row) return null;
  const [deceased, heirs, assets, roadmap] = await Promise.all([
    getDeceased(caseId),
    listHeirs(caseId),
    listAssets(caseId),
    listRoadmap(caseId),
  ]);
  return {
    case: row,
    deceased,
    heirs,
    assets,
    roadmap: roadmap.map((step) => ({
      ...step,
      payload: safeParse(step.payload),
    })),
  };
}

function safeParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
