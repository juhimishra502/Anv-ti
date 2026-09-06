"use client";
// Floating frosted pill navigation (reference video style): brand at left, an
// optional status chip in the middle, the language selector, and page actions.
import Link from "next/link";
import type { ReactNode } from "react";
import { LanguageSelector } from "./LanguageSelector";
import { useLocale } from "@/lib/i18n/context";

export function FloatingNav({
  chip,
  stateCode,
  children,
}: {
  chip?: ReactNode;
  stateCode?: string | null;
  children?: ReactNode;
}) {
  const { t } = useLocale();
  return (
    <div className="navwrap">
      <nav className="navpill" aria-label="Primary">
        <Link className="brand" href="/">
          {t("brand")}
        </Link>
        {chip ? <span className="chip">{chip}</span> : null}
        <span style={{ flex: 1 }} />
        <LanguageSelector stateCode={stateCode} compact />
        {children}
      </nav>
    </div>
  );
}
