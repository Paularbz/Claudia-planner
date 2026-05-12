import { extractFreeSlots } from "./freeSlots";
import { daysUntil, todayISO } from "@/lib/utils/date";
import type { Task, Pendencia, FreeSlot, SchedulingSuggestion } from "@/types";

function scoreSlot(slot: FreeSlot, pendencia: Pendencia): number {
  let score = 50;

  if (pendencia.deadline) {
    const days = daysUntil(pendencia.deadline);
    if (days <= 0) score += 50;
    else if (days <= 1) score += 40;
    else if (days <= 3) score += 25;
    else if (days <= 7) score += 10;
  }

  const priorityBonus: Record<string, number> = {
    "Urgente": 30,
    "Alta": 20,
    "Média": 10,
    "Baixa": 0,
  };
  score += priorityBonus[pendencia.priority] ?? 0;

  const daysFromNow = daysUntil(slot.date);
  score -= daysFromNow * 3;
  if (daysFromNow < 0) score = 0;

  const buffer = slot.durationMinutes - pendencia.estimatedMinutes;
  if (buffer >= 15) score += 5;
  if (buffer >= 60) score += 3;

  return Math.max(0, Math.min(100, score));
}

function generateReason(slot: FreeSlot, pendencia: Pendencia, score: number): string {
  const parts: string[] = [];

  const daysFrom = daysUntil(slot.date);
  if (daysFrom === 0) parts.push("Hoje");
  else if (daysFrom === 1) parts.push("Amanhã");
  else parts.push(`Em ${daysFrom} dias`);

  parts.push(`às ${slot.startTime}`);

  if (pendencia.deadline) {
    const days = daysUntil(pendencia.deadline);
    if (days <= 1) parts.push("— prazo urgente!");
    else if (days <= 3) parts.push(`— prazo em ${days} dias`);
  }

  if (pendencia.priority === "Urgente") parts.push("• prioridade urgente");
  else if (pendencia.priority === "Alta") parts.push("• prioridade alta");

  if (score >= 70) parts.push("✨ melhor opção");

  return parts.join(" ");
}

export function getSuggestions(
  pendencia: Pendencia,
  tasks: Task[],
  maxSuggestions = 5
): SchedulingSuggestion[] {
  if (!pendencia.estimatedMinutes) return [];

  const slots = extractFreeSlots(
    tasks,
    pendencia.estimatedMinutes,
    pendencia.timeRestrictions ?? [],
    undefined,
    14
  );

  return slots
    .map((slot) => ({
      pendencia,
      suggestedSlot: slot,
      score: scoreSlot(slot, pendencia),
      reason: generateReason(slot, pendencia, scoreSlot(slot, pendencia)),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSuggestions);
}

export function getTopFreeSlots(tasks: Task[], lookAheadDays = 3): FreeSlot[] {
  return extractFreeSlots(tasks, 30, [], undefined, lookAheadDays).slice(0, 5);
}
