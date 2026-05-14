import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Terms",
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsPage() {
  return (
    <main className="legal-page">
      <SiteHeader current="terms" />

      <article className="legal-panel">
        <p className="eyebrow">TERMS</p>
        <h1>利用規約</h1>
        <p>制定日: 2026年5月13日</p>

        <h2>本サイトについて</h2>
        <p>
          NTE Tools は、Neverness to Everness のプレイヤー向けに作成された非公式のファンメイドサイトです。
          本サイトは、ゲームの運営会社、開発会社、販売会社、その他関連する権利者によって運営、承認、
          後援、提携された公式サービスではありません。
        </p>

        <h2>権利表記</h2>
        <p>
          Neverness to Everness に関する名称、ロゴ、画像、キャラクター、ゲーム内素材、商標、著作物、
          その他の知的財産権は、それぞれの権利者に帰属します。本サイト上のゲーム由来の素材は、
          情報整理、ビルド共有、プレイヤー支援を目的として表示しています。
        </p>

        <h2>掲載情報</h2>
        <p>
          本サイトのデータ、計算結果、画像、説明文は、正確性を高めるよう努めていますが、完全性、
          最新性、正確性を保証するものではありません。ゲーム側のアップデート、地域差、データ取得元の差異、
          入力内容によって、実際のゲーム内表示と異なる場合があります。
        </p>

        <h2>禁止事項</h2>
        <p>
          本サイトの利用にあたり、第三者の権利を侵害する行為、公式サービスであるかのように誤認させる行為、
          不正アクセス、過度な負荷をかける行為、法令または公序良俗に反する行為を禁止します。
        </p>

        <h2>削除・修正の依頼</h2>
        <p>
          権利上の懸念、誤記、掲載データの修正依頼がある場合は、<Link href="/contact">Contact</Link>
          からご連絡ください。内容を確認し、必要に応じて修正または削除します。
        </p>

        <h2>免責</h2>
        <p>
          本サイトの利用、または利用できなかったことによって生じたいかなる損害についても、
          運営者は責任を負いません。利用者は、自身の判断と責任において本サイトを利用するものとします。
        </p>

        <h2>規約の変更</h2>
        <p>
          本規約は、必要に応じて予告なく変更される場合があります。変更後の内容は、本ページに掲載された時点で有効になります。
        </p>
      </article>
    </main>
  );
}
