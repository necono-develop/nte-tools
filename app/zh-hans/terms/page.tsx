import type { Metadata } from "next";
import { LegalRoute } from "@/components/LegalRoute";

export const metadata: Metadata = {
  title: "Terms",
  alternates: {
    canonical: "/zh-hans/terms",
    languages: {
      ja: "/terms",
      en: "/en/terms",
      "zh-Hans": "/zh-hans/terms",
    },
  },
};

export default function TermsZhHansPage() {
  return <LegalRoute locale="zhHans" page="terms" />;
}
