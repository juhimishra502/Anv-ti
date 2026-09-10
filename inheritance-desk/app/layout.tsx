import type { Metadata } from "next";
import "./globals.css";
import { LocaleProvider } from "@/lib/i18n/context";
import { Environment } from "@/components/Environment";
import { AudioProvider } from "@/lib/audio/audio-context";
import { MusicPlayer } from "@/components/MusicPlayer";
import { Depth3D } from "@/components/Depth3D";

export const metadata: Metadata = {
  title: "Anvīti",
  description:
    "Accessible, source-grounded guidance for families claiming and transferring assets after a death in India. Orientation only — no route is certified for execution.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a href="#main" className="sr-only">
          Skip to main content
        </a>
        <Environment />
        <LocaleProvider>
          <AudioProvider>
            <Depth3D />
            {children}
            <MusicPlayer />
          </AudioProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
