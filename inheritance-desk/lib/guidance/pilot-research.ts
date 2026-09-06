// Imports the verified operational-pilot research (Delhi, Tamil Nadu, Maharashtra,
// Karnataka) into the shared `detail` shape used by the 30-field step panel, WITHOUT
// inventing anything: every fact keeps its status, conflicts and unresolved gaps are
// preserved verbatim, and source provenance (URL, snapshot hash, retrieval date) is
// carried through from the source manifest. (Uttar Pradesh is already a full detail
// in procedures.json — up-varasat-mutation.)

export interface PilotFact { value: unknown; sources?: string[]; status?: string; note?: string | null }
export interface PilotProcedure {
  id: string;
  state: string;
  title: string;
  route: Record<string, unknown>;
  execution_approved: boolean;
  checked_on: string;
  office_ids?: string[];
  facts: Record<string, PilotFact>;
  gaps?: string[];
}

export interface ManifestEntry {
  id: string;
  url: string;
  final_url?: string;
  checked_on?: string;
  status?: string;
  sha256?: string;
  retrieved_at?: string;
}

const asArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.map(String) : v == null ? [] : [String(v)];

// Statuses that mean "do not treat as an executable, current, verified value".
const UNVERIFIED = new Set([
  "not_verified", "conflicting", "requires_legal_review", "legacy_manual", "legacy_rule_requires_review",
  "legacy_form_requires_confirmation", "published_requires_reconciliation", "channel_specific_unresolved",
  "authority_published_deadline_unverified", "dated_official_schedule", "published_schedule", "published_estimate",
  "manual_published", "published_not_guaranteed", "published_process",
]);
const isVerified = (s?: string) => s === "officially_published" || s === "published";

/** Convert a pilot procedure into the `detail` object the 30-field builder reads.
 *  Conflicting and unverified facts are surfaced under `unresolved`, never as clean
 *  values. */
export function pilotToDetail(p: PilotProcedure): Record<string, unknown> {
  const f = p.facts;
  const unresolved: string[] = [];

  // Preserve gaps verbatim.
  for (const g of p.gaps ?? []) unresolved.push(g);
  // Preserve conflicts and unverified facts with their notes.
  for (const [key, fact] of Object.entries(f)) {
    if (fact.status === "conflicting") {
      unresolved.push(`CONFLICT — ${key}: ${asArray(fact.value).join(" / ")}${fact.note ? ` (${fact.note})` : ""}`);
    } else if (fact.status && UNVERIFIED.has(fact.status) && fact.note) {
      unresolved.push(`${key}: ${fact.note}`);
    }
  }

  const documents = asArray(f.documents?.value).map((name) => ({ name, required: "typical" as const }));
  const actions = [...asArray(f.workflow?.value), ...asArray(f.submission?.value)];

  const fees: Array<{ label: string; amount: string | null; status: string }> = [];
  for (const [key, label] of [["government_fee_inr", "Government fee"], ["government_application_fee_inr", "Government application fee"], ["centre_charge_inr", "Service-centre charge"], ["service_fee_inr", "Service fee"]] as const) {
    const fact = f[key];
    if (fact && fact.value != null) {
      fees.push({ label, amount: `₹${fact.value}`, status: isVerified(fact.status) ? "published" : "to_be_confirmed" });
    }
  }

  const noticeDays = f.notice_days?.value ?? (f.sla_days && typeof f.sla_days.value === "number" ? f.sla_days.value : null);

  return {
    purpose: p.title,
    applicability: `${p.title} — verified research record for ${p.state} (${JSON.stringify(p.route)}); exact scenario only.`,
    who_may_apply: f.eligibility && isVerified(f.eligibility.status) ? String(f.eligibility.value) : null,
    prerequisites: [],
    actions,
    documents,
    documents_note: f.documents?.note ?? undefined,
    fees,
    timeline: {
      published: null,
      notice_objection: noticeDays != null ? `Notice period: ${noticeDays} day(s) (not total processing time).` : "",
      delay_help: "",
    },
    outcome: {
      result: f.output ? String(f.output.value) : "",
      how_to_check: "",
      unlocks: "",
      correction_appeal: f.appeal?.value ? String(f.appeal.value) : "",
    },
    office: null, // office facts require confirmation; kept in the pilot offices dataset
    last_verified: p.checked_on,
    unresolved,
  };
}

/** Source provenance for a pilot procedure, resolved from the source manifest. */
export function pilotProvenance(p: PilotProcedure, manifest: ManifestEntry[]): Array<{ id: string; url: string; snapshot_sha256: string | null; retrieved_at: string | null; status: string | null }> {
  const byId = new Map(manifest.map((m) => [m.id, m]));
  const ids = new Set<string>();
  for (const fact of Object.values(p.facts)) for (const s of fact.sources ?? []) ids.add(s);
  return [...ids].map((id) => {
    const m = byId.get(id);
    return { id, url: m?.final_url ?? m?.url ?? "", snapshot_sha256: m?.sha256 ?? null, retrieved_at: m?.retrieved_at ?? null, status: m?.status ?? null };
  });
}
