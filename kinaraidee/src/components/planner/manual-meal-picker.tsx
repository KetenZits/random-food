"use client";

import { ArrowLeft, Check, ChefHat, Clock3, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useKitchen } from "@/features/kitchen/kitchen-provider";
import { calculateMealMatch } from "@/features/meals/matching";
import { normalizeIngredientName } from "@/lib/ingredients/normalize";
import type { Meal } from "@/types/kitchen";

export function ManualMealPicker({ onPick }: { onPick: (meal: Meal) => void }) {
  const kitchen = useKitchen();
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [custom, setCustom] = useState({ name: "", description: "", time: "20", ingredients: "", steps: "" });
  const meals = useMemo(() => kitchen.meals.filter((meal) => meal.name.includes(query.trim()) || meal.tags.some((tag) => tag.includes(query.trim()))), [kitchen.meals, query]);
  if (creating) {
    const fieldClass = "mt-1.5 h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm outline-none focus:border-[var(--primary)]";
    return <form onSubmit={(event) => {
      event.preventDefault();
      if (!custom.name.trim()) return;
      const ingredients = custom.ingredients.split(",").map((value) => value.trim()).filter(Boolean).map((value) => {
        const match = value.match(/^(.+?)\s+(\d+(?:\.\d+)?)\s*([^\s]+)$/);
        const name = match?.[1]?.trim() ?? value;
        return { name, normalizedName: normalizeIngredientName(name), quantity: match ? Number(match[2]) : 1, unit: match?.[3] ?? "piece" };
      });
      const meal = kitchen.addCustomMeal({ name: custom.name.trim(), description: custom.description.trim() || "เมนูโฮมเมดที่เพิ่มเอง", cuisine: "thai", mealType: "main", difficulty: "easy", cookingTimeMinutes: Math.max(5, Number(custom.time) || 20), ingredients, steps: custom.steps.split("\n").map((step) => step.trim()).filter(Boolean).length ? custom.steps.split("\n").map((step) => step.trim()).filter(Boolean) : ["เตรียมวัตถุดิบให้พร้อม", "ปรุงจนสุกและชิมรส", "จัดเสิร์ฟขณะร้อน"], tags: ["เมนูของฉัน"], imageTone: "#927054" });
      onPick(meal);
    }}><button type="button" onClick={() => setCreating(false)} className="mb-4 inline-flex items-center gap-2 text-xs font-semibold text-muted"><ArrowLeft size={14} /> กลับไปเลือกเมนู</button><div className="grid gap-4 sm:grid-cols-2"><label className="text-xs font-semibold sm:col-span-2">ชื่อเมนู<input value={custom.name} onChange={(event) => setCustom({ ...custom, name: event.target.value })} required autoFocus placeholder="เช่น ผัดผักสูตรคุณแม่" className={fieldClass} /></label><label className="text-xs font-semibold sm:col-span-2">คำอธิบาย<input value={custom.description} onChange={(event) => setCustom({ ...custom, description: event.target.value })} placeholder="สั้น ๆ ว่าเมนูนี้เป็นยังไง" className={fieldClass} /></label><label className="text-xs font-semibold">เวลาทำ (นาที)<input value={custom.time} onChange={(event) => setCustom({ ...custom, time: event.target.value })} type="number" min="5" className={fieldClass} /></label><label className="text-xs font-semibold sm:col-span-2">วัตถุดิบ <span className="font-normal text-muted">(ชื่อ จำนวน หน่วย, ...)</span><input value={custom.ingredients} onChange={(event) => setCustom({ ...custom, ingredients: event.target.value })} placeholder="ไข่ไก่ 2 egg, มะเขือเทศ 100 g" className={fieldClass} /></label><label className="text-xs font-semibold sm:col-span-2">วิธีทำ <span className="font-normal text-muted">(หนึ่งขั้นต่อบรรทัด)</span><textarea value={custom.steps} onChange={(event) => setCustom({ ...custom, steps: event.target.value })} rows={4} placeholder={"เตรียมวัตถุดิบ\nผัดจนสุก\nปรุงรสและจัดเสิร์ฟ"} className={`${fieldClass} h-auto resize-none py-3`} /></label></div><button type="submit" className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-bold text-primary-foreground"><ChefHat size={17} /> สร้างและเลือกเมนูนี้</button></form>;
  }
  return <div><label className="relative block"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหาเมนู เช่น กะเพรา" className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] pl-11 pr-4 text-sm outline-none focus:border-[var(--primary)]" /></label><button onClick={() => setCreating(true)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--primary)] py-3 text-xs font-bold text-primary"><Plus size={15} /> สร้างเมนูของตัวเอง</button><div className="mt-4 max-h-[46dvh] space-y-2 overflow-y-auto pr-1">{meals.map((meal) => { const match = calculateMealMatch(meal, kitchen.ingredients); return <button key={meal.id} onClick={() => onPick(meal)} className="group flex w-full items-center gap-3 rounded-[18px] p-3 text-left transition hover:bg-[var(--muted-soft)]"><span className="grid size-11 shrink-0 place-items-center rounded-[15px] bg-[var(--accent-soft)] text-sm font-black text-accent">{match.score}</span><span className="min-w-0 flex-1"><strong className="block truncate text-sm">{meal.name}</strong><span className="mt-1 flex items-center gap-3 text-[10px] text-muted"><span className="flex items-center gap-1"><Check size={11} /> พร้อม {match.score}%</span><span className="flex items-center gap-1"><Clock3 size={11} /> {meal.cookingTimeMinutes} นาที</span></span></span><span className="rounded-xl bg-[var(--secondary)] px-3 py-2 text-[11px] font-bold text-primary opacity-0 transition group-hover:opacity-100">เลือก</span></button>; })}</div></div>;
}
