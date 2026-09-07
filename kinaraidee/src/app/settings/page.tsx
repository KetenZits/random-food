import type { Metadata } from "next";
import { SettingsView } from "@/components/settings/settings-view";

export const metadata: Metadata = { title: "ตั้งค่า" };
export default function SettingsPage() { return <SettingsView />; }
