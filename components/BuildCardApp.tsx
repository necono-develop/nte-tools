"use client";

import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, DragEvent, ReactNode, Ref } from "react";
import { toPng } from "html-to-image";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Download, Info, RotateCw, Save, Share2, Trash2, X } from "lucide-react";
import charactersJson from "@/data/characters.json";
import gearsJson from "@/data/gears.json";
import gearStatOptionsJson from "@/data/gearStatOptions.json";
import arcsJson from "@/data/arcs.json";
import modulesJson from "@/data/modules.json";
import moduleShapesJson from "@/data/moduleShapes.json";
import statIconsJson from "@/data/statIcons.json";
import statsJson from "@/data/stats.json";
import { assetPath } from "@/lib/asset";
import { calculateStats, canPlaceModule, getArcStatsAtLevel, occupiedCells } from "@/lib/build";
import type { Arc, BuildSave, Character, Gear, GearStatOption, LocaleText, Module, ModuleShape, PlacedModule, StatBlock, StatId } from "@/lib/types";

const characters = charactersJson as unknown as Character[];
const gears = gearsJson as unknown as Gear[];
const gearStatOptions = gearStatOptionsJson as unknown as { mainStats: GearStatOption[]; subStats: GearStatOption[] };
const arcs = arcsJson as unknown as Arc[];
const moduleData = modulesJson as unknown as Module[];
const moduleShapes = moduleShapesJson as unknown as ModuleShape[];
const QR_IMAGE_PATH = "assets/qr/nte-tools.webp";
const SITE_URL = "https://nte-tools.com/buildcard";
const X_POST_TEXT = "Built with NTE Tools\n\n#NTE #NTE_BuildCard";
const BUILD_CARD_WIDTH = 520;
const BUILD_CARD_HEIGHT = 650;
type ModuleStatOption = {
  sourceStatId: string;
  statId?: StatId | null;
  names?: LocaleText;
  isPercent?: boolean;
  sourceIcon?: string | null;
  valuesBySize: Record<string, { blue?: number; purple?: number; orange?: number }>;
};

const attributeDamageSourceIds = new Set([
  "DamageUpCosmosBase",
  "DamageUpNatureBase",
  "DamageUpIncantationBase",
  "DamageUpPsycheBase",
  "DamageUpChaosBase",
  "DamageUpLakshanaBase",
  "DamageUpPsychicallyBase",
]);

const moduleSubStatOptions: ModuleStatOption[] = gearStatOptions.subStats
  .filter((row) => row.moduleRolls?.length)
  .map((row) => ({
    sourceStatId: row.sourceStatId,
    statId: row.statId,
    names: row.names,
    isPercent: Boolean(row.isPercent),
    sourceIcon: row.sourceIcon,
    valuesBySize: Object.fromEntries((row.moduleRolls ?? []).map((roll) => [String(roll.size), roll.rolls])),
  }))
  .filter((row) => row.statId || statIdFromSourceStatId(row.sourceStatId));
const statIcons = statIconsJson as unknown as { byKey: Record<string, string>; byStatId: Record<string, string>; bySourceStatId: Record<string, string> };
const stats = statsJson as unknown as { id: keyof StatBlock; label: { ja: string }; unit: string }[];

const STORAGE_KEY = "nte-build-card-draft-v1";
const PENDING_BUILD_ID = "NTE-BUILD-PENDING";

type BoardDrag =
  | { kind: "move"; id: string; offsetX: number; offsetY: number }
  | { kind: "new"; shapeId: string; rarity: PlacedModule["rarity"]; offsetX: number; offsetY: number };

function createBuildId() {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  const time = Date.now().toString(36).slice(-2).toUpperCase();
  return `NTE-BUILD-${random}${time}`;
}

function gearBaseKey(gear: Gear) {
  return gear.id.replace(/_(blue|purple|orange)$/i, "");
}

function rarityRank(rarity: string) {
  if (rarity === "S") return 0;
  if (rarity === "A") return 1;
  if (rarity === "B") return 2;
  return 9;
}

function sortArcsByRarityAndName(values: Arc[]) {
  return [...values].sort((a, b) => rarityRank(a.rarity) - rarityRank(b.rarity) || (a.name.ja ?? a.id).localeCompare(b.name.ja ?? b.id, "ja"));
}

function normalizeGearSubStats(values?: string[]) {
  return Array.from({ length: 4 }, (_, index) => values?.[index] ?? "");
}

function clampLevelValue(value: number, min: number, max: number, fallback = max) {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, Math.round(value)));
}

function clampGearLevel(level: number) {
  return clampLevelValue(level, 0, 20, 20);
}

function buildGearRows(gear: Gear, mainStatId: string, subStatIds: string[], level: number) {
  const quality = (gear.quality ?? "orange") as "blue" | "purple" | "orange";
  const main = gearStatOptions.mainStats.find((row) => row.sourceStatId === mainStatId);
  const subs = normalizeGearSubStats(subStatIds).map((statId) => gearStatOptions.subStats.find((row) => row.sourceStatId === statId));
  const rows = [
    { kind: "main", option: main, value: gearMainStatValue(main, quality, level) },
    ...subs.map((option) => ({ kind: "sub", option, value: gearStatValue(option, quality) })),
  ];
  return {
    mainStat: rows[0],
    subStats: rows.slice(1),
    rows,
    bonuses: rows.flatMap((row) => {
      const statId = row.option?.statId ?? statIdFromSourceStatId(row.option?.sourceStatId);
      return isStatId(statId) ? [{ statId, value: row.value, sourceStatId: row.option?.sourceStatId }] : [];
    }),
  };
}

function gearMainStatValue(option: GearStatOption | undefined, quality: "blue" | "purple" | "orange", level: number) {
  const raw = option?.values?.[quality];
  if (Array.isArray(raw)) return Number(raw[clampGearLevel(level)] ?? raw.at(-1) ?? 0);
  return Number(raw ?? 0);
}

function gearStatValue(option: GearStatOption | undefined, quality: "blue" | "purple" | "orange") {
  const raw = option?.values?.[quality];
  if (Array.isArray(raw)) return Number(raw.at(-1) ?? 0);
  return Number(raw ?? 0);
}

function moduleQuality(rarity: PlacedModule["rarity"]) {
  if (rarity === "B") return "blue";
  if (rarity === "A") return "purple";
  return "orange";
}

function clampModuleLevel(level: number) {
  if (!Number.isFinite(level)) return 20;
  return Math.max(0, Math.min(20, Math.round(level)));
}

function moduleShapeSize(shapeId: string) {
  const shape = moduleShapes.find((row) => row.id === shapeId);
  return shape?.ownGridNum ?? shape?.cells.length ?? 2;
}

function moduleStatValue(option: ModuleStatOption | undefined, rarity: PlacedModule["rarity"], shapeSize: number) {
  return Number(option?.valuesBySize?.[String(shapeSize)]?.[moduleQuality(rarity)] ?? 0);
}

function normalizeModuleSubStatSourceIds(values?: string[]) {
  return Array.from({ length: 4 }, (_, index) => values?.[index] ?? "");
}

function buildModuleMainStats(module: Module | undefined, level: number) {
  return (module?.mainStats ?? [])
    .filter((row) => row.statId === "hp" || row.statId === "attack")
    .map((row) => ({
      sourceStatId: row.sourceStatId,
      statId: row.statId as StatId,
      value: Number(row.values[clampModuleLevel(level)] ?? row.values.at(-1) ?? 0),
    }));
}

function normalizeModuleSubStats(values: PlacedModule["subStats"] | undefined, rarity: PlacedModule["rarity"], shapeSize: number) {
  const sourceIds = Array.from({ length: 4 }, (_, index) => values?.[index]?.sourceStatId ?? "");
  return moduleSubStatsFromSourceIds(sourceIds, rarity, shapeSize);
}

