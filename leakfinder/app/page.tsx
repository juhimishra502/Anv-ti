"use client";

import { useEffect, useRef, useState } from "react";
import type { LeakItem, LeakReport, LeakType, Level, PropertyRecord } from "@/lib/types";
import { sampleWard, SAMPLE_WARD_NAME } from "@/lib/sampleWard";
import { parseRollCsv } from "@/lib/csv";
import { inr, inrCompact } from "@/lib/format";

type View = "empty" | "loading" | "success" | "error";

const LEAK_LABEL: Record<LeakType, string> = {
  under_declared_floors: "Under-declared floors",
  under_declared_area: "Under-declared area",
  usage_misclassification: "Usage misclassification",
  stale_assessment: "Stale assessment",
  not_on_roll: "No / zero collection",
  other: "Other",
};

const LOADING_STAGES = [
  "Reading the property roll…",
  "Comparing declared vs observed floors, area & usage…",
  "Recomputing assessable value where it looks understated…",
  "Estimating recoverable tax per property…",
  "Ranking the biggest leaks…",
];

function levelClasses(level: Level): string {
  switch (level) {
    case "high":
      return "bg-red-100 text-red-800 ring-red-200";
    case "medium":
      return "bg-amber-100 text-amber-800 ring-amber-200";
    case "low":
      return "bg-slate-100 text-slate-600 ring-slate-200";
  }
}

export default function Home() {
  const [view, setView] = useState<View>("empty");
  const [report, setReport] = useState<LeakReport | null>(null);
  const [error, setError] = useState<string>("");
  const [stage, setStage] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  // Cycle the loading messages so the AI wait feels like progress, not a dead spinner.
  useEffect(() => {
    if (view !== "loading") return;
    setStage(0);
    const id = setInterval(() => {
      setStage((s) => Math.min(s + 1, LOADING_STAGES.length - 1));
    }, 1400);
    return () => clearInterval(id);
  }, [view]);

  async function analyze(properties: PropertyRecord[], wardName: string) {
    setView("loading");
    setError("");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ properties, wardName }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Something went wrong. Please try again.");
        setView("error");
        return;
      }
      setReport(data as LeakReport);
      setView("success");
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
      setView("error");
    }
  }

  function onUploadClick() {
    fileRef.current?.click();
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-uploading the same file
    if (!file) return;
    try {
      const text = await file.text();
      const records = parseRollCsv(text);
      await analyze(records, file.name.replace(/\.csv$/i, ""));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read that CSV.");
      setView("error");
    }
  }

  function reset() {
    setReport(null);
    setError("");
    setView("empty");
  }

  return (
    <div className="min-h-full bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-3xl px-5 py-10 sm:py-14">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden>
              🏙️
            </span>
            <h1 className="text-2xl font-bold tracking-tight">Leakfinder</h1>
          </div>
          <p className="mt-1 text-slate-600">
            Find the property tax you&apos;re already owed. Turn a ward&apos;s roll into a ranked
            list of likely under-taxed properties — and a rupee figure worth chasing.
          </p>
        </header>

        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={onFile}
        />

        {view === "empty" && (
          <EmptyState onSample={() => analyze(sampleWard, SAMPLE_WARD_NAME)} onUpload={onUploadClick} />
        )}
        {view === "loading" && <LoadingState stage={stage} />}
        {view === "error" && <ErrorState message={error} onRetry={reset} />}
        {view === "success" && report && (
          <SuccessState report={report} onReset={reset} onUpload={onUploadClick} />
        )}

        <Disclaimer />
      </div>
    </div>
  );
}

