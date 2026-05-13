import type { Arc, Character, Gear, ModuleBoard, ModuleShape, PlacedModule, StatBlock, StatId } from "./types";

const EMPTY_STATS: StatBlock = {
  hp: 0,
  attack: 0,
  defense: 0,
  critRate: 0,
  critDamage: 0,
  chargeEfficiency: 0,
  unbalIntensity: 0,
  generalDamage: 0,
  attributeDamage: 0,
};

type EquipmentStats = StatBlock & {
  attackPercent: number;
  hpPercent: number;
  defensePercent: number;
};

export function rotateCells(shape: ModuleShape, rotation: PlacedModule["rotation"]) {
  const rotated = shape.cells.map((cell) => {
    if (rotation === 0) return { ...cell };
    if (rotation === 90) return { x: cell.y, y: -cell.x };
    if (rotation === 180) return { x: -cell.x, y: -cell.y };
    return { x: -cell.y, y: cell.x };
  });
  const minX = Math.min(...rotated.map((cell) => cell.x));
  const minY = Math.min(...rotated.map((cell) => cell.y));
  return rotated.map((cell) => ({ x: cell.x - minX, y: cell.y - minY }));
}

export function occupiedCells(module: PlacedModule, shape: ModuleShape) {
  return rotateCells(shape, module.rotation).map((cell) => ({
    x: module.x + cell.x,
    y: module.y + cell.y,
  }));
}

export function canPlaceModule(
  candidate: PlacedModule,
  board: ModuleBoard,
  placed: PlacedModule[],
  shapes: ModuleShape[],
): { ok: boolean; reason?: string } {
  const shape = shapes.find((row) => row.id === candidate.shapeId);
  if (!shape) return { ok: false, reason: "形状が見つかりません" };
  if (candidate.rotation !== 0 && (!shape.rotatable || !board.rules.allowRotation)) {
    return { ok: false, reason: "このモジュールは回転できません" };
  }
  if (!placed.some((row) => row.id === candidate.id) && placed.length >= board.rules.maxModules) {
    return { ok: false, reason: `最大配置数 ${board.rules.maxModules} を超えます` };
  }

  const occupied = new Set<string>();
  for (const module of placed.filter((row) => row.id !== candidate.id)) {
    const otherShape = shapes.find((row) => row.id === module.shapeId);
    if (!otherShape) continue;
    for (const cell of occupiedCells(module, otherShape)) occupied.add(`${cell.x}:${cell.y}`);
  }

  for (const cell of occupiedCells(candidate, shape)) {
    const boardCell = board.cells.find((row) => row.x === cell.x && row.y === cell.y);
    if (!boardCell) return { ok: false, reason: "盤面外には配置できません" };
    if (!boardCell.enabled || boardCell.type === "locked") return { ok: false, reason: "無効セルには配置できません" };
    if (occupied.has(`${cell.x}:${cell.y}`)) return { ok: false, reason: "既存モジュールと重なっています" };
  }
  return { ok: true };
}

export function calculateStats(
  character: Character,
  gear: Gear,
  arc: Arc,
  arcLevel: number,
  modules: PlacedModule[],
  shapes: ModuleShape[],
  gearStats: { statId: StatId; value: number; sourceStatId?: string }[] = [],
  characterLevel = 80,
): StatBlock {
  const characterStats = getCharacterStatsAtLevel(character, characterLevel);
  const arcStats = getArcStatsAtLevel(arc, arcLevel);
  const base = { ...EMPTY_STATS, ...characterStats };
  const equipment: EquipmentStats = { ...EMPTY_STATS, attackPercent: 0, hpPercent: 0, defensePercent: 0 };
  const applyEquipment = (statId: StatId, value: number, sourceStatId?: string) => {
    if (statId === "attributeDamage" && sourceStatId && !isCharacterAttributeDamageSource(character, sourceStatId)) return;
    if (statId === "attackPercent" || statId === "hpPercent" || statId === "defensePercent") equipment[statId] += value;
    else equipment[statId] += value;
  };

  for (const stat of gear.baseStats) applyEquipment(stat.statId, stat.value);
  for (const stat of gearStats) applyEquipment(stat.statId, stat.value, stat.sourceStatId);
  for (const module of modules) {
    const mainStats: { statId: StatId; value: number; sourceStatId?: string }[] = module.mainStats?.length ? module.mainStats : module.mainStat ? [module.mainStat] : [];
    for (const main of mainStats) applyEquipment(main.statId, main.value, main.sourceStatId);
    for (const sub of module.subStats) applyEquipment(sub.statId, sub.value, sub.sourceStatId);
  }
  applyModuleSpecialization(character, modules, shapes, applyEquipment);

  const attackBase = base.attack + Number(arcStats.attack ?? 0);
  const hpBase = base.hp + Number(arcStats.hp ?? 0);
  const defenseBase = base.defense + Number(arcStats.defense ?? 0);
  const attackPercent = equipment.attackPercent + Number(arcStats.attackPercent ?? 0);
  const hpPercent = equipment.hpPercent + Number(arcStats.hpPercent ?? 0);
  const defensePercent = equipment.defensePercent + Number(arcStats.defensePercent ?? 0);

  return {
    hp: Math.round(hpBase * (1 + hpPercent / 100) + equipment.hp),
    attack: Math.round(attackBase * (1 + attackPercent / 100) + equipment.attack),
    defense: Math.round(defenseBase * (1 + defensePercent / 100) + equipment.defense),
    critRate: base.critRate + Number(arcStats.critRate ?? 0) + equipment.critRate,
    critDamage: base.critDamage + Number(arcStats.critDamage ?? 0) + equipment.critDamage,
    chargeEfficiency: base.chargeEfficiency + Number(arcStats.chargeEfficiency ?? 0) + equipment.chargeEfficiency,
    unbalIntensity: base.unbalIntensity + Number(arcStats.unbalIntensity ?? 0) + equipment.unbalIntensity,
    generalDamage: base.generalDamage + Number(arcStats.generalDamage ?? 0) + equipment.generalDamage,
    attributeDamage: base.attributeDamage + Number(arcStats.attributeDamage ?? 0) + equipment.attributeDamage,
  };
}

