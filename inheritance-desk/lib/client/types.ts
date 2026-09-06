// Client-safe view types (no server-only imports). GuidanceResult is reused from
// the engine types module, which is free of server-only dependencies.
import type { GuidanceResult } from "@/lib/guidance/types";

export type { GuidanceResult };

export interface SessionUser {
  id: string;
  display_name: string;
  is_demo: boolean;
}

export interface CaseSummary {
  id: string;
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Deceased {
  full_name: string | null;
  residence_state: string | null;
  residence_district: string | null;
  death_state: string | null;
  death_district: string | null;
  death_date: string | null;
  death_registered: string | null;
  death_certificate: string | null;
  will_status: string | null;
  certificate_copies: string | null;
  will_registered: string | null;
  executor_present: string | null;
  probate_status: string | null;
  dispute_status: string | null;
  applicant_relationship: string | null;
  nri_status: string | null;
}

export interface AssetView {
  id: string;
  asset_type: string;
  service: string;
  label: string | null;
  institution: string | null;
  nominee_status: string | null;
  holding_mode: string | null;
  record_type: string | null;
  authority: string | null;
  scheme: string | null;
  location: {
    state_code: string | null;
    district: string | null;
  } | null;
}

export interface RoadmapStepView {
  id: string;
  case_id: string;
  asset_id: string | null;
  procedure_id: string | null;
  service: string;
  title: string;
  requirement: "required" | "conditional" | "optional";
  derived_done: number;
  engine_status: string;
  completeness: string;
  execution_available: number;
  user_status: string;
  submitted_at: string | null;
  office: string | null;
  ack_number: string | null;
  method: string | null;
  follow_up_date: string | null;
  notes: string | null;
  sort_order: number;
  payload: GuidanceResult | null;
}

export interface CaseView {
  case: CaseSummary;
  deceased: Deceased | null;
  heirs: unknown[];
  assets: AssetView[];
  roadmap: RoadmapStepView[];
}

export interface ReferenceData {
  catalog_version: string;
  coverage_note: string;
  states: {
    code: string;
    name: string;
    type: string;
    procedure_coverage: string;
    execution_available: boolean;
  }[];
  asset_types: { id: string; service: string }[];
}
