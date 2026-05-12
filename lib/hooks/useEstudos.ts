"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { invalidate, useInvalidation } from "@/lib/utils/invalidate";
import type { EstudoItem, EstudoStatus, Category, Priority } from "@/types";

function rowToEstudo(row: Record<string, unknown>): EstudoItem {
  return {
    id: row.id as number,
    title: row.title as string,
    description: row.description as string | undefined,
    source: row.source as EstudoItem["source"],
    url: row.url as string | undefined,
    author: row.author as string | undefined,
    category: row.category as Category,
    priority: row.priority as Priority,
    status: row.status as EstudoStatus,
    tags: (row.tags as string[]) ?? [],
    notes: row.notes as string | undefined,
    insightId: row.insight_id as number | undefined,
    scheduledDate: row.scheduled_date as string | undefined,
    completedAt: row.completed_at as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function useEstudos(filters?: { status?: EstudoStatus; search?: string }) {
  const [estudos, setEstudos] = useState<EstudoItem[]>([]);

  const fetch = useCallback(async () => {
    let query = supabase
      .from("estudos")
      .select("*")
      .order("created_at", { ascending: false });

    if (filters?.status) query = query.eq("status", filters.status);
    if (filters?.search) query = query.ilike("title", `%${filters.search}%`);

    const { data } = await query;
    if (data) setEstudos(data.map(rowToEstudo));
  }, [filters?.status, filters?.search]);

  useEffect(() => { fetch(); }, [fetch]);
  useInvalidation("estudos", fetch);

  return estudos;
}

export function useEstudoActions() {
  async function createEstudo(data: Omit<EstudoItem, "id" | "createdAt" | "updatedAt">) {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("estudos").insert({
      user_id: user?.id,
      title: data.title,
      description: data.description,
      source: data.source,
      url: data.url,
      author: data.author,
      category: data.category,
      priority: data.priority,
      status: data.status,
      tags: data.tags,
      notes: data.notes,
      insight_id: data.insightId,
      scheduled_date: data.scheduledDate,
      completed_at: data.completedAt,
    });
    invalidate("estudos");
  }

  async function updateEstudo(id: number, data: Partial<EstudoItem>) {
    await supabase.from("estudos").update({
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.source !== undefined && { source: data.source }),
      ...(data.url !== undefined && { url: data.url }),
      ...(data.author !== undefined && { author: data.author }),
      ...(data.category !== undefined && { category: data.category }),
      ...(data.priority !== undefined && { priority: data.priority }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.tags !== undefined && { tags: data.tags }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.insightId !== undefined && { insight_id: data.insightId }),
      ...(data.scheduledDate !== undefined && { scheduled_date: data.scheduledDate }),
      ...(data.completedAt !== undefined && { completed_at: data.completedAt }),
      updated_at: new Date().toISOString(),
    }).eq("id", id);
    invalidate("estudos");
  }

  async function deleteEstudo(id: number) {
    await supabase.from("estudos").delete().eq("id", id);
    invalidate("estudos");
  }

  return { createEstudo, updateEstudo, deleteEstudo };
}
