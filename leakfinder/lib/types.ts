// Shared types for Leakfinder — the property roll in, the leak report out.

export type UsageType =
  | "Residential"
  | "Commercial"
  | "Mixed"
  | "Industrial"
  | "Institutional";

/** One row of a ward's property tax roll, with optional observed signals. */
export interface PropertyRecord {
  id: string;
  address: string;
  /** Usage the owner declared / the roll records. */
  usageDeclared: UsageType;
  /** Floors on the roll. */
  floorsDeclared: number;
  /** Built-up area on the roll, in sq ft. */
  builtUpAreaDeclaredSqft: number;
  /** Assessed annual (rateable) value the tax is computed on, in ₹. */
  annualValueDeclared: number;
  /** Property tax actually paid last year, in ₹ (0 = no record / unpaid). */
  taxPaidLastYear: number;
  /** Years since the last assessment (proxy for staleness). */
  yearsSinceAssessment: number;
  // --- Observed signals (imagery / field survey / utility load). May be absent. ---
  usageObserved?: UsageType;
  floorsObserved?: number;
  builtUpAreaObservedSqft?: number;
  observationNote?: string;
}

export type LeakType =
  | "under_declared_floors"
  | "under_declared_area"
  | "usage_misclassification"
  | "stale_assessment"
  | "not_on_roll"
  | "other";

export type Level = "high" | "medium" | "low";

/** One flagged property in the leak report. */
export interface LeakItem {
  id: string;
  address: string;
  leakType: LeakType;
  severity: Level;
  confidence: Level;
  /** Estimated recoverable property tax per year, in ₹. */
  recoverableAnnual: number;
  reasoning: string;
}

/** The structured output Claude returns. */
export interface LeakReport {
  wardName: string;
  propertiesAnalyzed: number;
  propertiesFlagged: number;
  /** Sum of recoverableAnnual across flagged properties, in ₹/year. */
  totalRecoverable: number;
  items: LeakItem[];
  summary: string;
}
