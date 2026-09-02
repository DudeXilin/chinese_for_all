import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";

import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  display: "swap",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CHINESE FOR ALL ☭",
  description:
    "Китайский — бесплатно для всех. Бесплатное и открытое пространство для изучения китайского языка.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={`${geist.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
