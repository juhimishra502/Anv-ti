// Grounded assistant for a specific case. Builds the guidance query from the case's
// own stored context (authorization-checked), then answers strictly from cited
// sources. Returns an honest unavailable state if AI credentials are absent.
import { error, guard, requireUser } from "@/lib/api/handler";
import { assertCaseAccess, getDeceased, listAssets } from "@/lib/db/repo";
import { groundedChatResponse } from "@/lib/ai/chat";
import type { GuidanceQuery } from "@/lib/guidance/types";

export const runtime = "nodejs";

function present(v: string | null | undefined): string | undefined {
  return v && v.trim() ? v : undefined;
}

export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  return guard(async () => {
    const user = await requireUser();
    const { id } = await ctx.params;
    assertCaseAccess(user.id, id);

    let body: {
      question?: unknown;
      assetId?: unknown;
      service?: unknown;
      history?: unknown;
      locale?: unknown;
    };
    try {
      body = await request.json();
    } catch {
      return error("Invalid JSON body.");
    }
    const question = typeof body.question === "string" ? body.question.trim() : "";
    if (!question) return error("A question is required.");
    if (question.length > 2000) return error("Question is too long.");

    const deceased = await getDeceased(id);
    const query: GuidanceQuery = {
      deceasedState: present(deceased?.residence_state),
      deceasedDistrict: present(deceased?.residence_district),
      deathState: present(deceased?.death_state),
      deathDistrict: present(deceased?.death_district),
      deathRegistrationStatus: present(deceased?.death_registered),
      willStatus: present(deceased?.will_status),
    };

    // Narrow to a specific asset or service if the client asked about one.
    if (typeof body.assetId === "string") {
      const asset = (await listAssets(id)).find((a) => a.id === body.assetId);
      if (asset) {
        query.assetType = asset.asset_type;
        query.service = asset.service;
        query.institution = present(asset.institution);
        query.nomineeStatus = present(asset.nominee_status);
        query.holdingMode = present(asset.holding_mode);
        query.recordType = present(asset.record_type);
        query.authority = present(asset.authority);
        query.scheme = present(asset.scheme);
        query.assetState = present(asset.location?.state_code ?? null);
        query.assetDistrict = present(asset.location?.district ?? null);
      }
    } else if (typeof body.service === "string") {
      query.service = body.service;
    }

    const history = Array.isArray(body.history)
      ? (body.history as unknown[])
          .filter(
            (m): m is { role: "user" | "assistant"; content: string } =>
              !!m &&
              typeof m === "object" &&
              (("role" in m && ((m as { role: unknown }).role === "user" || (m as { role: unknown }).role === "assistant"))) &&
              "content" in m &&
              typeof (m as { content: unknown }).content === "string",
          )
          .slice(-8)
      : [];

    const language = typeof body.locale === "string" ? body.locale : undefined;
    // Streaming NDJSON response (meta -> delta... -> done, or unavailable/error).
    return groundedChatResponse({ question, query, history, language });
  });
}
