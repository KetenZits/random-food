import { PackageOpen } from "lucide-react";
import type { ReactNode, ButtonHTMLAttributes } from "react";

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="flex min-h-80 flex-col items-center justify-center rounded-[30px] border border-dashed border-[var(--border)] px-6 text-center"><div className="mb-5 grid size-16 place-items-center rounded-[24px] bg-[var(--accent-soft)] text-accent"><PackageOpen size={29} /></div><h2 className="text-xl font-bold">{title}</h2><p className="mt-2 max-w-md text-sm leading-6 text-muted">{description}</p>{action && <div className="mt-6">{action}</div>}</div>;
}

export function PrimaryButton({ children, className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-black/[.08] transition-all hover:-translate-y-0.5 hover:bg-[var(--primary-hover)] active:translate-y-0 disabled:pointer-events-none disabled:opacity-45 ${className}`}>{children}</button>;
}

export function SecondaryButton({ children, className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[var(--muted-soft)] px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-[var(--secondary)] disabled:pointer-events-none disabled:opacity-45 ${className}`}>{children}</button>;
}
