// Admin coverage console (READ-ONLY). Shows jurisdiction coverage, procedure
// freshness/review status, and unresolved critical fields from the catalogue.
// Honest scope: this does NOT implement role-based admin auth, source review
// queues, publish/rollback, or second-person approval — it is a coverage dashboard.
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { loadCatalog, loadOffices } from "@/lib/guidance/catalog";
import { FloatingNav } from "@/components/FloatingNav";
import { GlassShell } from "@/components/GlassShell";

export const runtime = "nodejs";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <>
        <FloatingNav />
        <main id="main" className="container">
          <GlassShell wide={false}>
            <h1>Admin console</h1>
            <p className="muted">Please sign in to view coverage.</p>
            <Link className="btn" href="/signin">Sign in</Link>
          </GlassShell>
        </main>
      </>
    );
  }

  const catalog = loadCatalog();
  const offices = loadOffices();
  const today = new Date().toISOString().slice(0, 10);

  // State/UT coverage counts.
  const byCoverage: Record<string, number> = {};
  for (const s of catalog.states) byCoverage[s.procedure_coverage] = (byCoverage[s.procedure_coverage] ?? 0) + 1;

  const procedures = catalog.procedures.map((p) => ({
    id: p.id,
    title: p.title,
    service: p.service,
    completeness: p.completeness,
    legal: p.legal_review_status,
    review_due: p.review_due,
    stale: p.review_due < today,
    execution: p.execution_available,
    unresolved: p.detail?.unresolved ?? [],
    limits: p.limits,
  }));
  const execReady = procedures.filter((p) => p.execution).length;
  const detailed = procedures.filter((p) => p.completeness === "detailed_orientation").length;

  return (
    <>
      <FloatingNav />
      <main id="main" className="container container-wide">
        <GlassShell wide>
        <h1>Admin coverage console</h1>
        <div className="notice notice-danger small">
          Read-only dashboard. Role-based admin auth, source-review queue, translation review, and
          publish/rollback with second-person approval are <strong>not implemented</strong>. No record
          is marked verified-for-execution.
        </div>

        <div className="card">
          <h2>Jurisdiction coverage ({catalog.states.length} states/UTs)</h2>
          <ul className="clean small">
            {Object.entries(byCoverage).map(([k, v]) => (
              <li key={k}>
                <strong>{v}</strong> — {k.replace(/_/g, " ")}
              </li>
            ))}
          </ul>
          <p className="small muted">
            Catalogue {catalog.meta.catalog_version}. {catalog.meta.coverage}
          </p>
        </div>

        <div className="card">
          <h2>
            Procedures ({procedures.length}) · execution-ready: <span className="badge badge-danger">{execReady}</span> · detailed: <span className="badge badge-info">{detailed}</span>
          </h2>
          <ul className="clean small">
            {procedures.map((p) => (
              <li key={p.id} style={{ marginBottom: "0.5rem" }}>
                <strong>{p.title}</strong>{" "}
                <span className="badge">{p.service.replace(/_/g, " ")}</span>{" "}
                <span className="badge badge-info">{p.completeness.replace(/_/g, " ")}</span>{" "}
                <span className="badge badge-warn">{p.legal.replace(/_/g, " ")}</span>{" "}
                {p.stale ? <span className="badge badge-danger">review due ({p.review_due})</span> : <span className="badge badge-ok">reviewed to {p.review_due}</span>}
                {p.unresolved.length > 0 && (
                  <ul className="clean" style={{ marginTop: "0.25rem" }}>
                    {p.unresolved.map((u, i) => (
                      <li key={i} className="muted">⚠ {u}</li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <h2>Offices ({offices.length})</h2>
          <ul className="clean small">
            {offices.map((o) => {
              const fields: Array<[string, { status: string } | undefined]> = [
                ["address", o.address],
                ["officer", o.person],
                ["phone", o.phone],
                ["hours", o.public_hours],
              ];
              const unverified = fields.filter(
                ([, f]) => f && f.status !== "officially_published" && f.status !== "officially_listed",
              );
              return (
                <li key={o.id} style={{ marginBottom: "0.35rem" }}>
                  <strong>{o.jurisdiction}</strong> ({o.state}/{o.district}) · {o.role?.value}
                  {unverified.length > 0 && (
                    <span className="muted"> — to confirm: {unverified.map(([k]) => k).join(", ")}</span>
                  )}
                </li>
              );
            })}
          </ul>
          <p className="small muted">
            Contact review policy is a product cadence, not a government expiry.
          </p>
        </div>
        </GlassShell>
      </main>
    </>
  );
}
