import type { IngredientUnit, NormalizedUnit } from "@/types/kitchen";

const WEIGHT_FACTORS: Record<string, number> = { g: 1, kg: 1000 };
const VOLUME_FACTORS: Record<string, number> = { ml: 1, L: 1000, tbsp: 15, tsp: 5 };

const countUnits = new Set(["piece", "egg", "pack", "bottle", "bag"]);

export function normalizeQuantity(quantity: number, unit: IngredientUnit): {
  quantity: number;
  unit: NormalizedUnit;
} {
  if (unit in WEIGHT_FACTORS) return { quantity: quantity * WEIGHT_FACTORS[unit], unit: "g" };
  if (unit in VOLUME_FACTORS) return { quantity: quantity * VOLUME_FACTORS[unit], unit: "ml" };
  if (countUnits.has(unit)) return { quantity, unit: "count" };
  return { quantity, unit: "count" };
}

export function convertQuantity(quantity: number, from: IngredientUnit, to: IngredientUnit): number | null {
  const source = normalizeQuantity(quantity, from);
  const target = normalizeQuantity(1, to);
  if (source.unit !== target.unit) return null;
  return source.quantity / target.quantity;
}

export function formatQuantity(quantity: number, unit: IngredientUnit): string {
  if (unit === "g" && quantity >= 1000) return `${stripZeros(quantity / 1000)} กก.`;
  if (unit === "ml" && quantity >= 1000) return `${stripZeros(quantity / 1000)} ลิตร`;
  const labels: Record<string, string> = {
    g: "กรัม", kg: "กก.", ml: "มล.", L: "ลิตร", piece: "ชิ้น", egg: "ฟอง",
    pack: "แพ็ก", bottle: "ขวด", bag: "ถุง", tbsp: "ชต.", tsp: "ชช.",
  };
  return `${stripZeros(quantity)} ${labels[unit] ?? unit}`;
}

function stripZeros(value: number): string {
  return new Intl.NumberFormat("th-TH", { maximumFractionDigits: 2 }).format(value);
}
