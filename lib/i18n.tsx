"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { LocaleText, StatId } from "./types";

export type Locale = "ja" | "en" | "zhHans";

export const DEFAULT_LOCALE: Locale = "ja";

const LOCALE_LABELS: Record<Locale, string> = {
  ja: "日本語",
  en: "English",
  zhHans: "简体中文",
};

type Messages = {
  nav: Record<string, string>;
  home: Record<string, string>;
  build: Record<string, string>;
  legal: {
    privacyTitle: string;
    termsTitle: string;
    contactTitle: string;
    established: string;
    privacySections: readonly (readonly [string, string])[];
    termsSections: readonly (readonly [string, string])[];
    contactBody: string;
  };
};

const messages = {
  ja: {
    nav: { buildcard: "Build Card", privacy: "Privacy", terms: "Terms", contact: "Contact", language: "表示言語" },
    home: {
      eyebrow: "NEVERNESS TO EVERNESS",
      lead: "Neverness to Everness のキャラクター、Arc、Gear、Modules を組み合わせて、共有しやすいビルドカードを作成するための非公式ファンツールです。",
      primary: "ビルドカードを作成",
      about: "このサイトについて",
      visualTitle: "Build Card",
      visualSub: "Character / Arc / Gear / Modules",
      sectionTitle: "ビルドを、見やすく残す",
      sectionBody: "NTE Tools は、プレイヤー同士がビルド構成を共有しやすくすることを目的にしたコミュニティ向けサイトです。現在はビルドカード作成機能を中心に提供しており、データの整理が進み次第、検索・比較・シミュレーション機能を拡張していく予定です。",
      buildCard: "選択したキャラクターや装備構成を、画像として保存しやすいカードにまとめます。",
      localDraft: "作成途中の内容はブラウザ内に保存され、サーバーへ送信されません。",
      fanMade: "本サイトは公式サービスではなく、ファンによる非公式ツールです。",
      footer: "NTE Tools is an unofficial fan-made tool.",
    },
    build: {
      title: "ビルドカード作成",
      restored: "ローカル保存された下書きを復元しました",
      loadFailed: "保存データを読み込めませんでした",
      selectedModule: "配置済みモジュールを選択しました",
      saved: "ローカルに保存しました",
      resetDone: "ビルドをリセットしました",
      exporting: "PNGを書き出しています",
      exported: "PNGを書き出しました",
      openX: "Xの投稿画面を開きます",
      basicSettings: "基本設定",
      chooseCharacterArc: "キャラクターとArcを選択",
      character: "キャラクター",
      selectCharacter: "-- キャラを選択してください --",
      selectArc: "-- Arcを選択してください --",
      showAllArcs: "全Arc表示",
      gearName: "ギア名",
      selectGear: "-- Gearを選択してください --",
      rank: "ランク",
      statsSettings: "ステータス設定",
      main: "メイン",
      sub: "サブ",
      select: "-- 選択してください --",
      mainUnselected: "Main 未選択",
      placed: "配置中",
      modulePlacement: "モジュール配置",
      addModule: "追加モジュール",
      selected: "選択中",
      none: "なし",
      level: "レベル",
      chooseBoardModule: "盤面上のブロックを選択すると詳細を編集できます。",
      saveOutput: "保存 / 出力",
      saveOutputSub: "下書き保存と画像書き出し",
      comment: "カードコメント",
      commentPlaceholder: "コメントを入力",
      save: "保存",
      reset: "リセット",
      postX: "Xでポスト",
      scoreFormula: "Score計算式",
      scoreTarget: "対象: Gearのメイン/サブ + Moduleのサブ",
      scoreEach: "各項目: max(重み付き合計, 会心合計) / 2",
      weighted: "重み付き合計:",
      scoreAttack: "攻撃力x0.5 + 攻撃力%x0.8",
      scoreCrit: "+ クリダメ + クリ率x2",
      scoreDamage: "+ 汎用ダメ + 有効属性ダメ",
      scoreCritOnly: "会心合計: クリ率x2 + クリダメ",
      scoreRound: "小数第1位で切り捨て",
      scoreAttr: "属性ダメージはキャラクター属性と一致するものだけ加算",
      attribute: "属性",
      arcType: "弧盤",
      unknownAttribute: "属性未確認",
      unknownArcType: "弧盤未確認",
      attributeSuffix: "属性",
      attributeDamageSuffix: "異能ダメージ強化",
      unknownAttributeDamage: "属性異能ダメージ強化",
      attack: "攻撃力",
      defense: "防御力",
      critRate: "クリティカル率",
      critDamage: "クリティカルダメージ",
      chargeEfficiency: "チャージ効率",
      cyclePower: "連環パワー",
      generalDamage: "汎用ダメージ強化",
      toolsSub: "ビルド検索・比較・シミュレーション",
      unavailable: "未取得",
      unselected: "未選択",
      moveModule: "モジュール移動",
      delete: "削除",
      moveUp: "上へ移動",
      moveLeft: "左へ移動",
      moveRight: "右へ移動",
      moveDown: "下へ移動",
      rotate: "回転",
    },
    legal: {
      privacyTitle: "プライバシーポリシー",
      termsTitle: "利用規約",
      contactTitle: "お問い合わせ",
      established: "制定日: 2026年5月13日",
      privacySections: [
        ["取得する情報", "NTE Tools のビルドカード作成機能では、選択したキャラクター、Arc、Gear、Modules、ステータス、コメントなどの下書き情報をブラウザの localStorage に保存する場合があります。これらの情報は利用者の端末内に保存され、運営者のサーバーへ送信されません。"],
        ["画像出力", "ビルドカードのPNG出力は、利用者のブラウザ上で生成されます。作成した画像、入力したコメント、ビルド内容が NTE Tools の運営者へ自動送信されることはありません。"],
        ["広告配信について", "本サイトでは、今後 Google AdSense などの第三者配信事業者による広告を掲載する場合があります。広告配信事業者は、利用者の興味に応じた広告を表示するため、Cookie などを使用して本サイトや他サイトへのアクセス情報を利用することがあります。これには氏名、住所、メールアドレス、電話番号など、個人を直接特定する情報は含まれません。"],
        ["Cookieについて", "本サイトは、下書き保存のためにブラウザの localStorage を利用します。また、広告配信やサイト改善のためにCookieを利用する場合があります。Cookieの利用を望まない場合は、ブラウザ設定からCookieを無効化できます。ただし、一部機能や広告表示が正しく動作しない場合があります。"],
        ["外部サービス", "本サイトには、XやDiscordなど外部サービスへのリンクが含まれます。外部サービス上で取得される情報の取り扱いは、各サービスのプライバシーポリシーに従います。"],
        ["お問い合わせ", "プライバシーに関する連絡は、Contact ページからお願いします。"],
      ],
      termsSections: [
        ["本サイトについて", "NTE Tools は、Neverness to Everness のプレイヤー向けに作成された非公式のファンメイドサイトです。本サイトは、ゲームの運営会社、開発会社、販売会社、その他関連する権利者によって運営、承認、後援、提携された公式サービスではありません。"],
        ["権利表記", "Neverness to Everness に関する名称、ロゴ、画像、キャラクター、ゲーム内素材、商標、著作物、その他の知的財産権は、それぞれの権利者に帰属します。本サイト上のゲーム由来の素材は、情報整理、ビルド共有、プレイヤー支援を目的として表示しています。"],
        ["掲載情報", "本サイトのデータ、計算結果、画像、説明文は、正確性を高めるよう努めていますが、完全性、最新性、正確性を保証するものではありません。ゲーム側のアップデート、地域差、データ取得元の差異、入力内容によって、実際のゲーム内表示と異なる場合があります。"],
        ["禁止事項", "本サイトの利用にあたり、第三者の権利を侵害する行為、公式サービスであるかのように誤認させる行為、不正アクセス、過度な負荷をかける行為、法令または公序良俗に反する行為を禁止します。"],
        ["削除・修正の依頼", "権利上の懸念、誤記、掲載データの修正依頼がある場合は、Contact からご連絡ください。内容を確認し、必要に応じて修正または削除します。"],
        ["免責", "本サイトの利用、または利用できなかったことによって生じたいかなる損害についても、運営者は責任を負いません。利用者は、自身の判断と責任において本サイトを利用するものとします。"],
        ["規約の変更", "本規約は、必要に応じて予告なく変更される場合があります。変更後の内容は、本ページに掲載された時点で有効になります。"],
      ],
      contactBody: "不具合報告、掲載データの修正、権利に関する連絡、削除依頼などは、X または Discord からお知らせください。できるだけ該当ページ、対象キャラクターや装備名、確認した内容を添えていただけると助かります。",
    },
  },
  en: {
    nav: { buildcard: "Build Card", privacy: "Privacy", terms: "Terms", contact: "Contact", language: "Language" },
    home: {
      eyebrow: "NEVERNESS TO EVERNESS",
      lead: "An unofficial fan tool for creating shareable build cards by combining Neverness to Everness characters, Arcs, Gear, and Modules.",
      primary: "Create Build Card",
      about: "About this site",
      visualTitle: "Build Card",
      visualSub: "Character / Arc / Gear / Modules",
      sectionTitle: "Keep Builds Easy to Read",
      sectionBody: "NTE Tools is a community site for sharing build setups between players. The build card maker is the current focus, with search, comparison, and simulation features planned as the data improves.",
      buildCard: "Turn selected characters and equipment setups into cards that are easy to save as images.",
      localDraft: "Drafts are stored in your browser and are not sent to the server.",
      fanMade: "This is an unofficial fan-made tool and is not an official service.",
      footer: "NTE Tools is an unofficial fan-made tool.",
    },
    build: {
      title: "Build Card Maker",
      restored: "Restored the locally saved draft",
      loadFailed: "Could not load saved data",
      selectedModule: "Selected the placed module",
      saved: "Saved locally",
      resetDone: "Build reset",
      exporting: "Exporting PNG",
      exported: "PNG exported",
      openX: "Opening X post screen",
      basicSettings: "Basic Settings",
      chooseCharacterArc: "Choose a character and Arc",
      character: "Character",
      selectCharacter: "-- Select a character --",
      selectArc: "-- Select an Arc --",
      showAllArcs: "Show all Arcs",
      gearName: "Gear Name",
      selectGear: "-- Select Gear --",
      rank: "Rank",
      statsSettings: "Stats Settings",
      main: "Main",
      sub: "Sub",
      select: "-- Select --",
      mainUnselected: "Main unselected",
      placed: "placed",
      modulePlacement: "Module Placement",
      addModule: "Add Module",
      selected: "Selected",
      none: "None",
      level: "Level",
      chooseBoardModule: "Select a block on the board to edit details.",
      saveOutput: "Save / Export",
      saveOutputSub: "Draft save and image export",
      comment: "Card Comment",
      commentPlaceholder: "Enter a comment",
      save: "Save",
      reset: "Reset",
      postX: "Post to X",
      scoreFormula: "Score Formula",
      scoreTarget: "Target: Gear main/sub + Module sub stats",
      scoreEach: "Each item: max(weighted total, crit total) / 2",
      weighted: "Weighted total:",
      scoreAttack: "ATK x0.5 + ATK% x0.8",
      scoreCrit: "+ Crit DMG + Crit Rate x2",
      scoreDamage: "+ General DMG + matching attribute DMG",
      scoreCritOnly: "Crit total: Crit Rate x2 + Crit DMG",
      scoreRound: "Truncated to one decimal place",
      scoreAttr: "Attribute DMG is counted only when it matches the character attribute",
      attribute: "Attribute",
      arcType: "Arc Type",
      unknownAttribute: "Unknown attribute",
      unknownArcType: "Unknown Arc type",
      attributeSuffix: "",
      attributeDamageSuffix: "DMG Bonus",
      unknownAttributeDamage: "Attribute DMG Bonus",
      attack: "ATK",
      defense: "DEF",
      critRate: "Crit Rate",
      critDamage: "Crit DMG",
      chargeEfficiency: "Charge Efficiency",
      cyclePower: "Cycle Power",
      generalDamage: "General DMG Bonus",
      toolsSub: "Build search, comparison, and simulation",
      unavailable: "Unavailable",
      unselected: "unselected",
      moveModule: "Move module",
      delete: "Delete",
      moveUp: "Move up",
      moveLeft: "Move left",
      moveRight: "Move right",
      moveDown: "Move down",
      rotate: "Rotate",
    },
    legal: {
      privacyTitle: "Privacy Policy",
      termsTitle: "Terms",
      contactTitle: "Contact",
      established: "Established: May 13, 2026",
      privacySections: [
        ["Information We Store", "The build card maker may save draft information such as selected characters, Arcs, Gear, Modules, stats, and comments in your browser's localStorage. This information stays on your device and is not sent to the operator's server."],
        ["Image Export", "PNG build cards are generated in your browser. Created images, comments, and build contents are not automatically sent to NTE Tools."],
        ["Advertising", "This site may display ads from third-party providers such as Google AdSense in the future. Ad providers may use cookies and similar technologies to show ads based on your interests. This does not include directly identifying information such as your name, address, email address, or phone number."],
        ["Cookies", "This site uses localStorage for draft saves and may use cookies for advertising or site improvement. You can disable cookies in your browser settings, though some features or ads may not work correctly."],
        ["External Services", "This site links to external services such as X and Discord. Information handled by those services follows their own privacy policies."],
        ["Contact", "For privacy questions, please use the Contact page."],
      ],
      termsSections: [
        ["About This Site", "NTE Tools is an unofficial fan-made site for Neverness to Everness players. It is not operated, approved, sponsored, or affiliated with the game's operator, developer, publisher, or other rights holders."],
        ["Rights", "Names, logos, images, characters, in-game materials, trademarks, copyrighted works, and other intellectual property related to Neverness to Everness belong to their respective rights holders. Game-derived materials are displayed for data organization, build sharing, and player support."],
        ["Information", "We try to improve the accuracy of data, calculations, images, and descriptions, but do not guarantee completeness, freshness, or correctness. Game updates, regional differences, source differences, and user input may cause differences from in-game display."],
        ["Prohibited Acts", "Do not infringe third-party rights, misrepresent this site as an official service, attempt unauthorized access, apply excessive load, or violate laws or public order."],
        ["Removal and Corrections", "If you have rights concerns, find an error, or need data corrected, please contact us from the Contact page. We will review the content and correct or remove it when needed."],
        ["Disclaimer", "The operator is not responsible for damages arising from using or being unable to use this site. Users use this site at their own judgment and responsibility."],
        ["Changes", "These terms may change without prior notice. Updated terms become effective when posted on this page."],
      ],
      contactBody: "For bug reports, data corrections, rights concerns, or removal requests, please contact us through X or Discord. Including the relevant page, character or equipment name, and what you checked helps a lot.",
    },
  },
  zhHans: {
    nav: { buildcard: "构筑卡", privacy: "隐私", terms: "条款", contact: "联系", language: "语言" },
    home: {
      eyebrow: "NEVERNESS TO EVERNESS",
      lead: "用于组合《Neverness to Everness》的角色、Arc、Gear 与 Modules，并生成便于分享的构筑卡的非官方粉丝工具。",
      primary: "制作构筑卡",
      about: "关于本站",
      visualTitle: "Build Card",
      visualSub: "Character / Arc / Gear / Modules",
      sectionTitle: "清晰保存构筑",
      sectionBody: "NTE Tools 是为了方便玩家分享构筑配置而制作的社区网站。目前以构筑卡生成功能为中心，随着数据整理推进，之后会扩展搜索、比较和模拟功能。",
      buildCard: "将选择的角色和装备配置整理成便于保存为图片的卡片。",
      localDraft: "编辑中的草稿会保存在浏览器内，不会发送到服务器。",
      fanMade: "本站不是官方服务，而是粉丝制作的非官方工具。",
      footer: "NTE Tools is an unofficial fan-made tool.",
    },
    build: {
      title: "构筑卡制作",
      restored: "已恢复本地保存的草稿",
      loadFailed: "无法读取保存数据",
      selectedModule: "已选择配置的模块",
      saved: "已保存到本地",
      resetDone: "已重置构筑",
      exporting: "正在导出 PNG",
      exported: "PNG 已导出",
      openX: "正在打开 X 发布页面",
      basicSettings: "基础设置",
      chooseCharacterArc: "选择角色和 Arc",
      character: "角色",
      selectCharacter: "-- 请选择角色 --",
      selectArc: "-- 请选择 Arc --",
      showAllArcs: "显示全部 Arc",
      gearName: "Gear 名称",
      selectGear: "-- 请选择 Gear --",
      rank: "等级",
      statsSettings: "属性设置",
      main: "主属性",
      sub: "副属性",
      select: "-- 请选择 --",
      mainUnselected: "主属性未选择",
      placed: "已配置",
      modulePlacement: "模块配置",
      addModule: "追加模块",
      selected: "当前选择",
      none: "无",
      level: "等级",
      chooseBoardModule: "选择盘面上的模块后可以编辑详情。",
      saveOutput: "保存 / 导出",
      saveOutputSub: "草稿保存与图片导出",
      comment: "卡片留言",
      commentPlaceholder: "输入留言",
      save: "保存",
      reset: "重置",
      postX: "发布到 X",
      scoreFormula: "Score 计算式",
      scoreTarget: "对象: Gear 主/副属性 + Module 副属性",
      scoreEach: "每项: max(加权合计, 暴击合计) / 2",
      weighted: "加权合计:",
      scoreAttack: "攻击力x0.5 + 攻击力%x0.8",
      scoreCrit: "+ 暴击伤害 + 暴击率x2",
      scoreDamage: "+ 通用伤害 + 有效属性伤害",
      scoreCritOnly: "暴击合计: 暴击率x2 + 暴击伤害",
      scoreRound: "向下取到小数第1位",
      scoreAttr: "属性伤害只计算与角色属性一致的项目",
      attribute: "属性",
      arcType: "Arc 类型",
      unknownAttribute: "属性未确认",
      unknownArcType: "Arc 类型未确认",
      attributeSuffix: "属性",
      attributeDamageSuffix: "异能伤害增强",
      unknownAttributeDamage: "属性异能伤害增强",
      attack: "攻击力",
      defense: "防御力",
      critRate: "暴击率",
      critDamage: "暴击伤害",
      chargeEfficiency: "充能效率",
      cyclePower: "连环强度",
      generalDamage: "通用伤害增强",
      toolsSub: "构筑搜索、比较、模拟",
      unavailable: "未取得",
      unselected: "未选择",
      moveModule: "移动模块",
      delete: "删除",
      moveUp: "上移",
      moveLeft: "左移",
      moveRight: "右移",
      moveDown: "下移",
      rotate: "旋转",
    },
    legal: {
      privacyTitle: "隐私政策",
      termsTitle: "使用条款",
      contactTitle: "联系我们",
      established: "制定日: 2026年5月13日",
      privacySections: [
        ["收集的信息", "构筑卡制作功能可能会将所选角色、Arc、Gear、Modules、属性和留言等草稿信息保存到浏览器的 localStorage。这些信息保存在用户设备内，不会发送到运营者服务器。"],
        ["图片导出", "构筑卡 PNG 会在用户浏览器内生成。生成的图片、输入的留言和构筑内容不会自动发送给 NTE Tools。"],
        ["广告投放", "本站今后可能会展示 Google AdSense 等第三方广告。广告服务商可能使用 Cookie 等信息展示符合兴趣的广告。这些信息不包含姓名、地址、邮箱、电话号码等直接识别个人的信息。"],
        ["Cookie", "本站使用 localStorage 保存草稿，也可能为了广告投放或网站改善使用 Cookie。用户可以在浏览器设置中禁用 Cookie，但部分功能或广告显示可能无法正常工作。"],
        ["外部服务", "本站包含 X、Discord 等外部服务链接。外部服务获取的信息将遵循各服务自身的隐私政策。"],
        ["联系", "关于隐私的问题请通过 Contact 页面联系。"],
      ],
      termsSections: [
        ["关于本站", "NTE Tools 是面向 Neverness to Everness 玩家制作的非官方粉丝网站。本站并非由游戏运营方、开发方、发行方或相关权利方运营、认可、赞助或合作的官方服务。"],
        ["权利声明", "Neverness to Everness 相关名称、标志、图片、角色、游戏内素材、商标、著作物及其他知识产权均归各自权利方所有。本站展示游戏来源素材的目的在于数据整理、构筑分享和玩家支援。"],
        ["掲載信息", "本站会尽力提升数据、计算结果、图片和说明文字的准确性，但不保证完整性、及时性或准确性。游戏更新、地区差异、数据来源差异和输入内容都可能导致与游戏内显示不同。"],
        ["禁止事项", "禁止侵犯第三方权利、使人误认为本站是官方服务、非法访问、造成过度负载，或违反法律及公序良俗的行为。"],
        ["删除和修正请求", "如有权利疑虑、错误或数据修正请求，请通过 Contact 联系。确认内容后，会根据需要修正或删除。"],
        ["免责声明", "因使用或无法使用本站而产生的任何损害，运营者不承担责任。用户应以自身判断和责任使用本站。"],
        ["条款变更", "本条款可能会根据需要不经预告进行变更。变更后的内容在本页面发布时生效。"],
      ],
      contactBody: "如需报告问题、修正数据、权利相关联系或删除请求，请通过 X 或 Discord 告知。若能附上相关页面、角色或装备名称以及确认内容，会更便于处理。",
    },
  },
} as const satisfies Record<Locale, Messages>;

