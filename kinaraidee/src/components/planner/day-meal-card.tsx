"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { CheckCircle2, Clock3, Dices, Lock, Plus, RefreshCw, ShoppingBasket, Trash2, Unlock } from "lucide-react";
import { DAY_NAMES, SLOT_LABELS } from "@/constants/kitchen";
import { useKitchen } from "@/features/kitchen/kitchen-provider";
import { calculateMealMatch } from "@/features/meals/matching";
import { fromIsoDate, toIsoDate } from "@/lib/date/week";
import type { PlannedMeal } from "@/types/kitchen";

export function DayMealCard({ date, index, plans, mealsPerDay, revealIndex, preview = false, onAdd, onRegenerate, onRemove, onToggleLock }: { date: string; index: number; plans: PlannedMeal[]; mealsPerDay: 1 | 2 | 3; revealIndex: number; preview?: boolean; onAdd: (slot: number) => void; onRegenerate: (slot: number) => void; onRemove: (planId: string) => void; onToggleLock: (planId: string) => void }) {
  const kitchen = useKitchen();
  const today = date === toIsoDate(new Date());
  return <motion.article layout initial={{ opacity: 0, y: 20, rotateX: -8 }} animate={{ opacity: 1, y: 0, rotateX: 0 }} transition={{ delay: revealIndex * .08, type: "spring", stiffness: 280, damping: 26 }} className={`surface-card overflow-hidden rounded-[28px] ${today ? "ring-2 ring-[color-mix(in_srgb,var(--primary),transparent_65%)]" : ""}`}>
    <header className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4"><div className="flex items-center gap-3"><span className={`grid size-10 place-items-center rounded-[15px] text-sm font-bold ${today ? "bg-primary text-primary-foreground" : "bg-[var(--muted-soft)]"}`}>{fromIsoDate(date).getDate()}</span><div><p className="text-[9px] font-bold tracking-[.16em] text-muted">{DAY_NAMES[index].english}</p><h2 className="text-base font-bold">{DAY_NAMES[index].thai}</h2></div></div>{today && <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-[10px] font-bold text-accent">วันนี้</span>}</header>
    <div className="divide-y divide-[var(--border)]">{Array.from({ length: mealsPerDay }, (_, slot) => {
      const plan = plans.find((item) => item.slot === slot);
      const meal = kitchen.meals.find((item) => item.id === plan?.mealId);
      const match = meal ? calculateMealMatch(meal, kitchen.ingredients) : null;
      return <div key={slot} className="group p-4">{mealsPerDay > 1 && <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted">{SLOT_LABELS[mealsPerDay][slot]}</p>}{plan && meal ? <><div className="flex gap-3"><div className="grid size-12 shrink-0 place-items-center rounded-[17px] bg-[var(--accent-soft)] text-accent"><Dices size={21} /></div><div className="min-w-0 flex-1">{preview ? <span className="font-bold leading-5">{meal.name}</span> : <Link href={`/planner/${date}?slot=${slot}`} className="font-bold leading-5 hover:text-primary">{meal.name}</Link>}<div className="mt-2 flex flex-wrap gap-2 text-[10px] font-semibold"><span className={`inline-flex items-center gap-1 ${match && match.score >= 80 ? "text-success" : "text-warning"}`}><CheckCircle2 size={12} /> พร้อม {match?.score}%</span><span className="inline-flex items-center gap-1 text-muted"><Clock3 size={12} /> {meal.cookingTimeMinutes} นาที</span>{match && match.missingIngredients.length > 0 && <span className="inline-flex items-center gap-1 text-muted"><ShoppingBasket size={11} /> ขาด {match.missingIngredients.length}</span>}</div></div></div><div className="mt-3 flex items-center justify-end gap-1"><button onClick={() => onToggleLock(plan.id)} aria-label={plan.isLocked ? "ปลดล็อกเมนู" : "ล็อกเมนู"} className={`grid size-8 place-items-center rounded-xl ${plan.isLocked ? "bg-[var(--secondary)] text-primary" : "text-muted hover:bg-[var(--muted-soft)]"}`}>{plan.isLocked ? <Lock size={14} /> : <Unlock size={14} />}</button><button onClick={() => onRegenerate(slot)} disabled={plan.isLocked} aria-label="สุ่มเมนูนี้ใหม่" className="grid size-8 place-items-center rounded-xl text-muted hover:bg-[var(--muted-soft)] hover:text-primary disabled:opacity-25"><RefreshCw size={14} /></button><button onClick={() => onRemove(plan.id)} disabled={plan.isLocked} aria-label="นำเมนูออก" className="grid size-8 place-items-center rounded-xl text-muted hover:bg-red-500/10 hover:text-danger disabled:opacity-25"><Trash2 size={14} /></button></div></> : <button onClick={() => onAdd(slot)} className="flex min-h-20 w-full items-center justify-center gap-2 rounded-[18px] border border-dashed border-[var(--border)] text-xs font-semibold text-muted transition hover:border-[var(--primary)] hover:bg-[var(--secondary)] hover:text-primary"><Plus size={16} /> เพิ่มเมนูเอง</button>}</div>;
    })}</div>
  </motion.article>;
}
