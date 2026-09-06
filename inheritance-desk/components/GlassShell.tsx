// The large translucent application frame from the reference — content sits inside a
// frosted glass panel floating over the environmental background, with soft depth
// accents. Purely presentational; children carry all functionality.
import type { ReactNode } from "react";

export function GlassShell({
  children,
  wide = true,
}: {
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="glass-shell" style={wide ? { maxWidth: 1080 } : { maxWidth: 760 }}>
      {/* Soft floating depth accents behind the content (decorative). */}
      <span className="depth" aria-hidden style={{ width: 120, height: 120, top: -28, left: -22, background: "rgba(255,255,255,0.5)" }} />
      <span className="depth" aria-hidden style={{ width: 90, height: 90, bottom: -24, right: -18, background: "color-mix(in srgb, var(--meadow-2) 55%, white)" }} />
      {children}
    </div>
  );
}
