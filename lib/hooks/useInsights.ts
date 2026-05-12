"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { invalidate, useInvalidation } from "@/lib/utils/invalidate";
import type { Insight, InsightCategory } from "@/types";

function rowToInsight(row: Record<string, unknown>): Insight {
  return {
    id: row.id as number,
    title: row.title as string,
    content: row.content as string,
    category: row.category as InsightCategory,
    tags: (row.tags as string[]) ?? [],
    linkedTaskId: row.linked_task_id as number | undefined,
    linkedEstudoId: row.linked_estudo_id as number | undefined,
    linkedProjetoId: row.linked_projeto_id as number | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function useInsights(filters?: { category?: InsightCategory; search?: string }) {
  const [insights, setInsights] = useState<Insight[]>([]);

  const fetch = useCallback(async () => {
    let query = supabase
      .from("insights")
      .select("*")
      .order("created_at", { ascending: false });

    if (filters?.category) query = query.eq("category", filters.category);
    if (filters?.search) query = query.ilike("title", `%${filters.search}%`);

    const { data } = await query;
    if (data) setInsights(data.map(rowToInsight));
  }, [filters?.category, filters?.search]);

  useEffect(() => { fetch(); }, [fetch]);
  useInvalidation("insights", fetch);

  return insights;
}

export function useInsight(id: number) {
  const [insight, setInsight] = useState<Insight | null>(null);

  const fetch = useCallback(async () => {
    const { data } = await supabase.from("insights").select("*").eq("id", id).single();
    if (data) setInsight(rowToInsight(data));
    else setInsight(null);
  }, [id]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return insight;
}

export function useInsightActions() {
  async function createInsight(data: Omit<Insight, "id" | "createdAt" | "updatedAt">) {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("insights").insert({
      user_id: user?.id,
      title: data.title,
      content: data.content,
      category: data.category,
      tags: data.tags,
      linked_task_id: data.linkedTaskId,
      linked_estudo_id: data.linkedEstudoId,
      linked_projeto_id: data.linkedProjetoId,
    });
    invalidate("insights");
  }

  async function updateInsight(id: number, data: Partial<Insight>) {
    await supabase.from("insights").update({
      ...(data.title !== undefined && { title: data.title }),
      ...(data.content !== undefined && { content: data.content }),
      ...(data.category !== undefined && { category: data.category }),
      ...(data.tags !== undefined && { tags: data.tags }),
      ...(data.linkedTaskId !== undefined && { linked_task_id: data.linkedTaskId }),
      ...(data.linkedEstudoId !== undefined && { linked_estudo_id: data.linkedEstudoId }),
      ...(data.linkedProjetoId !== undefined && { linked_projeto_id: data.linkedProjetoId }),
      updated_at: new Date().toISOString(),
    }).eq("id", id);
    invalidate("insights");
  }

  async function deleteInsight(id: number) {
    await supabase.from("insights").delete().eq("id", id);
    invalidate("insights");
  }

  return { createInsight, updateInsight, deleteInsight };
}
