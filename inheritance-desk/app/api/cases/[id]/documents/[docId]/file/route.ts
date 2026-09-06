// Streams a stored document's bytes — ONLY to a signed-in owner of the case. This is
// the sole way to read a file; there is no public URL. Served inline for viewing.
import { error, guard, requireUser } from "@/lib/api/handler";
import { assertCaseAccess, getDocument } from "@/lib/db/repo";
import { readUpload } from "@/lib/documents/storage";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string; docId: string }> },
): Promise<Response> {
  return guard(async () => {
    const user = await requireUser();
    const { id, docId } = await ctx.params;
    await assertCaseAccess(user.id, id);
    const doc = await getDocument(docId);
    if (!doc || doc.case_id !== id) return error("Document not found.", 404);
    const bytes = await readUpload(docId);
    if (!bytes) return error("File is missing from storage.", 404);
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": doc.mime,
        "Content-Disposition": `inline; filename="${(doc.original_name ?? docId).replace(/"/g, "")}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  });
}
