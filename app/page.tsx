import type { Metadata } from "next";
import { HomeRoute } from "@/components/HomeRoute";

const description = "NTE Tools is an unofficial Neverness to Everness fan tool for creating build cards and sharing character, Arc, Gear, and Modules setups.";

export const metadata: Metadata = {
  title: "NTE Tools",
  description,
  keywords: [
    "NTE Tools",
    "Neverness to Everness",
    "NTE build",
    "build card",
    "character build",
    "Arc",
    "Gear",
    "Modules",
  ],
  alternates: {
    canonical: "/",
    languages: {
      ja: "/",
      en: "/en",
      "zh-Hans": "/zh-hans",
    },
  },
};

export default function Home() {
  return <HomeRoute locale="ja" />;
}
