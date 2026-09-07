import type { Metadata, Viewport } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { KitchenProvider } from "@/features/kitchen/kitchen-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "กินไรดี — ผู้ช่วยคิดเมนูจากของในครัว", template: "%s | กินไรดี" },
  description: "จัดการวัตถุดิบ วางแผนมื้ออาหาร และสุ่มเมนูไทยจากของที่มีในครัว",
  applicationName: "กินไรดี",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f3e9" },
    { media: "(prefers-color-scheme: dark)", color: "#151916" },
  ],
  width: "device-width",
  initialScale: 1,
};

const themeScript = `
try {
  const saved = JSON.parse(localStorage.getItem('kinrai-kitchen-v1') || '{}');
  const theme = saved.theme || {};
  document.documentElement.dataset.theme = theme.theme || 'matcha';
  document.documentElement.dataset.background = theme.backgroundStyle || 'soft';
  document.documentElement.dataset.cards = theme.cardStyle || 'soft';
  if (theme.customPrimary) document.documentElement.style.setProperty('--custom-primary', theme.customPrimary);
  if (theme.customAccent) document.documentElement.style.setProperty('--custom-accent', theme.customAccent);
} catch {}
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body>
        <KitchenProvider>
          <AppShell>{children}</AppShell>
        </KitchenProvider>
      </body>
    </html>
  );
}
