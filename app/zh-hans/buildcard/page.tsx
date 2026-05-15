import type { Metadata } from "next";
import { BuildCardRoute, buildCardDescription, buildCardTitle } from "@/components/BuildCardRoute";

export const metadata: Metadata = {
  title: buildCardTitle,
  description: buildCardDescription,
  alternates: {
    canonical: "/zh-hans/buildcard",
    languages: {
      ja: "/buildcard",
      en: "/en/buildcard",
      "zh-Hans": "/zh-hans/buildcard",
    },
  },
};

export default function BuildCardZhHansPage() {
  return <BuildCardRoute locale="zhHans" />;
}
