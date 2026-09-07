import type { GeneratedMealsResponse, MealGenerationInput } from "@/services/ai/schemas";

export interface MealGenerationProvider {
  readonly name: string;
  generateMeals(input: MealGenerationInput): Promise<GeneratedMealsResponse>;
}

export class AIProviderError extends Error {
  constructor(message: string, readonly provider: string, readonly cause?: unknown) {
    super(message);
    this.name = "AIProviderError";
  }
}