const I18nContext = createContext<{
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Messages;
  localeLabels: Record<Locale, string>;
} | null>(null);

export function I18nProvider({ children, initialLocale = DEFAULT_LOCALE }: { children: ReactNode; initialLocale?: Locale }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    document.documentElement.lang = htmlLang(next);
  };

  useEffect(() => {
    setLocaleState(initialLocale);
  }, [initialLocale]);

  useEffect(() => {
    document.documentElement.lang = htmlLang(locale);
  }, [locale]);

  const value = useMemo(() => ({ locale, setLocale, t: messages[locale], localeLabels: LOCALE_LABELS }), [locale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used within I18nProvider");
  return value;
}

export function localizeName(value: LocaleText | undefined, locale: Locale, fallback = "") {
  return value?.[locale] ?? value?.ja ?? value?.en ?? value?.zhHans ?? fallback;
}

export function statLabel(statId: StatId, locale: Locale) {
  const labels: Record<Locale, Partial<Record<StatId, string>>> = {
    ja: {
      hp: "HP",
      attack: "攻撃力",
      defense: "防御力",
      critRate: "クリティカル率",
      critDamage: "クリティカルダメージ",
      chargeEfficiency: "チャージ効率",
      unbalIntensity: "連環パワー",
      generalDamage: "汎用ダメージ強化",
      attributeDamage: "属性異能ダメージ強化",
      hpPercent: "HP%",
      attackPercent: "攻撃力%",
      defensePercent: "防御力%",
    },
    en: {
      hp: "HP",
      attack: "ATK",
      defense: "DEF",
      critRate: "Crit Rate",
      critDamage: "Crit DMG",
      chargeEfficiency: "Charge Efficiency",
      unbalIntensity: "Cycle Power",
      generalDamage: "General DMG Bonus",
      attributeDamage: "Attribute DMG Bonus",
      hpPercent: "HP%",
      attackPercent: "ATK%",
      defensePercent: "DEF%",
    },
    zhHans: {
      hp: "HP",
      attack: "攻击力",
      defense: "防御力",
      critRate: "暴击率",
      critDamage: "暴击伤害",
      chargeEfficiency: "充能效率",
      unbalIntensity: "连环强度",
      generalDamage: "通用伤害增强",
      attributeDamage: "属性异能伤害增强",
      hpPercent: "HP%",
      attackPercent: "攻击力%",
      defensePercent: "防御力%",
    },
  };
  return labels[locale][statId] ?? labels.ja[statId] ?? statId;
}

export function localePrefix(locale: Locale) {
  if (locale === "en") return "/en";
  if (locale === "zhHans") return "/zh-hans";
  return "";
}

export function stripLocalePrefix(pathname: string) {
  if (pathname === "/en" || pathname.startsWith("/en/")) {
    return pathname.replace(/^\/en(?=\/|$)/, "") || "/";
  }
  if (pathname === "/zh-hans" || pathname.startsWith("/zh-hans/")) {
    return pathname.replace(/^\/zh-hans(?=\/|$)/, "") || "/";
  }
  return pathname || "/";
}

export function localizedPath(pathname: string, locale: Locale) {
  const basePath = stripLocalePrefix(pathname);
  return `${localePrefix(locale)}${basePath === "/" ? "" : basePath}` || "/";
}

function htmlLang(locale: Locale) {
  if (locale === "zhHans") return "zh-Hans";
  return locale;
}
