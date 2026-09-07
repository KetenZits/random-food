"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowLeft, Check, CheckCircle2, ChefHat, Clock3, Heart, MinusCircle, ShoppingBasket, Sparkles } from "lucide-react";
import { useState } from "react";
import { MealArtwork } from "@/components/meals/meal-card";
import { Modal } from "@/components/ui/modal";
import { PrimaryButton, SecondaryButton } from "@/components/ui/primitives";
import { useKitchen } from "@/features/kitchen/kitchen-provider";
import { calculateMealMatch } from "@/features/meals/matching";
import { formatQuantity } from "@/lib/units";

export function MealDetailsView({ date, slot }: { date: string; slot: number }) {
  const kitchen = useKitchen();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const plan = kitchen.plannedMeals.find((item) => item.date === date && item.slot === slot) ?? kitchen.plannedMeals.find((item) => item.date === date);
  const meal = kitchen.meals.find((item) => item.id === plan?.mealId);
  if (!plan || !meal) return <div className="grid min-h-[70dvh] place-items-center text-center"><div><span className="mx-auto grid size-16 place-items-center rounded-[24px] bg-[var(--muted-soft)] text-muted"><ChefHat size={28} /></span><h1 className="mt-5 text-2xl font-bold">วันนี้ยังไม่มีเมนู</h1><p className="mt-2 text-sm text-muted">กลับไปเลือกเองหรือให้ครัวสุ่มให้ก็ได้</p><Link href="/planner" className="mt-6 inline-flex h-11 items-center gap-2 rounded-2xl bg-primary px-5 text-sm font-bold text-primary-foreground"><ArrowLeft size={16} /> กลับไปวางแผน</Link></div></div>;
  const planId = plan.id;
  const match = calculateMealMatch(meal, kitchen.ingredients);
  const favorite = kitchen.favoriteMealIds.includes(meal.id);
  const dateLabel = new Intl.DateTimeFormat("th-TH", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(`${date}T12:00:00`));

  function confirmCook() {
    const result = kitchen.cookMeal(planId);
    setConfirmOpen(false);
    setNotice(result.message);
  }

  return <motion.div initial={false} animate={{ opacity: 1, y: 0 }}>
    <div className="mb-6 flex items-center justify-between"><Link href="/planner" className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-foreground"><span className="grid size-9 place-items-center rounded-full bg-[var(--muted-soft)]"><ArrowLeft size={17} /></span> กลับไปแผนสัปดาห์</Link><p className="hidden text-xs font-semibold text-muted sm:block">{dateLabel}</p></div>
    {notice && <div role="status" className="mb-5 flex items-center gap-2 rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-success"><CheckCircle2 size={17} /> {notice}</div>}
    <section className="grid gap-6 lg:grid-cols-[1.05fr_1fr]">
      <div className="surface-card rounded-[32px] p-4 sm:p-6"><MealArtwork meal={meal} /><div className="px-1 pt-6"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold tracking-[.17em] text-accent">{meal.cuisine.toUpperCase()} · {meal.mealType.toUpperCase()}</p><h1 className="mt-2 text-3xl font-bold tracking-[-.04em] sm:text-4xl">{meal.name}</h1></div><button onClick={() => kitchen.toggleFavorite(meal.id)} aria-label="สลับรายการโปรด" className={`grid size-11 place-items-center rounded-full ${favorite ? "bg-red-500/10 text-red-500" : "bg-[var(--muted-soft)] text-muted"}`}><Heart size={20} fill={favorite ? "currentColor" : "none"} /></button></div><p className="mt-4 text-sm leading-7 text-muted">{meal.description}</p>
        <div className="mt-6 grid grid-cols-3 gap-2"><Metric icon={<CheckCircle2 size={17} />} label="พร้อมทำ" value={`${match.score}%`} tone="success" /><Metric icon={<Clock3 size={17} />} label="เวลา" value={`${meal.cookingTimeMinutes} นาที`} /><Metric icon={<ChefHat size={17} />} label="ความยาก" value={meal.difficulty === "easy" ? "ง่าย" : meal.difficulty === "medium" ? "ปานกลาง" : "ยาก"} /></div>
        <button onClick={() => setConfirmOpen(true)} disabled={plan.status === "cooked"} className="mt-6 flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-bold text-primary-foreground shadow-lg shadow-black/10 disabled:opacity-55">{plan.status === "cooked" ? <><CheckCircle2 size={18} /> ทำเมนูนี้แล้ว</> : <><ChefHat size={18} /> ทำเมนูนี้แล้ว</>}</button>
      </div></div>
      <div className="space-y-6"><section className="surface-card rounded-[28px] p-5 sm:p-6"><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold tracking-[.16em] text-accent">INGREDIENTS</p><h2 className="mt-1 text-xl font-bold">วัตถุดิบที่ใช้</h2></div><span className="rounded-full bg-[var(--muted-soft)] px-3 py-1.5 text-[10px] font-bold text-muted">{match.availableCount}/{match.totalRequired} พร้อม</span></div><div className="mt-5 space-y-3">{match.ingredients.map((ingredient) => <div key={`${ingredient.name}-${ingredient.unit}`} className="flex items-center gap-3"><span className={`grid size-8 place-items-center rounded-full ${ingredient.available ? "bg-emerald-500/10 text-success" : "bg-amber-500/10 text-warning"}`}>{ingredient.available ? <Check size={14} /> : <MinusCircle size={14} />}</span><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{ingredient.name}{ingredient.optional && <span className="ml-2 text-[10px] font-normal text-muted">ไม่บังคับ</span>}</p>{!ingredient.available && ingredient.availableQuantity > 0 && <p className="text-[10px] text-warning">มี {formatQuantity(ingredient.availableQuantity, ingredient.inventoryUnit)} / ต้องใช้ {formatQuantity(ingredient.quantity, ingredient.unit)}</p>}</div><span className="text-xs font-semibold text-muted">{formatQuantity(ingredient.quantity, ingredient.unit)}</span></div>)}</div>{match.missingIngredients.length > 0 && <div className="mt-5 rounded-[18px] bg-amber-500/10 p-4"><p className="flex items-center gap-2 text-xs font-bold text-warning"><ShoppingBasket size={15} /> ต้องซื้อเพิ่ม</p><p className="mt-2 text-xs leading-5 text-muted">{match.missingIngredients.map((item) => `${item.name} ${formatQuantity(item.shortfall || item.quantity, item.inventoryUnit)}`).join(" · ")}</p></div>}</section>
        <section className="surface-card rounded-[28px] p-5 sm:p-6"><p className="text-[10px] font-bold tracking-[.16em] text-accent">HOW TO</p><h2 className="mt-1 text-xl font-bold">วิธีทำ</h2><ol className="mt-5 space-y-5">{meal.steps.map((step, index) => <li key={step} className="flex gap-4"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--secondary)] text-xs font-bold text-primary">{index + 1}</span><p className="pt-1 text-sm leading-6">{step}</p></li>)}</ol></section></div>
    </section>
    <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="ใช้วัตถุดิบสำหรับมื้อนี้?" description="ระบบจะหักจำนวนที่มีจริงโดยไม่ให้ติดลบ" size="sm"><div className="space-y-3">{match.ingredients.filter((item) => !item.optional && item.availableQuantity > 0).map((item) => <div key={item.name} className="flex items-center justify-between rounded-2xl bg-[var(--muted-soft)] px-4 py-3 text-sm"><span className="font-semibold">{item.name}</span><span className="text-muted">− {formatQuantity(Math.min(item.quantity, item.availableQuantity), item.unit)}</span></div>)}</div>{match.missingIngredients.some((item) => !item.optional) && <div className="mt-4 flex gap-2 rounded-2xl bg-amber-500/10 p-3 text-xs leading-5 text-warning"><Sparkles className="shrink-0" size={15} /> ของบางอย่างไม่พอ ระบบจะหักเฉพาะจำนวนที่มีอยู่</div>}<div className="mt-5 flex gap-3"><SecondaryButton onClick={() => setConfirmOpen(false)} className="flex-1">ยังไม่ทำ</SecondaryButton><PrimaryButton onClick={confirmCook} className="flex-[1.4]">ยืนยันว่าทำแล้ว</PrimaryButton></div></Modal>
  </motion.div>;
}

function Metric({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone?: "success" }) {
  return <div className={`rounded-[18px] p-3 ${tone === "success" ? "bg-emerald-500/10" : "bg-[var(--muted-soft)]"}`}><span className={tone === "success" ? "text-success" : "text-muted"}>{icon}</span><p className="mt-2 text-[10px] text-muted">{label}</p><p className="mt-0.5 text-xs font-bold">{value}</p></div>;
}
