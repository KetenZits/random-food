"use client";

import { CircleAlert, RefreshCw } from "lucide-react";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="grid min-h-[75dvh] place-items-center text-center"><div><span className="mx-auto grid size-16 place-items-center rounded-[24px] bg-red-500/10 text-danger"><CircleAlert size={28} /></span><h1 className="mt-5 text-2xl font-bold">ครัวสะดุดนิดหน่อย</h1><p className="mt-2 text-sm text-muted">ข้อมูลของคุณยังอยู่ ลองเปิดหน้านี้ใหม่อีกครั้ง</p><button onClick={reset} className="mt-6 inline-flex h-11 items-center gap-2 rounded-2xl bg-primary px-5 text-sm font-bold text-primary-foreground"><RefreshCw size={16} /> ลองอีกครั้ง</button></div></div>;
}
