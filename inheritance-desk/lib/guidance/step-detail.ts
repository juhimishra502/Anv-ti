// The canonical 30-field step-detail template. Every JourneyGraph node opens a panel
// built from EXACTLY these 30 structured fields (never one big paragraph). Each field
// is produced from the procedure's structured `detail`; when a value is unknown it is
// returned as an explicit "not_verified" field carrying: the exact missing field, the
// authority that can confirm it, the last-checked date, and whether the rest of the
// route is still safe to follow.

export type FieldStatus = "verified" | "to_be_confirmed" | "not_verified";

export interface StepDetailField {
  n: number;               // 1..30, fixed order
  key: string;
  label: string;
  value: string | null;    // display value, or null when unknown
  status: FieldStatus;
  missing_field?: string;  // when unknown: what exactly is missing
  authority?: string;      // when unknown: who can confirm it
  last_checked: string | null;
  rest_safe: boolean;      // is the rest of the route safe to follow without this field?
}

interface Fact { value?: string | null; status?: string; note?: string | null }
const isFact = (v: unknown): v is Fact => !!v && typeof v === "object" && "status" in (v as object);

/** Read a value that may be a plain string, a FactRef, or absent. */
function readFact(v: unknown): { value: string | null; verified: boolean } {
  if (v == null || v === "") return { value: null, verified: false };
  if (isFact(v)) {
    const verified = v.status === "published" || v.status === "officially_published";
    return { value: verified && v.value ? String(v.value) : null, verified: !!(verified && v.value) };
  }
  return { value: String(v), verified: true };
}

const list = (v: unknown): string | null => (Array.isArray(v) && v.length ? v.map(String).join("; ") : null);

interface Ctx {
  office: Record<string, unknown> | null;
  example: Record<string, unknown> | null;
  fees: Array<Record<string, unknown>>;
  timeline: Record<string, unknown> | null;
  outcome: Record<string, unknown> | null;
  sources: { id: string; title: string; publisher: string; url: string }[];
  lastVerified: string | null;
}

interface FieldDef {
  key: string;
  label: string;
  extract: (d: Record<string, unknown>, ctx: Ctx) => { value: string | null; verified: boolean };
  authority: (d: Record<string, unknown>) => string;
}

/** The office/registrar that can confirm an unknown execution field. */
function authFor(d: Record<string, unknown>): string {
  const o = d.office && typeof d.office === "object" ? (d.office as Record<string, unknown>) : null;
  const chain = o && typeof o.authority_chain === "string" ? o.authority_chain : null;
  const resp = o && typeof o.responsible === "string" ? o.responsible : null;
  return resp || chain || "the responsible office/registrar for this service";
}

