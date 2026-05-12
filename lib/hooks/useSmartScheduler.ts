"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase/client";
import { getSuggestions, getTopFreeSlots } from "@/lib/scheduling/scheduler";
import type { SchedulingSuggestion, FreeSlot, Task, Pendencia } from "@/types";

function rowToTask(row: Record<string, unknown>): Task {
  return {
    id: row.id as number,
    title: row.title as string,
    date: row.date as string,
    startTime: row.start_time as string | undefined,
    endTime: row.end_time as string | undefined,
    estimatedMinutes: row.estimated_minutes as number | undefined,
    category: row.category as Task["category"],
    priority: row.priority as Task["priority"],
    status: row.status as Task["status"],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToPendencia(row: Record<string, unknown>): Pendencia {
  return {
    id: row.id as number,
    title: row.title as string,
    description: row.description as string | undefined,
    deadline: row.deadline as string | undefined,
    estimatedMinutes: row.estimated_minutes as number,
    category: row.category as Pendencia["category"],
    priority: row.priority as Pendencia["priority"],
    status: row.status as Pendencia["status"],
    notes: row.notes as string | undefined,
    timeRestrictions: row.time_restrictions as Pendencia["timeRestrictions"],
    taskId: row.task_id as number | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function useSmartScheduler(pendenciaId: number | null) {
  const [pendencia, setPendencia] = useState<Pendencia | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [pendResult, taskResult] = await Promise.all([
        pendenciaId
          ? supabase.from("pendencias").select("*").eq("id", pendenciaId).single()
          : Promise.resolve({ data: null }),
        supabase.from("tasks").select("*"),
      ]);
      setPendencia(pendResult.data ? rowToPendencia(pendResult.data) : null);
      setTasks((taskResult.data ?? []).map(rowToTask));
      setLoading(false);
    }
    load();
  }, [pendenciaId]);

  const suggestions = useMemo<SchedulingSuggestion[]>(() => {
    if (!pendencia) return [];
    return getSuggestions(pendencia, tasks);
  }, [pendencia, tasks]);

  return { suggestions, isLoading: loading };
}

export function useFreeSlots(lookAheadDays = 3): FreeSlot[] {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    supabase.from("tasks").select("*").then(({ data }) => {
      setTasks((data ?? []).map(rowToTask));
    });
  }, []);

  return useMemo(() => getTopFreeSlots(tasks, lookAheadDays), [tasks, lookAheadDays]);
}
