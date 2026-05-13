import BuildCardApp from "@/components/BuildCardApp";
import { SiteHeader } from "@/components/SiteHeader";

export default function BuildCardPage() {
  return (
    <main className="buildcard-page">
      <SiteHeader current="buildcard" />
      <BuildCardApp />
    </main>
  );
}
