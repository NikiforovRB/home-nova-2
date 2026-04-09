import type { Metadata } from "next";
import localFont from "next/font/local";
import { Suspense } from "react";
import { PageLoadingFallback } from "@/components/page-loading-fallback";
import { Providers } from "@/components/providers";
import { SiteFooter, SiteHeader } from "@/components/site";
import "./globals.css";

const gilroy = localFont({
  src: "../../public/fonts/Gilroy-Medium.ttf",
  variable: "--font-gilroy",
  display: "swap",
});

export const metadata: Metadata = {
  title: "HOMENOVA",
  description: "Платформа объявлений недвижимости HOMENOVA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${gilroy.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <Providers>
          <SiteHeader />
          <div className="flex min-h-0 flex-1 flex-col">
            <Suspense fallback={<PageLoadingFallback />}>{children}</Suspense>
          </div>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
