"use client";
// Visible language selector shown in native scripts. Suggested languages (by the
// current state) are grouped first. Choosing an assistant-only language is labelled
// honestly. Usable before and after login.
import { LOCALES, suggestedLanguages, getLocale } from "@/lib/i18n/locales";
import { useLocale } from "@/lib/i18n/context";

export function LanguageSelector({
  stateCode,
  compact = false,
}: {
  stateCode?: string | null;
  compact?: boolean;
}) {
  const { locale, setLocale, t, info } = useLocale();
  const suggested = suggestedLanguages(stateCode);
  const suggestedLocales = suggested.map(getLocale);
  const others = LOCALES.filter((l) => !suggested.includes(l.code));

  return (
    <label className="row" style={{ margin: 0, gap: "0.4rem", alignItems: "center", fontWeight: 600 }}>
      <span aria-hidden>🌐</span>
      <span className="sr-only">{t("chooseLanguage")}</span>
      <select
        aria-label={t("chooseLanguage")}
        value={locale}
        onChange={(e) => setLocale(e.target.value)}
        style={{ minHeight: compact ? 40 : 48, width: "auto", minWidth: 150, fontWeight: 600 }}
      >
        <optgroup label={t("suggested")}>
          {suggestedLocales.map((l) => (
            <option key={l.code} value={l.code}>
              {l.native}
              {l.code !== "en" ? ` · ${l.english}` : ""}
              {!l.uiComplete ? " ✦" : ""}
            </option>
          ))}
        </optgroup>
        <optgroup label="All languages">
          {others.map((l) => (
            <option key={l.code} value={l.code}>
              {l.native} · {l.english}
              {!l.uiComplete ? " ✦" : ""}
            </option>
          ))}
        </optgroup>
      </select>
      {!info.uiComplete && (
        <span className="small muted" style={{ maxWidth: 220 }}>
          ✦ {t("assistantOnlyNote")}
        </span>
      )}
    </label>
  );
}
