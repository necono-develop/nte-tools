import type { Metadata } from "next";
import BuildCardApp from "@/components/BuildCardApp";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Build Card",
  alternates: {
    canonical: "/buildcard",
  },
};

export default function BuildCardPage() {
  return (
    <main className="buildcard-page">
      <SiteHeader current="buildcard" />
      <BuildCardApp />
    </main>
  );
}
