import { GeminiMealProvider } from "@/services/ai/gemini-provider";
import { LocalMealProvider } from "@/services/ai/local-provider";
import type { GeneratedMealsResponse, MealGenerationInput } from "@/services/ai/schemas";

export interface MealGenerationResult extends GeneratedMealsResponse {
  provider: string;
  fallback: boolean;
}

export async function generateMeals(input: MealGenerationInput): Promise<MealGenerationResult> {
  const local = new LocalMealProvider();
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { ...(await local.generateMeals(input)), provider: local.name, fallback: true };
  try {
    const provider = new GeminiMealProvider(apiKey, process.env.GEMINI_MODEL);
    return { ...(await provider.generateMeals(input)), provider: provider.name, fallback: false };
  } catch {
    return { ...(await local.generateMeals(input)), provider: local.name, fallback: true };
  }
}
