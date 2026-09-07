export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function fromIsoDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function startOfWeek(date = new Date()): Date {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const weekday = result.getDay();
  result.setDate(result.getDate() - (weekday === 0 ? 6 : weekday - 1));
  return result;
}

export function getWeekDates(anchor = new Date()): string[] {
  const start = startOfWeek(anchor);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return toIsoDate(date);
  });
}

export function addWeeks(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount * 7);
  return next;
}

export function formatWeekRange(dates: string[]): string {
  if (!dates.length) return "";
  const first = fromIsoDate(dates[0]);
  const last = fromIsoDate(dates[dates.length - 1]);
  const month = new Intl.DateTimeFormat("th-TH", { month: "long" });
  const year = new Intl.DateTimeFormat("th-TH", { year: "numeric" });
  if (first.getMonth() === last.getMonth()) {
    return `${first.getDate()}–${last.getDate()} ${month.format(first)} ${year.format(first)}`;
  }
  return `${first.getDate()} ${month.format(first)} – ${last.getDate()} ${month.format(last)} ${year.format(last)}`;
}

export function daysUntil(date?: string): number | null {
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((fromIsoDate(date).getTime() - today.getTime()) / 86_400_000);
}
