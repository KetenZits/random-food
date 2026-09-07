import type { Metadata } from "next";
import { MealDetailsView } from "@/components/meals/meal-details-view";

export const metadata: Metadata = { title: "รายละเอียดเมนู" };

export default async function MealDatePage({ params, searchParams }: {
  params: Promise<{ date: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { date } = await params;
  const query = await searchParams;
  const rawSlot = Array.isArray(query.slot) ? query.slot[0] : query.slot;
  const slot = Number.isFinite(Number(rawSlot)) ? Number(rawSlot) : 0;
  return <MealDetailsView date={date} slot={slot} />;
}
