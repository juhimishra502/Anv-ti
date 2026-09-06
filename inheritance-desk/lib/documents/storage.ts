// Private document storage backed by Neon (Postgres). File bytes are stored in the
// document_blobs table (base64) so uploads survive a serverless/ephemeral-filesystem
// deploy. Bytes are only ever read back through an ownership-checked API route —
// there is no public URL.
//
// Validation: an allowlist of types and a size cap. NOTE: automated malware/virus
// scanning is NOT implemented — files are marked scan_status='not_scanned' and this
// limitation is surfaced honestly in the UI. Do not present them as scanned.
import "server-only";
import { sql, nowIso } from "@/lib/db/client";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

// Allowed MIME -> file extension.
export const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
};

export async function saveUpload(docId: string, bytes: Uint8Array): Promise<void> {
  const b64 = Buffer.from(bytes).toString("base64");
  await sql()`
    INSERT INTO document_blobs (id, content_b64, created_at)
    VALUES (${docId}, ${b64}, ${nowIso()})
    ON CONFLICT (id) DO UPDATE SET content_b64 = excluded.content_b64`;
}

export async function readUpload(docId: string): Promise<Buffer | null> {
  const rows = await sql()`SELECT content_b64 FROM document_blobs WHERE id = ${docId}`;
  const row = rows[0] as { content_b64: string } | undefined;
  if (!row) return null;
  return Buffer.from(row.content_b64, "base64");
}

export async function deleteUpload(docId: string): Promise<void> {
  await sql()`DELETE FROM document_blobs WHERE id = ${docId}`;
}
