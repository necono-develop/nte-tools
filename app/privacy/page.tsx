import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Privacy Policy",
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <main className="legal-page">
      <SiteHeader current="privacy" />
      <article className="legal-panel">
        <p className="eyebrow">POLICY</p>
        <h1>プライバシーポリシー</h1>
        <p>制定日: 2026年5月13日</p>

        <h2>取得する情報</h2>
        <p>
          NTE Tools のビルドカード作成機能では、選択したキャラクター、Arc、Gear、Modules、ステータス、コメントなどの下書き情報を
          ブラウザの localStorage に保存する場合があります。これらの情報は利用者の端末内に保存され、運営者のサーバーへ送信されません。
        </p>

        <h2>画像出力</h2>
        <p>
          ビルドカードのPNG出力は、利用者のブラウザ上で生成されます。作成した画像、入力したコメント、ビルド内容が
          NTE Tools の運営者へ自動送信されることはありません。
        </p>

        <h2>広告配信について</h2>
        <p>
          本サイトでは、今後 Google AdSense などの第三者配信事業者による広告を掲載する場合があります。
          広告配信事業者は、利用者の興味に応じた広告を表示するため、Cookie などを使用して本サイトや他サイトへのアクセス情報を利用することがあります。
          これには氏名、住所、メールアドレス、電話番号など、個人を直接特定する情報は含まれません。
        </p>

        <h2>Cookieについて</h2>
        <p>
          本サイトは、下書き保存のためにブラウザの localStorage を利用します。また、広告配信やサイト改善のためにCookieを利用する場合があります。
          Cookieの利用を望まない場合は、ブラウザ設定からCookieを無効化できます。ただし、一部機能や広告表示が正しく動作しない場合があります。
        </p>

        <h2>外部サービス</h2>
        <p>
          本サイトには、XやDiscordなど外部サービスへのリンクが含まれます。外部サービス上で取得される情報の取り扱いは、
          各サービスのプライバシーポリシーに従います。
        </p>

        <h2>お問い合わせ</h2>
        <p>
          プライバシーに関する連絡は、<Link href="/contact">Contact</Link> ページからお願いします。
        </p>
      </article>
    </main>
  );
}
