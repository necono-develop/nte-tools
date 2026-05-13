import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://nte-tools.com"),
  title: {
    default: "NTE Tools",
    template: "%s | NTE Tools",
  },
  description: "Neverness to Evernessのビルドカード作成と共有を支援する非公式ファンツールです。",
  icons: {
    icon: "/assets/brand/nte-tools-icon.webp",
    apple: "/assets/brand/nte-tools-icon.webp",
  },
  openGraph: {
    title: "NTE Tools",
    description: "Neverness to Evernessのビルドカード作成と共有を支援する非公式ファンツールです。",
    url: "https://nte-tools.com",
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
      <body>{children}</body>
    </html>
  );
}
