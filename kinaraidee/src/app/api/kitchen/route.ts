import { NextResponse } from "next/server";
import { MEAL_CATALOG } from "@/constants/kitchen";
import { startOfWeek, toIsoDate } from "@/lib/date/week";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { kitchenStateSchema } from "@/lib/validation/kitchen-state";
import type { IngredientTransaction, KitchenState, Meal } from "@/types/kitchen";

function unavailable() {
  return NextResponse.json({ message: "ยังไม่ได้ตั้งค่า Supabase" }, { status: 503 });
}

function assertNoError(result: { error: { message: string } | null }) {
  if (result.error) throw new Error(result.error.message);
}

function isSameSite(request: Request) {
  const fetchSite = request.headers.get("sec-fetch-site");
  return process.env.NODE_ENV !== "production" || fetchSite === "same-origin" || fetchSite === "same-site";
}

export async function GET(request: Request) {
  if (!isSameSite(request)) return NextResponse.json({ message: "คำขอไม่ได้มาจากแอปนี้" }, { status: 403 });
  const client = createServerSupabaseClient();
  if (!client) return unavailable();
  try {
    const [ingredientsResult, mealsResult, recipeResult, stepsResult, plansResult, historyResult, transactionsResult, preferencesResult] = await Promise.all([
      client.from("ingredients").select("*"),
      client.from("meals").select("*"),
      client.from("meal_ingredients").select("*"),
      client.from("meal_steps").select("*"),
      client.from("planned_meals").select("*"),
      client.from("meal_history").select("*"),
      client.from("ingredient_transactions").select("*"),
      client.from("app_preferences").select("*").eq("id", "personal").maybeSingle(),
    ]);
    for (const result of [ingredientsResult, mealsResult, recipeResult, stepsResult, plansResult, historyResult, transactionsResult, preferencesResult]) assertNoError(result);
    const hasCloudData = Boolean(preferencesResult.data || ingredientsResult.data?.length || plansResult.data?.length || historyResult.data?.length);
    if (!hasCloudData) return NextResponse.json({ state: null });

    const customMeals: Meal[] = (mealsResult.data ?? []).filter((row) => row.source !== "curated").map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      cuisine: row.cuisine as Meal["cuisine"],
      mealType: row.meal_type as Meal["mealType"],
      difficulty: row.difficulty as Meal["difficulty"],
      cookingTimeMinutes: row.cooking_time_minutes,
      ingredients: (recipeResult.data ?? []).filter((item) => item.meal_id === row.id).map((item) => ({ name: item.ingredient_name, normalizedName: item.normalized_name, quantity: item.quantity, unit: item.unit, optional: item.is_optional })),
      steps: (stepsResult.data ?? []).filter((step) => step.meal_id === row.id).sort((a, b) => a.step_number - b.step_number).map((step) => step.instruction),
      tags: row.tags,
      imageTone: row.image_tone,
      source: row.source as Meal["source"],
    }));
    const mealNames = new Map([...MEAL_CATALOG, ...customMeals].map((meal) => [meal.id, meal.name]));
    const preferences = preferencesResult.data;
    const state: KitchenState = {
      ingredients: (ingredientsResult.data ?? []).map((row) => ({ id: row.id, name: row.name, normalizedName: row.normalized_name, category: row.category as KitchenState["ingredients"][number]["category"], quantity: row.quantity, normalizedQuantity: row.normalized_quantity, unit: row.unit, normalizedUnit: row.normalized_unit as "g" | "ml" | "count", purchaseDate: row.purchase_date, expirationDate: row.expiration_date ?? undefined, notes: row.notes ?? undefined, createdAt: row.created_at, updatedAt: row.updated_at })),
      customMeals,
      plannedMeals: (plansResult.data ?? []).map((row) => ({ id: row.id, date: row.date, slot: row.meal_slot, mealId: row.meal_id, isLocked: row.is_locked, status: row.status as "planned" | "cooked" | "skipped", matchScore: row.match_score, createdAt: row.created_at })),
      favoriteMealIds: (mealsResult.data ?? []).filter((row) => row.is_favorite).map((row) => row.id),
      history: (historyResult.data ?? []).map((row) => ({ id: row.id, mealId: row.meal_id, mealName: mealNames.get(row.meal_id) ?? "เมนูที่เคยทำ", cookedAt: row.cooked_at, ingredientsUsed: Array.isArray(row.ingredients_used) ? row.ingredients_used as KitchenState["history"][number]["ingredientsUsed"] : [] })),
      transactions: (transactionsResult.data ?? []).filter((row) => row.ingredient_id).map((row) => ({ id: row.id, ingredientId: row.ingredient_id as string, type: row.type as IngredientTransaction["type"], quantity: row.quantity, unit: row.unit, reference: row.reference ?? undefined, createdAt: row.created_at })),
      mealsPerDay: (preferences?.meals_per_day ?? 1) as 1 | 2 | 3,
      theme: preferences?.theme as unknown as KitchenState["theme"] ?? { theme: "matcha", customPrimary: "#48664c", customAccent: "#ed704c", backgroundStyle: "soft", cardStyle: "soft" },
    };
    return NextResponse.json({ state: kitchenStateSchema.parse(state) });
  } catch {
    return NextResponse.json({ message: "โหลดข้อมูลครัวจาก Supabase ไม่สำเร็จ" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const client = createServerSupabaseClient();
  if (!client) return unavailable();
  if (!isSameSite(request)) return NextResponse.json({ message: "คำขอไม่ได้มาจากแอปนี้" }, { status: 403 });
  try {
    const state = kitchenStateSchema.parse(await request.json());
    const ingredients = state.ingredients.map((item) => ({ id: item.id, name: item.name, normalized_name: item.normalizedName, category: item.category, quantity: item.quantity, normalized_quantity: item.normalizedQuantity, unit: item.unit, normalized_unit: item.normalizedUnit, purchase_date: item.purchaseDate, expiration_date: item.expirationDate ?? null, notes: item.notes ?? null, created_at: item.createdAt, updated_at: item.updatedAt }));
    if (ingredients.length) assertNoError(await client.from("ingredients").upsert(ingredients));
    const existingIngredients = await client.from("ingredients").select("id"); assertNoError(existingIngredients);
    const ingredientIds = new Set(ingredients.map((item) => item.id));
    const removedIngredients = (existingIngredients.data ?? []).map((item) => item.id).filter((id) => !ingredientIds.has(id));
    if (removedIngredients.length) assertNoError(await client.from("ingredients").delete().in("id", removedIngredients));

    const allMeals = [...MEAL_CATALOG, ...state.customMeals];
    assertNoError(await client.from("meals").upsert(allMeals.map((meal) => ({ id: meal.id, name: meal.name, description: meal.description, cuisine: meal.cuisine, meal_type: meal.mealType, difficulty: meal.difficulty, cooking_time_minutes: meal.cookingTimeMinutes, is_favorite: state.favoriteMealIds.includes(meal.id), source: meal.source, tags: meal.tags, image_tone: meal.imageTone }))));
    const mealIds = allMeals.map((meal) => meal.id);
    if (mealIds.length) {
      assertNoError(await client.from("meal_ingredients").delete().in("meal_id", mealIds));
      assertNoError(await client.from("meal_steps").delete().in("meal_id", mealIds));
      const recipeRows = allMeals.flatMap((meal) => meal.ingredients.map((item) => {
        const normalized = normalizeForDatabase(item.quantity, item.unit);
        return { meal_id: meal.id, ingredient_name: item.name, normalized_name: item.normalizedName, quantity: item.quantity, normalized_quantity: normalized.quantity, unit: item.unit, normalized_unit: normalized.unit, is_optional: item.optional ?? false };
      }));
      const stepRows = allMeals.flatMap((meal) => meal.steps.map((instruction, index) => ({ meal_id: meal.id, step_number: index + 1, instruction })));
      if (recipeRows.length) assertNoError(await client.from("meal_ingredients").insert(recipeRows));
      if (stepRows.length) assertNoError(await client.from("meal_steps").insert(stepRows));
    }

    const weekIds = new Map<string, string>();
    for (const plan of state.plannedMeals) {
      const weekStart = toIsoDate(startOfWeek(new Date(`${plan.date}T12:00:00`)));
      if (!weekIds.has(weekStart)) {
        const result = await client.from("weekly_plans").upsert({ week_start: weekStart, meals_per_day: state.mealsPerDay }, { onConflict: "week_start" }).select("id").single();
        assertNoError(result); if (result.data) weekIds.set(weekStart, result.data.id);
      }
    }
    const plannedRows = state.plannedMeals.map((plan) => ({ id: plan.id, weekly_plan_id: weekIds.get(toIsoDate(startOfWeek(new Date(`${plan.date}T12:00:00`)))) as string, date: plan.date, meal_slot: plan.slot, meal_id: plan.mealId, is_locked: plan.isLocked, status: plan.status, match_score: plan.matchScore, created_at: plan.createdAt }));
    if (plannedRows.length) assertNoError(await client.from("planned_meals").upsert(plannedRows));
    const existingPlans = await client.from("planned_meals").select("id"); assertNoError(existingPlans);
    const planIds = new Set(plannedRows.map((plan) => plan.id));
    const removedPlans = (existingPlans.data ?? []).map((plan) => plan.id).filter((id) => !planIds.has(id));
    if (removedPlans.length) assertNoError(await client.from("planned_meals").delete().in("id", removedPlans));

    if (state.history.length) assertNoError(await client.from("meal_history").upsert(state.history.map((entry) => ({ id: entry.id, meal_id: entry.mealId, cooked_at: entry.cookedAt, ingredients_used: entry.ingredientsUsed }))));
    const existingHistory = await client.from("meal_history").select("id"); assertNoError(existingHistory);
    const historyIds = new Set(state.history.map((entry) => entry.id));
    const removedHistory = (existingHistory.data ?? []).map((entry) => entry.id).filter((id) => !historyIds.has(id));
    if (removedHistory.length) assertNoError(await client.from("meal_history").delete().in("id", removedHistory));

    if (state.transactions.length) assertNoError(await client.from("ingredient_transactions").upsert(state.transactions.map((entry) => ({ id: entry.id, ingredient_id: ingredientIds.has(entry.ingredientId) ? entry.ingredientId : null, ingredient_name: state.ingredients.find((item) => item.id === entry.ingredientId)?.name ?? entry.reference ?? "วัตถุดิบที่ลบแล้ว", type: entry.type, quantity: entry.quantity, unit: entry.unit, reference: entry.reference ?? null, created_at: entry.createdAt }))));
    const existingTransactions = await client.from("ingredient_transactions").select("id"); assertNoError(existingTransactions);
    const transactionIds = new Set(state.transactions.map((entry) => entry.id));
    const removedTransactions = (existingTransactions.data ?? []).map((entry) => entry.id).filter((id) => !transactionIds.has(id));
    if (removedTransactions.length) assertNoError(await client.from("ingredient_transactions").delete().in("id", removedTransactions));

    const existingCustomMeals = await client.from("meals").select("id").neq("source", "curated"); assertNoError(existingCustomMeals);
    const customMealIds = new Set(state.customMeals.map((meal) => meal.id));
    const removedCustomMeals = (existingCustomMeals.data ?? []).map((meal) => meal.id).filter((id) => !customMealIds.has(id));
    if (removedCustomMeals.length) assertNoError(await client.from("meals").delete().in("id", removedCustomMeals));
    assertNoError(await client.from("app_preferences").upsert({ id: "personal", meals_per_day: state.mealsPerDay, theme: state.theme }));
    return NextResponse.json({ saved: true });
  } catch {
    return NextResponse.json({ message: "บันทึกข้อมูลครัวไป Supabase ไม่สำเร็จ" }, { status: 400 });
  }
}

function normalizeForDatabase(quantity: number, unit: string): { quantity: number; unit: "g" | "ml" | "count" } {
  if (unit === "kg") return { quantity: quantity * 1000, unit: "g" };
  if (unit === "g") return { quantity, unit: "g" };
  if (unit === "L") return { quantity: quantity * 1000, unit: "ml" };
  if (unit === "ml") return { quantity, unit: "ml" };
  if (unit === "tbsp") return { quantity: quantity * 15, unit: "ml" };
  if (unit === "tsp") return { quantity: quantity * 5, unit: "ml" };
  return { quantity, unit: "count" };
}
