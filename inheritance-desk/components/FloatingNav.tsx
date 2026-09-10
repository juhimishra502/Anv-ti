"use client";
// Floating frosted pill navigation (reference video style): brand at left, an
// optional status chip in the middle, the language selector, and page actions.
import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { LanguageSelector } from "./LanguageSelector";

export function FloatingNav({
  chip,
  stateCode,
  children,
}: {
  chip?: ReactNode;
  stateCode?: string | null;
  children?: ReactNode;
}) {
  return (
    <div className="navwrap">
      <nav className="navpill" aria-label="Primary">
        <Link className="brand anviti-nav-brand" href="/" aria-label="Anvīti home">
          <Image src="/images/anviti-rose-infinity.png" alt="" width={1774} height={887} priority />
          <span>Anvīti</span>
        </Link>
        {chip ? <span className="chip">{chip}</span> : null}
        <span style={{ flex: 1 }} />
        <LanguageSelector stateCode={stateCode} compact />
        {children}
      </nav>
    </div>
  );
}
