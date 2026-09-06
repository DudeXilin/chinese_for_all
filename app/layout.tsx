import type { Metadata } from "next";

import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}
