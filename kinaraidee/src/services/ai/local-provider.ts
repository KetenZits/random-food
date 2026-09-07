import { MEAL_CATALOG } from "@/constants/kitchen";
import type { MealGenerationProvider } from "@/services/ai/provider";
import type { GeneratedMealsResponse, MealGenerationInput } from "@/services/ai/schemas";

export class LocalMealProvider implements MealGenerationProvider {
  readonly name = "local-curated";
  async generateMeals(input: MealGenerationInput): Promise<GeneratedMealsResponse> {
    const excluded = new Set(input.alreadySelectedMeals);
    const cuisinePool = MEAL_CATALOG.filter((meal) => input.cuisine !== "thai" || meal.cuisine === "thai");
    const sorted = [...cuisinePool].sort((a, b) => Number(excluded.has(a.id)) - Number(excluded.has(b.id)));
    return {
      meals: sorted.slice(0, Math.min(input.desiredMeals, sorted.length)).map((meal) => ({
        name: meal.name,
        description: meal.description,
        mealType: meal.mealType,
        cuisine: meal.cuisine,
        cookingTimeMinutes: meal.cookingTimeMinutes,
        difficulty: meal.difficulty,
        ingredients: meal.ingredients.map((ingredient) => ({
          name: ingredient.name,
          normalizedName: ingredient.normalizedName,
          requiredQuantity: ingredient.quantity,
          unit: ingredient.unit,
          isOptional: ingredient.optional ?? false,
        })),
        steps: meal.steps,
        tags: meal.tags,
      })),
    };
  }
}
