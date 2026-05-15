import type { Metadata } from "next";
import { BuildCardRoute, buildCardDescription, buildCardTitle } from "@/components/BuildCardRoute";

export const metadata: Metadata = {
  title: buildCardTitle,
  description: buildCardDescription,
  alternates: {
    canonical: "/en/buildcard",
    languages: {
      ja: "/buildcard",
      en: "/en/buildcard",
      "zh-Hans": "/zh-hans/buildcard",
    },
  },
};

export default function BuildCardEnPage() {
  return <BuildCardRoute locale="en" />;
}
