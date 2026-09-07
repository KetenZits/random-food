import type { ReactNode } from "react";

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: ReactNode }) {
  return <header className="mb-6 flex min-w-0 flex-col gap-4 sm:mb-7 lg:flex-row lg:items-end lg:justify-between"><div className="min-w-0">{eyebrow && <p className="mb-2 text-[10px] font-bold uppercase tracking-[.18em] text-accent sm:text-[11px]">{eyebrow}</p>}<h1 className="text-balance text-[1.75rem] font-bold leading-tight tracking-[-.035em] sm:text-[2.15rem]">{title}</h1>{description && <p className="mt-2 max-w-2xl text-sm leading-6 text-muted sm:text-[15px]">{description}</p>}</div>{actions && <div className="min-w-0 shrink-0 overflow-x-auto pb-1 lg:overflow-visible lg:pb-0">{actions}</div>}</header>;
}
