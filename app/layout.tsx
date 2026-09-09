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
      <body>
        {children}
        <ProfileButton />
      </body>
    </html>
  );
}
