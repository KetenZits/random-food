"use client";

import { AnimatePresence, motion } from "motion/react";
import { Boxes, CircleAlert, PackagePlus, Plus, Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { CATEGORY_LABELS } from "@/constants/kitchen";
import { IngredientCard } from "@/components/ingredients/ingredient-card";
import { IngredientForm } from "@/components/ingredients/ingredient-form";
import { Modal } from "@/components/ui/modal";
import { EmptyState, PrimaryButton } from "@/components/ui/primitives";
import { PageHeader } from "@/components/ui/page-header";
import { useKitchen } from "@/features/kitchen/kitchen-provider";
import { daysUntil } from "@/lib/date/week";
import { ingredientCategories, type Ingredient, type IngredientCategory, type IngredientDraft } from "@/types/kitchen";

type SortMode = "recent" | "quantity" | "expiration" | "alpha";

export function InventoryView() {
  const kitchen = useKitchen();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<IngredientCategory | "all">("all");
  const [sort, setSort] = useState<SortMode>("recent");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Ingredient | undefined>();

  const filtered = useMemo(() => kitchen.ingredients.filter((ingredient) => {
    const matchesSearch = ingredient.name.toLocaleLowerCase("th-TH").includes(query.trim().toLocaleLowerCase("th-TH"));
    return matchesSearch && (category === "all" || ingredient.category === category);
  }).sort((a, b) => {
    if (sort === "quantity") return b.normalizedQuantity - a.normalizedQuantity;
    if (sort === "expiration") return (a.expirationDate ?? "9999") .localeCompare(b.expirationDate ?? "9999");
    if (sort === "alpha") return a.name.localeCompare(b.name, "th");
    return b.createdAt.localeCompare(a.createdAt);
  }), [kitchen.ingredients, query, category, sort]);

  const expiring = kitchen.ingredients.filter((item) => { const days = daysUntil(item.expirationDate); return item.quantity > 0 && days !== null && days <= 3; }).length;
  const activeCount = kitchen.ingredients.filter((item) => item.quantity > 0).length;

  function openAdd() { setEditing(undefined); setEditorOpen(true); }
  function submit(draft: IngredientDraft) {
    if (editing) kitchen.updateIngredient(editing.id, draft);
    else kitchen.addIngredient(draft);
    setEditorOpen(false);
  }

  return <motion.div initial={false} animate={{ opacity: 1, y: 0 }}>
    <PageHeader eyebrow="MY PANTRY" title="ของที่มีในครัว" description="เพิ่มของที่เพิ่งซื้อ แล้วเราจะช่วยจับคู่ให้เป็นมื้ออร่อยก่อนหมดอายุ" actions={<PrimaryButton onClick={openAdd}><Plus size={18} /> เพิ่มวัตถุดิบ</PrimaryButton>} />
    <section className="mb-6 grid gap-3 sm:grid-cols-2">
      <div className="flex items-center gap-4 rounded-[22px] bg-primary px-5 py-4 text-primary-foreground"><span className="grid size-10 place-items-center rounded-2xl bg-white/15"><Boxes size={20} /></span><div><p className="text-xs opacity-65">วัตถุดิบพร้อมใช้</p><p className="text-xl font-bold">{activeCount} <span className="text-sm font-medium opacity-75">รายการ</span></p></div></div>
      <div className="flex items-center gap-4 rounded-[22px] bg-[var(--accent-soft)] px-5 py-4 text-foreground"><span className="grid size-10 place-items-center rounded-2xl bg-[var(--card)] text-accent"><CircleAlert size={20} /></span><div><p className="text-xs text-muted">ควรรีบใช้</p><p className="text-xl font-bold">{expiring} <span className="text-sm font-medium text-muted">รายการ</span></p></div></div>
    </section>
    <section className="mb-6 space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหาวัตถุดิบ..." className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--card)] pl-11 pr-4 text-sm outline-none focus:border-[var(--primary)]" /></label>
        <label className="relative"><SlidersHorizontal className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={16} /><select value={sort} onChange={(event) => setSort(event.target.value as SortMode)} className="h-12 min-w-44 appearance-none rounded-2xl border border-[var(--border)] bg-[var(--card)] pl-11 pr-5 text-sm outline-none"><option value="recent">เพิ่มล่าสุด</option><option value="quantity">จำนวนมากสุด</option><option value="expiration">หมดอายุก่อน</option><option value="alpha">เรียงตามชื่อ</option></select></label>
      </div>
      <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1"><button onClick={() => setCategory("all")} className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${category === "all" ? "bg-primary text-primary-foreground" : "bg-[var(--muted-soft)] text-muted"}`}>ทั้งหมด</button>{ingredientCategories.map((item) => <button key={item} onClick={() => setCategory(item)} className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${category === item ? "bg-primary text-primary-foreground" : "bg-[var(--muted-soft)] text-muted hover:text-foreground"}`}>{CATEGORY_LABELS[item]}</button>)}</div>
    </section>
    {kitchen.ingredients.length === 0 ? <EmptyState title="ในครัวยังไม่มีอะไรเลย" description="เพิ่มวัตถุดิบที่เพิ่งซื้อมา แล้วเราจะช่วยคิดว่าเอาไปทำอะไรได้บ้าง" action={<PrimaryButton onClick={openAdd}><PackagePlus size={17} /> เพิ่มวัตถุดิบแรก</PrimaryButton>} /> : filtered.length === 0 ? <EmptyState title="หาไม่เจอในครัว" description="ลองเปลี่ยนคำค้นหรือเลือกหมวดหมู่อื่น" /> : <motion.div layout className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"><AnimatePresence mode="popLayout">{filtered.map((ingredient) => <IngredientCard key={ingredient.id} ingredient={ingredient} onEdit={() => { setEditing(ingredient); setEditorOpen(true); }} onDelete={() => kitchen.deleteIngredient(ingredient.id)} onAdjust={(delta) => kitchen.adjustIngredient(ingredient.id, delta)} onUsedUp={() => kitchen.markUsedUp(ingredient.id)} />)}</AnimatePresence></motion.div>}
    <Modal open={editorOpen} onClose={() => setEditorOpen(false)} title={editing ? `แก้ไข ${editing.name}` : "เพิ่มของเข้าครัว"} description={editing ? "แก้จำนวนหรือรายละเอียดให้ตรงกับของที่มี" : "ใช้เวลาไม่ถึงนาที แล้วเมนูแนะนำจะแม่นขึ้น"}><IngredientForm ingredient={editing} onSubmit={submit} onCancel={() => setEditorOpen(false)} /></Modal>
  </motion.div>;
}
