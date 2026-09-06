// Document vault for a case: list (GET) and upload (POST multipart). Ownership is
// enforced on every request. Files are validated (type allowlist + size cap) and
// stored privately on disk; only masked metadata is returned.
import { json, error, guard, requireUser } from "@/lib/api/handler";
import { assertCaseAccess, addDocument, listDocuments } from "@/lib/db/repo";
import { newId } from "@/lib/db/index";
import { saveUpload, ALLOWED_TYPES, MAX_UPLOAD_BYTES } from "@/lib/documents/storage";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
  return guard(async () => {
    const user = await requireUser();
    const { id } = await ctx.params;
    await assertCaseAccess(user.id, id);
    // Never expose storage paths — only metadata the UI needs.
    const docs = (await listDocuments(id)).map((d) => ({
      id: d.id,
      label: d.label,
      original_name: d.original_name,
      mime: d.mime,
      size: d.size,
      scan_status: d.scan_status,
      created_at: d.created_at,
    }));
    return json({ documents: docs });
  });
}

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
  return guard(async () => {
    const user = await requireUser();
    const { id } = await ctx.params;
    await assertCaseAccess(user.id, id);

    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return error("Expected a multipart upload.");
    }
    const file = form.get("file");
    if (!(file instanceof File)) return error("No file provided.");
    if (file.size === 0) return error("The file is empty.");
    if (file.size > MAX_UPLOAD_BYTES) return error("File is too large (max 10 MB).", 413);

    const ext = ALLOWED_TYPES[file.type];
    if (!ext) return error("Unsupported file type. Allowed: PDF, JPG, PNG, WEBP, HEIC.", 415);

    const labelRaw = form.get("label");
    const label = typeof labelRaw === "string" && labelRaw.trim() ? labelRaw.trim().slice(0, 120) : null;

    const docId = newId("doc");
    const bytes = new Uint8Array(await file.arrayBuffer());
    // Insert the metadata row first: the blob has a foreign key to documents(id).
    await addDocument({
      id: docId,
      caseId: id,
      uploadedBy: user.id,
      label,
      originalName: file.name?.slice(0, 200) ?? null,
      mime: file.type,
      size: file.size,
      ext,
    });
    await saveUpload(docId, bytes);
    return json({ ok: true, documents: (await listDocuments(id)).map((d) => ({ id: d.id, label: d.label, original_name: d.original_name, mime: d.mime, size: d.size, scan_status: d.scan_status, created_at: d.created_at })) }, 201);
  });
}
