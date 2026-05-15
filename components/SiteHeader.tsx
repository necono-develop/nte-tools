"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { localizedPath, useI18n, type Locale } from "@/lib/i18n";

const X_PROFILE_URL = "https://x.com/NTE_Tools";
const DISCORD_INVITE_URL = "https://discord.gg/TZybt3NAah";

export function SiteHeader({ current }: { current?: "home" | "buildcard" | "privacy" | "terms" | "contact" }) {
  const { locale, setLocale, t, localeLabels } = useI18n();
  const pathname = usePathname();
  const router = useRouter();

  const switchLocale = (nextLocale: Locale) => {
    setLocale(nextLocale);
    router.push(localizedPath(pathname, nextLocale));
  };
  const href = (path: string) => localizedPath(path, locale);

  return (
    <nav className="site-nav" aria-label="Main navigation">
      <Link className="site-logo" href={href("/")}>NTE Tools</Link>
      <div className="site-nav-links">
        {current !== "buildcard" ? <Link href={href("/buildcard")}>{t.nav.buildcard}</Link> : null}
        {current !== "privacy" ? <Link href={href("/privacy")}>{t.nav.privacy}</Link> : null}
        {current !== "terms" ? <Link href={href("/terms")}>{t.nav.terms}</Link> : null}
        {current !== "contact" ? <Link href={href("/contact")}>{t.nav.contact}</Link> : null}
      </div>
      <label className="site-language-select">
        <span>{t.nav.language}</span>
        <select value={locale} onChange={(event) => switchLocale(event.target.value as Locale)}>
          {(["ja", "en", "zhHans"] as const).map((key) => (
            <option key={key} value={key}>{localeLabels[key]}</option>
          ))}
        </select>
      </label>
      <div className="site-social-links" aria-label="Social links">
        <a href={X_PROFILE_URL} target="_blank" rel="noreferrer" aria-label="X NTE_Tools">X</a>
        <a href={DISCORD_INVITE_URL} target="_blank" rel="noreferrer" aria-label="Discord">
          <DiscordIcon />
        </a>
      </div>
    </nav>
  );
}

function DiscordIcon() {
  return (
    <svg className="discord-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M19.6 5.2a15.4 15.4 0 0 0-3.8-1.2l-.5 1a14.2 14.2 0 0 0-6.6 0l-.5-1a15.7 15.7 0 0 0-3.8 1.2C2 8.8 1.4 12.3 1.7 15.8a15.2 15.2 0 0 0 4.7 2.4l1-1.6c-.6-.2-1.1-.5-1.6-.8l.4-.3a11 11 0 0 0 11.6 0l.4.3c-.5.3-1 .6-1.6.8l1 1.6a15.2 15.2 0 0 0 4.7-2.4c.4-4-.7-7.4-2.7-10.6ZM8.4 13.8c-.9 0-1.6-.8-1.6-1.7s.7-1.7 1.6-1.7 1.6.8 1.6 1.7-.7 1.7-1.6 1.7Zm7.2 0c-.9 0-1.6-.8-1.6-1.7s.7-1.7 1.6-1.7 1.6.8 1.6 1.7-.7 1.7-1.6 1.7Z"
      />
    </svg>
  );
}
