// Single document: DELETE removes it (user's own retention control). The file
// itself is streamed by the nested /file route, not from a public path.
import { json, error, guard, requireUser } from "@/lib/api/handler";
import { assertCaseAccess, getDocument, deleteDocumentRow, audit } from "@/lib/db/repo";
import { deleteUpload } from "@/lib/documents/storage";

export const runtime = "nodejs";

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string; docId: string }> },
): Promise<Response> {
  return guard(async () => {
    const user = await requireUser();
    const { id, docId } = await ctx.params;
    await assertCaseAccess(user.id, id);
    const doc = await getDocument(docId);
    if (!doc || doc.case_id !== id) return error("Document not found.", 404);
    await deleteUpload(docId);
    await deleteDocumentRow(docId);
    await audit(user.id, id, "document.deleted", doc.label ?? doc.original_name ?? docId);
    return json({ ok: true });
  });
}
