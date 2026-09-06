// Turns a case (deceased context + asset inventory) into a personalized roadmap by
// querying the grounded engine once per relevant service. It NEVER fabricates a step
// the engine did not produce, and it preserves every coverage limit and warning.
//
// Sequencing rule: death registration/certificate comes first where needed; asset
// claims then run in parallel (they do not depend on each other). We do not force a
// universal succession/heir certificate before every claim.
import "server-only";
import { lookupGuidance } from "./lookup";
import { professionalReviewReason, type ReviewContext } from "./services";
import { resolveProcedure } from "./resolve-procedure";
import type { GuidanceQuery } from "./types";
import type { Asset, AssetLocation, Deceased } from "@/lib/db/repo";

export interface GeneratedStep {
  asset_id: string | null;
  procedure_id: string | null;
  service: string;
  title: string;
  requirement: "required" | "conditional" | "optional";
  /** Computed from case answers (e.g. death registered AND certificate obtained). */
  derived_done: boolean;
  engine_status: string;
  completeness: string;
  execution_available: number;
  payload: string; // JSON GuidanceResult
  sort_order: number;
}

function present(v: string | null | undefined): string | undefined {
  return v && v.trim() ? v : undefined;
}

function deceasedContext(d: Deceased | null): GuidanceQuery {
  if (!d) return {};
  return {
    deceasedState: present(d.residence_state),
    deceasedDistrict: present(d.residence_district),
    deathState: present(d.death_state),
    deathDistrict: present(d.death_district),
    deathRegistrationStatus: present(d.death_registered),
    willStatus: present(d.will_status),
    // A declared family dispute/objection/missing heir routes claims to
    // professional review across every asset branch.
    ...(d.dispute_status === "yes" ? { hasDispute: true } : {}),
  };
}

const SERVICE_ORDER: Record<string, number> = {
  death_registration: 0,
  legal_heir_certificate: 1,
  property_mutation: 2,
  bank_claim: 3,
  securities_transmission: 4,
  mutual_fund_claim: 5,
  insurance_claim: 6,
  epfo_claim: 7,
  nps_claim: 8,
  postal_claim: 9,
  ppf_death_claim: 10,
  gsec_transmission: 11,
  corporate_bond_transmission: 12,
  sovereign_gold_bond_transmission: 13,
  locker_access: 14,
  family_pension_claim: 15,
  gratuity_death_claim: 16,
  vehicle_transmission: 17,
  unclaimed_deposit: 18,
  // Higher-complexity successions come after the routine institutional claims.
  private_company_share_transmission: 20,
  unlisted_share_transmission: 21,
  sole_proprietorship_succession: 22,
  partnership_interest_succession: 23,
  llp_interest_succession: 24,
  employer_benefit_claim: 25,
  estate_liability_resolution: 26,
  overseas_asset_succession: 27,
  digital_account_legacy: 28,
  cryptoasset_recovery: 29,
  specialist_review: 30,
};

/** Read minor / missing-heir flags from the stored questionnaire answers (they are
 *  not first-class deceased columns). Dispute comes from dispute_status. */
function reviewContext(d: Deceased | null): ReviewContext {
  let hasMinor = false;
  let hasMissingHeir = false;
  if (d?.answers_json) {
    try {
      const a = JSON.parse(d.answers_json) as Record<string, unknown>;
      hasMinor = a.minors === "yes";
      hasMissingHeir = a.missing_heir === "yes";
    } catch {
      /* ignore malformed answer JSON */
    }
  }
  return { hasDispute: d?.dispute_status === "yes", hasMinor, hasMissingHeir };
}

function classifyRequirement(service: string): GeneratedStep["requirement"] {
  if (service === "death_registration") return "required";
  // Heir/family certificates and specialist assets are conditional by design.
  return "conditional";
}

