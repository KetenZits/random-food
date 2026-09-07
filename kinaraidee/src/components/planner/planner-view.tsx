"use client";

import { AnimatePresence, motion } from "motion/react";
import { CalendarCheck2, ChevronLeft, ChevronRight, Dices, RefreshCw, Save, Sparkles, X } from "lucide-react";
import { useMemo, useState } from "react";
import { DayMealCard } from "@/components/planner/day-meal-card";
import { ManualMealPicker } from "@/components/planner/manual-meal-picker";
import { RandomizerStage } from "@/components/three/randomizer-stage";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { PrimaryButton, SecondaryButton } from "@/components/ui/primitives";
import { DAY_NAMES } from "@/constants/kitchen";
import { useKitchen } from "@/features/kitchen/kitchen-provider";
import { calculateMealMatch, mealWeight, weightedPick } from "@/features/meals/matching";
import { normalizeIngredientName } from "@/lib/ingredients/normalize";
import { addWeeks, formatWeekRange, getWeekDates, startOfWeek } from "@/lib/date/week";
import { generatedMealsResponseSchema } from "@/services/ai/schemas";
import type { CuisinePreference, IngredientStrictness, Meal, PlannedMeal, RandomizeOptions } from "@/types/kitchen";

function uid() { return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`; }

export function PlannerView() {
  const kitchen = useKitchen();
  const [anchor, setAnchor] = useState(() => startOfWeek(new Date()));
  const dates = useMemo(() => getWeekDates(anchor), [anchor]);
  const [selectedDates, setSelectedDates] = useState<string[]>(dates);
  const [mealsPerDay, setMealsPerDay] = useState<1 | 2 | 3>(kitchen.mealsPerDay);
  const [cuisine, setCuisine] = useState<CuisinePreference>("thai");
  const [strictness, setStrictness] = useState<IngredientStrictness>(2);
  const [draftPlan, setDraftPlan] = useState<PlannedMeal[] | null>(null);
  const [randomizing, setRandomizing] = useState(false);
  const [status, setStatus] = useState("พร้อมเปิดฝาหม้อแล้ว");
  const [picker, setPicker] = useState<{ date: string; slot: number } | null>(null);

  const savedForWeek = kitchen.plannedMeals.filter((plan) => dates.includes(plan.date));
  const displayed = draftPlan ?? savedForWeek;
  const options: RandomizeOptions = { dates: selectedDates, mealsPerDay, cuisine, strictness };

  function updateSelection(mode: "all" | "weekdays" | "weekend" | "clear") {
    if (mode === "all") setSelectedDates(dates);
    if (mode === "weekdays") setSelectedDates(dates.slice(0, 5));
    if (mode === "weekend") setSelectedDates(dates.slice(5));
    if (mode === "clear") setSelectedDates([]);
  }

  function changeWeek(nextAnchor: Date) {
    setAnchor(nextAnchor);
    setSelectedDates(getWeekDates(nextAnchor));
    setDraftPlan(null);
  }

  async function randomize() {
    if (!selectedDates.length || randomizing) return;
    setRandomizing(true);
    setStatus("กำลังดูว่าในครัวมีอะไร...");
    try {
      const response = await fetch("/api/meals/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ingredients: kitchen.ingredients, desiredMeals: selectedDates.length * mealsPerDay, cuisine, strictness, alreadySelectedMeals: savedForWeek.map((plan) => plan.mealId) }),
      });
      if (!response.ok) throw new Error("generation request failed");
      const parsed = generatedMealsResponseSchema.safeParse(await response.json());
      if (!parsed.success) throw new Error("generation response failed validation");
      setStatus("กำลังจับคู่เมนู...");
      const tones = ["#b85c38", "#d49235", "#6d9d6c", "#9d4d38", "#809b70"];
      const candidates = parsed.data.meals.map((generatedMeal, index) => {
        const existing = kitchen.meals.find((meal) => meal.name.trim() === generatedMeal.name.trim());
        if (existing) return existing;
        return {
          id: uid(),
          name: generatedMeal.name,
          description: generatedMeal.description,
          cuisine: generatedMeal.cuisine,
          mealType: generatedMeal.mealType,
          difficulty: generatedMeal.difficulty,
          cookingTimeMinutes: generatedMeal.cookingTimeMinutes,
          ingredients: generatedMeal.ingredients.map((ingredient) => ({ name: ingredient.name, normalizedName: normalizeIngredientName(ingredient.normalizedName ?? ingredient.name), quantity: ingredient.requiredQuantity, unit: ingredient.unit, optional: ingredient.isOptional })),
          steps: generatedMeal.steps,
          tags: generatedMeal.tags,
          imageTone: tones[index % tones.length],
          source: "ai" as const,
        };
      });
      kitchen.addGeneratedMeals(candidates.filter((meal) => meal.source === "ai"));
      const recentIds = kitchen.history.filter((entry) => new Date().getTime() - new Date(entry.cookedAt).getTime() < 14 * 86_400_000).map((entry) => entry.mealId);
      const selected: string[] = [];
      const generatedPlans: PlannedMeal[] = [];
      for (const date of selectedDates) {
        for (let slot = 0; slot < mealsPerDay; slot += 1) {
          const locked = savedForWeek.find((plan) => plan.date === date && plan.slot === slot && plan.isLocked);
          if (locked) { generatedPlans.push(locked); selected.push(locked.mealId); continue; }
          const eligible = candidates.filter((meal) => {
            const missing = calculateMealMatch(meal, kitchen.ingredients).ingredients.filter((item) => !item.optional && !item.available).length;
            return strictness === 99 || missing <= strictness;
          });
          const basePool = eligible.length ? eligible : candidates;
          const pool = basePool.some((meal) => !selected.includes(meal.id)) ? basePool.filter((meal) => !selected.includes(meal.id)) : basePool;
          const picked = weightedPick(pool.map((meal) => ({ item: meal, weight: mealWeight(meal, kitchen.ingredients, kitchen.favoriteMealIds, recentIds, selected) })));
          if (!picked) continue;
          selected.push(picked.id);
          generatedPlans.push({ id: uid(), date, slot, mealId: picked.id, isLocked: false, status: "planned", matchScore: calculateMealMatch(picked, kitchen.ingredients).score, createdAt: new Date().toISOString() });
        }
      }
      const selectedKeys = new Set(selectedDates.flatMap((date) => Array.from({ length: mealsPerDay }, (_, slot) => `${date}:${slot}`)));
      setDraftPlan([...savedForWeek.filter((plan) => !selectedKeys.has(`${plan.date}:${plan.slot}`)), ...generatedPlans]);
      setStatus("ได้ละ กินนี่แหละ!");
    } catch {
      const generated = kitchen.generatePlan(options);
      const selectedKeys = new Set(selectedDates.flatMap((date) => Array.from({ length: mealsPerDay }, (_, slot) => `${date}:${slot}`)));
      setDraftPlan([...savedForWeek.filter((plan) => !selectedKeys.has(`${plan.date}:${plan.slot}`)), ...generated]);
      setStatus("ใช้สูตรสำรองให้แล้ว พร้อมกิน!");
    } finally {
      setRandomizing(false);
    }
  }

  function regenerateSlot(date: string, slot: number) {
    const generated = kitchen.generatePlan({ ...options, dates: [date] });
    const replacement = generated.find((plan) => plan.slot === slot);
    if (!replacement) return;
    setDraftPlan([...displayed.filter((plan) => !(plan.date === date && plan.slot === slot)), replacement]);
  }

  function removePlan(planId: string) {
    if (draftPlan) setDraftPlan(draftPlan.filter((plan) => plan.id !== planId));
    else kitchen.removePlannedMeal(planId);
  }

  function toggleLock(planId: string) {
    if (draftPlan) setDraftPlan(draftPlan.map((plan) => plan.id === planId ? { ...plan, isLocked: !plan.isLocked } : plan));
    else kitchen.togglePlanLock(planId);
  }

  function pickManual(meal: Meal) {
    if (!picker) return;
    const plan: PlannedMeal = { id: uid(), date: picker.date, slot: picker.slot, mealId: meal.id, isLocked: false, status: "planned", matchScore: calculateMealMatch(meal, kitchen.ingredients).score, createdAt: new Date().toISOString() };
    if (draftPlan) setDraftPlan([...draftPlan.filter((item) => !(item.date === picker.date && item.slot === picker.slot)), plan]);
    else kitchen.savePlan([plan], mealsPerDay);
    setPicker(null);
  }

  return <motion.div initial={false} animate={{ opacity: 1, y: 0 }}>
    <PageHeader eyebrow="WEEKLY TABLE" title="อาทิตย์นี้กินอะไรดี" description="เลือกวันกับจำนวนมื้อ แล้วให้ครัวช่วยจัดแผนที่ใช้ของได้คุ้มที่สุด" actions={<div className="flex items-center gap-2 rounded-2xl bg-[var(--card)] p-1.5 shadow-sm"><button onClick={() => changeWeek(addWeeks(anchor, -1))} aria-label="สัปดาห์ก่อน" className="grid size-9 place-items-center rounded-xl hover:bg-[var(--muted-soft)]"><ChevronLeft size={17} /></button><button onClick={() => changeWeek(startOfWeek(new Date()))} className="px-2 text-xs font-bold">{formatWeekRange(dates)}</button><button onClick={() => changeWeek(addWeeks(anchor, 1))} aria-label="สัปดาห์ถัดไป" className="grid size-9 place-items-center rounded-xl hover:bg-[var(--muted-soft)]"><ChevronRight size={17} /></button></div>} />

    <section className="planner-randomizer mb-7 grid overflow-hidden rounded-[28px] bg-[var(--sidebar)] text-[var(--sidebar-fg)] sm:rounded-[34px] xl:grid-cols-[1.08fr_1fr]">
      <div className="relative min-h-[240px] border-b border-white/10 sm:min-h-[290px] xl:min-h-[420px] xl:border-b-0 xl:border-r"><RandomizerStage active={randomizing} /><div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-6 pb-5 pt-16"><AnimatePresence mode="wait"><motion.p key={status} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="text-center text-xs font-semibold text-white/85 sm:text-sm">{status}</motion.p></AnimatePresence></div></div>
      <div className="p-5 sm:p-7"><div className="flex items-center gap-2"><span className="grid size-8 place-items-center rounded-xl bg-white/10 text-[var(--accent)]"><Sparkles size={16} /></span><div><p className="text-sm font-bold text-white">ตั้งค่าการสุ่ม</p><p className="text-[10px] text-white/45">ปรับได้ตามใจ ก่อนเปิดฝาหม้อ</p></div></div>
        <div className="mt-6"><div className="flex items-center justify-between"><p className="text-xs font-semibold text-white/65">วันที่ต้องการ</p><div className="flex gap-2 text-[10px] font-semibold text-white/45"><button onClick={() => updateSelection("all")} className="hover:text-white">ทั้งหมด</button><button onClick={() => updateSelection("weekdays")} className="hover:text-white">วันทำงาน</button><button onClick={() => updateSelection("weekend")} className="hover:text-white">สุดสัปดาห์</button><button onClick={() => updateSelection("clear")} className="hover:text-white">ล้าง</button></div></div><div className="mt-3 grid grid-cols-7 gap-1.5">{dates.map((date, index) => { const active = selectedDates.includes(date); return <button key={date} onClick={() => setSelectedDates(active ? selectedDates.filter((item) => item !== date) : [...selectedDates, date])} aria-pressed={active} className={`rounded-xl py-2 text-[10px] font-bold transition ${active ? "bg-white text-[var(--sidebar)]" : "bg-white/[.06] text-white/45 hover:bg-white/10"}`}>{DAY_NAMES[index].short}</button>; })}</div></div>
        <div className="mt-5 grid grid-cols-2 gap-4"><ConfigSelect label="มื้อต่อวัน" value={String(mealsPerDay)} onChange={(value) => setMealsPerDay(Number(value) as 1 | 2 | 3)} options={[{ value: "1", label: "1 มื้อ" }, { value: "2", label: "2 มื้อ" }, { value: "3", label: "3 มื้อ" }]} /><ConfigSelect label="แนวอาหาร" value={cuisine} onChange={(value) => setCuisine(value as CuisinePreference)} options={[{ value: "thai", label: "ไทยเท่านั้น" }, { value: "mostly-thai", label: "ไทยเป็นหลัก" }, { value: "any", label: "อะไรก็ได้" }]} /></div>
        <div className="mt-4"><ConfigSelect label="ยอมให้ขาดวัตถุดิบ" value={String(strictness)} onChange={(value) => setStrictness(Number(value) as IngredientStrictness)} options={[{ value: "0", label: "ใช้เฉพาะของที่มี" }, { value: "1", label: "ขาดได้ไม่เกิน 1 อย่าง" }, { value: "2", label: "ขาดได้ไม่เกิน 2 อย่าง" }, { value: "3", label: "ขาดได้ไม่เกิน 3 อย่าง" }, { value: "99", label: "ไม่จำกัด" }]} /></div>
        <button onClick={randomize} disabled={!selectedDates.length || randomizing} className="mt-6 flex h-13 w-full items-center justify-center gap-3 rounded-2xl bg-[var(--accent)] text-sm font-bold text-white shadow-xl shadow-black/20 transition-all hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-40">{randomizing ? <RefreshCw className="animate-spin" size={18} /> : <Dices size={19} />}{randomizing ? "กำลังจับคู่..." : `สุ่ม ${selectedDates.length * mealsPerDay} มื้อ`}</button>
      </div>
    </section>

    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-bold tracking-[.16em] text-accent">YOUR PLAN</p><h2 className="mt-1 text-xl font-bold">โต๊ะอาหารประจำสัปดาห์</h2><p className="mt-1 text-xs text-muted">เมนูที่ล็อกไว้จะไม่เปลี่ยนเมื่อสุ่มใหม่</p></div>{draftPlan && <div className="flex gap-2"><SecondaryButton onClick={() => setDraftPlan(null)}><X size={15} /> ยกเลิก</SecondaryButton><SecondaryButton onClick={randomize}><RefreshCw size={15} /> สุ่มใหม่</SecondaryButton><PrimaryButton onClick={() => { kitchen.savePlan(draftPlan, mealsPerDay); setDraftPlan(null); }}><Save size={16} /> บันทึกแผนนี้</PrimaryButton></div>}</div>
    {draftPlan && <div className="mb-4 flex items-center gap-2 rounded-2xl bg-[var(--accent-soft)] px-4 py-3 text-xs font-semibold text-accent"><CalendarCheck2 size={16} /> นี่คือตัวอย่างแผน ตรวจดูก่อนแล้วค่อยบันทึก</div>}
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{dates.map((date, index) => <DayMealCard key={date} date={date} index={index} plans={displayed.filter((plan) => plan.date === date)} mealsPerDay={mealsPerDay} revealIndex={draftPlan ? index : 0} preview={Boolean(draftPlan)} onAdd={(slot) => setPicker({ date, slot })} onRegenerate={(slot) => regenerateSlot(date, slot)} onRemove={removePlan} onToggleLock={toggleLock} />)}</div>
    <Modal open={Boolean(picker)} onClose={() => setPicker(null)} title="เพิ่มเมนูเอง" description="เลือกจากเมนูไทยที่เตรียมไว้ ระบบจะคำนวณความพร้อมจากของในครัวให้" size="md"><ManualMealPicker onPick={pickManual} /></Modal>
  </motion.div>;
}

function ConfigSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) {
  return <label className="block text-[11px] font-semibold text-white/55">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-white/[.07] px-3 text-xs font-semibold text-white outline-none"><option className="bg-neutral-900" value={value} hidden>{options.find((option) => option.value === value)?.label}</option>{options.filter((option) => option.value !== value).map((option) => <option className="bg-neutral-900" key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}
