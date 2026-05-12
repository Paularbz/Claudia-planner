"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { invalidate, useInvalidation } from "@/lib/utils/invalidate";
import type { Projeto, ProjetoTask, KanbanStatus, Priority, Prazo, ProjetoStatus } from "@/types";

function rowToProjeto(row: Record<string, unknown>): Projeto {
  return {
    id: row.id as number,
    title: row.title as string,
    description: row.description as string | undefined,
    status: row.status as ProjetoStatus,
    color: row.color as string,
    deadline: row.deadline as string | undefined,
    prazo: row.prazo as Prazo,
    order: row.order as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToProjetoTask(row: Record<string, unknown>): ProjetoTask {
  return {
    id: row.id as number,
    projetoId: row.projeto_id as number,
    title: row.title as string,
    description: row.description as string | undefined,
    status: row.status as KanbanStatus,
    priority: row.priority as Priority,
    dueDate: row.due_date as string | undefined,
    taskId: row.task_id as number | undefined,
    order: row.order as number,
    completed: row.completed as boolean,
    completedAt: row.completed_at as string | undefined,
    responsible: row.responsible as string | undefined,
    itemPrazo: row.item_prazo as ProjetoTask["itemPrazo"],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function useProjetos() {
  const [projetos, setProjetos] = useState<Projeto[]>([]);

  const fetch = useCallback(async () => {
    const { data } = await supabase
      .from("projetos")
      .select("*")
      .order("order", { ascending: true });
    if (data) setProjetos(data.map(rowToProjeto));
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  useInvalidation("projetos", fetch);

  return { projetos, refetch: fetch };
}

export function useProjetoTasks(projetoId: number) {
  const [tasks, setTasks] = useState<ProjetoTask[]>([]);

  const fetch = useCallback(async () => {
    const { data } = await supabase
      .from("projeto_tasks")
      .select("*")
      .eq("projeto_id", projetoId)
      .order("order", { ascending: true });
    if (data) setTasks(data.map(rowToProjetoTask));
  }, [projetoId]);

  useEffect(() => { fetch(); }, [fetch]);
  useInvalidation("projeto_tasks", fetch);

  return tasks;
}

export function useProjetoActions(onMutate?: () => void) {
  async function createProjeto(data: Omit<Projeto, "id" | "createdAt" | "updatedAt">) {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("projetos").insert({
      user_id: user?.id,
      title: data.title,
      description: data.description,
      status: data.status,
      color: data.color,
      deadline: data.deadline,
      prazo: data.prazo,
      order: data.order,
    });
    onMutate?.();
    invalidate("projetos");
    invalidate("projeto_tasks");
  }

  async function updateProjeto(id: number, data: Partial<Projeto>) {
    await supabase.from("projetos").update({
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.color !== undefined && { color: data.color }),
      ...(data.deadline !== undefined && { deadline: data.deadline }),
      ...(data.prazo !== undefined && { prazo: data.prazo }),
      ...(data.order !== undefined && { order: data.order }),
      updated_at: new Date().toISOString(),
    }).eq("id", id);
    onMutate?.();
    invalidate("projetos");
    invalidate("projeto_tasks");
  }

  async function deleteProjeto(id: number) {
    await supabase.from("projeto_tasks").delete().eq("projeto_id", id);
    await supabase.from("projetos").delete().eq("id", id);
    onMutate?.();
    invalidate("projetos");
    invalidate("projeto_tasks");
  }

  async function createProjetoTask(data: Omit<ProjetoTask, "id" | "createdAt" | "updatedAt">) {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("projeto_tasks").insert({
      user_id: user?.id,
      projeto_id: data.projetoId,
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      due_date: data.dueDate,
      task_id: data.taskId,
      order: data.order,
      completed: data.completed,
      completed_at: data.completedAt,
      responsible: data.responsible,
      item_prazo: data.itemPrazo,
    });
    onMutate?.();
    invalidate("projetos");
    invalidate("projeto_tasks");
  }

  async function updateProjetoTask(id: number, data: Partial<ProjetoTask>) {
    await supabase.from("projeto_tasks").update({
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.priority !== undefined && { priority: data.priority }),
      ...(data.dueDate !== undefined && { due_date: data.dueDate }),
      ...(data.taskId !== undefined && { task_id: data.taskId }),
      ...(data.order !== undefined && { order: data.order }),
      ...(data.completed !== undefined && { completed: data.completed }),
      ...(data.completedAt !== undefined && { completed_at: data.completedAt }),
      ...(data.responsible !== undefined && { responsible: data.responsible }),
      ...(data.itemPrazo !== undefined && { item_prazo: data.itemPrazo }),
      updated_at: new Date().toISOString(),
    }).eq("id", id);
    onMutate?.();
    invalidate("projetos");
    invalidate("projeto_tasks");
  }

  async function deleteProjetoTask(id: number) {
    await supabase.from("projeto_tasks").delete().eq("id", id);
    onMutate?.();
    invalidate("projetos");
    invalidate("projeto_tasks");
  }

  return {
    createProjeto, updateProjeto, deleteProjeto,
    createProjetoTask, updateProjetoTask, deleteProjetoTask,
  };
}

export function useAllProjetoTasks() {
  const [tasks, setTasks] = useState<ProjetoTask[]>([]);

  const fetch = useCallback(async () => {
    const { data } = await supabase
      .from("projeto_tasks")
      .select("*")
      .order("order", { ascending: true });
    if (data) setTasks(data.map(rowToProjetoTask));
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  useInvalidation("projeto_tasks", fetch);

  return { tasks, refetch: fetch };
}
