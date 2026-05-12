"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { invalidate, useInvalidation } from "@/lib/utils/invalidate";
import type { Pendencia, PendenciaStatus, Category, Priority } from "@/types";

interface PendenciaFilters {
  status?: PendenciaStatus;
  category?: Category;
  priority?: Priority;
}

function rowToPendencia(row: Record<string, unknown>): Pendencia {
  return {
    id: row.id as number,
    title: row.title as string,
    description: row.description as string | undefined,
    deadline: row.deadline as string | undefined,
    estimatedMinutes: row.estimated_minutes as number,
    category: row.category as Category,
    priority: row.priority as Priority,
    status: row.status as PendenciaStatus,
    notes: row.notes as string | undefined,
    timeRestrictions: row.time_restrictions as Pendencia["timeRestrictions"],
    taskId: row.task_id as number | undefined,
    sortOrder: row.sort_order as number | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function usePendencias(filters?: PendenciaFilters) {
  const [pendencias, setPendencias] = useState<Pendencia[]>([]);

  const fetch = useCallback(async () => {
    let query = supabase
      .from("pendencias")
      .select("*")
      .order("sort_order", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (filters?.status) query = query.eq("status", filters.status);
    if (filters?.category) query = query.eq("category", filters.category);
    if (filters?.priority) query = query.eq("priority", filters.priority);

    const { data } = await query;
    if (data) setPendencias(data.map(rowToPendencia));
  }, [filters?.status, filters?.category, filters?.priority]);

  useEffect(() => { fetch(); }, [fetch]);
  useInvalidation("pendencias", fetch);

  async function createPendencia(data: Omit<Pendencia, "id" | "createdAt" | "updatedAt">) {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("pendencias").insert({
      user_id: user?.id,
      title: data.title,
      description: data.description,
      deadline: data.deadline,
      estimated_minutes: data.estimatedMinutes,
      category: data.category,
      priority: data.priority,
      status: data.status,
      notes: data.notes,
      time_restrictions: data.timeRestrictions,
      task_id: data.taskId,
    });
    await fetch();
    invalidate("pendencias");
  }

  async function updatePendencia(id: number, data: Partial<Pendencia>) {
    await supabase.from("pendencias").update({
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.deadline !== undefined && { deadline: data.deadline }),
      ...(data.estimatedMinutes !== undefined && { estimated_minutes: data.estimatedMinutes }),
      ...(data.category !== undefined && { category: data.category }),
      ...(data.priority !== undefined && { priority: data.priority }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.timeRestrictions !== undefined && { time_restrictions: data.timeRestrictions }),
      ...(data.taskId !== undefined && { task_id: data.taskId }),
      updated_at: new Date().toISOString(),
    }).eq("id", id);
    await fetch();
    invalidate("pendencias");
  }

  async function deletePendencia(id: number) {
    await supabase.from("pendencias").delete().eq("id", id);
    await fetch();
    invalidate("pendencias");
  }

  async function reorderPendencias(orderedIds: number[]) {
    await Promise.all(
      orderedIds.map((id, index) =>
        supabase.from("pendencias").update({ sort_order: index }).eq("id", id)
      )
    );
    await fetch();
    invalidate("pendencias");
  }

  return { pendencias, createPendencia, updatePendencia, deletePendencia, reorderPendencias };
}

export function usePendenciaById(id: number | null) {
  const [pendencia, setPendencia] = useState<Pendencia | null>(null);

  const fetch = useCallback(async () => {
    if (!id) { setPendencia(null); return; }
    const { data } = await supabase.from("pendencias").select("*").eq("id", id).single();
    if (data) setPendencia(rowToPendencia(data));
    else setPendencia(null);
  }, [id]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return pendencia;
}
