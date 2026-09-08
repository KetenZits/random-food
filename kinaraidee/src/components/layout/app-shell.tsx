"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Carrot, ChefHat, Heart, History, House, Settings, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import type { ReactNode } from "react";

const navigation = [
  { href: "/", label: "หน้าหลัก", shortLabel: "หน้าหลัก", icon: House },
  { href: "/ingredients", label: "วัตถุดิบ", shortLabel: "วัตถุดิบ", icon: Carrot },
  { href: "/planner", label: "วางแผนมื้ออาหาร", shortLabel: "แผนมื้อ", icon: CalendarDays },
  { href: "/favorites", label: "เมนูโปรด", shortLabel: "โปรด", icon: Heart },
  { href: "/history", label: "ประวัติการทำ", shortLabel: "ประวัติ", icon: History },
] as const;

function Logo() {
  return (
    <Link href="/" className="group flex items-center gap-3" aria-label="กินไรดี หน้าหลัก">
      <span className="relative grid size-10 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-black/10 transition-transform group-hover:-rotate-3 group-hover:scale-105">
        <ChefHat size={21} strokeWidth={2.2} />
        <Sparkles className="absolute -right-1 -top-1 text-accent" size={13} fill="currentColor" />
      </span>
      <span><strong className="block text-[1.05rem] font-bold tracking-tight">กินไรดี</strong><span className="block text-[10px] font-medium tracking-[.16em] text-[color:var(--muted)]">SMART KITCHEN</span></span>
    </Link>
  );
}

function isActive(pathname: string, href: string) { return href === "/" ? pathname === "/" : pathname.startsWith(href); }

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const mobileNavigation = [...navigation.filter((item) => item.href !== "/history"), { href: "/settings", label: "ตั้งค่า", shortLabel: "ตั้งค่า", icon: Settings }];
  return (
    <div className="app-background min-h-dvh lg:grid lg:grid-cols-[232px_minmax(0,1fr)] xl:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[232px] flex-col bg-[var(--sidebar)] px-5 py-7 text-[var(--sidebar-fg)] lg:flex xl:w-[248px]">
        <div className="px-2"><Logo /></div>
        <nav className="mt-10 space-y-1.5" aria-label="เมนูหลัก">
          {navigation.map((item) => {
            const active = isActive(pathname, item.href);
            return <Link key={item.href} href={item.href} className={`relative flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium transition-colors ${active ? "text-white" : "text-white/55 hover:bg-white/[.06] hover:text-white"}`}>
              {active && <motion.span layoutId="desktop-nav" className="absolute inset-0 rounded-2xl bg-white/[.1]" transition={{ type: "spring", stiffness: 350, damping: 30 }} />}
              <item.icon className="relative" size={19} strokeWidth={active ? 2.4 : 1.8} /><span className="relative">{item.label}</span>{active && <span className="relative ml-auto size-1.5 rounded-full bg-[var(--accent)]" />}
            </Link>;
          })}
        </nav>
        <div className="mt-auto">
          <Link href="/settings" className={`relative flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium transition-colors ${isActive(pathname, "/settings") ? "bg-white/10 text-white" : "text-white/55 hover:bg-white/[.06] hover:text-white"}`}><Settings size={19} /><span>ตั้งค่าและธีม</span></Link>
          <div className="mt-5 rounded-3xl bg-white/[.06] p-4"><div className="mb-3 flex items-center gap-2 text-xs font-semibold text-white/80"><Sparkles size={14} className="text-[var(--accent)]" /> ครัวฉลาดขึ้นทุกมื้อ</div><p className="text-[11px] leading-relaxed text-white/40">ซื้อให้พอดี ใช้ของให้หมด และไม่ต้องยืนคิดหน้าตู้เย็นอีก</p></div>
        </div>
      </aside>
      <div className="min-w-0 lg:col-start-2">
        <header className="sticky top-0 z-30 flex h-17 items-center justify-between border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--background),transparent_10%)] px-4 backdrop-blur-xl sm:px-6 lg:hidden"><Logo /><Link href="/settings" aria-label="ตั้งค่า" className="grid size-10 place-items-center rounded-full bg-[var(--muted-soft)]"><Settings size={19} /></Link></header>
        <main className="mx-auto min-h-dvh w-full max-w-[1500px] px-4 pb-28 pt-6 sm:px-6 sm:pt-8 lg:px-8 lg:pb-12 lg:pt-9 2xl:px-12">{children}</main>
      </div>
      <nav aria-label="เมนูมือถือ" className="fixed inset-x-2.5 bottom-[max(.625rem,env(safe-area-inset-bottom))] z-50 grid grid-cols-5 rounded-[24px] border border-white/10 bg-[color-mix(in_srgb,var(--sidebar),transparent_3%)] p-1.5 text-[var(--sidebar-fg)] shadow-2xl backdrop-blur-xl sm:inset-x-5 lg:hidden">
        {mobileNavigation.map((item) => {
          const active = isActive(pathname, item.href);
          return <Link key={item.href} href={item.href} className={`relative flex min-w-0 flex-col items-center gap-1 rounded-[18px] px-0.5 py-2 text-[9px] transition-colors min-[380px]:text-[10px] ${active ? "text-white" : "text-white/45"}`}>{active && <motion.span layoutId="mobile-nav" className="absolute inset-0 rounded-[18px] bg-white/10" />}<item.icon className="relative" size={18} strokeWidth={active ? 2.5 : 1.8} /><span className="relative max-w-full truncate">{item.shortLabel}</span></Link>;
        })}
      </nav>
    </div>
  );
}
