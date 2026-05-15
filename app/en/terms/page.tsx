import type { Metadata } from "next";
import { LegalRoute } from "@/components/LegalRoute";

export const metadata: Metadata = {
  title: "Terms",
  alternates: {
    canonical: "/en/terms",
    languages: {
      ja: "/terms",
      en: "/en/terms",
      "zh-Hans": "/zh-hans/terms",
    },
  },
};

export default function TermsEnPage() {
  return <LegalRoute locale="en" page="terms" />;
}
