"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { invalidate, useInvalidation } from "@/lib/utils/invalidate";
import { todayISO } from "@/lib/utils/date";
import type {
  AnotacaoEspiritual, PedidoOracao, VersiculoSalvo,
  LeituraBiblica, EstudoEstacao, AnotacaoCategory, EstacaoType,
} from "@/types";

// ── Row mappers ────────────────────────────────────────────────────────────────

function rowToAnotacao(row: Record<string, unknown>): AnotacaoEspiritual {
  return {
    id: row.id as number,
    date: row.date as string,
    content: row.content as string,
    category: row.category as AnotacaoCategory,
    versiculo: row.versiculo as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToPedido(row: Record<string, unknown>): PedidoOracao {
  return {
    id: row.id as number,
    title: row.title as string,
    description: row.description as string | undefined,
    answered: row.answered as boolean,
    answeredAt: row.answered_at as string | undefined,
    answeredNote: row.answered_note as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToVersiculo(row: Record<string, unknown>): VersiculoSalvo {
  return {
    id: row.id as number,
    reference: row.reference as string,
    text: row.text as string,
    theme: row.theme as string | undefined,
    date: row.date as string,
    createdAt: row.created_at as string,
  };
}

function rowToLeitura(row: Record<string, unknown>): LeituraBiblica {
  return {
    id: row.id as number,
    livro: row.livro as string,
    capitulo: row.capitulo as number,
    date: row.date as string,
    notes: row.notes as string | undefined,
    createdAt: row.created_at as string,
  };
}

function rowToEstudoEstacao(row: Record<string, unknown>): EstudoEstacao {
  return {
    id: row.id as number,
    estacao: row.estacao as EstacaoType,
    semana: row.semana as number,
    titulo: row.titulo as string,
    conteudo: row.conteudo as string,
    versiculo: row.versiculo as string | undefined,
    date: row.date as string,
    completed: row.completed as boolean,
    anotacoes: row.anotacoes as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ── Anotações ─────────────────────────────────────────────────────────────────

export function useAnotacoes(date?: string) {
  const [anotacoes, setAnotacoes] = useState<AnotacaoEspiritual[]>([]);

  const fetch = useCallback(async () => {
    let query = supabase.from("anotacoes_espirituais").select("*");
    if (date) {
      query = query.eq("date", date);
    } else {
      query = query.order("date", { ascending: false });
    }
    const { data } = await query;
    if (data) setAnotacoes(data.map(rowToAnotacao));
  }, [date]);

  useEffect(() => { fetch(); }, [fetch]);
  useInvalidation("anotacoes_espirituais", fetch);

  return anotacoes;
}

export function useAnotacaoActions() {
  async function createAnotacao(data: Omit<AnotacaoEspiritual, "id" | "createdAt" | "updatedAt">) {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("anotacoes_espirituais").insert({
      user_id: user?.id,
      date: data.date,
      content: data.content,
      category: data.category,
      versiculo: data.versiculo,
    });
    invalidate("anotacoes_espirituais");
  }

  async function updateAnotacao(id: number, data: Partial<AnotacaoEspiritual>) {
    await supabase.from("anotacoes_espirituais").update({
      ...(data.date !== undefined && { date: data.date }),
      ...(data.content !== undefined && { content: data.content }),
      ...(data.category !== undefined && { category: data.category }),
      ...(data.versiculo !== undefined && { versiculo: data.versiculo }),
      updated_at: new Date().toISOString(),
    }).eq("id", id);
    invalidate("anotacoes_espirituais");
  }

  async function deleteAnotacao(id: number) {
    await supabase.from("anotacoes_espirituais").delete().eq("id", id);
    invalidate("anotacoes_espirituais");
  }

  return { createAnotacao, updateAnotacao, deleteAnotacao };
}

// ── Pedidos de Oração ─────────────────────────────────────────────────────────

export function usePedidosOracao() {
  const [pedidos, setPedidos] = useState<PedidoOracao[]>([]);

  const fetch = useCallback(async () => {
    const { data } = await supabase
      .from("pedidos_oracao")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setPedidos(data.map(rowToPedido));
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  useInvalidation("pedidos_oracao", fetch);

  return pedidos;
}

export function usePedidoOracaoActions() {
  async function createPedido(data: Omit<PedidoOracao, "id" | "createdAt" | "updatedAt">) {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("pedidos_oracao").insert({
      user_id: user?.id,
      title: data.title,
      description: data.description,
      answered: data.answered,
      answered_at: data.answeredAt,
      answered_note: data.answeredNote,
    });
    invalidate("pedidos_oracao");
  }

  async function updatePedido(id: number, data: Partial<PedidoOracao>) {
    await supabase.from("pedidos_oracao").update({
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.answered !== undefined && { answered: data.answered }),
      ...(data.answeredAt !== undefined && { answered_at: data.answeredAt }),
      ...(data.answeredNote !== undefined && { answered_note: data.answeredNote }),
      updated_at: new Date().toISOString(),
    }).eq("id", id);
    invalidate("pedidos_oracao");
  }

  async function deletePedido(id: number) {
    await supabase.from("pedidos_oracao").delete().eq("id", id);
    invalidate("pedidos_oracao");
  }

  async function markAnswered(id: number, note?: string) {
    const now = new Date().toISOString();
    await supabase.from("pedidos_oracao").update({
      answered: true,
      answered_at: now,
      answered_note: note,
      updated_at: now,
    }).eq("id", id);
    invalidate("pedidos_oracao");
  }

  return { createPedido, updatePedido, deletePedido, markAnswered };
}

// ── Versículos Salvos ─────────────────────────────────────────────────────────

export function useVersiculosSalvos() {
  const [versiculos, setVersiculos] = useState<VersiculoSalvo[]>([]);

  const fetch = useCallback(async () => {
    const { data } = await supabase
      .from("versiculos_salvos")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setVersiculos(data.map(rowToVersiculo));
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  useInvalidation("versiculos_salvos", fetch);

  return versiculos;
}

export function useVersiculoActions() {
  async function saveVersiculo(data: Omit<VersiculoSalvo, "id" | "createdAt">) {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("versiculos_salvos").insert({
      user_id: user?.id,
      reference: data.reference,
      text: data.text,
      theme: data.theme,
      date: data.date,
    });
    invalidate("versiculos_salvos");
  }

  async function deleteVersiculo(id: number) {
    await supabase.from("versiculos_salvos").delete().eq("id", id);
    invalidate("versiculos_salvos");
  }

  return { saveVersiculo, deleteVersiculo };
}

// ── Leituras Bíblicas ─────────────────────────────────────────────────────────

export function useLeiturasBiblicas() {
  const [leituras, setLeituras] = useState<LeituraBiblica[]>([]);

  const fetch = useCallback(async () => {
    const { data } = await supabase
      .from("leituras_biblicas")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setLeituras(data.map(rowToLeitura));
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  useInvalidation("leituras_biblicas", fetch);

  return leituras;
}

export function useLeituraActions() {
  async function registrarLeitura(data: Omit<LeituraBiblica, "id" | "createdAt">) {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("leituras_biblicas").insert({
      user_id: user?.id,
      livro: data.livro,
      capitulo: data.capitulo,
      date: data.date,
      notes: data.notes,
    });
    invalidate("leituras_biblicas");
  }

  async function deleteLeitura(id: number) {
    await supabase.from("leituras_biblicas").delete().eq("id", id);
    invalidate("leituras_biblicas");
  }

  return { registrarLeitura, deleteLeitura };
}

// ── Estudos de Estação ────────────────────────────────────────────────────────

export function useEstudosEstacao(estacao?: EstacaoType) {
  const [estudos, setEstudos] = useState<EstudoEstacao[]>([]);

  const fetch = useCallback(async () => {
    let query = supabase.from("estudos_estacao").select("*");
    if (estacao) {
      query = query.eq("estacao", estacao).order("semana", { ascending: true });
    } else {
      query = query.order("date", { ascending: false });
    }
    const { data } = await query;
    if (data) setEstudos(data.map(rowToEstudoEstacao));
  }, [estacao]);

  useEffect(() => { fetch(); }, [fetch]);
  useInvalidation("estudos_estacao", fetch);

  return estudos;
}

export function useEstacaoActions() {
  async function createEstudoEstacao(data: Omit<EstudoEstacao, "id" | "createdAt" | "updatedAt">) {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("estudos_estacao").insert({
      user_id: user?.id,
      estacao: data.estacao,
      semana: data.semana,
      titulo: data.titulo,
      conteudo: data.conteudo,
      versiculo: data.versiculo,
      date: data.date,
      completed: data.completed,
      anotacoes: data.anotacoes,
    });
    invalidate("estudos_estacao");
  }

  async function updateEstudoEstacao(id: number, data: Partial<EstudoEstacao>) {
    await supabase.from("estudos_estacao").update({
      ...(data.estacao !== undefined && { estacao: data.estacao }),
      ...(data.semana !== undefined && { semana: data.semana }),
      ...(data.titulo !== undefined && { titulo: data.titulo }),
      ...(data.conteudo !== undefined && { conteudo: data.conteudo }),
      ...(data.versiculo !== undefined && { versiculo: data.versiculo }),
      ...(data.date !== undefined && { date: data.date }),
      ...(data.completed !== undefined && { completed: data.completed }),
      ...(data.anotacoes !== undefined && { anotacoes: data.anotacoes }),
      updated_at: new Date().toISOString(),
    }).eq("id", id);
    invalidate("estudos_estacao");
  }

  async function deleteEstudoEstacao(id: number) {
    await supabase.from("estudos_estacao").delete().eq("id", id);
    invalidate("estudos_estacao");
  }

  return { createEstudoEstacao, updateEstudoEstacao, deleteEstudoEstacao };
}

// ── Leitura Streak ────────────────────────────────────────────────────────────

export function useLeituraStreak() {
  const [streak, setStreak] = useState<number>(0);

  const fetch = useCallback(async () => {
    const { data } = await supabase
      .from("leituras_biblicas")
      .select("date")
      .order("date", { ascending: false });

    if (!data || data.length === 0) { setStreak(0); return; }

    const dates = [...new Set(data.map((l) => l.date as string))].sort().reverse();
    const today = todayISO();
    let count = 0;
    let cursor = new Date(today);

    for (const d of dates) {
      const expected = cursor.toISOString().slice(0, 10);
      if (d === expected) {
        count++;
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    }
    setStreak(count);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  useInvalidation("leituras_biblicas", fetch);

  return streak;
}
