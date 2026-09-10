import type { Metadata } from "next";

import "./globals.css";
import ProfileButton from "@/components/profile-button";
import Script from "next/script";

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
      <body>
        {/* Temporary diagnostic tool - floating bug button, full-screen
            copyable log. Safe to remove once debugging is done. */}
        <Script src="/js/debug-overlay.js" strategy="beforeInteractive" />
        {children}
        <ProfileButton />
      </body>
    </html>
  );
}
