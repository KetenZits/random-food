export const ingredientCategories = [
  "meat",
  "seafood",
  "eggs",
  "vegetables",
  "fruits",
  "herbs",
  "seasonings",
  "sauces",
  "rice_grains",
  "noodles",
  "dairy",
  "frozen",
  "other",
] as const;

export type IngredientCategory = (typeof ingredientCategories)[number];

export const units = [
  "g",
  "kg",
  "ml",
  "L",
  "piece",
  "egg",
  "pack",
  "bottle",
  "bag",
  "tbsp",
  "tsp",
] as const;

export type StandardUnit = (typeof units)[number];
export type IngredientUnit = StandardUnit | string;
export type NormalizedUnit = "g" | "ml" | "count";

export interface Ingredient {
  id: string;
  name: string;
  normalizedName: string;
  category: IngredientCategory;
  quantity: number;
  unit: IngredientUnit;
  normalizedQuantity: number;
  normalizedUnit: NormalizedUnit;
  purchaseDate: string;
  expirationDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type IngredientDraft = Pick<
  Ingredient,
  "name" | "category" | "quantity" | "unit" | "purchaseDate"
> &
  Partial<Pick<Ingredient, "expirationDate" | "notes">>;

export interface RecipeIngredient {
  name: string;
  normalizedName: string;
  quantity: number;
  unit: IngredientUnit;
  optional?: boolean;
}

export interface Meal {
  id: string;
  name: string;
  description: string;
  cuisine: "thai" | "asian" | "international";
  mealType: "main" | "light" | "breakfast";
  difficulty: "easy" | "medium" | "hard";
  cookingTimeMinutes: number;
  ingredients: RecipeIngredient[];
  steps: string[];
  tags: string[];
  imageTone: string;
  source: "curated" | "ai" | "manual";
}

export interface IngredientAvailability extends RecipeIngredient {
  availableQuantity: number;
  available: boolean;
  shortfall: number;
  inventoryUnit: IngredientUnit;
}

export interface MealMatch {
  score: number;
  availableCount: number;
  totalRequired: number;
  expirationBonus: number;
  ingredients: IngredientAvailability[];
  missingIngredients: IngredientAvailability[];
}

export interface PlannedMeal {
  id: string;
  date: string;
  slot: number;
  mealId: string;
  isLocked: boolean;
  status: "planned" | "cooked" | "skipped";
  matchScore: number;
  createdAt: string;
}

export interface MealHistoryEntry {
  id: string;
  mealId: string;
  mealName: string;
  cookedAt: string;
  ingredientsUsed: Array<{
    name: string;
    quantity: number;
    unit: IngredientUnit;
  }>;
}

export interface IngredientTransaction {
  id: string;
  ingredientId: string;
  type: "add" | "consume" | "adjust" | "waste";
  quantity: number;
  unit: IngredientUnit;
  reference?: string;
  createdAt: string;
}

export type ThemeName =
  | "minimal"
  | "midnight"
  | "matcha"
  | "sakura"
  | "ocean"
  | "mango"
  | "grape"
  | "night-market"
  | "custom";

export interface ThemePreferences {
  theme: ThemeName;
  customPrimary: string;
  customAccent: string;
  backgroundStyle: "solid" | "soft" | "ambient";
  cardStyle: "soft" | "flat" | "glass";
}

export interface KitchenState {
  ingredients: Ingredient[];
  customMeals: Meal[];
  plannedMeals: PlannedMeal[];
  favoriteMealIds: string[];
  history: MealHistoryEntry[];
  transactions: IngredientTransaction[];
  mealsPerDay: 1 | 2 | 3;
  theme: ThemePreferences;
}

export type IngredientStrictness = 0 | 1 | 2 | 3 | 99;
export type CuisinePreference = "thai" | "mostly-thai" | "any";

export interface RandomizeOptions {
  dates: string[];
  mealsPerDay: 1 | 2 | 3;
  cuisine: CuisinePreference;
  strictness: IngredientStrictness;
}
