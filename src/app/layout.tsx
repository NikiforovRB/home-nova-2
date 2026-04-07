import type { Metadata } from "next";
import localFont from "next/font/local";
import { Providers } from "@/components/providers";
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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
