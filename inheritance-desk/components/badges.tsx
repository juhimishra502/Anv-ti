import type { JSX } from "react";

const COVERAGE_LABEL: Record<string, { text: string; cls: string }> = {
  directory_only: { text: "Directory only", cls: "badge" },
  partial_information: { text: "Some info researched", cls: "badge-info" },
  orientation_available: { text: "Orientation available", cls: "badge-info" },
  procedure_researched: { text: "Procedure researched", cls: "badge-info" },
};

export function CoverageBadge({ coverage }: { coverage: string }): JSX.Element {
  const meta = COVERAGE_LABEL[coverage] ?? { text: coverage.replace(/_/g, " "), cls: "badge" };
  return <span className={`badge ${meta.cls}`}>{meta.text}</span>;
}

const ENGINE_STATUS: Record<string, { text: string; cls: string }> = {
  orientation_only: { text: "Orientation", cls: "badge-info" },
  needs_context: { text: "Needs more details", cls: "badge-warn" },
  review_due: { text: "Source review due", cls: "badge-warn" },
  professional_review: { text: "Professional review", cls: "badge-danger" },
  local_review_required: { text: "Local review required", cls: "badge-warn" },
  outside_india: { text: "Outside India", cls: "badge-warn" },
};

export function StatusBadge({ status }: { status: string }): JSX.Element {
  const meta = ENGINE_STATUS[status] ?? { text: status.replace(/_/g, " "), cls: "badge" };
  return <span className={`badge ${meta.cls}`}>{meta.text}</span>;
}

const REQUIREMENT: Record<string, { text: string; cls: string }> = {
  required: { text: "Required", cls: "badge-danger" },
  conditional: { text: "Conditional", cls: "badge-warn" },
  optional: { text: "Optional", cls: "badge" },
  completed: { text: "Completed", cls: "badge-ok" },
};

export function RequirementBadge({ requirement }: { requirement: string }): JSX.Element {
  const meta = REQUIREMENT[requirement] ?? { text: requirement, cls: "badge" };
  return <span className={`badge ${meta.cls}`}>{meta.text}</span>;
}

export function ExecutionBadge(): JSX.Element {
  return (
    <span className="badge badge-warn" title="No route here is a certified, ready-to-file checklist.">
      Not execution-ready
    </span>
  );
}
