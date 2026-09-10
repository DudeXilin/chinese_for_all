import type { Metadata } from "next";

import "./globals.css";
import ProfileButton from "@/components/profile-button";

export const metadata: Metadata = {
  title: "CHINESE FOR ALL",
  description: "Изучение китайского языка.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <head>
        {/* Temporary diagnostic tool - floating bug button, full-screen
            copyable log. A plain native <script> tag (not next/script),
            so the browser's own HTML parser runs it immediately,
            regardless of whether Next.js's client bundle manages to
            load/hydrate at all on this device. Safe to remove later. */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="/js/debug-overlay.js" />
      </head>
      <body>
        {children}
        <ProfileButton />
      </body>
    </html>
  );
}
