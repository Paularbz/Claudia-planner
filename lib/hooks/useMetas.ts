"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { invalidate, useInvalidation } from "@/lib/utils/invalidate";
import { todayISO } from "@/lib/utils/date";
import type { Meta, MetaCheck } from "@/types";

function rowToMeta(row: Record<string, unknown>): Meta {
  return {
    id: row.id as number,
    type: row.type as Meta["type"],
    label: row.label as string,
    icon: row.icon as string,
    color: row.color as string,
    isActive: row.is_active as boolean,
    order: row.order as number,
    target: row.target as number | undefined,
    targetUnit: row.target_unit as string | undefined,
    createdAt: row.created_at as string,
  };
}

function rowToMetaCheck(row: Record<string, unknown>): MetaCheck {
  return {
    id: row.id as number,
    metaId: row.meta_id as number,
    date: row.date as string,
    completed: row.completed as boolean,
    value: row.value as number | undefined,
    completedAt: row.completed_at as string | undefined,
  };
}

export function useMetas() {
  const [metas, setMetas] = useState<Meta[]>([]);

  const fetch = useCallback(async () => {
    const { data } = await supabase
      .from("metas")
      .select("*")
      .eq("is_active", true)
      .order("order", { ascending: true });
    if (data) setMetas(data.map(rowToMeta));
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  useInvalidation("metas", fetch);

  async function createMeta(data: Omit<Meta, "id" | "createdAt">) {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("metas").insert({
      user_id: user?.id,
      type: data.type,
      label: data.label,
      icon: data.icon,
      color: data.color,
      is_active: data.isActive,
      order: data.order,
      target: data.target,
      target_unit: data.targetUnit,
    });
    await fetch();
    invalidate("metas");
  }

  async function updateMeta(id: number, data: Partial<Meta>) {
    await supabase.from("metas").update({
      ...(data.type !== undefined && { type: data.type }),
      ...(data.label !== undefined && { label: data.label }),
      ...(data.icon !== undefined && { icon: data.icon }),
      ...(data.color !== undefined && { color: data.color }),
      ...(data.isActive !== undefined && { is_active: data.isActive }),
      ...(data.order !== undefined && { order: data.order }),
      ...(data.target !== undefined && { target: data.target }),
      ...(data.targetUnit !== undefined && { target_unit: data.targetUnit }),
    }).eq("id", id);
    await fetch();
    invalidate("metas");
  }

  async function deleteMeta(id: number) {
    await supabase.from("metas").delete().eq("id", id);
    await fetch();
    invalidate("metas");
  }

  return { metas, createMeta, updateMeta, deleteMeta };
}

export function useDailyChecks(date: string = todayISO()) {
  const [checks, setChecks] = useState<MetaCheck[]>([]);

  const fetch = useCallback(async () => {
    const { data } = await supabase
      .from("meta_checks")
      .select("*")
      .eq("date", date);
    if (data) setChecks(data.map(rowToMetaCheck));
  }, [date]);

  useEffect(() => { fetch(); }, [fetch]);
  useInvalidation("meta_checks", fetch);

  async function toggleCheck(metaId: number, completed: boolean) {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("meta_checks").upsert(
      {
        user_id: user?.id,
        meta_id: metaId,
        date,
        completed,
        completed_at: completed ? new Date().toISOString() : null,
      },
      { onConflict: "user_id,meta_id,date" }
    );
    await fetch();
    invalidate("meta_checks");
  }

  async function updateValue(metaId: number, value: number, target?: number) {
    const { data: { user } } = await supabase.auth.getUser();
    const completed = target !== undefined ? value >= target : false;
    await supabase.from("meta_checks").upsert(
      {
        user_id: user?.id,
        meta_id: metaId,
        date,
        completed,
        value,
        completed_at: completed ? new Date().toISOString() : null,
      },
      { onConflict: "user_id,meta_id,date" }
    );
    await fetch();
    invalidate("meta_checks");
  }

  function isChecked(metaId: number): boolean {
    return checks.some((c) => c.metaId === metaId && c.completed);
  }

  function getValue(metaId: number): number {
    return checks.find((c) => c.metaId === metaId)?.value ?? 0;
  }

  return { checks, toggleCheck, updateValue, isChecked, getValue };
}

export function useMetaHistory(metaId: number, days: number = 7) {
  const [history, setHistory] = useState<MetaCheck[]>([]);

  const fetch = useCallback(async () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days + 1);

    const startStr = start.toISOString().slice(0, 10);
    const endStr = end.toISOString().slice(0, 10);

    const { data } = await supabase
      .from("meta_checks")
      .select("*")
      .eq("meta_id", metaId)
      .gte("date", startStr)
      .lte("date", endStr);

    if (data) setHistory(data.map(rowToMetaCheck));
  }, [metaId, days]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return history;
}
