import { HomeContent } from "@/components/HomeContent";
import { SiteHeader } from "@/components/SiteHeader";
import { I18nProvider, type Locale } from "@/lib/i18n";

const description = "NTE Tools is an unofficial Neverness to Everness fan tool for creating build cards and sharing character, Arc, Gear, and Modules setups.";

export function HomeRoute({ locale }: { locale: Locale }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "NTE Tools",
    url: "https://nte-tools.com",
    inLanguage: ["ja", "en", "zh-Hans"],
    description,
    potentialAction: {
      "@type": "UseAction",
      target: "https://nte-tools.com/buildcard",
      name: "Create a build card",
    },
  };

  return (
    <I18nProvider initialLocale={locale}>
      <main className="site-page">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
        <SiteHeader current="home" />
        <HomeContent />
      </main>
    </I18nProvider>
  );
}
