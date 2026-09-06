"use client";
// Client helpers to translate dynamic/generated strings into the current locale via
// the cached /api/translate endpoint. While loading, or when translation is
// unavailable (no key), the English source is returned so the UI always renders.
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale } from "./context";

const CHUNK = 40;

/**
 * Translate an arbitrary set of strings into `locale`, chunked to stay under the API
 * cap. Returns a source->translated map. Missing/unavailable entries are omitted, so
 * callers fall back to the source string. `signal` lets callers cancel on locale
 * change (prevents a previous language's result arriving late).
 */
export async function fetchTranslations(
  texts: string[],
  locale: string,
  version: string,
  signal?: AbortSignal,
): Promise<Record<string, string>> {
  const unique = Array.from(new Set(texts.filter(Boolean)));
  if (locale === "en" || unique.length === 0) return {};
  const chunks: string[][] = [];
  for (let i = 0; i < unique.length; i += CHUNK) chunks.push(unique.slice(i, i + CHUNK));
  const map: Record<string, string> = {};
  const results = await Promise.all(
    chunks.map((batch) =>
      fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texts: batch, locale, version }),
        signal,
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => ({ batch, translations: d?.translations as string[] | undefined }))
        .catch(() => ({ batch, translations: undefined })),
    ),
  );
  for (const r of results) {
    if (!r.translations) continue;
    r.batch.forEach((s, i) => {
      if (r.translations![i]) map[s] = r.translations![i];
    });
  }
  return map;
}

export function useTranslated(texts: string[], version = "v1"): (s: string) => string {
  const { locale } = useLocale();
  const [map, setMap] = useState<Record<string, string>>({});

  const unique = useMemo(() => Array.from(new Set(texts.filter(Boolean))), [texts]);
  const key = useMemo(() => `${locale}|${version}|${unique.join("")}`, [locale, version, unique]);

  useEffect(() => {
    if (locale === "en" || unique.length === 0) return; // identity handled in tr()
    const ctrl = new AbortController();
    fetchTranslations(unique, locale, version, ctrl.signal)
      .then((m) => {
        if (!ctrl.signal.aborted && Object.keys(m).length) setMap(m);
      })
      .catch(() => {});
    // Abort in-flight requests when locale/content changes — no stale-language result.
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return useCallback((s: string) => (locale === "en" ? s : (map[s] ?? s)), [map, locale]);
}
