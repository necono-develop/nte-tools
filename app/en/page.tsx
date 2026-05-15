import type { Metadata } from "next";
import { HomeRoute } from "@/components/HomeRoute";

export const metadata: Metadata = {
  title: "NTE Tools",
  alternates: {
    canonical: "/en",
    languages: {
      ja: "/",
      en: "/en",
      "zh-Hans": "/zh-hans",
    },
  },
};

export default function HomeEnPage() {
  return <HomeRoute locale="en" />;
}