function moduleSubStatsFromSourceIds(sourceIds: string[] | undefined, rarity: PlacedModule["rarity"], shapeSize: number) {
  return normalizeModuleSubStatSourceIds(sourceIds)
    .map((sourceStatId) => moduleSubStatOptions.find((row) => row.sourceStatId === sourceStatId))
    .map((row) => row && (row.statId || statIdFromSourceStatId(row.sourceStatId)) ? {
      sourceStatId: row.sourceStatId,
      statId: (row.statId ?? statIdFromSourceStatId(row.sourceStatId)) as StatId,
      value: moduleStatValue(row, rarity, shapeSize),
    } : null)
    .slice(0, 4)
    .filter((row): row is NonNullable<typeof row> => Boolean(row));
}

function formatGearStatValue(row: { option?: GearStatOption; value: number }) {
  const value = Number.isInteger(row.value) ? row.value.toLocaleString("ja-JP") : row.value.toFixed(1);
  return row.option?.isPercent ? `${value}%` : value;
}

function shortGearStatLabel(row: { option?: GearStatOption }) {
  const sourceStatId = row.option?.sourceStatId;
  const statId = row.option?.statId ?? statIdFromSourceStatId(sourceStatId);
  if (sourceStatId === "AtkAdd" || statId === "attack") return "ATK";
  if (sourceStatId === "HPMaxAdd" || statId === "hp") return "HP";
  if (sourceStatId === "DefAdd" || statId === "defense") return "DEF";
  if (sourceStatId === "CritBase" || statId === "critRate") return "CR";
  if (sourceStatId === "CritDamageBase" || statId === "critDamage") return "CD";
  if (sourceStatId === "DamageUpGeneralBase" || statId === "generalDamage") return "DMG";
  if (sourceStatId && attributeDamageSourceIds.has(sourceStatId)) return "DMG";
  if (sourceStatId === "MagBase" || sourceStatId === "MagAdd") return "POW";
  if (sourceStatId === "UnbalIntensityBase" || sourceStatId === "UnbalIntensityAdd" || statId === "unbalIntensity") return "BRK";
  if (sourceStatId === "HealUp") return "HEAL";
  return row.option?.names?.en?.replace(/\s*%$/, "").split(/\s+/)[0]?.slice(0, 4).toUpperCase() ?? "---";
}

function formatStatValue(value: number, isPercent?: boolean) {
  const formatted = Number.isInteger(value) ? value.toLocaleString("ja-JP") : value.toFixed(1);
  return isPercent ? `${formatted}%` : formatted;
}

function isStatId(value: unknown): value is StatId {
  return typeof value === "string" && ["hp", "attack", "defense", "critRate", "critDamage", "chargeEfficiency", "unbalIntensity", "generalDamage", "attributeDamage", "attackPercent", "hpPercent", "defensePercent"].includes(value);
}

function statIconByKey(key: string) {
  return statIcons.byKey[key] ?? statIcons.byStatId[key];
}

function statIconByStatId(statId?: string | null) {
  return statId ? statIcons.byStatId[statId] : undefined;
}

function statIconBySourceStatId(sourceStatId?: string | null) {
  return sourceStatId ? statIcons.bySourceStatId[sourceStatId] : undefined;
}

function gearStatIcon(row: ReturnType<typeof buildGearRows>["rows"][number]) {
  return statIconBySourceStatId(row.option?.sourceStatId) ?? statIconByStatId(row.option?.statId);
}

function localName(value: LocaleText | undefined, fallback = "") {
  return value?.ja ?? value?.en ?? value?.zhHans ?? fallback;
}

function moduleColor(rarity?: PlacedModule["rarity"]) {
  if (rarity === "B") return "#4aa8ff";
  if (rarity === "A") return "#b96dff";
  if (rarity === "S") return "#ffb547";
  return "#39c2ff";
}

function moduleEdgeClasses(module: PlacedModule | undefined, cells: Map<string, PlacedModule>, x: number, y: number) {
  if (!module) return "";
  const same = (cx: number, cy: number) => cells.get(`${cx}:${cy}`)?.id === module.id;
  return [
    !same(x, y - 1) ? "edge-top" : "",
    !same(x + 1, y) ? "edge-right" : "",
    !same(x, y + 1) ? "edge-bottom" : "",
    !same(x - 1, y) ? "edge-left" : "",
  ].filter(Boolean).join(" ");
}

function gearModuleTotals(modules: PlacedModule[], gearRows: ReturnType<typeof buildGearRows>) {
  const totals = { chargeEfficiency: 0, cyclePower: 0 };
  const add = (stat: { sourceStatId?: string; statId?: string | null; value: number }) => {
    if (stat.statId === "chargeEfficiency" || stat.sourceStatId === "ChargeGetEfficiencyBase") totals.chargeEfficiency += stat.value;
    if (stat.sourceStatId === "MagBase" || stat.sourceStatId === "MagAdd") totals.cyclePower += stat.value;
  };

  for (const row of gearRows.rows) {
    add({
      sourceStatId: row.option?.sourceStatId,
      statId: row.option?.statId,
      value: row.value,
    });
  }
  for (const module of modules) {
    for (const stat of module.mainStats ?? []) add(stat);
    for (const stat of module.subStats ?? []) add(stat);
  }
  return totals;
}

function statIdFromSourceStatId(sourceStatId?: string | null): StatId | null {
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
  if (!sourceStatId) return null;
  return map[sourceStatId] ?? (attributeDamageSourceIds.has(sourceStatId) ? "attributeDamage" : null);
}

function scoreAttributeDamageValue(character: Character, stat: { sourceStatId?: string; statId?: string | null; value: number }) {
  if (!stat.sourceStatId || !attributeDamageSourceIds.has(stat.sourceStatId)) return 0;
  const sourceKeyByElementKey: Record<string, string> = {
    Anima: "Nature",
    Cosmos: "Cosmos",
    Incantation: "Incantation",
    Chaos: "Chaos",
    Psyche: "Psyche",
    Lakshana: "Lakshana",
  };
  const elementKey = character.elementKey;
  if (!elementKey) return stat.value;
  return stat.sourceStatId === `DamageUp${sourceKeyByElementKey[elementKey] ?? elementKey}Base` ? stat.value : 0;
}

function statScoreUnit(character: Character, stat: { sourceStatId?: string; statId?: string | null; value: number }) {
  const attackFlat = stat.statId === "attack" || stat.sourceStatId === "AtkAdd" || stat.sourceStatId === "AtkBase" ? stat.value : 0;
  const attackPercent = stat.statId === "attackPercent" || stat.sourceStatId === "AtkUp" ? stat.value : 0;
  const critDamage = stat.statId === "critDamage" || stat.sourceStatId === "CritDamageBase" ? stat.value : 0;
  const critRate = stat.statId === "critRate" || stat.sourceStatId === "CritBase" ? stat.value : 0;
  const generalDamage = stat.sourceStatId === "DamageUpGeneralBase" ? stat.value : 0;
  const attributeDamage = scoreAttributeDamageValue(character, stat);
  const weighted = attackFlat * 0.5 + attackPercent * 0.8 + critDamage + critRate * 2 + generalDamage + attributeDamage;
  const critOnly = critRate * 2 + critDamage;
  return Math.trunc((Math.max(weighted, critOnly) / 2) * 10) / 10;
}

function gearModuleScore(character: Character, modules: PlacedModule[], gearRows: ReturnType<typeof buildGearRows>) {
  const gearScore = gearRows.rows.reduce((total, row) => total + statScoreUnit(character, {
    sourceStatId: row.option?.sourceStatId,
    statId: row.option?.statId,
    value: row.value,
  }), 0);
  const moduleScore = modules.reduce((total, module) => (
    total + module.subStats.reduce((sum, stat) => sum + statScoreUnit(character, stat), 0)
  ), 0);
  return Math.trunc((gearScore + moduleScore) * 10) / 10;
}

