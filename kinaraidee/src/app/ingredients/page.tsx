import type { Metadata } from "next";
import { InventoryView } from "@/components/ingredients/inventory-view";

export const metadata: Metadata = { title: "วัตถุดิบ" };
export default function IngredientsPage() { return <InventoryView />; }
