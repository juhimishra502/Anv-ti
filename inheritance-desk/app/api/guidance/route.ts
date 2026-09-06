// Ad-hoc guidance lookup (used for the asset-add preview and general queries).
// Requires sign-in. Input is validated by the engine itself; we only forward fields.
import { json, error, guard, requireUser } from "@/lib/api/handler";
import { lookupGuidance } from "@/lib/guidance/lookup";
import type { GuidanceQuery } from "@/lib/guidance/types";

export const runtime = "nodejs";

const ALLOWED = new Set([
  "country",
  "assetType",
  "service",
  "assetState",
  "assetDistrict",
  "userState",
  "deceasedState",
  "deceasedDistrict",
  "deathState",
  "deathDistrict",
  "recordType",
  "authority",
  "institution",
  "nomineeStatus",
  "holdingMode",
  "willStatus",
  "courtOrderStatus",
  "scheme",
  "sector",
  "employmentStatus",
  "policyStatus",
  "hasDispute",
  "asOf",
]);

export async function POST(request: Request): Promise<Response> {
  return guard(async () => {
    await requireUser();
    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return error("Invalid JSON body.");
    }
    const query: GuidanceQuery = {};
    for (const [key, value] of Object.entries(body)) {
      if (!ALLOWED.has(key)) continue;
      (query as Record<string, unknown>)[key] = value;
    }
    return json(lookupGuidance(query));
  });
}
