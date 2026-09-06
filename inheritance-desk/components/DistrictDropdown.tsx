"use client";
// Database-backed, dependent, type-to-search district dropdown. Loads districts for
// the selected state from /api/jurisdictions (local DB, no live government call).
// - Changing the state clears an incompatible district (via the effect).
// - Honest states: loading, error+retry, empty (import pending), and "I don't know".
// - Never silently falls back to free text.
import { useCallback, useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n/context";

interface Item {
  code: string;
  name: string;
}

export function DistrictDropdown({
  stateCode,
  value,
  onChange,
  label,
}: {
  stateCode: string | undefined;
  value: string;
  onChange: (name: string) => void;
  label: string;
}) {
  const { t } = useLocale();
  const [items, setItems] = useState<Item[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");

  const load = useCallback(async () => {
    if (!stateCode) {
      setItems([]);
      setStatus("idle");
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch(`/api/jurisdictions?parent=${encodeURIComponent(stateCode)}&level=district`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setItems(data.items ?? []);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, [stateCode]);

  // Reload when the parent state changes and clear an incompatible child selection.
  useEffect(() => {
    // Clearing the child and showing the loading state on parent change is the
    // intended synchronization when the selected state changes.
    onChange("");
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateCode]);

  return (
    <div>
      <label htmlFor="district-dd">{label}</label>
      {status === "loading" && <p className="small muted">{t("loading")}</p>}
      {status === "error" && (
        <div className="small">
          <span className="badge badge-danger">error</span>{" "}
          <button type="button" className="btn btn-ghost btn-small" onClick={load}>
            Retry
          </button>
        </div>
      )}
      <select
        id="district-dd"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={!stateCode || status === "loading"}
      >
        <option value="">{t("assetTypeSelect")}</option>
        {items.map((it) => (
          <option key={it.code} value={it.name}>
            {it.name}
          </option>
        ))}
        <option value="__unknown__">{t("iDontKnow")}</option>
      </select>
      {status === "ready" && items.length === 0 && stateCode && (
        <p className="small muted">{t("districtsUnavailable")}</p>
      )}
    </div>
  );
}