const FIELDS: FieldDef[] = [
  { key: "why_applies", label: "Why this applies", extract: (d) => readFact(d.applicability ?? d.purpose), authority: () => "the responsible authority" },
  { key: "expected_result", label: "Expected result", extract: (d, c) => readFact(c.outcome?.result ?? d.purpose), authority: () => "the responsible authority" },
  { key: "prerequisites", label: "Prerequisites", extract: (d) => ({ value: list(d.prerequisites), verified: Array.isArray(d.prerequisites) && d.prerequisites.length > 0 }), authority: () => "the responsible authority" },
  { key: "action_sequence", label: "Action sequence", extract: (d) => ({ value: list(d.actions), verified: Array.isArray(d.actions) && d.actions.length > 0 }), authority: () => "the responsible authority" },
  { key: "who_may_apply", label: "Who may apply", extract: (d) => readFact(d.who_may_apply), authority: () => "the responsible authority" },
  { key: "required_documents", label: "Required documents", extract: (d) => {
      const docs = Array.isArray(d.documents) ? (d.documents as Array<Record<string, unknown>>) : [];
      const req = docs.filter((x) => x.required === "required").map((x) => String(x.name));
      return { value: req.length ? req.join("; ") : null, verified: req.length > 0 };
    }, authority: () => "the responsible authority" },
  { key: "conditional_documents", label: "Conditional documents", extract: (d) => {
      const docs = Array.isArray(d.documents) ? (d.documents as Array<Record<string, unknown>>) : [];
      const cond = docs.filter((x) => x.required && x.required !== "required").map((x) => String(x.name));
      return { value: cond.length ? cond.join("; ") : null, verified: cond.length > 0 };
    }, authority: () => "the responsible authority" },
  { key: "form_name", label: "Form name", extract: (d) => readFact(typeof d.form === "object" && d.form ? (d.form as Record<string, unknown>).name : d.form), authority: authFor },
  { key: "form_download", label: "Official form download", extract: (d) => readFact(typeof d.form === "object" && d.form ? (d.form as Record<string, unknown>).url : null), authority: authFor },
  { key: "online_link", label: "Online application link", extract: (d) => readFact((d.online_channel as Record<string, unknown> | null)?.url ?? null), authority: authFor },
  { key: "offline_method", label: "Offline application method", extract: (d) => readFact(d.offline_channel), authority: authFor },
  { key: "responsible_authority", label: "Responsible authority", extract: (_d, c) => readFact(c.office?.authority_chain), authority: () => "the responsible authority" },
  { key: "office_name", label: "Office name", extract: (_d, c) => readFact(c.example?.label ?? c.office?.responsible), authority: () => "the responsible office/registrar" },
  { key: "office_address", label: "Office address", extract: (_d, c) => readFact(c.example?.address ?? c.office?.address), authority: () => "the responsible office" },
  { key: "service_counter", label: "Service counter", extract: (_d, c) => readFact(c.office?.service_counter), authority: () => "the responsible office" },
  { key: "officer_role", label: "Officer role", extract: (_d, c) => readFact(c.example?.officer ?? c.office?.officer_name ?? c.office?.responsible), authority: () => "the responsible office" },
  { key: "telephone", label: "Telephone", extract: (_d, c) => readFact(c.example?.phone ?? c.office?.phone), authority: () => "the responsible office" },
  { key: "email", label: "Email", extract: (_d, c) => readFact(c.example?.email ?? c.office?.email), authority: () => "the responsible office" },
  { key: "public_hours", label: "Public hours", extract: (_d, c) => readFact(c.example?.hours ?? c.office?.hours), authority: () => "the responsible office" },
  { key: "appointment", label: "Appointment requirement", extract: (_d, c) => readFact(c.office?.appointment), authority: () => "the responsible office" },
  { key: "fee", label: "Official/institution fee", extract: (_d, c) => {
      const f = c.fees.find((x) => x.amount && (x.status === "published" || x.status === "published_schedule"));
      return { value: f ? `${f.label}: ${f.amount}` : null, verified: !!f };
    }, authority: () => "the responsible office/institution" },
  { key: "payment_method", label: "Payment method", extract: (_d, c) => readFact(c.office?.payment_method), authority: () => "the responsible office" },
  { key: "published_timeline", label: "Published timeline", extract: (_d, c) => readFact(c.timeline?.published), authority: () => "the responsible authority" },
  { key: "estimated_timeline", label: "Estimated timeline", extract: (_d, c) => readFact(c.timeline?.estimated), authority: () => "the responsible authority" },
  { key: "notice_hearing", label: "Notice, verification, inspection or hearing", extract: (_d, c) => readFact(c.timeline?.notice_objection), authority: () => "the responsible authority" },
  { key: "acknowledgement", label: "Acknowledgement and tracking", extract: (_d, c) => readFact(c.outcome?.how_to_check), authority: () => "the responsible authority" },
  { key: "completion_evidence", label: "Completion evidence", extract: (_d, c) => readFact(c.outcome?.result ?? c.outcome?.unlocks), authority: () => "the responsible authority" },
  { key: "correction_appeal", label: "Correction and appeal", extract: (_d, c) => readFact(c.outcome?.correction_appeal), authority: () => "the responsible authority" },
  { key: "sources", label: "Official sources and last verification", extract: (_d, c) => ({
      value: c.sources.length ? c.sources.map((s) => `${s.publisher}: ${s.url}`).join("; ") + (c.lastVerified ? ` (last verified ${c.lastVerified})` : "") : null,
      verified: c.sources.length > 0,
    }), authority: () => "the publishing authority" },
  { key: "verification_status", label: "Verification status and unresolved fields", extract: (d) => ({
      value: Array.isArray(d.unresolved) && d.unresolved.length ? `Unresolved: ${(d.unresolved as string[]).join("; ")}` : "No unresolved fields recorded.",
      verified: true,
    }), authority: () => "the publishing authority" },
];

export interface StepDetailInput {
  detail?: Record<string, unknown> | null;
  sources?: { id: string; title: string; publisher: string; url: string }[];
  routeSafe?: boolean; // false only when the route itself is unusable (e.g. no reviewed checklist)
}

/** Build the fixed 30-field panel for a procedure. Always returns 30 fields. */
export function buildStepDetail(input: StepDetailInput): StepDetailField[] {
  const d = (input.detail ?? {}) as Record<string, unknown>;
  const office = d.office && typeof d.office === "object" ? (d.office as Record<string, unknown>) : null;
  const example = office && Array.isArray(office.examples) && office.examples.length ? (office.examples[0] as Record<string, unknown>) : null;
  const ctx: Ctx = {
    office,
    example,
    fees: Array.isArray(d.fees) ? (d.fees as Array<Record<string, unknown>>) : [],
    timeline: d.timeline && typeof d.timeline === "object" ? (d.timeline as Record<string, unknown>) : null,
    outcome: d.outcome && typeof d.outcome === "object" ? (d.outcome as Record<string, unknown>) : null,
    sources: input.sources ?? [],
    lastVerified: typeof d.last_verified === "string" ? d.last_verified : null,
  };
  const routeSafe = input.routeSafe !== false;
  return FIELDS.map((f, i) => {
    const { value, verified } = f.extract(d, ctx);
    if (value != null && verified) {
      return { n: i + 1, key: f.key, label: f.label, value, status: "verified", last_checked: ctx.lastVerified, rest_safe: routeSafe };
    }
    if (value != null && !verified) {
      return { n: i + 1, key: f.key, label: f.label, value, status: "to_be_confirmed", missing_field: f.label, authority: f.authority(d), last_checked: ctx.lastVerified, rest_safe: routeSafe };
    }
    return {
      n: i + 1, key: f.key, label: f.label, value: null, status: "not_verified",
      missing_field: f.label, authority: f.authority(d), last_checked: ctx.lastVerified, rest_safe: routeSafe,
    };
  });
}

export const STEP_DETAIL_FIELD_COUNT = FIELDS.length;
