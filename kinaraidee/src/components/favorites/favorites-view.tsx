"use client";

import { motion } from "motion/react";
import { Heart, Sparkles } from "lucide-react";
import { MealCard } from "@/components/meals/meal-card";
import { EmptyState } from "@/components/ui/primitives";
import { PageHeader } from "@/components/ui/page-header";
import { useKitchen } from "@/features/kitchen/kitchen-provider";

export function FavoritesView() {
  const kitchen = useKitchen();
  const favorites = kitchen.meals.filter((meal) => kitchen.favoriteMealIds.includes(meal.id));
  return <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}><PageHeader eyebrow="YOUR FAVORITES" title="เมนูโปรด" description="เมนูที่ชอบจะมีโอกาสถูกเลือกเพิ่มขึ้นนิดหน่อย แต่แผนยังหลากหลายเหมือนเดิม" />{favorites.length ? <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{favorites.map((meal) => <MealCard key={meal.id} meal={meal} />)}</div> : <EmptyState title="ยังไม่มีเมนูโปรด" description="กดหัวใจบนเมนูที่ชอบ แล้วครัวจะจำไว้ให้ตอนสุ่มครั้งถัดไป" action={<div className="inline-flex items-center gap-2 text-sm font-bold text-primary"><Heart size={17} /> เลือกหัวใจจากหน้าเมนู <Sparkles size={15} /></div>} />}</motion.div>;
}
