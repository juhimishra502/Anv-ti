// Liveness probe for Railway's healthcheck. Deliberately does not touch the
// database — it reports that the server process is up and serving, so a Neon
// hiccup doesn't cause Railway to kill and restart an otherwise-healthy app.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(): Response {
  return Response.json({ status: "ok" });
}
