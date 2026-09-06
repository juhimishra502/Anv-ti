"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_LOCALE, getLocale, type LocaleInfo } from "./locales";
import {
  CANONICAL,
  DICTS,
  MESSAGE_IDS,
  hasReviewedUi,
  translate,
  type MessageKey,
} from "./messages";
import { fetchTranslations } from "./translate-client";

const STORAGE_KEY = "id_locale";
// Bump when the canonical catalogue changes so machine-translated chrome invalidates.
const UI_VERSION = "ui-2026-09-05";

interface LocaleCtx {
  locale: string;
  info: LocaleInfo;
  setLocale: (code: string) => void;
  t: (key: MessageKey) => string;
  /** True while a non-reviewed locale's chrome is still being machine-translated. */
  uiLoading: boolean;
}

const Ctx = createContext<LocaleCtx | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<string>(DEFAULT_LOCALE);
  // Machine-translated chrome for the current non-reviewed locale: message id -> text.
  const [dyn, setDyn] = useState<Record<string, string>>({});
  const [uiLoading, setUiLoading] = useState(false);
  const localeRef = useRef(locale);

  // Load persisted locale. LOCAL choice wins (e.g. the language picked on the landing
  // before login) so it never reverts to a fresh demo user's default 'en'. Only fall
  // back to the server preference when no local choice exists; sync local → server.
  useEffect(() => {
    (async () => {
      let stored: string | null = null;
      try {
        stored = localStorage.getItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
      if (stored) setLocaleState(stored);
      try {
        const res = await fetch("/api/preferences");
        if (!res.ok) return;
        const data = await res.json();
        if (stored) {
          // Persist the local choice to the account if the server differs.
          if (data?.ui_language && data.ui_language !== stored) {
            fetch("/api/preferences", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ui_language: stored }),
            }).catch(() => {});
          }
        } else if (data?.ui_language) {
          setLocaleState(data.ui_language);
          try {
            localStorage.setItem(STORAGE_KEY, data.ui_language);
          } catch {
            /* ignore */
          }
        }
      } catch {
        /* not signed in / offline */
      }
    })();
  }, []);

  // Keep <html lang/dir> in sync (RTL for Urdu etc.).
  useEffect(() => {
    const info = getLocale(locale);
    document.documentElement.lang = info.code;
    document.documentElement.dir = info.dir;
  }, [locale]);

  // Atomic chrome translation for non-reviewed locales. On locale change we clear the
  // old machine-translation immediately and fetch the new one; the AbortController in
  // the cleanup guarantees a previous language's result cannot arrive late.
  useEffect(() => {
    localeRef.current = locale;
    // Clearing prior-language chrome and setting the loading flag are the intended
    // synchronous sync when the locale changes (atomic language switch).
    /* eslint-disable react-hooks/set-state-in-effect */
    if (hasReviewedUi(locale)) {
      setDyn({});
      setUiLoading(false);
      return;
    }
    setDyn({}); // don't show the previous language's chrome
    setUiLoading(true);
    /* eslint-enable react-hooks/set-state-in-effect */
    const ctrl = new AbortController();
    const values = MESSAGE_IDS.map((id) => CANONICAL[id]);
    fetchTranslations(values, locale, UI_VERSION, ctrl.signal)
      .then((map) => {
        if (ctrl.signal.aborted || localeRef.current !== locale) return;
        const next: Record<string, string> = {};
        for (const id of MESSAGE_IDS) {
          const en = CANONICAL[id];
          if (map[en]) next[id] = map[en];
        }
        setDyn(next);
        setUiLoading(false);
      })
      .catch(() => {
        if (!ctrl.signal.aborted) setUiLoading(false);
      });
    return () => ctrl.abort();
  }, [locale]);

  const setLocale = useCallback((code: string) => {
    setLocaleState(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      /* ignore */
    }
    fetch("/api/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ui_language: code }),
    }).catch(() => {});
  }, []);

  const t = useCallback(
    (key: MessageKey): string => {
      const dict = DICTS[locale];
      if (dict && dict[key]) return dict[key] as string;
      if (dyn[key]) return dyn[key];
      return translate("en", key); // canonical English fallback
    },
    [locale, dyn],
  );

  const value = useMemo<LocaleCtx>(
    () => ({ locale, info: getLocale(locale), setLocale, t, uiLoading }),
    [locale, setLocale, t, uiLoading],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLocale(): LocaleCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
