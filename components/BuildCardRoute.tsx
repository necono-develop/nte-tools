import BuildCardApp from "@/components/BuildCardApp";
import { SiteHeader } from "@/components/SiteHeader";
import { I18nProvider, type Locale } from "@/lib/i18n";

export const buildCardTitle = "NTE Build Card Maker";
export const buildCardDescription = "Create and share Neverness to Everness build cards with character, Arc, Gear, Modules, stats, score, and preview image export.";

export function BuildCardRoute({ locale }: { locale: Locale }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "NTE Build Card Maker",
    alternateName: "NTE Tools Build Card",
    url: "https://nte-tools.com/buildcard",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web",
    inLanguage: ["ja", "en", "zh-Hans"],
    isAccessibleForFree: true,
    description: buildCardDescription,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    publisher: {
      "@type": "Organization",
      name: "NTE Tools",
      url: "https://nte-tools.com",
    },
  };

  return (
    <I18nProvider initialLocale={locale}>
      <main className="buildcard-page">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
        <SiteHeader current="buildcard" />
        <BuildCardApp />
      </main>
    </I18nProvider>
  );
}
