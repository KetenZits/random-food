"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowUpRight, Check, Clock3, Heart, ShoppingBasket } from "lucide-react";
import { useKitchen } from "@/features/kitchen/kitchen-provider";
import { calculateMealMatch } from "@/features/meals/matching";
import type { Meal } from "@/types/kitchen";

export function MealArtwork({ meal, compact = false }: { meal: Meal; compact?: boolean }) {
  return <div className={`relative overflow-hidden rounded-[22px] ${compact ? "h-24" : "h-40"}`} style={{ background: `color-mix(in srgb, ${meal.imageTone}, var(--card) 30%)` }} aria-hidden="true"><div className="absolute -right-8 -top-9 size-32 rounded-full bg-white/15" /><div className="absolute -bottom-9 -left-4 size-28 rounded-full bg-black/[.06]" /><div className="absolute left-1/2 top-1/2 h-[55%] w-[58%] -translate-x-1/2 -translate-y-[38%] rounded-[50%] border-[7px] border-white/80 bg-white/55 shadow-xl shadow-black/10"><span className="absolute inset-[14%] rounded-[50%] bg-[color-mix(in_srgb,var(--accent),#d99c48_55%)] opacity-75" /></div><span className="absolute bottom-3 left-4 rounded-full bg-black/15 px-3 py-1 text-[10px] font-bold tracking-wider text-white backdrop-blur-md">THAI HOME COOK</span></div>;
}

export function MealCard({ meal, href, showArtwork = true }: { meal: Meal; href?: string; showArtwork?: boolean }) {
  const kitchen = useKitchen();
  const match = calculateMealMatch(meal, kitchen.ingredients);
  const favorite = kitchen.favoriteMealIds.includes(meal.id);
  return <motion.article layout whileHover={{ y: -4 }} className="surface-card group rounded-[28px] p-4">{showArtwork && <MealArtwork meal={meal} />}<div className="px-1 pb-1 pt-4"><div className="flex items-start justify-between gap-3"><div><h3 className="text-lg font-bold tracking-tight">{meal.name}</h3><p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">{meal.description}</p></div><button onClick={() => kitchen.toggleFavorite(meal.id)} aria-label={favorite ? `นำ ${meal.name} ออกจากเมนูโปรด` : `เพิ่ม ${meal.name} เป็นเมนูโปรด`} className={`grid size-9 shrink-0 place-items-center rounded-full transition ${favorite ? "bg-red-500/10 text-red-500" : "bg-[var(--muted-soft)] text-muted hover:text-red-500"}`}><Heart size={17} fill={favorite ? "currentColor" : "none"} /></button></div><div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] font-semibold"><span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 ${match.score >= 80 ? "bg-emerald-500/10 text-success" : "bg-amber-500/10 text-warning"}`}><Check size={12} /> พร้อม {match.score}%</span><span className="inline-flex items-center gap-1 rounded-full bg-[var(--muted-soft)] px-2.5 py-1.5 text-muted"><Clock3 size={12} /> {meal.cookingTimeMinutes} นาที</span>{match.missingIngredients.length > 0 && <span className="inline-flex items-center gap-1 text-muted"><ShoppingBasket size={12} /> ขาด {match.missingIngredients.length}</span>}</div>{href && <Link href={href} className="mt-4 flex items-center justify-between border-t border-[var(--border)] pt-3 text-xs font-bold text-primary">ดูวิธีทำ <span className="grid size-7 place-items-center rounded-full bg-[var(--secondary)] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"><ArrowUpRight size={14} /></span></Link>}</div></motion.article>;
}
