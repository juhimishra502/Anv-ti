// Server-only loader for the government-data catalogue.
// Reads the versioned research pack from disk. No live network calls happen at
// lookup time (catalog.no_live_network_at_lookup === true).
import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import type {
  Catalog,
  StateRecord,
  SourceRecord,
  ProcedureRecord,
  AssetTypeRecord,
  CatalogMeta,
  OfficeRecord,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "government-data");

function readJson<T>(...segments: string[]): T {
  const file = path.join(DATA_DIR, ...segments);
  return JSON.parse(readFileSync(file, "utf8")) as T;
}

let cached: Catalog | null = null;

export function loadCatalog(): Catalog {
  if (cached) return cached;
  cached = {
    meta: readJson<CatalogMeta>("catalog.json"),
    states: readJson<StateRecord[]>("states.json"),
    sources: readJson<SourceRecord[]>("sources.json"),
    procedures: readJson<ProcedureRecord[]>("procedures.json"),
    assetTypes: readJson<AssetTypeRecord[]>("asset-types.json"),
  };
  return cached;
}

let cachedOffices: OfficeRecord[] | null = null;

export function loadOffices(): OfficeRecord[] {
  if (cachedOffices) return cachedOffices;
  try {
    cachedOffices = readJson<OfficeRecord[]>("operational-pilot", "offices.json");
  } catch {
    cachedOffices = [];
  }
  return cachedOffices;
}

// Verified operational-pilot research (Delhi, Tamil Nadu, Maharashtra, Karnataka),
// with its source manifest (snapshot hashes, retrieval dates). Loaded lazily.
import type { PilotProcedure, ManifestEntry } from "./pilot-research";

let cachedPilot: PilotProcedure[] | null = null;
export function loadPilotResearch(): PilotProcedure[] {
  if (cachedPilot) return cachedPilot;
  try {
    cachedPilot = readJson<PilotProcedure[]>("operational-pilot", "procedure-research.json");
  } catch {
    cachedPilot = [];
  }
  return cachedPilot;
}

let cachedManifest: ManifestEntry[] | null = null;
export function loadPilotManifest(): ManifestEntry[] {
  if (cachedManifest) return cachedManifest;
  try {
    cachedManifest = readJson<ManifestEntry[]>("operational-pilot", "source-manifest.json");
  } catch {
    cachedManifest = [];
  }
  return cachedManifest;
}
