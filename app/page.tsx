import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

export default function Home() {
  return (
    <main className="site-page">
      <SiteHeader current="home" />

      <section className="site-hero">
        <div className="site-hero-copy">
          <p className="eyebrow">NEVERNESS TO EVERNESS</p>
          <h1>NTE Tools</h1>
          <p>
            Neverness to Everness のキャラクター、Arc、Gear、Modules を組み合わせて、
            共有しやすいビルドカードを作成するための非公式ファンツールです。
          </p>
          <div className="site-actions">
            <Link className="primary-link" href="/buildcard">ビルドカードを作成</Link>
            <a href="#about">このサイトについて</a>
          </div>
        </div>
        <div className="site-hero-visual" aria-hidden="true">
          <img src="/assets/brand/nte-tools-icon.webp" alt="" />
          <div>
            <strong>Build Card</strong>
            <span>Character / Arc / Gear / Modules</span>
          </div>
        </div>
      </section>

      <section id="about" className="site-section">
        <div>
          <h2>ビルドを、見やすく残す</h2>
          <p>
            NTE Tools は、プレイヤー同士がビルド構成を共有しやすくすることを目的にした
            コミュニティ向けサイトです。現在はビルドカード作成機能を中心に提供しており、
            データの整理が進み次第、検索・比較・シミュレーション機能を拡張していく予定です。
          </p>
        </div>
        <div className="site-feature-grid">
          <article>
            <strong>Build Card</strong>
            <span>選択したキャラクターや装備構成を、画像として保存しやすいカードにまとめます。</span>
          </article>
          <article>
            <strong>Local Draft</strong>
            <span>作成途中の内容はブラウザ内に保存され、サーバーへ送信されません。</span>
          </article>
          <article>
            <strong>Fan Made</strong>
            <span>本サイトは公式サービスではなく、ファンによる非公式ツールです。</span>
          </article>
        </div>
      </section>

      <footer className="site-footer">
        <span>NTE Tools is an unofficial fan-made tool.</span>
        <div>
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/contact">Contact</Link>
        </div>
      </footer>
    </main>
  );
}
