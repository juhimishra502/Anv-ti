import type { PropertyRecord, UsageType } from "./types";

const USAGE_VALUES: UsageType[] = [
  "Residential",
  "Commercial",
  "Mixed",
  "Industrial",
  "Institutional",
];

function normUsage(v: string | undefined): UsageType | undefined {
  if (!v) return undefined;
  const hit = USAGE_VALUES.find((u) => u.toLowerCase() === v.trim().toLowerCase());
  return hit;
}

/** Parse a single CSV line, honouring double-quoted fields (which may contain commas). */
function parseLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function num(v: string | undefined): number {
  if (v == null || v === "") return 0;
  const n = Number(v.replace(/[₹,\s]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/**
 * Parse a property-roll CSV into PropertyRecord[].
 * Expected headers (case-insensitive, order-independent):
 *   id, address, usageDeclared, floorsDeclared, builtUpAreaDeclaredSqft,
 *   annualValueDeclared, taxPaidLastYear, yearsSinceAssessment,
 *   usageObserved, floorsObserved, builtUpAreaObservedSqft, observationNote
 * Throws on an unusable file (no header row / no data rows / missing key columns).
 */
export function parseRollCsv(text: string): PropertyRecord[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    throw new Error("CSV needs a header row and at least one property row.");
  }

  const headers = parseLine(lines[0]).map((h) => h.toLowerCase());
  const idx = (name: string) => headers.indexOf(name.toLowerCase());

  const required = ["id", "address", "usagedeclared", "floorsdeclared"];
  const missing = required.filter((r) => idx(r) === -1);
  if (missing.length) {
    throw new Error(`CSV is missing required columns: ${missing.join(", ")}.`);
  }

  const records: PropertyRecord[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = parseLine(lines[i]);
    const get = (name: string) => {
      const j = idx(name);
      return j === -1 ? undefined : cells[j];
    };

    const usageDeclared = normUsage(get("usagedeclared")) ?? "Residential";
    records.push({
      id: get("id") || `ROW-${i}`,
      address: get("address") || "(no address)",
      usageDeclared,
      floorsDeclared: num(get("floorsdeclared")),
      builtUpAreaDeclaredSqft: num(get("builtupareadeclaredsqft")),
      annualValueDeclared: num(get("annualvaluedeclared")),
      taxPaidLastYear: num(get("taxpaidlastyear")),
      yearsSinceAssessment: num(get("yearssinceassessment")),
      usageObserved: normUsage(get("usageobserved")),
      floorsObserved: get("floorsobserved") ? num(get("floorsobserved")) : undefined,
      builtUpAreaObservedSqft: get("builtupareaobservedsqft")
        ? num(get("builtupareaobservedsqft"))
        : undefined,
      observationNote: get("observationnote") || undefined,
    });
  }

  if (!records.length) throw new Error("No property rows found in the CSV.");
  return records;
}
