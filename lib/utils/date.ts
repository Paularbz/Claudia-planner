import { format, parseISO, isToday, isTomorrow, differenceInDays, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

export function toISODate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function tomorrowISO(): string {
  return toISODate(addDays(new Date(), 1));
}

export function nowISO(): string {
  return new Date().toISOString();
}

export function formatDate(isoDate: string): string {
  const date = parseISO(isoDate);
  if (isToday(date)) return "Hoje";
  if (isTomorrow(date)) return "Amanhã";
  return format(date, "dd/MM/yyyy", { locale: ptBR });
}

export function formatDateLong(isoDate: string): string {
  return format(parseISO(isoDate), "EEEE, dd 'de' MMMM", { locale: ptBR });
}

export function formatTime(time: string): string {
  return time.substring(0, 5);
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function daysUntil(isoDate: string): number {
  return differenceInDays(parseISO(isoDate), new Date());
}

export function isoDateRange(start: string, days: number): string[] {
  return Array.from({ length: days }, (_, i) =>
    toISODate(addDays(parseISO(start), i))
  );
}

export function isWeekend(isoDate: string): boolean {
  const day = parseISO(isoDate).getDay();
  return day === 0 || day === 6;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h${m}min` : `${h}h`;
}
