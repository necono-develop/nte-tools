import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Contact",
  alternates: {
    canonical: "/contact",
  },
};

export default function ContactPage() {
  return (
    <main className="legal-page">
      <SiteHeader current="contact" />

      <article className="legal-panel">
        <p className="eyebrow">CONTACT</p>
        <h1>お問い合わせ</h1>
        <p>
          不具合報告、掲載データの修正、権利に関する連絡、削除依頼などは、X または Discord からお知らせください。
          できるだけ該当ページ、対象キャラクターや装備名、確認した内容を添えていただけると助かります。
        </p>
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
    </main>
  );
}
