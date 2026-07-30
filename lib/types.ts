export type LocaleText = {
  ja?: string;
  en?: string;
  zhHans?: string;
};

export type StatId =
  | "hp"
  | "attack"
  | "defense"
  | "critRate"
  | "critDamage"
  | "chargeEfficiency"
  | "unbalIntensity"
  | "generalDamage"
  | "attributeDamage"
  | "attackPercent"
  | "hpPercent"
  | "defensePercent";

export type StatBlock = {
  hp: number;
  attack: number;
  defense: number;
  critRate: number;
  critDamage: number;
  chargeEfficiency: number;
  unbalIntensity: number;
  generalDamage: number;
  attributeDamage: number;
};

export type CharacterAttribute = "相" | "光" | "闇" | "魂" | "霊" | "呪";
export type CharacterArcType = "ソリッド" | "リキッド" | "プラズマ" | "気体" | "重合体";

export type BoardCell = {
  x: number;
  y: number;
  type: "normal" | "special" | "locked";
  enabled: boolean;
};

export type ModuleBoard = {
  width: number;
  height: number;
  cells: BoardCell[];
  rules: {
    allowRotation: boolean;
    maxModules: number;
  };
  ownerGridCount?: number | null;
  specialization?: {
    typeName?: LocaleText;
    description?: LocaleText;
    specialDescription?: LocaleText;
    stats?: {
      sourceStatId: string;
      names?: LocaleText;
      value: number;
    }[];
  };
  source: string;
  dataStatus: string;
};

export type Character = {
  id: string;
  slug: string;
  name: LocaleText;
  rarity: string;
  element: string;
  elementKey?: string;
  attribute?: CharacterAttribute;
  attributeNames?: LocaleText;
  arcTypeId?: string | null;
  arcType?: CharacterArcType;
  weaponTypeId?: string | null;
  weaponType?: CharacterArcType | null;
  weaponTypeNames?: LocaleText;
  assets: {
    icon: string;
    portrait: string;
    card: string;
  };
  theme?: {
    primary: string;
    secondary: string;
    deep: string;
    accent: string;
  };
  portraitFit?: {
    scale?: number;
    x?: string;
    y?: string;
    backgroundScale?: string;
    backgroundX?: string;
    backgroundY?: string;
  };
  baseStats: Partial<StatBlock>;
  levelStats?: {
    status: string;
    supportedLevels: { min: number; max: number };
    statSlots: {
      statId: keyof StatBlock;
      sourceStatId: string;
      names?: LocaleText;
      isPercent?: boolean;
      values: number[];
    }[];
  };
  moduleBoard: ModuleBoard;
  dataStatus: string;
};

export type Gear = {
  id: string;
  sourceId?: string;
  sourceStatId?: string;
  statId?: StatId | null;
  name: LocaleText;
  rarity: string;
  quality?: string;
  typeId?: string;
  typeGeometry?: string;
  ownGridNum?: number;
  sourceIcon?: string;
  assets: { icon: string };
  baseStats: { statId: StatId; value: number }[];
  mainStats?: {
    sourceStatId: string;
    statId?: StatId | null;
    names?: LocaleText;
    sourceIcon?: string | null;
    supportedLevels?: { min: number; max: number };
    valueIndexing?: "level_zero_to_twenty";
    values: number[];
  }[];
  mainStat?: {
    sourceStatId: string;
    statId?: StatId | null;
    names?: LocaleText;
    isPercent?: boolean;
    supportedLevels?: { min: number; max: number };
    valueIndexing?: "level_zero_to_twenty";
    values: number[];
  };
  subStats?: {
    sourceStatId: string;
    names?: LocaleText;
    amountStats?: number;
    sourceIcon?: string | null;
  }[];
  setEffect?: {
    sourceIcon?: string;
    assets?: { icon: string };
    conditions?: {
      condition: number;
      description: LocaleText;
    }[];
    geometry?: {
      id: string;
      name: LocaleText;
      sourceIcon?: string;
      assets?: { icon: string };
    }[];
  };
  availableMainStats: string[];
  dataStatus: string;
};

export type GearStatOption = {
  sourceStatId: string;
  statId?: StatId | null;
  names?: LocaleText;
  sourceIcon?: string | null;
  isPercent?: boolean;
  values: {
    blue?: number[] | number;
    purple?: number[] | number;
    orange?: number[] | number;
  };
  moduleRolls?: {
    size: number;
    rolls: {
      blue?: number;
      purple?: number;
      orange?: number;
    };
  }[];
};

export type GearStatSelection = {
  statId: string;
};

export type Arc = {
  id: string;
  localKey?: string;
  name: LocaleText;
  rarity: string;
  typeId?: string;
  assets: { icon: string };
  baseStats: Partial<Record<StatId, number>>;
  effect: {
    name: LocaleText;
    description: LocaleText;
  };
  levelStats?: {
    status: string;
    supportedLevels: { min: number; max: number };
    statSlots: {
      slot: number;
      statId: StatId | null;
      sourceStatId?: string;
      names?: LocaleText;
      isPercent?: boolean;
      values?: number[];
    }[];
  };
  dataStatus: string;
};

export type ModuleShape = {
  id: string;
  name: string;
  names?: LocaleText;
  cells: { x: number; y: number }[];
  rotatable: boolean;
  asset: string;
  sourceGeometry?: string;
  sourceIcon?: string;
  ownGridNum?: number;
  dataStatus?: string;
};

export type Module = {
  id: string;
  sourceId?: string;
  name: LocaleText;
  rarity: "S" | "A" | "B";
  quality?: string;
  typeId: string;
  typeGeometry?: string;
  ownGridNum?: number;
  shapeId: string;
  sourceIcon?: string;
  assets: { icon: string };
  mainStats: {
    sourceStatId: string;
    statId?: StatId | null;
    names?: LocaleText;
    sourceIcon?: string | null;
    supportedLevels?: { min: number; max: number };
    valueIndexing?: "level_zero_to_twenty";
    values: number[];
  }[];
  mainStatCandidates: StatId[];
  subStats: {
    sourceStatId: string;
    statId?: StatId | null;
    names?: LocaleText;
    isPercent?: boolean;
    supportedLevels?: { min: number; max: number };
    valueIndexing?: "level_zero_to_twenty";
    values?: {
      blue?: number[] | number;
      purple?: number[] | number;
      orange?: number[] | number;
    };
    valuesBySize?: Record<string, {
      blue?: number;
      purple?: number;
      orange?: number;
    }>;
    amountStats?: number;
    sourceIcon?: string | null;
  }[];
  dataStatus: string;
};

export type PlacedModule = {
  id: string;
  shapeId: string;
  x: number;
  y: number;
  rotation: 0 | 90 | 180 | 270;
  rarity: "S" | "A" | "B";
  level: number;
  mainStats: {
    sourceStatId?: string;
    statId: StatId;
    value: number;
  }[];
  mainStat?: {
    statId: StatId;
    value: number;
  };
  subStatSourceIds?: string[];
  subStats: {
    sourceStatId?: string;
    statId: StatId;
    value: number;
  }[];
};

export type BuildSave = {
  version: 1;
  characterId: string;
  characterLevel?: number;
  gearId: string;
  gearLevel?: number;
  gearMainStatId?: string;
  gearSubStatIds?: string[];
  arcId: string;
  arcLevel?: number;
  modules: PlacedModule[];
  comment?: string;
  manualStats?: Partial<StatBlock>;
  meta: {
    buildId?: string;
    createdAt: string;
    updatedAt: string;
  };
};
