import type { Metadata } from "next";
import { HomeRoute } from "@/components/HomeRoute";

export const metadata: Metadata = {
  title: "NTE Tools",
  alternates: {
    canonical: "/zh-hans",
    languages: {
      ja: "/",
      en: "/en",
      "zh-Hans": "/zh-hans",
    },
  },
};

export default function HomeZhHansPage() {
  return <HomeRoute locale="zhHans" />;
}
