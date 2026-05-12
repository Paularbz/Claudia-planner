"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { invalidate, useInvalidation } from "@/lib/utils/invalidate";
import type { Transacao, TipoTransacao, EntidadeFinanceira } from "@/types";

interface TransacaoFilters {
  tipo?: TipoTransacao;
  entidade?: EntidadeFinanceira;
  mes?: string; // "YYYY-MM"
}

function rowToTransacao(row: Record<string, unknown>): Transacao {
  return {
    id: row.id as number,
    tipo: row.tipo as TipoTransacao,
    entidade: row.entidade as EntidadeFinanceira,
    categoria: row.categoria as string,
    descricao: row.descricao as string,
    valor: Number(row.valor),
    data: row.data as string,
    observacoes: row.observacoes as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function useFinanceiro(filters?: TransacaoFilters) {
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("financeiro_transacoes")
      .select("*")
      .order("data", { ascending: false })
      .order("created_at", { ascending: false });

    if (filters?.tipo) query = query.eq("tipo", filters.tipo);
    if (filters?.entidade) query = query.eq("entidade", filters.entidade);
    if (filters?.mes) {
      const [year, month] = filters.mes.split("-");
      const start = `${year}-${month}-01`;
      const lastDay = new Date(Number(year), Number(month), 0).getDate();
      const end = `${year}-${month}-${String(lastDay).padStart(2, "0")}`;
      query = query.gte("data", start).lte("data", end);
    }

    const { data } = await query;
    if (data) setTransacoes(data.map(rowToTransacao));
    setLoading(false);
  }, [filters?.tipo, filters?.entidade, filters?.mes]);

  useEffect(() => { fetch(); }, [fetch]);
  useInvalidation("financeiro", fetch);

  async function createTransacao(data: Omit<Transacao, "id" | "createdAt" | "updatedAt">) {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("financeiro_transacoes").insert({
      user_id: user?.id ?? null,
      tipo: data.tipo,
      entidade: data.entidade,
      categoria: data.categoria,
      descricao: data.descricao,
      valor: data.valor,
      data: data.data,
      observacoes: data.observacoes,
    });
    await fetch();
    invalidate("financeiro");
  }

  async function updateTransacao(id: number, data: Partial<Transacao>) {
    await supabase.from("financeiro_transacoes").update({
      ...(data.tipo !== undefined && { tipo: data.tipo }),
      ...(data.entidade !== undefined && { entidade: data.entidade }),
      ...(data.categoria !== undefined && { categoria: data.categoria }),
      ...(data.descricao !== undefined && { descricao: data.descricao }),
      ...(data.valor !== undefined && { valor: data.valor }),
      ...(data.data !== undefined && { data: data.data }),
      ...(data.observacoes !== undefined && { observacoes: data.observacoes }),
      updated_at: new Date().toISOString(),
    }).eq("id", id);
    await fetch();
    invalidate("financeiro");
  }

  async function deleteTransacao(id: number) {
    await supabase.from("financeiro_transacoes").delete().eq("id", id);
    await fetch();
    invalidate("financeiro");
  }

  return { transacoes, loading, createTransacao, updateTransacao, deleteTransacao };
}

export function calcularResumo(transacoes: Transacao[]) {
  const receitaTotal = transacoes.filter((t) => t.tipo === "receita").reduce((s, t) => s + t.valor, 0);
  const despesaTotal = transacoes.filter((t) => t.tipo === "despesa").reduce((s, t) => s + t.valor, 0);
  const lucroLiquido = receitaTotal - despesaTotal;

  const receitaPF = transacoes.filter((t) => t.tipo === "receita" && t.entidade === "pessoal").reduce((s, t) => s + t.valor, 0);
  const despesaPF = transacoes.filter((t) => t.tipo === "despesa" && t.entidade === "pessoal").reduce((s, t) => s + t.valor, 0);
  const receitaPJ = transacoes.filter((t) => t.tipo === "receita" && t.entidade === "profissional").reduce((s, t) => s + t.valor, 0);
  const despesaPJ = transacoes.filter((t) => t.tipo === "despesa" && t.entidade === "profissional").reduce((s, t) => s + t.valor, 0);

  return {
    receitaTotal, despesaTotal, lucroLiquido,
    pf: { receita: receitaPF, despesa: despesaPF, lucro: receitaPF - despesaPF },
    pj: { receita: receitaPJ, despesa: despesaPJ, lucro: receitaPJ - despesaPJ },
  };
}

export function calcularPorCategoria(transacoes: Transacao[], tipo: TipoTransacao) {
  const map: Record<string, number> = {};
  transacoes.filter((t) => t.tipo === tipo).forEach((t) => {
    map[t.categoria] = (map[t.categoria] ?? 0) + t.valor;
  });
  return Object.entries(map)
    .map(([categoria, valor]) => ({ categoria, valor }))
    .sort((a, b) => b.valor - a.valor);
}
