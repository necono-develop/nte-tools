import type { Metadata } from "next";
import { BuildCardRoute, buildCardDescription, buildCardTitle } from "@/components/BuildCardRoute";

const title = buildCardTitle;
const description = buildCardDescription;
const pagePath = "/buildcard";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "NTE",
    "Neverness to Everness",
    "Build Card",
    "Build Card Maker",
    "NTE Tools",
    "Arc",
    "Gear",
    "Modules",
  ],
  alternates: {
    canonical: pagePath,
    languages: {
      ja: pagePath,
      en: "/en/buildcard",
      "zh-Hans": "/zh-hans/buildcard",
    },
  },
  openGraph: {
    title,
    description,
    url: pagePath,
    type: "website",
    images: [
      {
        url: "/assets/brand/nte-tools-og.png",
        width: 1200,
        height: 630,
        alt: "NTE Build Card Maker",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/assets/brand/nte-tools-og.png"],
  },
};

export default function BuildCardPage() {
  return <BuildCardRoute locale="ja" />;
}
