// Types for the source-grounded guidance catalogue and lookup engine.
// These mirror the structures in government-data/*.json exactly. Do not add fields
// that are not backed by the research pack.

export type StateType = "state" | "ut";

export interface StateRecord {
  code: string;
  name: string;
  type: StateType;
  aliases: string[];
  directory_source_id: string | null;
  directory_row: number | null;
  portal_as_published: string | null;
  portal_url: string | null;
  portal_status: string;
  fallback_url: string | null;
  /** directory_only | partial_information | ... — never implies execution readiness */
  procedure_coverage: string;
  execution_available: boolean;
}

export interface SourceRecord {
  id: string;
  title: string;
  publisher: string;
  url: string;
  kind: string;
  research_checked_on: string | null;
  source_publication_date: string | null;
  access_note: string | null;
  snapshot_path: string | null;
  sha256: string | null;
  snapshot_status: string;
  final_url?: string | null;
  bytes?: number | null;
  retrieved_at?: string | null;
  download_error?: string | null;
}

export interface ProcessingTime {
  value: number;
  unit: string;
  condition: string;
}

/** A fact whose confidence/provenance is tracked. `status` distinguishes a value
 *  confirmed from a primary official source vs. one still to be confirmed. */
export interface FactRef {
  value: string | null;
  status: "published" | "to_be_confirmed" | "conflicting" | "secondary";
  source_id?: string;
  note?: string;
}

export interface DetailDoc {
  name: string;
  required: "required" | "conditional" | "typical";
  note?: string;
}

export interface DetailFee {
  label: string;
  amount: string | null;
  status: FactRef["status"];
  basis?: string;
  source_id?: string;
  note?: string;
}

/** Deep, source-backed detail for a fully-researched procedure. Optional: most
 *  catalogue entries remain orientation-only and omit this. */
export interface ProcedureDetail {
  purpose: string;
  applicability: string;
  who_may_apply: string;
  prerequisites: string[];
  actions: string[];
  online_channel?: { label: string; url: string; note?: string };
  offline_channel?: string;
  form?: { name: string | null; note?: string };
  documents: DetailDoc[];
  documents_note: string;
  office: {
    authority_chain: string;
    responsible: string;
    jurisdiction_rule: string;
    address: FactRef;
    officer_name: FactRef;
    phone: FactRef;
    hours: FactRef;
    grievance?: string;
    /** Concrete, source-verified office instances for specific jurisdictions. */
    examples?: {
      label: string;
      address: FactRef;
      officer: FactRef;
      phone: FactRef;
      email: FactRef;
      hours: FactRef;
    }[];
  };
  fees: DetailFee[];
  fees_note: string;
  timeline: {
    published: string | null;
    notice_objection: string;
    delay_help: string;
    status: FactRef["status"];
  };
  outcome: {
    result: string;
    how_to_check: string;
    unlocks: string;
    correction_appeal: string;
  };
  evidence: { source_id: string; page_section: string }[];
  last_verified: string;
  unresolved: string[];
}

export interface ProcedureRecord {
  id: string;
  version: number;
  title: string;
  service: string;
  location_basis: string;
  match: Record<string, string>;
  needed_context: string[];
  source_ids: string[];
  evidence_locator: string;
  last_source_reviewed: string;
  review_due: string;
  review_status: string;
  legal_review_status: string;
  execution_available: boolean;
  completeness: string;
  summary: string;
  steps: string[];
  document_examples: string[];
  fees: unknown | null;
  published_processing_time: ProcessingTime | null;
  application_url: string | null;
  limits: string;
  /** Present only for fully-researched procedures (e.g. UP succession mutation). */
  detail?: ProcedureDetail;
}

export interface AssetTypeRecord {
  id: string;
  service: string;
}

export interface CatalogMeta {
  schema_version: number;
  catalog_version: string;
  assembled_on: string;
  state_count: number;
  refresh_policy: string;
  coverage: string;
  no_live_network_at_lookup: boolean;
  default_review_days: number;
  [key: string]: unknown;
}

export interface Catalog {
  meta: CatalogMeta;
  states: StateRecord[];
  sources: SourceRecord[];
  procedures: ProcedureRecord[];
  assetTypes: AssetTypeRecord[];
}

/** A single field of an office record carries its own provenance and verification status. */
export interface OfficeField<T = string | null> {
  value: T;
  sources: string[];
  status: string;
  note: string | null;
}

export interface OfficeRecord {
  id: string;
  state: string;
  district: string;
  jurisdiction: string;
  role: OfficeField;
  person: OfficeField;
  issuing_officer_name?: OfficeField;
  address: OfficeField;
  phone: OfficeField;
  official_mobile?: OfficeField;
  deputy_mobile?: OfficeField;
  email: OfficeField;
  public_hours: OfficeField;
  appointment: OfficeField;
  jurisdiction_mapping: OfficeField<string[] | string | null>;
  last_inspected_on: string;
  contact_review_due: string;
  review_interval_note: string;
}

// ---- Lookup query + result ----

export interface GuidanceQuery {
  country?: string;
  assetType?: string;
  service?: string;
  assetState?: string;
  assetDistrict?: string;
  userState?: string;
  deceasedState?: string;
  deceasedDistrict?: string;
  deathState?: string;
  deathDistrict?: string;
  recordType?: string;
  authority?: string;
  institution?: string;
  nomineeStatus?: string;
  holdingMode?: string;
  willStatus?: string;
  courtOrderStatus?: string;
  scheme?: string;
  sector?: string;
  employmentStatus?: string;
  policyStatus?: string;
  hasDispute?: boolean;
  asOf?: string;
  [key: string]: string | boolean | undefined;
}

export interface GuidanceQuestion {
  field: string;
  question: string;
}

export interface ProcedureCard extends ProcedureRecord {
  status: "orientation_only" | "needs_context" | "review_due";
  missing_context: string[];
  sources: SourceRecord[];
  requirement_for_execution: string;
}

export interface DirectoryEntry {
  state: string;
  source_id: string;
  source: SourceRecord | undefined;
  portal_url: string | null;
  portal_as_published: string | null;
  portal_status: string;
  fallback_url: string | null;
  note: string;
}

export interface GuidanceResult {
  catalog_version?: string;
  status: string;
  service?: string;
  as_of?: string;
  selected_asset_state?: string | null;
  jurisdiction_state?: string | null;
  jurisdiction_basis?: string;
  execution_available: boolean;
  completeness?: string;
  explanation?: string;
  next_action?: string;
  questions?: GuidanceQuestion[];
  procedures: ProcedureCard[] | [];
  directory?: DirectoryEntry | null;
  warnings?: string[];
  message?: string;
  field?: string;
  states?: { code: string; name: string }[];
  /** Added by the state-aware resolver (resolve-procedure.ts). */
  route_status?: string;
  professional_review?: string;
  fallback?: { stateName: string; verified: boolean; message: string; missing: string[] } | null;
  compact?: {
    heading: string;
    bullets: string[];
    chips: { office: string; fee: string; timeline: string; status: string; state: string | null };
  };
}
