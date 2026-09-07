import { z } from "zod";

export const generatedIngredientSchema = z.object({
  name: z.string().min(1).max(100),
  normalizedName: z.string().min(1).max(100).optional(),
  requiredQuantity: z.number().positive().max(100_000),
  unit: z.string().min(1).max(30),
  available: z.boolean().optional(),
  isOptional: z.boolean().default(false),
});

export const generatedMealSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().min(1).max(500),
  mealType: z.enum(["main", "light", "breakfast"]),
  cuisine: z.enum(["thai", "asian", "international"]),
  cookingTimeMinutes: z.number().int().min(5).max(360),
  difficulty: z.enum(["easy", "medium", "hard"]),
  ingredients: z.array(generatedIngredientSchema).min(1).max(30),
  steps: z.array(z.string().min(1).max(500)).min(1).max(20),
  tags: z.array(z.string().max(40)).max(8).default([]),
});

export const generatedMealsResponseSchema = z.object({
  meals: z.array(generatedMealSchema).min(1).max(30),
});

export const mealGenerationInputSchema = z.object({
  ingredients: z.array(z.object({
    name: z.string(),
    normalizedName: z.string().optional(),
    quantity: z.number().nonnegative(),
    unit: z.string(),
    expirationDate: z.string().optional(),
  })).max(300),
  desiredMeals: z.number().int().min(1).max(21),
  cuisine: z.enum(["thai", "mostly-thai", "any"]),
  strictness: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(99)]),
  alreadySelectedMeals: z.array(z.string()).max(50).default([]),
});

export type MealGenerationInput = z.infer<typeof mealGenerationInputSchema>;
export type GeneratedMealsResponse = z.infer<typeof generatedMealsResponseSchema>;
