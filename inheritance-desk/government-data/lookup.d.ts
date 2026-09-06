export type GuidanceQuery = {
  assetState?: string; userState?: string; deceasedState?: string; deathState?: string;
  assetDistrict?: string; deceasedDistrict?: string; deathDistrict?: string;
  country?: string; assetType?: string; service?: string; recordType?: string;
  authority?: string; institution?: string; nomineeStatus?: string; holdingMode?: string;
  willStatus?: string; courtOrderStatus?: string; scheme?: string; sector?: string;
  employmentStatus?: string; policyStatus?: string; deathRegistrationStatus?: string;
  hasDispute?: boolean; asOf?: string;
};
export type CatalogData = {
  meta: Record<string, unknown>; states: Record<string, unknown>[];
  sources: Record<string, unknown>[]; procedures: Record<string, unknown>[];
  assetTypes: Record<string, unknown>[];
};
export type GuidanceResult = {
  status: string; execution_available: false; procedures: Record<string, unknown>[];
  next_action?: string; message?: string; jurisdiction_state?: string | null;
  selected_asset_state?: string | null; questions?: { field: string; question: string }[];
  [key: string]: unknown;
};
export function loadCatalog(base?: URL): CatalogData;
export function createLookup(data: CatalogData): {
  lookup(query?: GuidanceQuery): GuidanceResult;
  normalizeState(value: string): Record<string, unknown> | null;
  states: Record<string, unknown>[];
};
export function lookupGuidance(query?: GuidanceQuery): GuidanceResult;
