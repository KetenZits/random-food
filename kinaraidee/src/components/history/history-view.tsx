"use client";

import { motion } from "motion/react";
import { CalendarDays, ChefHat, Clock3, PackageCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/ui/primitives";
import { PageHeader } from "@/components/ui/page-header";
import { useKitchen } from "@/features/kitchen/kitchen-provider";
import { formatQuantity } from "@/lib/units";

type Range = "week" | "month" | "all";

export function HistoryView() {
  const kitchen = useKitchen();
  const [range, setRange] = useState<Range>("month");
  const [now] = useState(() => Date.now());
  const history = useMemo(() => kitchen.history.filter((entry) => {
    const age = now - new Date(entry.cookedAt).getTime();
    return range === "all" || age <= (range === "week" ? 7 : 31) * 86_400_000;
  }), [kitchen.history, now, range]);
  const counts = useMemo(() => kitchen.history.reduce<Record<string, number>>((result, entry) => ({ ...result, [entry.mealId]: (result[entry.mealId] ?? 0) + 1 }), {}), [kitchen.history]);
  return <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}><PageHeader eyebrow="COOKING JOURNAL" title="มื้อที่เคยทำ" description="ย้อนดูว่าเมนูไหนทำบ่อย และวัตถุดิบอะไรถูกใช้ไปบ้าง" actions={<div className="flex rounded-2xl bg-[var(--muted-soft)] p-1">{(["week", "month", "all"] as const).map((item) => <button key={item} onClick={() => setRange(item)} className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition ${range === item ? "bg-[var(--card)] text-foreground shadow-sm" : "text-muted"}`}>{item === "week" ? "สัปดาห์นี้" : item === "month" ? "เดือนนี้" : "ทั้งหมด"}</button>)}</div>} />
    {history.length === 0 ? <EmptyState title="ยังไม่มีบันทึกมื้ออาหาร" description="เมื่อกด “ทำเมนูนี้แล้ว” เราจะเก็บมื้อนั้นพร้อมวัตถุดิบที่ใช้ไว้ตรงนี้" /> : <div className="grid gap-4 lg:grid-cols-[1fr_280px]"><div className="space-y-3">{history.map((entry, index) => <motion.article key={entry.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * .05 }} className="surface-card flex flex-col gap-4 rounded-[24px] p-5 sm:flex-row sm:items-center"><span className="grid size-12 shrink-0 place-items-center rounded-[18px] bg-[var(--secondary)] text-primary"><ChefHat size={22} /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-bold">{entry.mealName}</h2><span className="rounded-full bg-[var(--muted-soft)] px-2 py-1 text-[9px] font-bold text-muted">ทำแล้ว {counts[entry.mealId]} ครั้ง</span></div><p className="mt-1 flex items-center gap-1.5 text-xs text-muted"><Clock3 size={12} /> {new Intl.DateTimeFormat("th-TH", { dateStyle: "long", timeStyle: "short" }).format(new Date(entry.cookedAt))}</p></div><div className="border-t border-[var(--border)] pt-3 sm:max-w-[45%] sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0"><p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold text-muted"><PackageCheck size={12} /> วัตถุดิบที่ใช้</p><p className="text-xs leading-5">{entry.ingredientsUsed.length ? entry.ingredientsUsed.map((item) => `${item.name} ${formatQuantity(item.quantity, item.unit)}`).join(" · ") : "ไม่มีรายการที่หัก"}</p></div></motion.article>)}</div><aside className="surface-card h-fit rounded-[26px] p-5"><p className="text-[10px] font-bold tracking-[.16em] text-accent">YOUR RHYTHM</p><h2 className="mt-1 text-lg font-bold">สรุปการเข้าครัว</h2><div className="mt-5 space-y-4"><Summary icon={<ChefHat size={18} />} label="ทำอาหารแล้ว" value={`${history.length} มื้อ`} /><Summary icon={<CalendarDays size={18} />} label="เมนูไม่ซ้ำ" value={`${new Set(history.map((item) => item.mealId)).size} เมนู`} /><Summary icon={<PackageCheck size={18} />} label="รายการวัตถุดิบที่ใช้" value={`${history.reduce((sum, item) => sum + item.ingredientsUsed.length, 0)} รายการ`} /></div></aside></div>}
  </motion.div>;
}

function Summary({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-[15px] bg-[var(--muted-soft)] text-primary">{icon}</span><div><p className="text-[10px] text-muted">{label}</p><p className="text-sm font-bold">{value}</p></div></div>; }
