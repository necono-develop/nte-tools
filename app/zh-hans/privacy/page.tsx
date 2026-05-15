import type { Metadata } from "next";
import { LegalRoute } from "@/components/LegalRoute";

export const metadata: Metadata = {
  title: "Privacy Policy",
  alternates: {
    canonical: "/zh-hans/privacy",
    languages: {
      ja: "/privacy",
      en: "/en/privacy",
      "zh-Hans": "/zh-hans/privacy",
    },
  },
};

export default function PrivacyZhHansPage() {
  return <LegalRoute locale="zhHans" page="privacy" />;
}