export function generateRoadmap(
  deceased: Deceased | null,
  assets: (Asset & { location: AssetLocation | null })[],
): GeneratedStep[] {
  const base = deceasedContext(deceased);
  const review = reviewContext(deceased);
  const steps: GeneratedStep[] = [];

  // 1) Death registration / certificate — first. "Registered" and "certificate
  // obtained" are DISTINCT facts; the step is only done when the certificate exists.
  const isRegistered = (deceased?.death_registered ?? "").toLowerCase() === "yes";
  const hasCertificate = (deceased?.death_certificate ?? "").toLowerCase() === "available";
  const deathDone = isRegistered && hasCertificate;
  {
    // A dispute doesn't affect registering the death / obtaining the certificate.
    const route = resolveProcedure(
      { assetType: "property", service: "death_registration", deathState: present(deceased?.death_state ?? null), residenceState: present(deceased?.residence_state ?? null), extra: { ...base, hasDispute: false } },
      lookupGuidance,
    );
    const result = route.result;
    // Override the generic next action to reflect the actual sub-state.
    if (deathDone) {
      result.next_action = "The death is registered and you have the certificate. This step is complete — keep the certificate safe; you will reuse it for other claims.";
    } else if (isRegistered && !hasCertificate) {
      result.next_action = "The death is registered. Next, obtain the death certificate from the same registrar.";
    }
    steps.push({
      asset_id: null,
      procedure_id: result.procedures[0]?.id ?? null,
      service: "death_registration",
      title: "Register the death and obtain the death certificate",
      requirement: "required",
      derived_done: deathDone,
      engine_status: result.status,
      completeness: result.completeness ?? "orientation_only",
      execution_available: 0,
      payload: JSON.stringify({ ...result, compact: route.compact, fallback: route.fallback, route_status: route.routeStatus }),
      sort_order: SERVICE_ORDER.death_registration,
    });
  }

  // 2) Heir/family certificate — conditional, only surfaced as orientation.
  if (present(deceased?.residence_state ?? null)) {
    const route = resolveProcedure(
      { assetType: "property", service: "legal_heir_certificate", residenceState: present(deceased?.residence_state ?? null), deathState: present(deceased?.death_state ?? null), extra: base },
      lookupGuidance,
    );
    steps.push({
      asset_id: null,
      procedure_id: route.result.procedures[0]?.id ?? null,
      service: "legal_heir_certificate",
      title: "Check whether a heir / family certificate applies to your case",
      requirement: "conditional",
      derived_done: false,
      engine_status: route.result.status,
      completeness: route.result.completeness ?? "orientation_only",
      execution_available: 0,
      payload: JSON.stringify({ ...route.result, compact: route.compact, fallback: route.fallback, route_status: route.routeStatus }),
      sort_order: SERVICE_ORDER.legal_heir_certificate,
    });
  }

  // 3) One step per asset (claims proceed in parallel). The state-aware resolver picks
  // the route STRICTLY from the asset's own state/district (or the selected case state
  // for a state-scoped asset with no state of its own) — never another state's route —
  // and attaches an honest per-state fallback when that state has no verified procedure.
  assets.forEach((asset, i) => {
    const reviewReason = professionalReviewReason(asset.service, review);
    const route = resolveProcedure(
      {
        assetType: asset.asset_type,
        service: asset.service,
        assetState: present(asset.location?.state_code ?? null),
        assetDistrict: present(asset.location?.district ?? null),
        residenceState: present(deceased?.residence_state ?? null),
        deathState: present(deceased?.death_state ?? null),
        institution: present(asset.institution),
        recordType: present(asset.record_type),
        authority: present(asset.authority),
        hasDispute: review.hasDispute,
        professionalReview: reviewReason,
        extra: {
          ...base,
          nomineeStatus: present(asset.nominee_status),
          holdingMode: present(asset.holding_mode),
          scheme: present(asset.scheme),
        },
      },
      lookupGuidance,
    );
    steps.push({
      asset_id: asset.id,
      procedure_id: route.result.procedures[0]?.id ?? null,
      service: asset.service,
      title: asset.label
        ? `Claim / transfer: ${asset.label}`
        : `Claim / transfer this ${asset.asset_type.replace(/_/g, " ")}`,
      requirement: classifyRequirement(asset.service),
      derived_done: false,
      engine_status: route.result.status,
      completeness: route.result.completeness ?? "orientation_only",
      execution_available: 0,
      payload: JSON.stringify({
        ...route.result,
        compact: route.compact,
        fallback: route.fallback,
        route_status: route.routeStatus,
        ...(reviewReason ? { professional_review: reviewReason } : {}),
      }),
      sort_order: (SERVICE_ORDER[asset.service] ?? 19) * 100 + i,
    });
  });

  return steps.sort((a, b) => a.sort_order - b.sort_order);
}
