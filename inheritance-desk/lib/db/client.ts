// Neon (serverless Postgres) is the database. Queries go over Neon's HTTP driver.
// Access is server-side only via a single trusted role (DATABASE_URL); there is no
// public/anon key, so per-case authorization is enforced in application code (repo.ts)
// through the user's session and family membership — not via Postgres RLS.
import "server-only";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { randomUUID } from "node:crypto";

let sqlFn: NeonQueryFunction<false, false> | null = null;

/**
 * Neon SQL client. Use as a tagged template for normal queries:
 *   await sql`SELECT * FROM users WHERE id = ${id}`   // → rows[]
 * and sql.query(text, params) for dynamically-built statements:
 *   await sql.query(`UPDATE t SET ${sets} WHERE id = $${n}`, values)
 * Throws a clear error if DATABASE_URL is missing.
 */
export function sql(): NeonQueryFunction<false, false> {
  if (sqlFn) return sqlFn;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("Neon is not configured. Set DATABASE_URL in .env.local.");
  }
  sqlFn = neon(url);
  return sqlFn;
}

/** True when the Neon connection string is present (for an honest "DB unavailable" state). */
export function isDbConfigured(): boolean {
  return !!process.env.DATABASE_URL;
}

export function newId(prefix = ""): string {
  const id = randomUUID();
  return prefix ? `${prefix}_${id}` : id;
}

export function nowIso(): string {
  return new Date().toISOString();
}
