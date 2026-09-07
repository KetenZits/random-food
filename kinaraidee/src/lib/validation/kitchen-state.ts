import { z } from "zod";
import { ingredientCategories } from "@/types/kitchen";

const unit = z.string().min(1).max(30);
const normalizedUnit = z.enum(["g", "ml", "count"]);

export const ingredientStateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(80),
  normalizedName: z.string().min(1).max(100),
  category: z.enum(ingredientCategories),
  quantity: z.number().nonnegative().max(1_000_000),
  unit,
  normalizedQuantity: z.number().nonnegative().max(1_000_000_000),
  normalizedUnit,
  purchaseDate: z.string(),
  expirationDate: z.string().optional(),
  notes: z.string().max(300).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const recipeIngredientStateSchema = z.object({
  name: z.string().min(1).max(100),
  normalizedName: z.string().min(1).max(100),
  quantity: z.number().positive().max(1_000_000),
  unit,
  optional: z.boolean().optional(),
});

export const mealStateSchema = z.object({
  id: z.string().min(1).max(120),
  name: z.string().min(1).max(120),
  description: z.string().max(500),
  cuisine: z.enum(["thai", "asian", "international"]),
  mealType: z.enum(["main", "light", "breakfast"]),
  difficulty: z.enum(["easy", "medium", "hard"]),
  cookingTimeMinutes: z.number().int().min(1).max(1440),
  ingredients: z.array(recipeIngredientStateSchema).max(50),
  steps: z.array(z.string().min(1).max(500)).max(30),
  tags: z.array(z.string().max(40)).max(12),
  imageTone: z.string().max(40),
  source: z.enum(["curated", "ai", "manual"]),
});

const plannedMealStateSchema = z.object({
  id: z.string().uuid(),
  date: z.string(),
  slot: z.number().int().min(0).max(2),
  mealId: z.string().min(1).max(120),
  isLocked: z.boolean(),
  status: z.enum(["planned", "cooked", "skipped"]),
  matchScore: z.number().int().min(0).max(100),
  createdAt: z.string(),
});

const historyStateSchema = z.object({
  id: z.string().uuid(),
  mealId: z.string().min(1).max(120),
  mealName: z.string().min(1).max(120),
  cookedAt: z.string(),
  ingredientsUsed: z.array(z.object({ name: z.string(), quantity: z.number().nonnegative(), unit })).max(100),
});

const transactionStateSchema = z.object({
  id: z.string().uuid(),
  ingredientId: z.string().uuid(),
  type: z.enum(["add", "consume", "adjust", "waste"]),
  quantity: z.number(),
  unit,
  reference: z.string().max(200).optional(),
  createdAt: z.string(),
});

const themeStateSchema = z.object({
  theme: z.enum(["minimal", "midnight", "matcha", "sakura", "ocean", "mango", "grape", "night-market", "custom"]),
  customPrimary: z.string().regex(/^#[0-9a-f]{6}$/i),
  customAccent: z.string().regex(/^#[0-9a-f]{6}$/i),
  backgroundStyle: z.enum(["solid", "soft", "ambient"]),
  cardStyle: z.enum(["soft", "flat", "glass"]),
});

export const kitchenStateSchema = z.object({
  ingredients: z.array(ingredientStateSchema).max(1000),
  customMeals: z.array(mealStateSchema).max(500),
  plannedMeals: z.array(plannedMealStateSchema).max(2000),
  favoriteMealIds: z.array(z.string().min(1).max(120)).max(500),
  history: z.array(historyStateSchema).max(5000),
  transactions: z.array(transactionStateSchema).max(20_000),
  mealsPerDay: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  theme: themeStateSchema,
});
