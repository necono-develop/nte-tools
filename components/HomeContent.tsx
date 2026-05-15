"use client";

import Link from "next/link";
import { localizedPath, useI18n } from "@/lib/i18n";

export function HomeContent() {
  const { locale, t } = useI18n();
  const href = (path: string) => localizedPath(path, locale);

  return (
    <>
      <section className="site-hero">
        <div className="site-hero-copy">
          <p className="eyebrow">{t.home.eyebrow}</p>
          <h1>NTE Tools</h1>
          <p>{t.home.lead}</p>
          <div className="site-actions">
            <Link className="primary-link" href={href("/buildcard")}>{t.home.primary}</Link>
            <a href="#about">{t.home.about}</a>
          </div>
        </div>
        <div className="site-hero-visual" aria-hidden="true">
          <img src="/assets/brand/nte-tools-icon.png" alt="" />
          <div>
            <strong>{t.home.visualTitle}</strong>
            <span>{t.home.visualSub}</span>
          </div>
        </div>
      </section>

      <section id="about" className="site-section">
        <div>
          <h2>{t.home.sectionTitle}</h2>
          <p>{t.home.sectionBody}</p>
        </div>
        <div className="site-feature-grid">
          <article>
            <strong>Build Card</strong>
            <span>{t.home.buildCard}</span>
          </article>
          <article>
            <strong>Local Draft</strong>
            <span>{t.home.localDraft}</span>
          </article>
          <article>
            <strong>Fan Made</strong>
            <span>{t.home.fanMade}</span>
          </article>
        </div>
      </section>

      <footer className="site-footer">
        <span>{t.home.footer}</span>
        <div>
          <Link href={href("/privacy")}>{t.nav.privacy}</Link>
          <Link href={href("/terms")}>{t.nav.terms}</Link>
          <Link href={href("/contact")}>{t.nav.contact}</Link>
        </div>
      </footer>
    </>
  );
}
