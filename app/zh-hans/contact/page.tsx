import type { Metadata } from "next";
import { LegalRoute } from "@/components/LegalRoute";

export const metadata: Metadata = {
  title: "Contact",
  alternates: {
    canonical: "/zh-hans/contact",
    languages: {
      ja: "/contact",
      en: "/en/contact",
      "zh-Hans": "/zh-hans/contact",
    },
  },
};

export default function ContactZhHansPage() {
  return <LegalRoute locale="zhHans" page="contact" />;
}
