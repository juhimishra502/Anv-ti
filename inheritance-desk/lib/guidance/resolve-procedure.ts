// Strict, state-aware procedure resolver. This is the single decision point for how
// an asset routes. It NEVER emits another state's procedure: state-scoped services
// (property, legal-heir, death registration) resolve only from the selected asset /
// case state, and when that state has no verified procedure it returns an explicit,
// clearly-labelled fallback for THAT state — never a silent fall-through to UP.
//
// Resolution order (per requirement):
//   1. asset type + asset state + district/tehsil
//   2. asset type + asset state
//   3. national / institution procedure (banks, securities, MF, insurance, EPF, NPS…)
//   4. state fallback for the selected asset state (honest, "not verified")
//   5. generic fallback marked "not verified" (no state known at all)
//
// The engine (engine.ts) already performs 1–3 by matching on state + district; this
// layer adds 4–5 and a compact 5-second projection, and guarantees no cross-state leak.
import type { GuidanceQuery, GuidanceResult } from "./types";
import { serviceMeta } from "./services.ts";
import { buildStepDetail } from "./step-detail.ts";

export interface ResolveInput {
  assetType: string;
  assetState?: string | null;
  assetDistrict?: string | null;
  residenceState?: string | null;
  deathState?: string | null;
  institution?: string | null;
  recordType?: string | null;
  authority?: string | null;
  /** Optional explicit service override (else derived from assetType by the engine). */
  service?: string;
  hasDispute?: boolean;
  professionalReview?: string | null;
  /** Extra engine context to preserve (district, will status, etc.); explicit fields win. */
  extra?: GuidanceQuery;
}

export interface StateFallback {
  stateName: string;
  verified: false;
  message: string;
  missing: string[];
}

export interface CompactStep {
  heading: string;
  bullets: string[]; // English source; the client translates at render
  chips: { office: string; fee: string; timeline: string; status: string; state: string | null };
}

export type RouteStatus =
  | "verified_orientation" | "needs_context" | "state_fallback" | "national" | "professional_review";

export interface ResolvedRoute {
  service: string;
  scope: "state" | "national";
  stateName: string | null;
  verified: boolean;
  routeStatus: RouteStatus;
  fallback: StateFallback | null;
  compact: CompactStep;
  /** The full grounded engine result (drives the "View details" panel). */
  result: GuidanceResult;
}

const VERIFY_LOCALLY = "verify locally";

// State-scoped services route by geography; everything else is national/institutional.
const STATE_SCOPED = new Set(["property_mutation", "legal_heir_certificate", "death_registration"]);

/** Honest fallback wording per state-scoped service (never references another state). */
function fallbackFor(service: string, stateName: string): { message: string; bullets: string[]; missing: string[] } {
  if (service === "property_mutation") {
    return {
      message: `Procedure for ${stateName} is not yet verified. Use the local revenue/registration authority for the property's location and confirm documents, fees, office and timeline.`,
      bullets: [
        "Check the land record and identify the local revenue office / tehsil.",
        "File the mutation/succession request with death proof; confirm documents, fees and timeline locally.",
      ],
      missing: ["office", "fee", "timeline", "documents", "form", "official source"],
    };
  }
  if (service === "legal_heir_certificate") {
    return {
      message: `Procedure for ${stateName} is not yet verified. Apply for the heir / family certificate through the local revenue authority and confirm the documents, fees, office and timeline.`,
      bullets: [
        "Identify the local revenue authority (tahsildar / equivalent) for the deceased's district.",
        "Apply with the death certificate and heir evidence; confirm documents, fees and timeline locally.",
      ],
      missing: ["office", "fee", "timeline", "documents", "form", "official source"],
    };
  }
  // death_registration
  return {
    message: `Procedure for ${stateName} is not yet verified. Register the death with the local registrar (municipal/panchayat) for the place of death and confirm documents, fees and timeline.`,
    bullets: [
      "Identify the local registrar of births & deaths for the place of death.",
      "Register the death and obtain the certificate; confirm documents, fees and timeline locally.",
    ],
    missing: ["office", "fee", "timeline", "documents", "official source"],
  };
}

/** Pick a chip value from the researched detail; "verify locally" when unverified. */
function chipsFromResult(result: GuidanceResult): { office: string; fee: string; timeline: string } {
  const proc = (result.procedures ?? []).find((p) => p.detail);
  if (!proc?.detail) return { office: VERIFY_LOCALLY, fee: VERIFY_LOCALLY, timeline: VERIFY_LOCALLY };
  const fields = buildStepDetail({ detail: proc.detail as unknown as Record<string, unknown> });
  const val = (key: string) => {
    const f = fields.find((x) => x.key === key);
    return f && f.status === "verified" && f.value ? f.value : VERIFY_LOCALLY;
  };
  const office = (() => {
    const f = fields.find((x) => x.key === "office_name");
    if (f?.status === "verified" && f.value) return f.value;
    const auth = fields.find((x) => x.key === "responsible_authority");
    return auth?.status === "verified" && auth.value ? auth.value : VERIFY_LOCALLY;
  })();
  return { office, fee: val("fee"), timeline: val("published_timeline") };
}