function EmptyState({ onSample, onUpload }: { onSample: () => void; onUpload: () => void }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold">Analyze a ward</h2>
      <ol className="mt-3 space-y-1.5 text-sm text-slate-600">
        <li>1. Load a property roll (sample ward, or your own CSV).</li>
        <li>2. Leakfinder compares declared vs observed floors, area & usage.</li>
        <li>3. You get the biggest revenue leaks, ranked, with a ₹ estimate each.</li>
      </ol>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <button
          onClick={onSample}
          className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          Load sample ward →
        </button>
        <button
          onClick={onUpload}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Upload roll CSV
        </button>
      </div>
      <p className="mt-4 text-xs text-slate-500">
        CSV columns: <code className="rounded bg-slate-100 px-1">id, address, usageDeclared,
        floorsDeclared, builtUpAreaDeclaredSqft, annualValueDeclared, taxPaidLastYear,
        yearsSinceAssessment</code> and optional observed columns (<code className="rounded bg-slate-100 px-1">usageObserved,
        floorsObserved, builtUpAreaObservedSqft, observationNote</code>).
      </p>
    </section>
  );
}

function LoadingState({ stage }: { stage: number }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
        <span className="font-medium">Analyzing the ward</span>
      </div>
      <ul className="mt-4 space-y-2">
        {LOADING_STAGES.map((label, i) => (
          <li
            key={i}
            className={`flex items-center gap-2 text-sm transition ${
              i <= stage ? "text-slate-900" : "text-slate-400"
            }`}
          >
            <span aria-hidden>{i < stage ? "✓" : i === stage ? "•" : "○"}</span>
            {label}
          </li>
        ))}
      </ul>
    </section>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <section className="rounded-2xl border border-red-200 bg-red-50 p-6">
      <h2 className="font-semibold text-red-800">Couldn&apos;t analyze that</h2>
      <p className="mt-1 text-sm text-red-700">{message}</p>
      <button
        onClick={onRetry}
        className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500"
      >
        Start over
      </button>
    </section>
  );
}

function SuccessState({
  report,
  onReset,
  onUpload,
}: {
  report: LeakReport;
  onReset: () => void;
  onUpload: () => void;
}) {
  return (
    <section className="space-y-5">
      {/* Headline impact number */}
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
        <p className="text-sm font-medium text-emerald-700">
          Estimated recoverable property tax — {report.wardName}
        </p>
        <p className="mt-1 text-4xl font-bold tracking-tight text-emerald-900">
          {inrCompact(report.totalRecoverable)}
          <span className="ml-2 text-base font-medium text-emerald-700">/ year</span>
        </p>
        <p className="mt-2 text-sm text-emerald-800">
          {report.propertiesFlagged} of {report.propertiesAnalyzed} properties flagged for review ·{" "}
          {inr(report.totalRecoverable)} total
        </p>
        {report.summary && <p className="mt-3 text-sm text-emerald-900/80">{report.summary}</p>}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Flagged properties</h2>
        <div className="flex gap-2">
          <button
            onClick={onUpload}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Upload another
          </button>
          <button
            onClick={onReset}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Start over
          </button>
        </div>
      </div>

      <ul className="space-y-3">
        {report.items.map((item) => (
          <LeakCard key={item.id} item={item} />
        ))}
        {report.items.length === 0 && (
          <li className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
            No material leaks found in this ward — the roll looks well-assessed.
          </li>
        )}
      </ul>
    </section>
  );
}

function LeakCard({ item }: { item: LeakItem }) {
  return (
    <li className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{item.address}</p>
          <p className="text-xs text-slate-500">{item.id}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-emerald-700">{inr(item.recoverableAnnual)}</p>
          <p className="text-xs text-slate-500">est. recoverable / yr</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="rounded-full bg-slate-900 px-2 py-0.5 text-xs font-medium text-white">
          {LEAK_LABEL[item.leakType]}
        </span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${levelClasses(item.severity)}`}>
          {item.severity} severity
        </span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${levelClasses(item.confidence)}`}>
          {item.confidence} confidence
        </span>
      </div>
      <p className="mt-3 text-sm text-slate-700">{item.reasoning}</p>
    </li>
  );
}

function Disclaimer() {
  return (
    <p className="mt-8 rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
      <strong className="text-slate-600">Estimates for triage only.</strong> Leakfinder flags
      properties to <em>review</em> — not confirmed evasion or final assessments. Figures are
      approximate. Verify by field survey before issuing any demand notice.
    </p>
  );
}
