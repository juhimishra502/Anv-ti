// Database entrypoint. The store is Neon (serverless Postgres); the client and
// helpers live in ./client. This module re-exports them so existing imports from
// "@/lib/db" keep working.
export { sql, isDbConfigured, newId, nowIso } from "./client";
