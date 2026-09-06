"use client";
// Global 3D-depth driver. Mounted once in the root layout, it publishes the pointer
// position as CSS custom properties (--mx, --my in the range -1..1) on <html>, so the
// stylesheet can give every glass panel and card a subtle perspective tilt + depth on
// every page — one cheap listener, no per-element React state, no background motion.
// Honors prefers-reduced-motion (does nothing) and cleans up its listener.
import { useEffect } from "react";

export function Depth3D() {
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const root = document.documentElement;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      const mx = (e.clientX / window.innerWidth - 0.5) * 2;
      const my = (e.clientY / window.innerHeight - 0.5) * 2;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        root.style.setProperty("--mx", mx.toFixed(3));
        root.style.setProperty("--my", my.toFixed(3));
      });
    };
    const reset = () => { root.style.setProperty("--mx", "0"); root.style.setProperty("--my", "0"); };
    root.style.setProperty("--mx", "0");
    root.style.setProperty("--my", "0");
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", reset);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", reset);
    };
  }, []);
  return null;
}
