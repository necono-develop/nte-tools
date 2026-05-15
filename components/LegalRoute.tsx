import { ContactContent, PrivacyContent, TermsContent } from "@/components/LegalContent";
import { SiteHeader } from "@/components/SiteHeader";
import { I18nProvider, type Locale } from "@/lib/i18n";

type LegalPage = "privacy" | "terms" | "contact";

export function LegalRoute({ locale, page }: { locale: Locale; page: LegalPage }) {
  const Content = page === "privacy" ? PrivacyContent : page === "terms" ? TermsContent : ContactContent;

  return (
    <I18nProvider initialLocale={locale}>
      <main className="legal-page">
        <SiteHeader current={page} />
        <Content />
      </main>
    </I18nProvider>
  );
}
