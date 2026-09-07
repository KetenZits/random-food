import { daysUntil } from "@/lib/date/week";
import { normalizeIngredientName } from "@/lib/ingredients/normalize";
import { normalizeQuantity } from "@/lib/units";
import type { Ingredient, IngredientAvailability, Meal, MealMatch } from "@/types/kitchen";

export function calculateMealMatch(meal: Meal, inventory: Ingredient[]): MealMatch {
  let weightedAvailable = 0;
  let totalWeight = 0;
  let expirationBonus = 0;

  const ingredients: IngredientAvailability[] = meal.ingredients.map((required) => {
    const normalizedName = normalizeIngredientName(required.normalizedName || required.name);
    const matches = inventory.filter(
      (item) => item.quantity > 0 && normalizeIngredientName(item.normalizedName || item.name) === normalizedName,
    );
    const requiredNormalized = normalizeQuantity(required.quantity, required.unit);
    const comparable = matches.filter((item) => item.normalizedUnit === requiredNormalized.unit);
    const availableNormalized = comparable.reduce((sum, item) => sum + item.normalizedQuantity, 0);
    const ratio = requiredNormalized.quantity > 0
      ? Math.min(1, availableNormalized / requiredNormalized.quantity)
      : 1;
    const importance = required.optional ? 0.35 : 1;
    weightedAvailable += ratio * importance;
    totalWeight += importance;

    for (const item of comparable) {
      const remaining = daysUntil(item.expirationDate);
      if (remaining !== null && remaining >= 0 && remaining <= 3 && ratio > 0) {
        expirationBonus += remaining === 0 ? 3 : 1.5;
        break;
      }
    }

    const oneDisplayUnit = normalizeQuantity(1, required.unit);
    const canDisplayInRecipeUnit = oneDisplayUnit.unit === requiredNormalized.unit;
    const displayAvailable = canDisplayInRecipeUnit ? availableNormalized / oneDisplayUnit.quantity : availableNormalized;
    const displayShortfall = Math.max(0, required.quantity - displayAvailable);

    return {
      ...required,
      availableQuantity: displayAvailable,
      available: ratio >= 1,
      shortfall: displayShortfall,
      inventoryUnit: canDisplayInRecipeUnit ? required.unit : requiredNormalized.unit,
    };
  });

  const missingRequired = ingredients.filter((item) => !item.optional && !item.available);
  const base = totalWeight ? (weightedAvailable / totalWeight) * 100 : 0;
  const missingPenalty = missingRequired.length * 4;
  const score = Math.round(Math.max(0, Math.min(100, base - missingPenalty + expirationBonus)));

  return {
    score,
    availableCount: ingredients.filter((item) => item.available).length,
    totalRequired: ingredients.length,
    expirationBonus,
    ingredients,
    missingIngredients: ingredients.filter((item) => !item.available),
  };
}

export function mealWeight(
  meal: Meal,
  inventory: Ingredient[],
  favorites: string[],
  recentlyCooked: string[],
  alreadySelected: string[],
): number {
  const match = calculateMealMatch(meal, inventory);
  const varietyScore = alreadySelected.includes(meal.id) ? 0 : 100;
  const historyScore = recentlyCooked.includes(meal.id) ? 25 : 100;
  const favoriteBonus = favorites.includes(meal.id) ? 100 : 0;
  const expirationPriority = Math.min(100, match.expirationBonus * 20);
  return (
    match.score * 0.5 +
    expirationPriority * 0.2 +
    varietyScore * 0.1 +
    historyScore * 0.05 +
    favoriteBonus * 0.1 +
    Math.random() * 5
  );
}

export function weightedPick<T>(options: Array<{ item: T; weight: number }>): T | null {
  if (!options.length) return null;
  const positive = options.map((option) => ({ ...option, weight: Math.max(0.1, option.weight) }));
  const total = positive.reduce((sum, option) => sum + option.weight, 0);
  let cursor = Math.random() * total;
  for (const option of positive) {
    cursor -= option.weight;
    if (cursor <= 0) return option.item;
  }
  return positive[positive.length - 1].item;
}
