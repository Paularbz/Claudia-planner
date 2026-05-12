import { timeToMinutes, minutesToTime, isWeekend, isoDateRange, todayISO } from "@/lib/utils/date";
import type { Task, FreeSlot, DayBoundary, TimeRestrictionType } from "@/types";

const DEFAULT_BOUNDARY: DayBoundary = {
  workdayStart: "08:00",
  workdayEnd: "22:00",
  lunchStart: "12:00",
  lunchEnd: "13:00",
};

interface Interval {
  start: number;
  end: number;
}

function subtractIntervals(base: Interval, blocked: Interval[]): Interval[] {
  let gaps: Interval[] = [base];
  for (const block of blocked) {
    const next: Interval[] = [];
    for (const gap of gaps) {
      if (block.end <= gap.start || block.start >= gap.end) {
        next.push(gap);
      } else {
        if (block.start > gap.start) next.push({ start: gap.start, end: block.start });
        if (block.end < gap.end) next.push({ start: block.end, end: gap.end });
      }
    }
    gaps = next;
  }
  return gaps;
}

function passesTimeRestriction(
  slot: { startMinutes: number; date: string },
  restrictions: TimeRestrictionType[]
): boolean {
  for (const r of restrictions) {
    const h = slot.startMinutes;
    if (r === "only_morning" && h >= 12 * 60) return false;
    if (r === "only_afternoon" && (h < 12 * 60 || h >= 18 * 60)) return false;
    if (r === "only_evening" && h < 18 * 60) return false;
    if (r === "not_weekend" && isWeekend(slot.date)) return false;
    if (r === "only_weekend" && !isWeekend(slot.date)) return false;
  }
  return true;
}

export function extractFreeSlots(
  tasks: Task[],
  minDurationMinutes: number,
  restrictions: TimeRestrictionType[] = [],
  boundary: DayBoundary = DEFAULT_BOUNDARY,
  lookAheadDays = 7
): FreeSlot[] {
  const today = todayISO();
  const dates = isoDateRange(today, lookAheadDays);
  const slots: FreeSlot[] = [];

  const base: Interval = {
    start: timeToMinutes(boundary.workdayStart),
    end: timeToMinutes(boundary.workdayEnd),
  };
  const lunchBlock: Interval = {
    start: timeToMinutes(boundary.lunchStart),
    end: timeToMinutes(boundary.lunchEnd),
  };

  for (const date of dates) {
    const dayTasks = tasks.filter((t) => t.date === date && t.startTime && t.endTime);
    const blocked: Interval[] = [
      lunchBlock,
      ...dayTasks.map((t) => ({
        start: timeToMinutes(t.startTime!),
        end: timeToMinutes(t.endTime!),
      })),
    ];

    const gaps = subtractIntervals(base, blocked);
    for (const gap of gaps) {
      const duration = gap.end - gap.start;
      if (duration < minDurationMinutes) continue;
      if (!passesTimeRestriction({ startMinutes: gap.start, date }, restrictions)) continue;
      slots.push({
        date,
        startTime: minutesToTime(gap.start),
        endTime: minutesToTime(gap.end),
        durationMinutes: duration,
      });
    }
  }

  return slots;
}
