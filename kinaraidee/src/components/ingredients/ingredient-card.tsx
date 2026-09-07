"use client";

import { motion } from "motion/react";
import { Beef, CheckCircle2, Drumstick, Egg, Fish, Flower2, Leaf, Milk, Minus, Package, Pencil, Plus, Salad, Snowflake, Soup, Trash2, TriangleAlert, Wheat } from "lucide-react";
import { useState, type ComponentType } from "react";
import { CATEGORY_LABELS } from "@/constants/kitchen";
import { daysUntil } from "@/lib/date/week";
import { formatQuantity } from "@/lib/units";
import type { Ingredient, IngredientCategory } from "@/types/kitchen";

const icons: Record<IngredientCategory, ComponentType<{ size?: number; strokeWidth?: number }>> = {
  meat: Beef, seafood: Fish, eggs: Egg, vegetables: Salad, fruits: Flower2, herbs: Leaf,
  seasonings: Soup, sauces: Soup, rice_grains: Wheat, noodles: Soup, dairy: Milk,
  frozen: Snowflake, other: Package,
};

function expirationLabel(expirationDate?: string) {
  const days = daysUntil(expirationDate);
  if (days === null) return null;
  if (days < 0) return { text: `หมดอายุแล้ว ${Math.abs(days)} วัน`, tone: "danger" };
  if (days === 0) return { text: "หมดอายุวันนี้", tone: "danger" };
  if (days <= 3) return { text: `หมดอายุใน ${days} วัน`, tone: "warning" };
  return { text: `เก็บได้อีก ${days} วัน`, tone: "muted" };
}

export function IngredientCard({ ingredient, onEdit, onDelete, onAdjust, onUsedUp }: { ingredient: Ingredient; onEdit: () => void; onDelete: () => void; onAdjust: (delta: number) => void; onUsedUp: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const Icon = icons[ingredient.category] ?? Drumstick;
  const expiry = expirationLabel(ingredient.expirationDate);
  const step = ["kg", "L"].includes(ingredient.unit) ? .1 : ["g", "ml"].includes(ingredient.unit) ? 50 : 1;
  const isEmpty = ingredient.quantity <= 0;
  return (
    <motion.article layout initial={{ opacity: 0, y: 14, filter: "blur(5px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, scale: .96, filter: "blur(5px)" }} whileHover={{ y: -3 }} className={`surface-card group relative overflow-hidden rounded-[26px] p-5 ${isEmpty ? "opacity-60" : ""}`}>
      <div className="flex items-start gap-4">
        <div className="grid size-12 shrink-0 place-items-center rounded-[18px] bg-[var(--secondary)] text-primary"><Icon size={23} strokeWidth={1.8} /></div>
        <div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div><p className="text-[11px] font-semibold text-muted">{CATEGORY_LABELS[ingredient.category]}</p><h3 className="mt-0.5 truncate text-lg font-bold tracking-tight">{ingredient.name}</h3></div><button onClick={onEdit} aria-label={`แก้ไข ${ingredient.name}`} className="grid size-8 shrink-0 place-items-center rounded-full text-muted opacity-70 transition hover:bg-[var(--muted-soft)] hover:text-foreground sm:opacity-0 sm:group-hover:opacity-100"><Pencil size={15} /></button></div>
          <p className="mt-2 text-sm"><span className="text-muted">เหลือ </span><strong>{isEmpty ? "หมดแล้ว" : formatQuantity(ingredient.quantity, ingredient.unit)}</strong></p>
        </div>
      </div>
      {expiry && !isEmpty && <div className={`mt-4 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold ${expiry.tone === "danger" ? "bg-red-500/10 text-danger" : expiry.tone === "warning" ? "bg-amber-500/10 text-warning" : "bg-[var(--muted-soft)] text-muted"}`}><TriangleAlert size={14} />{expiry.text}</div>}
      <div className="mt-4 flex items-center justify-between border-t border-[var(--border)] pt-4">
        {confirming ? <div className="flex w-full items-center gap-2 text-xs"><span className="mr-auto font-semibold text-danger">ลบรายการนี้?</span><button onClick={() => setConfirming(false)} className="rounded-xl px-3 py-2 text-muted">ยกเลิก</button><button onClick={onDelete} className="rounded-xl bg-red-500/10 px-3 py-2 font-semibold text-danger">ลบ</button></div> : <><div className="flex items-center rounded-xl bg-[var(--muted-soft)] p-1"><button onClick={() => onAdjust(-step)} disabled={isEmpty} aria-label={`ลดจำนวน ${ingredient.name}`} className="grid size-8 place-items-center rounded-lg hover:bg-[var(--card)] disabled:opacity-30"><Minus size={14} /></button><button onClick={() => onAdjust(step)} aria-label={`เพิ่มจำนวน ${ingredient.name}`} className="grid size-8 place-items-center rounded-lg hover:bg-[var(--card)]"><Plus size={14} /></button></div><div className="flex items-center gap-1"><button onClick={onUsedUp} disabled={isEmpty} className="grid size-9 place-items-center rounded-xl text-muted hover:bg-emerald-500/10 hover:text-success disabled:opacity-30" aria-label={`ทำเครื่องหมายว่า ${ingredient.name} หมดแล้ว`}><CheckCircle2 size={17} /></button><button onClick={() => setConfirming(true)} className="grid size-9 place-items-center rounded-xl text-muted hover:bg-red-500/10 hover:text-danger" aria-label={`ลบ ${ingredient.name}`}><Trash2 size={16} /></button></div></>}
      </div>
    </motion.article>
  );
}
