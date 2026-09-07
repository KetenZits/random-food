import type { Metadata } from "next";
import { FavoritesView } from "@/components/favorites/favorites-view";

export const metadata: Metadata = { title: "เมนูโปรด" };
export default function FavoritesPage() { return <FavoritesView />; }