function applyModuleSpecialization(
  character: Character,
  modules: PlacedModule[],
  shapes: ModuleShape[],
  applyEquipment: (statId: StatId, value: number, sourceStatId?: string) => void,
) {
  const targetSize = character.moduleBoard.ownerGridCount;
  const stats = character.moduleBoard.specialization?.stats ?? [];
  if (!targetSize || !stats.length) return;

  const matchingCount = modules.filter((module) => {
    const shape = shapes.find((row) => row.id === module.shapeId);
    const size = shape?.ownGridNum ?? shape?.cells.length;
    return size === targetSize;
  }).length;
  if (!matchingCount) return;

  for (const stat of stats) {
    const statId = statIdFromSource(stat.sourceStatId, character);
    if (statId) applyEquipment(statId, stat.value * matchingCount, stat.sourceStatId);
  }
}

function statIdFromSource(sourceStatId: string, character?: Character): StatId | null {
  const map: Record<string, StatId> = {
    AtkBase: "attack",
    AtkAdd: "attack",
    AtkUp: "attackPercent",
    HPMaxBase: "hp",
    HPMaxAdd: "hp",
    HPMaxUp: "hpPercent",
    DefBase: "defense",
    DefAdd: "defense",
    DefUp: "defensePercent",
    CritBase: "critRate",
    CritDamageBase: "critDamage",
    ChargeGetEfficiencyBase: "chargeEfficiency",
    UnbalIntensityBase: "unbalIntensity",
    DamageUpGeneralBase: "generalDamage",
  };
  if (map[sourceStatId]) return map[sourceStatId];
  if (attributeDamageSourceIds.has(sourceStatId) && (!character || isCharacterAttributeDamageSource(character, sourceStatId))) return "attributeDamage";
  return null;
}

const attributeDamageSourceIds = new Set([
  "DamageUpCosmosBase",
  "DamageUpNatureBase",
  "DamageUpIncantationBase",
  "DamageUpPsycheBase",
  "DamageUpChaosBase",
  "DamageUpLakshanaBase",
  "DamageUpPsychicallyBase",
]);

function isCharacterAttributeDamageSource(character: Character, sourceStatId: string) {
  const elementKey = character.elementKey;
  if (!elementKey) return attributeDamageSourceIds.has(sourceStatId);
  const sourceKeyByElementKey: Record<string, string> = {
    Anima: "Nature",
    Cosmos: "Cosmos",
    Incantation: "Incantation",
    Chaos: "Chaos",
    Psyche: "Psyche",
    Lakshana: "Lakshana",
  };
  return sourceStatId === `DamageUp${sourceKeyByElementKey[elementKey] ?? elementKey}Base`;
}

export function getCharacterStatsAtLevel(character: Character, level: number): StatBlock {
  const normalizedLevel = clampLevel(level, character.levelStats?.supportedLevels.min ?? 1, character.levelStats?.supportedLevels.max ?? 80);
  const stats = { ...EMPTY_STATS, ...character.baseStats };
  for (const slot of character.levelStats?.statSlots ?? []) {
    if (!slot.statId || !slot.values?.length) continue;
    const value = slot.values[normalizedLevel - 1] ?? slot.values.at(-1);
    if (typeof value === "number") stats[slot.statId] = value;
  }
  return stats;
}

export function getArcStatsAtLevel(arc: Arc, level: number): Partial<Record<StatId, number>> {
  const normalizedLevel = clampLevel(level, arc.levelStats?.supportedLevels.min ?? 1, arc.levelStats?.supportedLevels.max ?? 80);
  const stats: Partial<Record<StatId, number>> = {};
  for (const slot of arc.levelStats?.statSlots ?? []) {
    if (!slot.statId || !slot.values?.length) continue;
    const value = slot.values[normalizedLevel - 1] ?? slot.values.at(-1);
    if (typeof value === "number") stats[slot.statId] = value;
  }
  return Object.keys(stats).length > 0 ? stats : arc.baseStats;
}

function clampLevel(level: number, min: number, max: number) {
  if (!Number.isFinite(level)) return max;
  return Math.max(min, Math.min(max, Math.round(level)));
}
