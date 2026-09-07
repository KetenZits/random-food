"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { MEAL_CATALOG, SEED_INGREDIENTS } from "@/constants/kitchen";
import { mealWeight, weightedPick, calculateMealMatch } from "@/features/meals/matching";
import { normalizeIngredientName } from "@/lib/ingredients/normalize";
import { normalizeQuantity } from "@/lib/units";
import { toIsoDate } from "@/lib/date/week";
import { kitchenStateSchema } from "@/lib/validation/kitchen-state";
import type {
  Ingredient,
  IngredientDraft,
  IngredientTransaction,
  KitchenState,
  Meal,
  PlannedMeal,
  RandomizeOptions,
  ThemePreferences,
} from "@/types/kitchen";

const STORAGE_KEY = "kinrai-kitchen-v1";
const cloudConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);

const defaultTheme: ThemePreferences = {
  theme: "matcha",
  customPrimary: "#47664b",
  customAccent: "#ee744d",
  backgroundStyle: "soft",
  cardStyle: "soft",
};

function id(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function ingredientFromDraft(draft: IngredientDraft, createdAt = new Date().toISOString()): Ingredient {
  const normalized = normalizeQuantity(draft.quantity, draft.unit);
  return {
    id: id(),
    ...draft,
    expirationDate: draft.expirationDate || undefined,
    notes: draft.notes?.trim() || undefined,
    normalizedName: normalizeIngredientName(draft.name),
    normalizedQuantity: normalized.quantity,
    normalizedUnit: normalized.unit,
    createdAt,
    updatedAt: createdAt,
  };
}

function relativeDate(offset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return toIsoDate(date);
}

function createSeedIngredients(): Ingredient[] {
  const expirationOffsets: Array<number | null> = [2, 4, 12, null, 3, 1, null, null, null, 2, 3, 5];
  return SEED_INGREDIENTS.map((draft, index) => ingredientFromDraft({
    ...draft,
    purchaseDate: relativeDate(-Math.min(index + 1, 10)),
    expirationDate: expirationOffsets[index] === null ? undefined : relativeDate(expirationOffsets[index] ?? 5),
  }, new Date(Date.now() - index * 60_000).toISOString()));
}

const seedIngredients = createSeedIngredients();

const initialState: KitchenState = {
  ingredients: seedIngredients,
  customMeals: [],
  plannedMeals: [],
  favoriteMealIds: ["pad-krapao-pork"],
  history: [],
  transactions: [],
  mealsPerDay: 1,
  theme: defaultTheme,
};

interface KitchenContextValue extends KitchenState {
  hydrated: boolean;
  cloudStatus: "local" | "syncing" | "synced" | "error";
  meals: Meal[];
  addIngredient: (draft: IngredientDraft) => void;
  updateIngredient: (ingredientId: string, draft: IngredientDraft) => void;
  deleteIngredient: (ingredientId: string) => void;
  adjustIngredient: (ingredientId: string, delta: number) => void;
  markUsedUp: (ingredientId: string) => void;
  toggleFavorite: (mealId: string) => void;
  addCustomMeal: (meal: Omit<Meal, "id" | "source">) => Meal;
  addGeneratedMeals: (meals: Meal[]) => void;
  generatePlan: (options: RandomizeOptions) => PlannedMeal[];
  savePlan: (plannedMeals: PlannedMeal[], mealsPerDay: 1 | 2 | 3) => void;
  togglePlanLock: (planId: string) => void;
  removePlannedMeal: (planId: string) => void;
  cookMeal: (planId: string) => { success: boolean; message: string };
  updateTheme: (theme: Partial<ThemePreferences>) => void;
  resetDemo: () => void;
  clearKitchen: () => void;
}

const KitchenContext = createContext<KitchenContextValue | null>(null);

export function KitchenProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<KitchenState>(initialState);
  const [hydrated, setHydrated] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<KitchenContextValue["cloudStatus"]>(cloudConfigured ? "syncing" : "local");

  useEffect(() => {
    const hydrate = window.setTimeout(async () => {
      let nextState = initialState;
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) nextState = { ...initialState, ...(JSON.parse(stored) as Partial<KitchenState>) };
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
      if (cloudConfigured) {
        try {
          const response = await fetch("/api/kitchen", { cache: "no-store" });
          if (!response.ok) throw new Error("cloud unavailable");
          const payload = await response.json() as { state?: unknown };
          if (payload.state) {
            const parsed = kitchenStateSchema.safeParse(payload.state);
            if (!parsed.success) throw new Error("invalid cloud state");
            nextState = parsed.data;
          }
          setCloudStatus("synced");
        } catch {
          setCloudStatus("error");
        }
      }
      setState(nextState);
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(hydrate);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    const root = document.documentElement;
    root.dataset.theme = state.theme.theme;
    root.dataset.background = state.theme.backgroundStyle;
    root.dataset.cards = state.theme.cardStyle;
    root.style.setProperty("--custom-primary", state.theme.customPrimary);
    root.style.setProperty("--custom-accent", state.theme.customAccent);
    if (!cloudConfigured) return;
    const sync = window.setTimeout(async () => {
      setCloudStatus("syncing");
      try {
        const response = await fetch("/api/kitchen", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(state) });
        setCloudStatus(response.ok ? "synced" : "error");
      } catch {
        setCloudStatus("error");
      }
    }, 700);
    return () => window.clearTimeout(sync);
  }, [state, hydrated]);

  const addIngredient = useCallback((draft: IngredientDraft) => {
    const ingredient = ingredientFromDraft(draft);
    const transaction: IngredientTransaction = {
      id: id(), ingredientId: ingredient.id, type: "add", quantity: draft.quantity,
      unit: draft.unit, reference: "เพิ่มวัตถุดิบ", createdAt: new Date().toISOString(),
    };
    setState((current) => ({
      ...current,
      ingredients: [ingredient, ...current.ingredients],
      transactions: [transaction, ...current.transactions],
    }));
  }, []);

  const updateIngredient = useCallback((ingredientId: string, draft: IngredientDraft) => {
    setState((current) => {
      const previous = current.ingredients.find((ingredient) => ingredient.id === ingredientId);
      if (!previous) return current;
      const normalized = normalizeQuantity(draft.quantity, draft.unit);
      const quantityChanged = previous.normalizedQuantity !== normalized.quantity || previous.normalizedUnit !== normalized.unit;
      const transaction: IngredientTransaction | null = quantityChanged ? {
        id: id(),
        ingredientId,
        type: "adjust",
        quantity: previous.unit === draft.unit ? draft.quantity - previous.quantity : normalized.quantity - previous.normalizedQuantity,
        unit: previous.unit === draft.unit ? draft.unit : normalized.unit,
        reference: `แก้ไขจาก ${previous.quantity} ${previous.unit}`,
        createdAt: new Date().toISOString(),
      } : null;
      return {
        ...current,
        ingredients: current.ingredients.map((ingredient) => ingredient.id !== ingredientId ? ingredient : {
          ...ingredient,
          ...draft,
          expirationDate: draft.expirationDate || undefined,
          notes: draft.notes?.trim() || undefined,
          normalizedName: normalizeIngredientName(draft.name),
          normalizedQuantity: normalized.quantity,
          normalizedUnit: normalized.unit,
          updatedAt: new Date().toISOString(),
        }),
        transactions: transaction ? [transaction, ...current.transactions] : current.transactions,
      };
    });
  }, []);

  const deleteIngredient = useCallback((ingredientId: string) => {
    setState((current) => {
      const target = current.ingredients.find((ingredient) => ingredient.id === ingredientId);
      return {
        ...current,
        ingredients: current.ingredients.filter((ingredient) => ingredient.id !== ingredientId),
        transactions: target && target.quantity > 0 ? [{ id: id(), ingredientId, type: "waste", quantity: -target.quantity, unit: target.unit, reference: `ลบ ${target.name}`, createdAt: new Date().toISOString() }, ...current.transactions] : current.transactions,
      };
    });
  }, []);

  const adjustIngredient = useCallback((ingredientId: string, delta: number) => {
    setState((current) => {
      let transaction: IngredientTransaction | null = null;
      const ingredients = current.ingredients.map((ingredient) => {
        if (ingredient.id !== ingredientId) return ingredient;
        const quantity = Math.max(0, Number((ingredient.quantity + delta).toFixed(3)));
        const normalized = normalizeQuantity(quantity, ingredient.unit);
        const actualDelta = quantity - ingredient.quantity;
        transaction = {
          id: id(), ingredientId, type: "adjust", quantity: actualDelta,
          unit: ingredient.unit, reference: "ปรับจำนวน", createdAt: new Date().toISOString(),
        };
        return { ...ingredient, quantity, normalizedQuantity: normalized.quantity, updatedAt: new Date().toISOString() };
      });
      return {
        ...current,
        ingredients,
        transactions: transaction ? [transaction, ...current.transactions] : current.transactions,
      };
    });
  }, []);

  const markUsedUp = useCallback((ingredientId: string) => {
    setState((current) => {
      const target = current.ingredients.find((ingredient) => ingredient.id === ingredientId);
      if (!target || target.quantity === 0) return current;
      return {
        ...current,
        ingredients: current.ingredients.map((ingredient) =>
          ingredient.id === ingredientId
            ? { ...ingredient, quantity: 0, normalizedQuantity: 0, updatedAt: new Date().toISOString() }
            : ingredient,
        ),
        transactions: [{
          id: id(), ingredientId, type: "waste", quantity: -target.quantity, unit: target.unit,
          reference: "ทำเครื่องหมายว่าหมดแล้ว", createdAt: new Date().toISOString(),
        }, ...current.transactions],
      };
    });
  }, []);

  const toggleFavorite = useCallback((mealId: string) => {
    setState((current) => ({
      ...current,
      favoriteMealIds: current.favoriteMealIds.includes(mealId)
        ? current.favoriteMealIds.filter((idValue) => idValue !== mealId)
        : [...current.favoriteMealIds, mealId],
    }));
  }, []);

  const addCustomMeal = useCallback((meal: Omit<Meal, "id" | "source">): Meal => {
    const created: Meal = { ...meal, id: id(), source: "manual" };
    setState((current) => ({ ...current, customMeals: [created, ...current.customMeals] }));
    return created;
  }, []);

  const addGeneratedMeals = useCallback((meals: Meal[]) => {
    setState((current) => {
      const knownIds = new Set([...MEAL_CATALOG, ...current.customMeals].map((meal) => meal.id));
      const novel = meals.filter((meal) => !knownIds.has(meal.id));
      return novel.length ? { ...current, customMeals: [...novel, ...current.customMeals] } : current;
    });
  }, []);

  const allMeals = useMemo(() => [...MEAL_CATALOG, ...state.customMeals], [state.customMeals]);

  const generatePlan = useCallback((options: RandomizeOptions): PlannedMeal[] => {
    const recentIds = state.history
      .filter((entry) => Date.now() - new Date(entry.cookedAt).getTime() < 14 * 86_400_000)
      .map((entry) => entry.mealId);
    const selected: string[] = [];
    const generated: PlannedMeal[] = [];

    for (const date of options.dates) {
      for (let slot = 0; slot < options.mealsPerDay; slot += 1) {
        const locked = state.plannedMeals.find(
          (planned) => planned.date === date && planned.slot === slot && planned.isLocked,
        );
        if (locked) {
          generated.push(locked);
          selected.push(locked.mealId);
          continue;
        }

        const cuisineMeals = allMeals.filter((meal) =>
          options.cuisine === "thai" ? meal.cuisine === "thai" : true,
        );
        const eligible = cuisineMeals.filter((meal) => {
          const match = calculateMealMatch(meal, state.ingredients);
          const missingRequired = match.ingredients.filter((item) => !item.optional && !item.available).length;
          return options.strictness === 99 || missingRequired <= options.strictness;
        });
        const pool = eligible.length ? eligible : cuisineMeals;
        const uniquePool = pool.some((meal) => !selected.includes(meal.id))
          ? pool.filter((meal) => !selected.includes(meal.id))
          : pool;
        const picked = weightedPick(uniquePool.map((meal) => ({
          item: meal,
          weight: mealWeight(meal, state.ingredients, state.favoriteMealIds, recentIds, selected),
        })));
        if (!picked) continue;
        selected.push(picked.id);
        generated.push({
          id: id(), date, slot, mealId: picked.id, isLocked: false, status: "planned",
          matchScore: calculateMealMatch(picked, state.ingredients).score,
          createdAt: new Date().toISOString(),
        });
      }
    }
    return generated;
  }, [allMeals, state.favoriteMealIds, state.history, state.ingredients, state.plannedMeals]);

  const savePlan = useCallback((plannedMeals: PlannedMeal[], mealsPerDay: 1 | 2 | 3) => {
    const keys = new Set(plannedMeals.map((planned) => `${planned.date}:${planned.slot}`));
    const touchedDates = new Set(plannedMeals.map((planned) => planned.date));
    setState((current) => ({
      ...current,
      mealsPerDay,
      plannedMeals: [
        ...current.plannedMeals.filter((planned) => !keys.has(`${planned.date}:${planned.slot}`) && !(touchedDates.has(planned.date) && planned.slot >= mealsPerDay)),
        ...plannedMeals,
      ],
    }));
  }, []);

  const togglePlanLock = useCallback((planId: string) => {
    setState((current) => ({
      ...current,
      plannedMeals: current.plannedMeals.map((planned) =>
        planned.id === planId ? { ...planned, isLocked: !planned.isLocked } : planned,
      ),
    }));
  }, []);

  const removePlannedMeal = useCallback((planId: string) => {
    setState((current) => ({
      ...current,
      plannedMeals: current.plannedMeals.filter((planned) => planned.id !== planId),
    }));
  }, []);

  const cookMeal = useCallback((planId: string): { success: boolean; message: string } => {
    const planned = state.plannedMeals.find((item) => item.id === planId);
    const meal = allMeals.find((item) => item.id === planned?.mealId);
    if (!planned || !meal) return { success: false, message: "ไม่พบเมนูนี้ในแผน" };

    setState((current) => {
      const nextIngredients = current.ingredients.map((item) => ({ ...item }));
      const transactions: IngredientTransaction[] = [];
      const used: Array<{ name: string; quantity: number; unit: string }> = [];

      for (const required of meal.ingredients.filter((item) => !item.optional)) {
        const normalizedRequired = normalizeQuantity(required.quantity, required.unit);
        let remaining = normalizedRequired.quantity;
        for (const inventory of nextIngredients) {
          if (remaining <= 0) break;
          if (
            normalizeIngredientName(inventory.normalizedName) !== normalizeIngredientName(required.normalizedName) ||
            inventory.normalizedUnit !== normalizedRequired.unit || inventory.normalizedQuantity <= 0
          ) continue;
          const deductNormalized = Math.min(remaining, inventory.normalizedQuantity);
          const ratio = inventory.normalizedQuantity === 0 ? 0 : deductNormalized / inventory.normalizedQuantity;
          const displayDeduction = inventory.quantity * ratio;
          inventory.quantity = Math.max(0, Number((inventory.quantity - displayDeduction).toFixed(3)));
          inventory.normalizedQuantity = Math.max(0, inventory.normalizedQuantity - deductNormalized);
          inventory.updatedAt = new Date().toISOString();
          remaining -= deductNormalized;
          used.push({ name: inventory.name, quantity: displayDeduction, unit: inventory.unit });
          transactions.push({
            id: id(), ingredientId: inventory.id, type: "consume", quantity: -displayDeduction,
            unit: inventory.unit, reference: meal.name, createdAt: new Date().toISOString(),
          });
        }
      }

      return {
        ...current,
        ingredients: nextIngredients,
        plannedMeals: current.plannedMeals.map((item) =>
          item.id === planId ? { ...item, status: "cooked" } : item,
        ),
        history: [{ id: id(), mealId: meal.id, mealName: meal.name, cookedAt: new Date().toISOString(), ingredientsUsed: used }, ...current.history],
        transactions: [...transactions, ...current.transactions],
      };
    });
    return { success: true, message: "บันทึกมื้อนี้และหักวัตถุดิบแล้ว" };
  }, [allMeals, state.plannedMeals]);

  const updateTheme = useCallback((theme: Partial<ThemePreferences>) => {
    setState((current) => ({ ...current, theme: { ...current.theme, ...theme } }));
  }, []);

  const resetDemo = useCallback(() => setState({ ...initialState, ingredients: createSeedIngredients() }), []);
  const clearKitchen = useCallback(() => setState((current) => ({ ...initialState, ingredients: [], theme: current.theme, favoriteMealIds: [] })), []);

  const value = useMemo<KitchenContextValue>(() => ({
    ...state,
    hydrated,
    cloudStatus,
    meals: allMeals,
    addIngredient,
    updateIngredient,
    deleteIngredient,
    adjustIngredient,
    markUsedUp,
    toggleFavorite,
    addCustomMeal,
    addGeneratedMeals,
    generatePlan,
    savePlan,
    togglePlanLock,
    removePlannedMeal,
    cookMeal,
    updateTheme,
    resetDemo,
    clearKitchen,
  }), [
    state, hydrated, cloudStatus, allMeals, addIngredient, updateIngredient, deleteIngredient,
    adjustIngredient, markUsedUp, toggleFavorite, addCustomMeal, addGeneratedMeals, generatePlan, savePlan,
    togglePlanLock, removePlannedMeal, cookMeal, updateTheme, resetDemo, clearKitchen,
  ]);

  return <KitchenContext.Provider value={value}>{children}</KitchenContext.Provider>;
}

export function useKitchen(): KitchenContextValue {
  const context = useContext(KitchenContext);
  if (!context) throw new Error("useKitchen must be used within KitchenProvider");
  return context;
}
