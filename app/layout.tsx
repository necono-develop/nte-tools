import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { SITE_URL } from "../lib/generated-sitemap";
import { I18nProvider } from "../lib/i18n";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "NTE Tools",
    template: "%s | NTE Tools",
  },
  description: "Neverness to Evernessのビルドカード作成と共有を支援する非公式ファンツールです。",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "NTE Tools",
    description: "Neverness to Evernessのビルドカード作成と共有を支援する非公式ファンツールです。",
    url: SITE_URL,
    siteName: "NTE Tools",
    images: [
      {
        url: "/assets/brand/nte-tools-og.webp",
        width: 1200,
        height: 630,
        alt: "NTE Tools",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NTE Tools",
    description: "Neverness to Evernessのビルドカード作成と共有を支援する非公式ファンツールです。",
    images: ["/assets/brand/nte-tools-og.webp"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>
        <I18nProvider>{children}</I18nProvider>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9131720335926402"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
