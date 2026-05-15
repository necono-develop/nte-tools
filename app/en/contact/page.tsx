import type { Metadata } from "next";
import { LegalRoute } from "@/components/LegalRoute";

export const metadata: Metadata = {
  title: "Contact",
  alternates: {
    canonical: "/en/contact",
    languages: {
      ja: "/contact",
      en: "/en/contact",
      "zh-Hans": "/zh-hans/contact",
    },
  },
};

export default function ContactEnPage() {
  return <LegalRoute locale="en" page="contact" />;
}