export function resolveProcedure(
  input: ResolveInput,
  lookup: (q: GuidanceQuery) => GuidanceResult,
): ResolvedRoute {
  const meta = serviceMeta(input.service ?? "");
  // For a state-scoped asset with no state of its own, apply the SELECTED case state
  // (residence/death) so the chosen state governs the asset — never a default state.
  const stateScoped =
    input.service ? STATE_SCOPED.has(input.service) : input.assetType === "property";
  const effectiveAssetState = stateScoped
    ? input.assetState || input.residenceState || input.deathState || undefined
    : input.assetState || undefined;

  const query: GuidanceQuery = {
    ...(input.extra ?? {}),
    assetType: input.assetType,
    ...(input.service ? { service: input.service } : {}),
    ...(effectiveAssetState ? { assetState: effectiveAssetState } : {}),
    ...(input.assetDistrict ? { assetDistrict: input.assetDistrict } : {}),
    ...(input.recordType ? { recordType: input.recordType } : {}),
    ...(input.authority ? { authority: input.authority } : {}),
    ...(input.residenceState ? { deceasedState: input.residenceState } : {}),
    ...(input.deathState ? { deathState: input.deathState } : {}),
    ...(input.institution ? { institution: input.institution } : {}),
    ...(input.hasDispute ? { hasDispute: true } : {}),
  };
  const result = lookup(query);
  const service = result.service ?? input.service ?? "property_mutation";
  const scope: "state" | "national" = STATE_SCOPED.has(service) ? "state" : "national";
  const stateName = result.jurisdiction_state ?? null;
  const verified = (result.procedures ?? []).some((p) => (p.steps?.length ?? 0) > 0);
  const heading = serviceMeta(service).label || meta.label || service.replace(/_/g, " ");

  let routeStatus: RouteStatus;
  let fallback: StateFallback | null = null;
  let bullets: string[];

  if (result.status === "professional_review") {
    routeStatus = "professional_review";
    bullets = [
      input.professionalReview || "This route needs qualified professional review before you act.",
      "The informational steps below still apply — read them, then arrange a review.",
    ];
  } else if (scope === "state") {
    if (verified) {
      routeStatus = "verified_orientation";
      const proc = result.procedures.find((p) => p.steps.length > 0)!;
      bullets = proc.steps.slice(0, 2);
    } else if ((result.procedures ?? []).length > 0) {
      // A procedure for THIS state exists but needs more input (e.g. record type) —
      // ask for it rather than declaring an unverified fallback.
      routeStatus = "needs_context";
      bullets = [
        result.next_action || "Answer the remaining question so the exact local steps can be shown.",
        "Your selected state's procedure applies once the missing detail is provided.",
      ];
    } else if (stateName) {
      // No procedure for the SELECTED state at all -> honest state fallback (never UP).
      routeStatus = "state_fallback";
      const fb = fallbackFor(service, stateName);
      fallback = { stateName, verified: false, message: fb.message, missing: fb.missing };
      bullets = fb.bullets;
    } else {
      // No state known at all -> generic, clearly-unverified, ask for the state.
      routeStatus = "needs_context";
      bullets = [
        "Select the state/UT where this asset is located so the correct local procedure can be shown.",
        "Until then, no state-specific procedure is applied.",
      ];
    }
  } else {
    // National / institutional route (banks, securities, MF, insurance, EPF, NPS, …).
    routeStatus = "national";
    const proc = (result.procedures ?? []).find((p) => p.steps.length > 0);
    bullets = proc
      ? proc.steps.slice(0, 2)
      : [
          `Identify the ${input.institution ? input.institution : "institution"} and its death-claim process.`,
          "Submit the claim with the death certificate and nominee/heir evidence.",
        ];
  }

  const detailChips = chipsFromResult(result);
  const statusChip =
    routeStatus === "verified_orientation" ? "Verified orientation"
    : routeStatus === "national" ? "National route"
    : routeStatus === "professional_review" ? "Professional review"
    : routeStatus === "state_fallback" ? `${stateName} fallback — not verified`
    : "Needs your input";

  const compact: CompactStep = {
    heading,
    bullets: bullets.slice(0, 2),
    chips: {
      office: scope === "national" ? (input.institution || "Institution / branch") : detailChips.office,
      fee: detailChips.fee,
      timeline: detailChips.timeline,
      status: statusChip,
      state: scope === "state" ? stateName : null,
    },
  };

  return { service, scope, stateName, verified, routeStatus, fallback, compact, result };
}
