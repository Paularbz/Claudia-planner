"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { invalidate, useInvalidation } from "@/lib/utils/invalidate";
import type { Task, TaskStatus, Category, Priority } from "@/types";

export interface TaskFilters {
  date?: string;
  status?: TaskStatus;
  category?: Category;
  priority?: Priority;
  search?: string;
}

export function useTasks(filters?: TaskFilters) {
  const [tasks, setTasks] = useState<Task[]>([]);

  const fetch = useCallback(async () => {
    let query = supabase
      .from("tasks")
      .select("*")
      .order("date", { ascending: true });

    if (filters?.date) query = query.eq("date", filters.date);
    if (filters?.status) query = query.eq("status", filters.status);
    if (filters?.category) query = query.eq("category", filters.category);
    if (filters?.priority) query = query.eq("priority", filters.priority);
    if (filters?.search) query = query.ilike("title", `%${filters.search}%`);

    const { data } = await query;
    if (data) {
      setTasks(
        data.map((row) => ({
          id: row.id,
          title: row.title,
          description: row.description,
          date: row.date,
          startTime: row.start_time,
          endTime: row.end_time,
          estimatedMinutes: row.estimated_minutes,
          category: row.category,
          priority: row.priority,
          status: row.status,
          notes: row.notes,
          tag: row.tag,
          color: row.color,
          pendenciaId: row.pendencia_id,
          showInCalendar: row.show_in_calendar ?? true,
          sortOrder: row.sort_order ?? undefined,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }))
      );
    }
  }, [filters?.date, filters?.status, filters?.category, filters?.priority, filters?.search]);

  useEffect(() => { fetch(); }, [fetch]);
  useInvalidation("tasks", fetch);

  async function createTask(data: Omit<Task, "id" | "createdAt" | "updatedAt">): Promise<number | undefined> {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: inserted } = await supabase.from("tasks").insert({
      user_id: user?.id,
      title: data.title,
      description: data.description,
      date: data.date,
      start_time: data.startTime,
      end_time: data.endTime,
      estimated_minutes: data.estimatedMinutes,
      category: data.category,
      priority: data.priority,
      status: data.status,
      notes: data.notes,
      tag: data.tag,
      color: data.color,
      pendencia_id: data.pendenciaId,
      show_in_calendar: data.showInCalendar ?? true,
    }).select("id").single();
    await fetch();
    invalidate("tasks");
    return inserted?.id;
  }

  async function updateTask(id: number, data: Partial<Task>) {
    await supabase.from("tasks").update({
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.date !== undefined && { date: data.date }),
      ...(data.startTime !== undefined && { start_time: data.startTime }),
      ...(data.endTime !== undefined && { end_time: data.endTime }),
      ...(data.estimatedMinutes !== undefined && { estimated_minutes: data.estimatedMinutes }),
      ...(data.category !== undefined && { category: data.category }),
      ...(data.priority !== undefined && { priority: data.priority }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.tag !== undefined && { tag: data.tag }),
      ...(data.color !== undefined && { color: data.color }),
      ...(data.pendenciaId !== undefined && { pendencia_id: data.pendenciaId }),
      ...(data.showInCalendar !== undefined && { show_in_calendar: data.showInCalendar }),
      updated_at: new Date().toISOString(),
    }).eq("id", id);
    await fetch();
    invalidate("tasks");
  }

  async function reorderTasks(orderedIds: number[]) {
    await Promise.all(
      orderedIds.map((id, index) =>
        supabase.from("tasks").update({ sort_order: index }).eq("id", id)
      )
    );
    await fetch();
    invalidate("tasks");
  }

  async function deleteTask(id: number) {
    await supabase.from("tasks").delete().eq("id", id);
    await fetch();
    invalidate("tasks");
  }

  async function moveTask(id: number, newDate: string, newStartTime?: string, newEndTime?: string) {
    await supabase.from("tasks").update({
      date: newDate,
      ...(newStartTime && { start_time: newStartTime }),
      ...(newEndTime && { end_time: newEndTime }),
      updated_at: new Date().toISOString(),
    }).eq("id", id);
    await fetch();
    invalidate("tasks");
  }

  return { tasks, createTask, updateTask, deleteTask, moveTask, reorderTasks };
}

export function useTaskById(id: number | null) {
  const [task, setTask] = useState<Task | null>(null);

  const fetch = useCallback(async () => {
    if (!id) { setTask(null); return; }
    const { data } = await supabase.from("tasks").select("*").eq("id", id).single();
    if (data) {
      setTask({
        id: data.id,
        title: data.title,
        description: data.description,
        date: data.date,
        startTime: data.start_time,
        endTime: data.end_time,
        estimatedMinutes: data.estimated_minutes,
        category: data.category,
        priority: data.priority,
        status: data.status,
        notes: data.notes,
        pendenciaId: data.pendencia_id,
        showInCalendar: data.show_in_calendar ?? true,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      });
    } else {
      setTask(null);
    }
  }, [id]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return task;
}
