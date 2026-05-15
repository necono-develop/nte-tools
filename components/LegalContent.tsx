"use client";

import Link from "next/link";
import { localizedPath, useI18n, type Locale } from "@/lib/i18n";

function ContactLinkedText({ body, label, locale }: { body: string; label: string; locale: Locale }) {
  const parts = body.split("Contact");
  if (parts.length === 1) {
    return body;
  }

  return (
    <>
      {parts.map((part, index) => (
        <span key={`${part}-${index}`}>
          {index > 0 ? <Link href={localizedPath("/contact", locale)}>{label}</Link> : null}
          {part}
        </span>
      ))}
    </>
  );
}

export function PrivacyContent() {
  const { locale, t } = useI18n();
  return (
    <article className="legal-panel">
      <p className="eyebrow">POLICY</p>
      <h1>{t.legal.privacyTitle}</h1>
      <p>{t.legal.established}</p>
      {t.legal.privacySections.map(([title, body]) => (
        <section key={title}>
          <h2>{title}</h2>
          <p><ContactLinkedText body={body} label={t.nav.contact} locale={locale} /></p>
        </section>
      ))}
    </article>
  );
}

export function TermsContent() {
  const { locale, t } = useI18n();
  return (
    <article className="legal-panel">
      <p className="eyebrow">TERMS</p>
      <h1>{t.legal.termsTitle}</h1>
      <p>{t.legal.established}</p>
      {t.legal.termsSections.map(([title, body]) => (
        <section key={title}>
          <h2>{title}</h2>
          <p><ContactLinkedText body={body} label={t.nav.contact} locale={locale} /></p>
        </section>
      ))}
    </article>
  );
}

export function ContactContent() {
  const { t } = useI18n();
  return (
    <article className="legal-panel">
      <p className="eyebrow">CONTACT</p>
      <h1>{t.legal.contactTitle}</h1>
      <p>{t.legal.contactBody}</p>
      <div className="contact-placeholder">
        <strong>X / Twitter</strong>
        <span>
          <a href="https://x.com/NTE_Tools" target="_blank" rel="noreferrer">
            @NTE_Tools
          </a>
        </span>
      </div>
      <div className="contact-placeholder">
        <strong>Discord</strong>
        <span>
          <a href="https://discord.gg/TZybt3NAah" target="_blank" rel="noreferrer">
            Discord
          </a>
        </span>
      </div>
    </article>
  );
}
