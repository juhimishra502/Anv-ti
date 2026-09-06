// Service registry: the routing + template metadata for every claim/transfer service.
// The grounded engine (engine.ts) decides orientation content from procedures.json;
// this layer adds what a service IS — its label, route basis, graph-node template,
// whether professional review is a conditional node, and its intake-schema key.
//
// Rule: professional review is a CONDITIONAL node — it never replaces the complete
// informational route. `professionalReviewReason` returns why a review is suggested
// for this case (dispute/minor/missing heir, or an inherently complex service), or
// null when none applies.

export type RouteBasis = "asset_location" | "deceased_residence" | "death_place" | "institution_or_scheme";

export interface ServiceMeta {
  id: string;
  label: string;
  routeBasis: RouteBasis;
  /** Graph-node template used by the JourneyGraph for this service's node. */
  graphNode: "certificate" | "property" | "institution" | "specialist";
  /** true once a source-grounded procedure exists; false = template/orientation pointer only. */
  grounded: boolean;
  /** always = a review node is always suggested; conditional = only when case flags trigger it. */
  professionalReview: "always" | "conditional" | "rare";
  /** Intake sub-questionnaire key (see lib/assets/schema.ts); null for non-asset services. */
  intakeKey: string | null;
}

export const SERVICES: Record<string, ServiceMeta> = {
  death_registration: { id: "death_registration", label: "Register the death & get the certificate", routeBasis: "death_place", graphNode: "certificate", grounded: true, professionalReview: "rare", intakeKey: null },
  legal_heir_certificate: { id: "legal_heir_certificate", label: "Legal heir / family certificate", routeBasis: "deceased_residence", graphNode: "certificate", grounded: true, professionalReview: "conditional", intakeKey: null },
  property_mutation: { id: "property_mutation", label: "Property mutation / transfer", routeBasis: "asset_location", graphNode: "property", grounded: true, professionalReview: "conditional", intakeKey: "property" },
  bank_claim: { id: "bank_claim", label: "Bank / deposit claim", routeBasis: "institution_or_scheme", graphNode: "institution", grounded: true, professionalReview: "rare", intakeKey: "bank" },
  securities_transmission: { id: "securities_transmission", label: "Shares / demat transmission", routeBasis: "institution_or_scheme", graphNode: "institution", grounded: true, professionalReview: "conditional", intakeKey: "demat" },
  mutual_fund_claim: { id: "mutual_fund_claim", label: "Mutual fund transmission", routeBasis: "institution_or_scheme", graphNode: "institution", grounded: true, professionalReview: "rare", intakeKey: "mutual_fund" },
  insurance_claim: { id: "insurance_claim", label: "Insurance death claim", routeBasis: "institution_or_scheme", graphNode: "institution", grounded: true, professionalReview: "rare", intakeKey: "insurance" },
  epfo_claim: { id: "epfo_claim", label: "EPF / EPS / EDLI claim", routeBasis: "institution_or_scheme", graphNode: "institution", grounded: true, professionalReview: "rare", intakeKey: "epfo" },
  nps_claim: { id: "nps_claim", label: "NPS death withdrawal", routeBasis: "institution_or_scheme", graphNode: "institution", grounded: true, professionalReview: "rare", intakeKey: "nps" },
  postal_claim: { id: "postal_claim", label: "Post-office savings claim", routeBasis: "institution_or_scheme", graphNode: "institution", grounded: true, professionalReview: "rare", intakeKey: "post_office" },
  gsec_transmission: { id: "gsec_transmission", label: "Government securities transmission", routeBasis: "institution_or_scheme", graphNode: "institution", grounded: true, professionalReview: "conditional", intakeKey: "gsec" },
  locker_access: { id: "locker_access", label: "Bank locker access", routeBasis: "institution_or_scheme", graphNode: "institution", grounded: true, professionalReview: "conditional", intakeKey: "locker" },
  unclaimed_deposit: { id: "unclaimed_deposit", label: "Unclaimed deposits / IEPF", routeBasis: "institution_or_scheme", graphNode: "institution", grounded: true, professionalReview: "conditional", intakeKey: "unclaimed" },

  // ---- Dedicated specialist services (replacing generic specialist_review) --------
  ppf_death_claim: { id: "ppf_death_claim", label: "PPF death claim", routeBasis: "institution_or_scheme", graphNode: "institution", grounded: true, professionalReview: "rare", intakeKey: "ppf" },
  corporate_bond_transmission: { id: "corporate_bond_transmission", label: "Corporate bond transmission", routeBasis: "institution_or_scheme", graphNode: "institution", grounded: true, professionalReview: "conditional", intakeKey: "corporate_bond" },
  sovereign_gold_bond_transmission: { id: "sovereign_gold_bond_transmission", label: "Sovereign Gold Bond transmission", routeBasis: "institution_or_scheme", graphNode: "institution", grounded: true, professionalReview: "conditional", intakeKey: "sgb" },
  vehicle_transmission: { id: "vehicle_transmission", label: "Vehicle ownership transfer", routeBasis: "asset_location", graphNode: "institution", grounded: true, professionalReview: "conditional", intakeKey: "vehicle" },
  sole_proprietorship_succession: { id: "sole_proprietorship_succession", label: "Sole proprietorship succession", routeBasis: "institution_or_scheme", graphNode: "specialist", grounded: true, professionalReview: "always", intakeKey: "sole_proprietorship" },
  partnership_interest_succession: { id: "partnership_interest_succession", label: "Partnership interest succession", routeBasis: "institution_or_scheme", graphNode: "specialist", grounded: true, professionalReview: "always", intakeKey: "partnership" },
  llp_interest_succession: { id: "llp_interest_succession", label: "LLP interest succession", routeBasis: "institution_or_scheme", graphNode: "specialist", grounded: true, professionalReview: "always", intakeKey: "llp" },
  private_company_share_transmission: { id: "private_company_share_transmission", label: "Private company share transmission", routeBasis: "institution_or_scheme", graphNode: "specialist", grounded: true, professionalReview: "always", intakeKey: "private_company" },
  unlisted_share_transmission: { id: "unlisted_share_transmission", label: "Unlisted share transmission", routeBasis: "institution_or_scheme", graphNode: "specialist", grounded: true, professionalReview: "conditional", intakeKey: "unlisted_shares" },
  family_pension_claim: { id: "family_pension_claim", label: "Family pension claim", routeBasis: "institution_or_scheme", graphNode: "institution", grounded: true, professionalReview: "conditional", intakeKey: "family_pension" },
  gratuity_death_claim: { id: "gratuity_death_claim", label: "Gratuity death claim", routeBasis: "institution_or_scheme", graphNode: "institution", grounded: true, professionalReview: "conditional", intakeKey: "gratuity" },
  employer_benefit_claim: { id: "employer_benefit_claim", label: "Employer benefit claim", routeBasis: "institution_or_scheme", graphNode: "specialist", grounded: false, professionalReview: "always", intakeKey: "employer_benefit" },
  overseas_asset_succession: { id: "overseas_asset_succession", label: "Overseas asset succession", routeBasis: "institution_or_scheme", graphNode: "specialist", grounded: false, professionalReview: "always", intakeKey: "overseas" },
  digital_account_legacy: { id: "digital_account_legacy", label: "Digital account legacy", routeBasis: "institution_or_scheme", graphNode: "specialist", grounded: false, professionalReview: "always", intakeKey: "digital" },
  cryptoasset_recovery: { id: "cryptoasset_recovery", label: "Cryptoasset recovery", routeBasis: "institution_or_scheme", graphNode: "specialist", grounded: false, professionalReview: "always", intakeKey: "crypto" },
  estate_liability_resolution: { id: "estate_liability_resolution", label: "Estate liability resolution", routeBasis: "institution_or_scheme", graphNode: "specialist", grounded: false, professionalReview: "always", intakeKey: "liability" },
  specialist_review: { id: "specialist_review", label: "Specialist / professional review", routeBasis: "institution_or_scheme", graphNode: "specialist", grounded: false, professionalReview: "always", intakeKey: null },
};

export function serviceMeta(service: string): ServiceMeta {
  return SERVICES[service] ?? { id: service, label: service.replace(/_/g, " "), routeBasis: "institution_or_scheme", graphNode: "institution", grounded: false, professionalReview: "conditional", intakeKey: null };
}

export interface ReviewContext {
  hasDispute?: boolean;
  hasMinor?: boolean;
  hasMissingHeir?: boolean;
}

/** Why a professional-review node is suggested for this service+case, or null.
 *  This is ADDITIVE — the informational route is always shown alongside it. */
export function professionalReviewReason(service: string, ctx: ReviewContext): string | null {
  if (ctx.hasDispute) return "A dispute or objection was recorded — arrange qualified review before acting on any claim.";
  if (ctx.hasMissingHeir) return "An heir is missing/untraceable — this usually needs a court or legal route.";
  const meta = serviceMeta(service);
  if (ctx.hasMinor && (meta.graphNode === "property" || meta.professionalReview !== "rare")) {
    return "A minor heir is involved — guardianship/court permission may be required for this asset.";
  }
  if (meta.professionalReview === "always") {
    return "This asset type usually needs a qualified professional (this route is orientation only).";
  }
  return null;
}
