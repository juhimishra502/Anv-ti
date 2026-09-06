// Server-only IO wrapper around the pure engine (engine.ts). Loads the versioned
// catalogue from disk once and answers queries. No live network at lookup time.
import "server-only";
import { loadCatalog } from "./catalog";
import { createLookup, type Lookup } from "./engine";
import type { GuidanceQuery, GuidanceResult, StateRecord } from "./types";

export { createLookup } from "./engine";
export type { Lookup } from "./engine";

let defaultLookup: Lookup | undefined;

export function lookupGuidance(query: GuidanceQuery): GuidanceResult {
  try {
    defaultLookup ??= createLookup(loadCatalog());
    return defaultLookup.lookup(query);
  } catch {
    return {
      status: "catalog_unavailable",
      message: "Guidance is temporarily unavailable. Retry or contact support.",
      procedures: [],
      execution_available: false,
    };
  }
}

export function getStates(): StateRecord[] {
  try {
    defaultLookup ??= createLookup(loadCatalog());
    return defaultLookup.states;
  } catch {
    return [];
  }
}