export default function BuildCardApp() {
  const [characterId, setCharacterId] = useState("");
  const [characterLevel, setCharacterLevel] = useState(80);
  const [gearId, setGearId] = useState("");
  const [gearLevel, setGearLevel] = useState(20);
  const [gearMainStatId, setGearMainStatId] = useState("");
  const [gearSubStatIds, setGearSubStatIds] = useState<string[]>(normalizeGearSubStats());
  const [arcId, setArcId] = useState("");
  const [showAllArcs, setShowAllArcs] = useState(false);
  const [arcLevel, setArcLevel] = useState(80);
  const [shapeId, setShapeId] = useState(moduleShapes[2]?.id ?? moduleShapes[0]?.id ?? "");
  const [moduleRarity, setModuleRarity] = useState<PlacedModule["rarity"]>("S");
  const [modules, setModules] = useState<PlacedModule[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [boardDrag, setBoardDrag] = useState<BoardDrag | null>(null);
  const [hoverCell, setHoverCell] = useState<{ x: number; y: number } | null>(null);
  const [buildId, setBuildId] = useState(PENDING_BUILD_ID);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("盤面をクリックしてモジュールを配置");
  const cardRef = useRef<HTMLDivElement>(null);
  const previewFrameRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(1);

  const character = characters.find((row) => row.id === characterId) ?? characters[0];
  const gear = gears.find((row) => row.id === gearId) ?? gears[0];
  const arc = arcs.find((row) => row.id === arcId) ?? arcs[0];
  const selectedShape = moduleShapes.find((row) => row.id === shapeId) ?? moduleShapes[0];
  const selectedModule = modules.find((row) => row.id === selectedModuleId) ?? null;
  const selectedGearBaseId = gearId ? gearBaseKey(gear) : "";
  const effectiveGearBaseId = selectedGearBaseId || gearBaseKey(gear);
  const gearBaseOptions = useMemo(() => {
    const map = new Map<string, Gear>();
    for (const row of gears) {
      const key = gearBaseKey(row);
      if (!map.has(key) || row.rarity === "S") map.set(key, row);
    }
    return [...map.entries()].map(([id, row]) => ({ id, gear: row }));
  }, []);
  const selectedGearRankOptions = useMemo(
    () => gears.filter((row) => gearBaseKey(row) === effectiveGearBaseId).sort((a, b) => rarityRank(a.rarity) - rarityRank(b.rarity)),
    [effectiveGearBaseId],
  );
  const compatibleArcs = useMemo(() => {
    const filtered = arcs.filter((row) => character.weaponTypeId && row.typeId === character.weaponTypeId);
    return sortArcsByRarityAndName(filtered.length ? filtered : arcs);
  }, [character]);
  const arcOptions = useMemo(() => showAllArcs ? sortArcsByRarityAndName(arcs) : compatibleArcs, [showAllArcs, compatibleArcs]);
  const arcStats = useMemo(() => getArcStatsAtLevel(arc, arcLevel), [arc, arcLevel]);
  const gearRows = useMemo(() => buildGearRows(gear, gearMainStatId, gearSubStatIds, gearLevel), [gear, gearMainStatId, gearSubStatIds, gearLevel]);
  const finalStats = useMemo(() => calculateStats(character, gear, arc, arcLevel, modules, moduleShapes, gearRows.bonuses, characterLevel), [character, gear, arc, arcLevel, modules, gearRows, characterLevel]);
  const boardCellMap = useMemo(() => new Map(character.moduleBoard.cells.map((cell) => [`${cell.x}:${cell.y}`, cell])), [character]);
  const occupied = useMemo(() => {
    const map = new Map<string, PlacedModule>();
    for (const module of modules) {
      const shape = moduleShapes.find((row) => row.id === module.shapeId);
      if (!shape) continue;
      for (const cell of occupiedCells(module, shape)) map.set(`${cell.x}:${cell.y}`, module);
    }
    return map;
  }, [modules]);
  const moduleDeleteCells = useMemo(() => {
    const map = new Map<string, string>();
    for (const module of modules) {
      const shape = moduleShapes.find((row) => row.id === module.shapeId);
      if (!shape) continue;
      const [first] = occupiedCells(module, shape).sort((a, b) => a.y - b.y || a.x - b.x);
      if (first) map.set(module.id, `${first.x}:${first.y}`);
    }
    return map;
  }, [modules]);
  const ghostModule = useMemo(() => {
    if (!boardDrag || !hoverCell) return null;
    if (boardDrag.kind === "move") {
      const source = modules.find((row) => row.id === boardDrag.id);
      if (!source) return null;
      const candidate = { ...source, x: hoverCell.x - boardDrag.offsetX, y: hoverCell.y - boardDrag.offsetY };
      return { candidate, valid: canPlaceModule(candidate, character.moduleBoard, modules, moduleShapes).ok };
    }
    const candidate = createPlacedModule(boardDrag.shapeId, boardDrag.rarity, hoverCell.x - boardDrag.offsetX, hoverCell.y - boardDrag.offsetY);
    return { candidate, valid: canPlaceModule(candidate, character.moduleBoard, modules, moduleShapes).ok };
  }, [boardDrag, hoverCell, modules, character]);
  const ghostCells = useMemo(() => {
    if (!ghostModule) return new Map<string, boolean>();
    const shape = moduleShapes.find((row) => row.id === ghostModule.candidate.shapeId);
    if (!shape) return new Map<string, boolean>();
    return new Map(occupiedCells(ghostModule.candidate, shape).map((cell) => [`${cell.x}:${cell.y}`, ghostModule.valid]));
  }, [ghostModule]);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      setBuildId(createBuildId());
      return;
    }
    try {
      const saved = JSON.parse(raw) as BuildSave;
      setCharacterId(saved.characterId);
      setCharacterLevel(clampCharacterLevel(saved.characterLevel ?? 80));
      setGearId(saved.gearId);
      setGearLevel(clampGearLevel(saved.gearLevel ?? 20));
      setGearMainStatId(saved.gearMainStatId ?? "");
      setGearSubStatIds(normalizeGearSubStats(saved.gearSubStatIds));
      setArcId(saved.arcId);
      setArcLevel(saved.arcLevel ?? 80);
      setModules((saved.modules ?? []).map(normalizePlacedModule));
      setComment(saved.comment ?? "");
      setBuildId(saved.meta?.buildId ?? createBuildId());
      setMessage("ローカル保存された下書きを復元しました");
    } catch {
      setBuildId(createBuildId());
      setMessage("保存データを読み込めませんでした");
    }
  }, []);

  useEffect(() => {
    const frame = previewFrameRef.current;
    if (!frame) return;

    const updateScale = () => {
      setPreviewScale(Math.min(1, frame.clientWidth / BUILD_CARD_WIDTH));
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(frame);
    window.addEventListener("resize", updateScale);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateScale);
    };
  }, []);

  useEffect(() => {
    if (!arcId || !arcOptions.length || arcOptions.some((row) => row.id === arcId)) return;
    setArcId(arcOptions[0].id);
  }, [arcOptions, arcId]);

  function createPlacedModule(targetShapeId: string, rarity: PlacedModule["rarity"], x: number, y: number): PlacedModule {
    const definition = moduleData.find((row) => row.shapeId === targetShapeId && row.rarity === rarity) ?? moduleData.find((row) => row.shapeId === targetShapeId);
    const level = 20;
    return {
      id: `module_${Date.now().toString(36)}`,
      shapeId: targetShapeId,
      x,
      y,
      rotation: 0,
      rarity,
      level,
      mainStats: buildModuleMainStats(definition, level),
      subStatSourceIds: normalizeModuleSubStatSourceIds(),
      subStats: normalizeModuleSubStats(undefined, rarity, definition?.ownGridNum ?? moduleShapeSize(targetShapeId)),
    };
  }

  function placementCandidate(targetShapeId: string, rarity: PlacedModule["rarity"], x: number, y: number): { module: PlacedModule; result: { ok: boolean; reason?: string } } {
    const shape = moduleShapes.find((row) => row.id === targetShapeId);
    if (!shape) return { module: createPlacedModule(targetShapeId, rarity, x, y), result: { ok: false, reason: "形状が見つかりません" } };

    const origins = [{ x, y }, ...shape.cells.map((cell) => ({ x: x - cell.x, y: y - cell.y }))];
    const uniqueOrigins = Array.from(new Map(origins.map((origin) => [`${origin.x}:${origin.y}`, origin])).values())
      .sort((a, b) => Math.abs(a.x - x) + Math.abs(a.y - y) - (Math.abs(b.x - x) + Math.abs(b.y - y)));

    let fallback: { module: PlacedModule; result: { ok: boolean; reason?: string } } = {
      module: createPlacedModule(targetShapeId, rarity, x, y),
      result: { ok: false, reason: "配置できません" },
    };
    for (const origin of uniqueOrigins) {
      const module = createPlacedModule(targetShapeId, rarity, origin.x, origin.y);
      const result = canPlaceModule(module, character.moduleBoard, modules, moduleShapes);
      if (result.ok) return { module, result };
      fallback = { module, result };
    }
    return fallback;
  }

  function placeAt(x: number, y: number) {
    const existing = occupied.get(`${x}:${y}`);
    if (existing) {
      setSelectedModuleId(existing.id);
      setMessage("配置済みモジュールを選択しました");
      return;
    }

    const { module: next, result } = placementCandidate(shapeId, moduleRarity, x, y);
    if (!result.ok) {
      setMessage(result.reason ?? "配置できません");
      return;
    }
    setModules((current) => [...current, next]);
    setSelectedModuleId(next.id);
    setMessage(`${localName(selectedShape.names, selectedShape.name)} を配置しました`);
  }

  function addModuleFromPalette(targetShapeId: string, rarity: PlacedModule["rarity"], x: number, y: number) {
    const next = createPlacedModule(targetShapeId, rarity, x, y);
    const result = canPlaceModule(next, character.moduleBoard, modules, moduleShapes);
    if (!result.ok) {
      setMessage(result.reason ?? "配置できません");
      return;
    }
    setModules((current) => [...current, next]);
    setSelectedModuleId(next.id);
    setShapeId(targetShapeId);
    setMessage(`${localName(moduleShapes.find((row) => row.id === targetShapeId)?.names, "Module")} を配置しました`);
  }

  function moveModuleTo(moduleId: string, x: number, y: number) {
    const module = modules.find((row) => row.id === moduleId);
    if (!module) return;
    const next = { ...module, x, y };
    const result = canPlaceModule(next, character.moduleBoard, modules, moduleShapes);
    if (!result.ok) {
      setMessage(result.reason ?? "移動できません");
      return;
    }
    setModules((current) => current.map((row) => row.id === moduleId ? next : row));
    setSelectedModuleId(moduleId);
    setMessage("モジュールを移動しました");
  }

  function nudgeSelectedModule(dx: number, dy: number) {
    if (!selectedModule) return;
    moveModuleTo(selectedModule.id, selectedModule.x + dx, selectedModule.y + dy);
  }

  function startModuleDrag(event: DragEvent<HTMLDivElement>, module: PlacedModule, x: number, y: number) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", module.id);
    setBoardDrag({ kind: "move", id: module.id, offsetX: x - module.x, offsetY: y - module.y });
    setSelectedModuleId(module.id);
  }

  function startShapeDrag(event: DragEvent<HTMLButtonElement>, targetShapeId: string) {
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData("text/plain", targetShapeId);
    setBoardDrag({ kind: "new", shapeId: targetShapeId, rarity: moduleRarity, offsetX: 0, offsetY: 0 });
    setShapeId(targetShapeId);
  }

  function allowModuleDrop(event: DragEvent<HTMLDivElement>, x: number, y: number) {
    if (!boardDrag) return;
    event.preventDefault();
    setHoverCell({ x, y });
    event.dataTransfer.dropEffect = boardDrag.kind === "move" ? "move" : "copy";
  }

  function dropModule(event: DragEvent<HTMLDivElement>, x: number, y: number) {
    if (!boardDrag) return;
    event.preventDefault();
    if (boardDrag.kind === "move") {
      moveModuleTo(boardDrag.id, x - boardDrag.offsetX, y - boardDrag.offsetY);
    } else {
      addModuleFromPalette(boardDrag.shapeId, boardDrag.rarity, x - boardDrag.offsetX, y - boardDrag.offsetY);
    }
    setBoardDrag(null);
    setHoverCell(null);
  }

  function removeModule(moduleId: string) {
    setModules((current) => current.filter((row) => row.id !== moduleId));
    setSelectedModuleId((current) => current === moduleId ? null : current);
    setMessage("モジュールを削除しました");
  }

  function rotateSelected() {
    if (!selectedModule) return;
    const nextRotation = ((selectedModule.rotation + 90) % 360) as PlacedModule["rotation"];
    const next = { ...selectedModule, rotation: nextRotation };
    const result = canPlaceModule(next, character.moduleBoard, modules, moduleShapes);
    if (!result.ok) {
      setMessage(result.reason ?? "回転できません");
      return;
    }
    setModules((current) => current.map((row) => row.id === next.id ? next : row));
    setMessage("モジュールを回転しました");
  }

  function removeSelected() {
    if (!selectedModule) return;
    removeModule(selectedModule.id);
  }

  function updateSelectedModule(patch: Partial<PlacedModule>) {
    if (!selectedModule) return;
    setModules((current) => current.map((row) => row.id === selectedModule.id ? { ...row, ...patch } : row));
  }

  function normalizePlacedModule(module: PlacedModule): PlacedModule {
    const rarity = module.rarity ?? "S";
    const level = clampModuleLevel(module.level);
    const definition = moduleData.find((row) => row.shapeId === module.shapeId && row.rarity === rarity) ?? moduleData.find((row) => row.shapeId === module.shapeId);
    const shapeSize = definition?.ownGridNum ?? moduleShapeSize(module.shapeId);
    const subStatSourceIds = normalizeModuleSubStatSourceIds(module.subStatSourceIds ?? module.subStats?.map((row) => row?.sourceStatId ?? ""));
    return {
      ...module,
      rarity,
      level,
      mainStats: module.mainStats?.length ? module.mainStats : buildModuleMainStats(definition, level),
      subStatSourceIds,
      subStats: moduleSubStatsFromSourceIds(subStatSourceIds, rarity, shapeSize),
    };
  }

  function updateGear(baseId: string, rarity = gearId ? gear.rarity : "S") {
    if (!baseId) {
      setGearId("");
      return;
    }
    const next = gears.find((row) => gearBaseKey(row) === baseId && row.rarity === rarity)
      ?? gears.find((row) => gearBaseKey(row) === baseId)
      ?? gear;
    setGearId(next.id);
  }

  function updateGearSubStat(index: number, statId: string) {
    setGearSubStatIds((current) => {
      const next = normalizeGearSubStats(current);
      next[index] = statId;
      return next;
    });
  }

  function updateSelectedModuleLevel(level: number) {
    if (!selectedModule) return;
    const nextLevel = clampModuleLevel(level);
    const definition = moduleData.find((row) => row.shapeId === selectedModule.shapeId && row.rarity === selectedModule.rarity) ?? moduleData.find((row) => row.shapeId === selectedModule.shapeId);
    const shapeSize = definition?.ownGridNum ?? moduleShapeSize(selectedModule.shapeId);
    updateSelectedModule({
      level: nextLevel,
      mainStats: buildModuleMainStats(definition, nextLevel),
      subStatSourceIds: normalizeModuleSubStatSourceIds(selectedModule.subStatSourceIds ?? selectedModule.subStats.map((row) => row?.sourceStatId ?? "")),
      subStats: moduleSubStatsFromSourceIds(selectedModule.subStatSourceIds ?? selectedModule.subStats.map((row) => row?.sourceStatId ?? ""), selectedModule.rarity, shapeSize),
    });
  }

  function updateSelectedModuleRarity(rarity: PlacedModule["rarity"]) {
    if (!selectedModule) return;
    const definition = moduleData.find((row) => row.shapeId === selectedModule.shapeId && row.rarity === rarity) ?? moduleData.find((row) => row.shapeId === selectedModule.shapeId);
    const shapeSize = definition?.ownGridNum ?? moduleShapeSize(selectedModule.shapeId);
    updateSelectedModule({
      rarity,
      mainStats: buildModuleMainStats(definition, selectedModule.level),
      subStatSourceIds: normalizeModuleSubStatSourceIds(selectedModule.subStatSourceIds ?? selectedModule.subStats.map((row) => row?.sourceStatId ?? "")),
      subStats: moduleSubStatsFromSourceIds(selectedModule.subStatSourceIds ?? selectedModule.subStats.map((row) => row?.sourceStatId ?? ""), rarity, shapeSize),
    });
  }

  function updateSelectedModuleSubStat(index: number, sourceStatId: string) {
    if (!selectedModule) return;
    const shapeSize = moduleData.find((row) => row.shapeId === selectedModule.shapeId && row.rarity === selectedModule.rarity)?.ownGridNum ?? moduleShapeSize(selectedModule.shapeId);
    const nextSourceIds = normalizeModuleSubStatSourceIds(selectedModule.subStatSourceIds ?? selectedModule.subStats.map((row) => row?.sourceStatId ?? ""));
    nextSourceIds[index] = sourceStatId;
    updateSelectedModule({
      subStatSourceIds: nextSourceIds,
      subStats: moduleSubStatsFromSourceIds(nextSourceIds, selectedModule.rarity, shapeSize),
    });
  }

  function saveLocal() {
    const now = new Date().toISOString();
    let createdAt = now;
    let nextBuildId = buildId === PENDING_BUILD_ID ? createBuildId() : buildId;
    try {
      const existing = window.localStorage.getItem(STORAGE_KEY);
      if (existing) {
        const savedMeta = (JSON.parse(existing) as Partial<BuildSave>).meta;
        if (savedMeta?.buildId === nextBuildId) {
          createdAt = savedMeta.createdAt ?? now;
        }
      }
    } catch {
      createdAt = now;
    }
    setBuildId(nextBuildId);
    const data: BuildSave = {
      version: 1,
      characterId,
      characterLevel,
      gearId,
      gearLevel,
      gearMainStatId,
      gearSubStatIds: normalizeGearSubStats(gearSubStatIds),
      arcId,
      arcLevel,
      modules,
      comment,
      meta: { buildId: nextBuildId, createdAt, updatedAt: now },
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setMessage("ローカルに保存しました");
  }

  function resetBuild() {
    setCharacterId("");
    setGearId("");
    setArcId("");
    setModules([]);
    setSelectedModuleId(null);
    setBuildId(createBuildId());
    setCharacterLevel(80);
    setGearLevel(20);
    setGearMainStatId("");
    setGearSubStatIds(normalizeGearSubStats());
    setArcLevel(80);
    setComment("");
    setMessage("ビルドをリセットしました");
  }

  async function downloadBuildPng() {
    if (!cardRef.current) return;
    const dataUrl = await toPng(cardRef.current, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: "#07101a",
    });
    const link = document.createElement("a");
    link.download = `nte-build-${character.slug}.png`;
    link.href = dataUrl;
    link.click();
  }

  async function exportPng() {
    setMessage("PNGを書き出しています");
    await downloadBuildPng();
    setMessage("PNGを書き出しました");
  }

  async function postToX() {
    const params = new URLSearchParams({
      text: X_POST_TEXT,
      url: SITE_URL,
    });
    const intentUrl = `https://twitter.com/intent/tweet?${params.toString()}`;
    const popup = window.open("about:blank", "_blank");
    if (popup) {
      popup.opener = null;
    }
    try {
      setMessage("PNGを書き出してXを開きます");
      await downloadBuildPng();
      setMessage("PNGを書き出しました。Xで投稿できます");
      if (popup) {
        popup.location.href = intentUrl;
      } else {
        window.open(intentUrl, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      popup?.close();
      setMessage("PNGの書き出しに失敗しました");
      throw error;
    }
  }

  return (
    <main className="app-shell">
      <section className="editor-panel">
        <div className="app-title">
          <div>
            <p className="eyebrow">NTE BUILD CARD</p>
            <h1>ビルドカード作成</h1>
          </div>
          <div className="status-pill">{message}</div>
        </div>

        <section className="input-section">
          <div className="input-section-head">
            <div>
              <span>01</span>
              <h2>基本設定</h2>
            </div>
            <p>キャラクターとArcを選択</p>
          </div>
          <div className="control-grid paired-control-grid">
            <div className="input-pair-card">
              <div className="pair-title">
                <AssetChip image={character.assets.icon} title="Character" subtitle={characterCombatSummary(character)} />
              </div>
              <div className="pair-fields">
                <SelectCard label="キャラクター" value={characterId} onChange={setCharacterId} placeholder="-- キャラを選択してください --">
                  {characters.map((row) => <option key={row.id} value={row.id}>{row.name.ja}</option>)}
                </SelectCard>
                <LevelInput label="Lv." min={1} max={80} value={characterLevel} onCommit={setCharacterLevel} />
              </div>
            </div>

            <div className="input-pair-card">
              <div className="pair-title">
                <AssetChip image={arc.assets.icon} title="Arc" subtitle={`${arc.rarity} / ${formatArcStats(arcStats)}`} />
              </div>
              <div className="pair-fields arc-pair-fields">
                <SelectCard label="Arc" value={arcId} onChange={setArcId} placeholder="-- Arcを選択してください --">
                  {arcOptions.map((row) => <option key={row.id} value={row.id}>{row.name.ja}</option>)}
                </SelectCard>
                <LevelInput label="Lv." min={1} max={80} value={arcLevel} onCommit={setArcLevel} />
                <div className="select-card compact-check">
                  <span>Filter</span>
                  <label>
                    <input type="checkbox" checked={showAllArcs} onChange={(event) => setShowAllArcs(event.target.checked)} />
                    全Arc表示
                  </label>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="gear-editor-panel">
          <div className="input-section-head">
            <div>
              <span>02</span>
              <h2>Gear</h2>
            </div>
            <p>{gear.rarity} / Lv.{gearLevel}</p>
          </div>
          <div className="gear-config-grid">
            <div className="input-pair-card gear-identity-card">
              <div className="pair-title">
                <AssetChip image={gear.assets.icon} title="Gear" subtitle={gear.name.ja ?? gear.id} />
              </div>
              <div className="gear-identity-fields">
                <SelectCard label="ギア名" value={selectedGearBaseId} onChange={(value) => updateGear(value)} placeholder="-- Gearを選択してください --">
                  {gearBaseOptions.map((row) => <option key={row.id} value={row.id}>{row.gear.name.ja}</option>)}
                </SelectCard>
                <div className="gear-rank-level-row">
                  <SelectCard label="ランク" value={gear.rarity} onChange={(value) => updateGear(selectedGearBaseId, value)}>
                    {selectedGearRankOptions.map((row) => <option key={row.id} value={row.rarity}>{row.rarity}</option>)}
                  </SelectCard>
                  <LevelInput label="Lv." min={0} max={20} value={gearLevel} onCommit={setGearLevel} />
                </div>
              </div>
            </div>

            <div className="input-pair-card gear-effects-card">
              <div className="pair-title text-title">
                <strong>ステータス設定</strong>
                <span>{gearRows.mainStat.option ? `Main ${shortGearStatLabel(gearRows.mainStat)} / ${formatGearStatValue(gearRows.mainStat)}` : "Main 未選択"}</span>
              </div>
              <div className="gear-stat-inputs">
                <SelectCard label="メイン" value={gearMainStatId} onChange={setGearMainStatId} placeholder="-- 選択してください --" placeholderDisabled={false}>
                  {gearStatOptions.mainStats.map((row) => <option key={row.sourceStatId} value={row.sourceStatId}>{row.names?.ja ?? row.sourceStatId}</option>)}
                </SelectCard>
                {gearRows.subStats.map((row, index) => (
                  <SelectCard key={index} label={`サブ ${index + 1}`} value={gearSubStatIds[index] ?? ""} onChange={(value) => updateGearSubStat(index, value)} placeholder="-- 選択してください --" placeholderDisabled={false}>
                    {gearStatOptions.subStats.map((option) => <option key={option.sourceStatId} value={option.sourceStatId}>{option.names?.ja ?? option.sourceStatId}</option>)}
                  </SelectCard>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="input-section modules-editor-panel">
          <div className="input-section-head">
            <div>
              <span>03</span>
              <h2>Modules</h2>
            </div>
            <p>{modules.length}/{character.moduleBoard.rules.maxModules} 配置中</p>
          </div>
          <div className="work-area">
            <div className="board-section">
              <div className="section-head">
                <h2>モジュール配置</h2>
              </div>
            <div className="module-board" style={{ gridTemplateColumns: `repeat(${character.moduleBoard.width}, minmax(0, 1fr))` }}>
              {Array.from({ length: character.moduleBoard.width * character.moduleBoard.height }, (_, index) => {
                const x = index % character.moduleBoard.width;
                const y = Math.floor(index / character.moduleBoard.width);
                const cell = boardCellMap.get(`${x}:${y}`);
                const module = occupied.get(`${x}:${y}`);
                const ghost = ghostCells.get(`${x}:${y}`);
                const isSelected = Boolean(module && module.id === selectedModuleId);
                const isDragging = Boolean(module && boardDrag?.kind === "move" && module.id === boardDrag.id);
                const showDelete = Boolean(module && moduleDeleteCells.get(module.id) === `${x}:${y}`);
                const edgeClasses = moduleEdgeClasses(module, occupied, x, y);
                return (
                  <div
                    key={`${x}:${y}`}
                    role="button"
                    tabIndex={cell?.enabled ? 0 : -1}
                    className={`board-cell ${cell?.type ?? "void"} ${!cell?.enabled ? "disabled" : ""} ${module ? "filled" : ""} ${isSelected ? "selected" : ""} ${isDragging ? "dragging" : ""} ${boardDrag && cell?.enabled ? "drop-ready" : ""} ${ghost !== undefined ? "ghost" : ""} ${ghost === false ? "invalid" : ""}`}
                    style={{ "--module-color": moduleColor(module?.rarity ?? ghostModule?.candidate.rarity) } as CSSProperties}
                    onClick={() => cell?.enabled && placeAt(x, y)}
                    draggable={Boolean(module)}
                    onDragStart={(event) => module && startModuleDrag(event, module, x, y)}
                    onDragOver={(event) => cell?.enabled && allowModuleDrop(event, x, y)}
                    onDragEnter={() => cell?.enabled && boardDrag && setHoverCell({ x, y })}
                    onDrop={(event) => cell?.enabled && dropModule(event, x, y)}
                    onDragEnd={() => {
                      setBoardDrag(null);
                      setHoverCell(null);
                    }}
                    aria-label={`cell ${x},${y}`}
                  >
                    {module ? <span className={edgeClasses} /> : null}
                    {ghost !== undefined ? <i aria-hidden="true" /> : null}
                    {module && showDelete ? (
                      <button
                        type="button"
                        className="cell-delete"
                        title="削除"
                        onClick={(event) => {
                          event.stopPropagation();
                          removeModule(module.id);
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    ) : null}
                  </div>
                );
              })}
              </div>
            </div>

            <aside className="side-editor">
            <div className="module-side-card">
              <div className="section-head">
                <h2>追加モジュール</h2>
                <span>{moduleRarity}</span>
              </div>
              <SelectCard label="ランク" value={moduleRarity} onChange={(value) => setModuleRarity(value as PlacedModule["rarity"])}>
                {(["S", "A", "B"] as const).map((rarity) => <option key={rarity} value={rarity}>{rarity}</option>)}
              </SelectCard>
              <div className="shape-preview">
                <img src={assetPath(selectedShape.asset)} alt="" />
              <div>
                <strong>{localName(selectedShape.names, selectedShape.name)}</strong>
              </div>
            </div>
              <div className="shape-palette">
                {moduleShapes.map((row) => (
                  <button
                    key={row.id}
                    type="button"
                    className={row.id === shapeId ? "selected" : ""}
                    draggable
                    onClick={() => setShapeId(row.id)}
                    onDragStart={(event) => startShapeDrag(event, row.id)}
                    onDragEnd={() => {
                      setBoardDrag(null);
                      setHoverCell(null);
                    }}
                    title={localName(row.names, row.name)}
                  >
                    <img src={assetPath(row.asset)} alt="" />
                  </button>
                ))}
              </div>
            </div>

            <div className="module-side-card">
              <div className="section-head">
                <h2>選択中</h2>
                {selectedModule ? <span>{selectedModule.rarity} Lv.{selectedModule.level}</span> : <span>なし</span>}
              </div>
              {selectedModule ? (
                <div className="module-form">
                  <LevelInput label="レベル" min={0} max={20} value={selectedModule.level} onCommit={updateSelectedModuleLevel} className="" />
                  <label>
                    ランク
                    <select value={selectedModule.rarity} onChange={(event) => updateSelectedModuleRarity(event.target.value as PlacedModule["rarity"])}>
                      {(["S", "A", "B"] as const).map((rarity) => <option key={rarity} value={rarity}>{rarity}</option>)}
                    </select>
                  </label>
                  <div className="module-fixed-stats">
                    {selectedModule.mainStats.map((row) => (
                      <div key={row.sourceStatId ?? row.statId}>
                        <span>{stats.find((stat) => stat.id === row.statId)?.label.ja ?? row.statId}</span>
                        <strong>{formatNumber(row.value)}</strong>
                      </div>
                    ))}
                  </div>
                  {Array.from({ length: 4 }, (_, index) => {
                    const shapeSize = moduleData.find((candidate) => candidate.shapeId === selectedModule.shapeId && candidate.rarity === selectedModule.rarity)?.ownGridNum ?? moduleShapeSize(selectedModule.shapeId);
                    const selectedSourceId = normalizeModuleSubStatSourceIds(selectedModule.subStatSourceIds ?? selectedModule.subStats.map((row) => row?.sourceStatId ?? ""))[index];
                    const option = moduleSubStatOptions.find((candidate) => candidate.sourceStatId === selectedSourceId);
                    const row = option ? moduleSubStatsFromSourceIds([selectedSourceId], selectedModule.rarity, shapeSize)[0] : undefined;
                  return (
                    <label key={index}>
                      サブ {index + 1}
                      <select value={selectedSourceId} onChange={(event) => updateSelectedModuleSubStat(index, event.target.value)}>
                        <option value="">-- 選択してください --</option>
                        {moduleSubStatOptions.map((candidate) => <option key={candidate.sourceStatId} value={candidate.sourceStatId}>{candidate.names?.ja ?? candidate.sourceStatId}</option>)}
                      </select>
                      <span className="module-sub-value">{option && row ? formatStatValue(row.value, option.isPercent) : ""}</span>
                    </label>
                  );
                })}
                  <div className="module-move-pad" aria-label="モジュール移動">
                    <span />
                    <button type="button" onClick={() => nudgeSelectedModule(0, -1)} title="上へ移動"><ArrowUp size={18} /></button>
                    <span />
                    <button type="button" onClick={() => nudgeSelectedModule(-1, 0)} title="左へ移動"><ArrowLeft size={18} /></button>
                    <button type="button" onClick={rotateSelected} title="回転"><RotateCw size={18} /></button>
                    <button type="button" onClick={() => nudgeSelectedModule(1, 0)} title="右へ移動"><ArrowRight size={18} /></button>
                    <span />
                    <button type="button" onClick={() => nudgeSelectedModule(0, 1)} title="下へ移動"><ArrowDown size={18} /></button>
                    <span />
                  </div>
                  <div className="icon-row">
                    <button type="button" className="icon-button danger" onClick={removeSelected} title="削除"><Trash2 size={18} /></button>
                  </div>
                </div>
              ) : (
                <p className="muted">盤面上のブロックを選択すると詳細を編集できます。</p>
              )}
            </div>
            </aside>
          </div>
        </section>

        <section className="input-section action-section">
          <div className="input-section-head">
            <div>
              <span>04</span>
              <h2>保存 / 出力</h2>
            </div>
            <p>下書き保存と画像書き出し</p>
          </div>
          <label className="comment-card">
            <span>カードコメント</span>
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value.slice(0, 48))}
              placeholder="コメントを入力"
              rows={2}
            />
          </label>
          <div className="action-row">
            <button type="button" onClick={saveLocal}><Save size={18} />保存</button>
            <button type="button" onClick={resetBuild}><X size={18} />リセット</button>
            <button type="button" className="primary" onClick={exportPng}><Download size={18} />PNG</button>
            <button type="button" className="social-action x-action" onClick={postToX}><Share2 size={18} />Xでポスト</button>
          </div>
        </section>
      </section>

      <section className="preview-panel">
        <div className="preview-toolbar">
          <span>4:5 Preview</span>
          <div className="score-help">
            <button type="button" aria-label="Score計算式">
              <Info size={16} />
            </button>
            <div className="score-help-popover" role="tooltip">
              <strong>Score計算式</strong>
              <span>対象: Gearのメイン/サブ + Moduleのサブ</span>
              <span>各項目: max(重み付き合計, 会心合計) / 2</span>
              <span>重み付き合計:</span>
              <span className="score-formula-line">攻撃力x0.5 + 攻撃力%x0.8</span>
              <span className="score-formula-line">+ クリダメ + クリ率x2</span>
              <span className="score-formula-line">+ 汎用ダメ + 有効属性ダメ</span>
              <span>会心合計: クリ率x2 + クリダメ</span>
              <span>小数第1位で切り捨て</span>
              <span>属性ダメージはキャラクター属性と一致するものだけ加算</span>
            </div>
          </div>
        </div>
        <div
          className="preview-frame"
          ref={previewFrameRef}
          style={{ height: BUILD_CARD_HEIGHT * previewScale } as CSSProperties}
        >
          <div
            className="preview-scale-layer"
            style={{ transform: `scale(${previewScale})` } as CSSProperties}
          >
            <BuildCard
              ref={cardRef}
              character={character}
              characterLevel={characterLevel}
              gear={gear}
              arc={arc}
              modules={modules}
              moduleShapes={moduleShapes}
              finalStats={finalStats}
              arcLevel={arcLevel}
              gearRows={gearRows}
              buildId={buildId}
              comment={comment}
            />
          </div>
        </div>
      </section>
    </main>
  );
}

function SelectCard({
  label,
  value,
  onChange,
  placeholder,
  placeholderDisabled = true,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  placeholderDisabled?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="select-card">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {placeholder ? <option value="" disabled={placeholderDisabled}>{placeholder}</option> : null}
        {children}
      </select>
    </label>
  );
}

function LevelInput({
  label,
  min,
  max,
  value,
  onCommit,
  className = "select-card",
}: {
  label: string;
  min: number;
  max: number;
  value: number;
  onCommit: (value: number) => void;
  className?: string;
}) {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const commit = () => {
    const parsed = draft.trim() === "" ? value : Number(draft);
    onCommit(clampLevelValue(parsed, min, max, value));
  };

  return (
    <label className={className}>
      <span>{label}</span>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={draft}
        onChange={(event) => setDraft(event.target.value.replace(/[^\d]/g, ""))}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
        }}
      />
    </label>
  );
}

function AssetChip({ image, title, subtitle }: { image: string; title: string; subtitle: string }) {
  return (
    <div className="asset-chip">
      <img src={assetPath(image)} alt="" />
      <div>
        <strong>{title}</strong>
        <span>{subtitle}</span>
      </div>
    </div>
  );
}

function characterAttributeLabel(character: Character) {
  return character.attribute ? `${character.attribute}属性` : "属性未確認";
}

function characterArcTypeLabel(character: Character) {
  return character.arcType ?? "弧盤未確認";
}

function characterCombatSummary(character: Character) {
  return `${characterAttributeLabel(character)} / ${characterArcTypeLabel(character)}`;
}

function characterAttributeDamageLabel(character: Character) {
  return character.attribute ? `${character.attribute}異能ダメージ強化` : "属性異能ダメージ強化";
}

const BuildCard = forwardRef<HTMLDivElement, {
  character: Character;
  characterLevel: number;
  gear: Gear;
  arc: Arc;
  modules: PlacedModule[];
  moduleShapes: ModuleShape[];
  finalStats: StatBlock;
  arcLevel: number;
  gearRows: ReturnType<typeof buildGearRows>;
  buildId: string;
  comment: string;
}>(function BuildCard(
  { character, characterLevel, gear, arc, modules, moduleShapes, finalStats, arcLevel, gearRows, buildId, comment },
  ref: Ref<HTMLDivElement>,
) {
  const attributeLabel = characterAttributeLabel(character);
  const arcTypeLabel = characterArcTypeLabel(character);
  const attributeDamageLabel = characterAttributeDamageLabel(character);
  const gearModuleStats = gearModuleTotals(modules, gearRows);
  const score = gearModuleScore(character, modules, gearRows);
  const moduleBoardCells = new Map(character.moduleBoard.cells.map((cell) => [`${cell.x}:${cell.y}`, cell]));
  const moduleCells = new Map<string, PlacedModule>();
  for (const module of modules) {
    const shape = moduleShapes.find((row) => row.id === module.shapeId);
    if (!shape) continue;
    for (const cell of occupiedCells(module, shape)) moduleCells.set(`${cell.x}:${cell.y}`, module);
  }

  return (
    <div
      className="build-card build-card-showcase"
      ref={ref}
      style={{
        "--character-art": `url(${assetPath(character.assets.card)})`,
        "--theme-primary": character.theme?.primary ?? "#2dc8ff",
        "--theme-secondary": character.theme?.secondary ?? "#79ecff",
        "--theme-deep": character.theme?.deep ?? "#103d75",
        "--theme-accent": character.theme?.accent ?? "#ffffff",
        "--portrait-scale": character.portraitFit?.scale ?? 1.22,
        "--portrait-x": character.portraitFit?.x ?? "-96px",
        "--portrait-y": character.portraitFit?.y ?? "-30px",
        "--portrait-bg-scale": character.portraitFit?.backgroundScale ?? "84% auto",
        "--portrait-bg-x": character.portraitFit?.backgroundX ?? "left -112px",
        "--portrait-bg-y": character.portraitFit?.backgroundY ?? "top -22px",
      } as CSSProperties}
    >
      <div className="card-background" />
      <header className="showcase-header">
        <div className="nte-mark">
          <strong>NTE</strong>
          <span>NEVERNESS TO EVERNESS</span>
        </div>
        {false ? <div className="showcase-heading">
          <h2><span>NTE</span> Build Card</h2>
          <p>出力イメージ</p>
        </div> : null}
      </header>

      <section className="showcase-main">
        <div className="hero-art">
          <img src={assetPath(character.assets.card)} alt="" />
          <div className="signature">
            <strong>{character.name.en ?? character.slug}</strong>
            <span>{buildId}</span>
          </div>
        </div>

        <div className="build-info">
          <div className="character-block">
            <div>
              <span className="accent-rule" />
              <h3>{character.name.ja}</h3>
            </div>
            <div className="level-badge">Lv.{characterLevel}</div>
          </div>

          <div className="trait-grid">
            <InfoPill label="属性" value={attributeLabel} />
            <InfoPill label="弧盤" value={arcTypeLabel} />
          </div>

          <div className="card-panel arc-panel">
            <PanelTitle title="Arc" />
            <div className="arc-grid">
              <ArcFeature arc={arc} arcLevel={arcLevel} />
            </div>
          </div>

          <div className="card-panel stat-panel-card">
            <PanelTitle title="Main Stats" />
            <StatLine iconPath={statIconByKey("hp")} label="HP" value={formatNumber(finalStats.hp)} />
            <StatLine iconPath={statIconByKey("attack")} label="攻撃力" value={formatNumber(finalStats.attack)} />
            <StatLine iconPath={statIconByKey("defense")} label="防御力" value={formatNumber(finalStats.defense)} />
            <StatLine iconPath={statIconByKey("critRate")} label="クリティカル率" value={`${finalStats.critRate}%`} />
            <StatLine iconPath={statIconByKey("critDamage")} label="クリティカルダメージ" value={`${finalStats.critDamage}%`} />
            <StatLine iconPath={statIconByKey("chargeEfficiency")} label="チャージ効率" value={`${formatNumber(finalStats.chargeEfficiency)}%`} />
            <StatLine iconPath={statIconByKey("cyclePower")} label="連環パワー" value={formatNumber(gearModuleStats.cyclePower)} />
            <StatLine iconPath={statIconByKey("generalDamage")} label="汎用ダメージ強化" value={`${formatNumber(finalStats.generalDamage)}%`} />
            <StatLine iconPath={statIconByKey("attributeDamage")} label={attributeDamageLabel} value={`${formatNumber(finalStats.attributeDamage)}%`} />
          </div>
        </div>
      </section>

      <section className="showcase-bottom">
        <div className="card-panel gear-modules-card">
          <PanelTitle title="Gear / Modules" />
          <div className="gear-modules-layout">
            <div className="gear-detail-card">
              <GearFeature gear={gear} rows={gearRows} />
            </div>
            <div className="module-board-wrap">
              <div
                className="module-shape-board"
                style={{
                  gridTemplateColumns: `repeat(${character.moduleBoard.width}, 1fr)`,
                  gridTemplateRows: `repeat(${character.moduleBoard.height}, 1fr)`,
                  aspectRatio: `${character.moduleBoard.width} / ${character.moduleBoard.height}`,
                }}
              >
                {Array.from({ length: character.moduleBoard.width * character.moduleBoard.height }, (_, index) => {
                  const x = index % character.moduleBoard.width;
                  const y = Math.floor(index / character.moduleBoard.width);
                  const boardCell = moduleBoardCells.get(`${x}:${y}`);
                  const module = moduleCells.get(`${x}:${y}`);
                  const edgeClasses = moduleEdgeClasses(module, moduleCells, x, y);
                  return (
                    <span
                      key={`${x}:${y}`}
                      className={`${!boardCell?.enabled ? "disabled" : ""} ${module ? `filled ${edgeClasses}` : ""}`}
                      style={{ "--set-color": moduleColor(module?.rarity) } as CSSProperties}
                    />
                  );
                })}
              </div>
            </div>
            <div className="module-stat-space">
              <div className="module-score">
                <span>Score</span>
                <strong>{formatScore(score)}</strong>
              </div>
              <StatLine iconPath={statIconByKey("cyclePower")} label="連環パワー" value={formatNumber(gearModuleStats.cyclePower)} />
              <StatLine iconPath={statIconByKey("chargeEfficiency")} label="チャージ効率" value={`${formatNumber(gearModuleStats.chargeEfficiency)}%`} />
            </div>
          </div>
        </div>
      </section>

      <footer className="showcase-footer">
        <div>
          <strong>NTE Tools</strong>
          <span>ビルド検索・比較・シミュレーション</span>
        </div>
        <div className="comment-strip">{comment.trim()}</div>
        <img className="qr-code" src={assetPath(QR_IMAGE_PATH)} alt="nte-tools.com QR code" />
      </footer>
    </div>
  );
});

function PanelTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="panel-title">
      <span>{title}</span>
      {sub ? <em>（{sub}）</em> : null}
    </div>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="info-pill">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function GearFeature({ gear, rows }: { gear: Gear; rows: ReturnType<typeof buildGearRows> }) {
  return (
    <div className="gear-feature">
      <div className="rarity">{gear.rarity}</div>
      <img src={assetPath(gear.assets.icon)} alt="" />
      <div className="gear-feature-body">
        <strong>{gear.name.ja ?? gear.id}</strong>
        <GearStatDisplay label="Main" row={rows.mainStat} />
        {rows.subStats.map((row, index) => <GearStatDisplay key={index} label={`Sub ${index + 1}`} row={row} />)}
      </div>
    </div>
  );
}

function GearStatDisplay({ label, row }: { label: string; row: ReturnType<typeof buildGearRows>["rows"][number] }) {
  if (!row.option) {
    return <div className="gear-stat-row empty" aria-label={`${label} 未選択`} />;
  }
  return (
    <div className="gear-stat-row">
      <span title={label}><StatIcon iconPath={gearStatIcon(row)} /></span>
      <em title={row.option?.names?.ja ?? row.option?.sourceStatId ?? "-"}>{shortGearStatLabel(row)}</em>
      <strong>{formatGearStatValue(row)}</strong>
    </div>
  );
}

function MiniFeature({ image, title, caption, rarity, variant }: { image: string; title: string; caption?: string; rarity: string; variant?: "arc" }) {
  return (
    <div className={`mini-feature ${variant === "arc" ? "arc-feature" : ""}`}>
      <div className="rarity">{rarity}</div>
      <img src={assetPath(image)} alt="" />
      <strong>{title}</strong>
      {caption ? <span>{caption}</span> : null}
    </div>
  );
}

function ArcFeature({ arc, arcLevel }: { arc: Arc; arcLevel: number }) {
  const statRows = buildArcStatRows(arc, arcLevel).slice(0, 2);
  return (
    <div className="mini-feature arc-feature">
      <div className="rarity">{arc.rarity}</div>
      <div className="arc-level-badge">Lv. {arcLevel}</div>
      <img src={assetPath(arc.assets.icon)} alt="" />
      <strong>{arc.name.ja ?? arc.id}</strong>
      <div className="arc-feature-stats" aria-label="Arc stats">
        {statRows.map((row) => (
          <div key={row.statId} className="arc-stat-badge">
            <StatIcon iconPath={row.iconPath} />
            <strong>{row.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function buildArcStatRows(arc: Arc, arcLevel: number) {
  const level = clampArcLevel(arcLevel);
  return (arc.levelStats?.statSlots ?? [])
    .filter((slot) => slot.statId && slot.values?.length)
    .map((slot) => {
      const value = slot.values?.[level - 1] ?? slot.values?.at(-1) ?? 0;
      const statId = slot.statId as StatId;
      return {
        statId,
        iconPath: arcStatIcon(statId),
        value: formatArcStatValue(statId, value, Boolean(slot.isPercent)),
      };
    });
}

function arcStatIcon(statId: StatId) {
  return statIconByStatId(statId) ?? statIconByKey("attributeDamage");
}

function StatIcon({ iconPath }: { iconPath?: string }) {
  if (!iconPath) return <span className="stat-icon fallback" aria-hidden="true" />;
  return <img className="stat-icon" src={assetPath(iconPath)} alt="" />;
}

function StatLine({ iconPath, label, value }: { iconPath?: string; label: string; value: string | number }) {
  return (
    <div className="stat-line">
      <StatIcon iconPath={iconPath} />
      <em>{label}</em>
      <strong>{value}</strong>
    </div>
  );
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("ja-JP", { maximumFractionDigits: 1 }).format(value);
}

function formatScore(value: number) {
  return value.toFixed(1);
}

function clampArcLevel(value: number) {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.min(80, Math.round(value)));
}

function clampCharacterLevel(value: number) {
  if (!Number.isFinite(value)) return 80;
  return Math.max(1, Math.min(80, Math.round(value)));
}

function formatArcStats(values: Partial<Record<StatId, number>>) {
  const labels: Partial<Record<StatId, string>> = {
    hp: "HP",
    attack: "攻撃力",
    defense: "防御力",
    critRate: "会心率",
    critDamage: "会心ダメ",
  };
  const percentStats = new Set<StatId>(["critRate", "critDamage", "chargeEfficiency", "hpPercent", "attackPercent", "defensePercent"]);
  const entries = (Object.entries(values) as [StatId, number][])
    .filter(([, value]) => Number.isFinite(value))
    .map(([key, value]) => `${arcStatLabel(key, labels)} ${formatNumber(value)}${percentStats.has(key) ? "%" : ""}`);
  return entries.length > 0 ? entries.join(" / ") : "未取得";
}

function arcStatLabel(statId: StatId, labels: Partial<Record<StatId, string>>) {
  if (statId === "hpPercent") return "HP%";
  if (statId === "attackPercent") return "攻撃力%";
  if (statId === "defensePercent") return "防御力%";
  if (statId === "chargeEfficiency") return "チャージ効率";
  if (statId === "unbalIntensity") return "連環パワー";
  return labels[statId] ?? statId;
}

function formatArcStatValue(statId: StatId, value: number, isPercent = false) {
  const suffix = isPercent || statId === "critRate" || statId === "critDamage" || statId.endsWith("Percent") ? "%" : "";
  return `${formatNumber(value)}${suffix}`;
}
