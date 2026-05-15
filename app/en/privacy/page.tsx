import type { Metadata } from "next";
import { LegalRoute } from "@/components/LegalRoute";

export const metadata: Metadata = {
  title: "Privacy Policy",
  alternates: {
    canonical: "/en/privacy",
    languages: {
      ja: "/privacy",
      en: "/en/privacy",
      "zh-Hans": "/zh-hans/privacy",
    },
  },
};

export default function PrivacyEnPage() {
  return <LegalRoute locale="en" page="privacy" />;
}
