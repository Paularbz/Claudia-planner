"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { todayISO } from "@/lib/utils/date";

export interface Alimento {
  id: string;
  nome: string;
  quantidade: number;
  unidade: string;
  calorias: number;
  carboidratos: number;
  proteinas: number;
  gorduras: number;
}

export interface RefeicaoPlano {
  id: string;
  refeicao: string;
  ordem: number;
  alimentos: Alimento[];
}

export interface DietaCheckin {
  id?: string;
  refeicao_id: string;
  data: string;
  completed: boolean;
}

export interface NutritionResult {
  nome: string;
  calorias_100g: number;
  carboidratos_100g: number;
  proteinas_100g: number;
  gorduras_100g: number;
}

function rowToRefeicao(row: Record<string, unknown>): RefeicaoPlano {
  return {
    id: row.id as string,
    refeicao: row.refeicao as string,
    ordem: row.ordem as number,
    alimentos: (row.alimentos as Alimento[]) ?? [],
  };
}

export function useDieta() {
  const [plano, setPlano] = useState<RefeicaoPlano[]>([]);
  const [checkins, setCheckins] = useState<DietaCheckin[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlano = useCallback(async () => {
    const { data } = await supabase
      .from("dieta_plano")
      .select("*")
      .order("ordem");
    setPlano((data ?? []).map(rowToRefeicao));
  }, []);

  const fetchCheckins = useCallback(async () => {
    const today = todayISO();
    const { data } = await supabase
      .from("dieta_checkins")
      .select("*")
      .eq("data", today);
    setCheckins(
      (data ?? []).map((r) => ({
        id: r.id,
        refeicao_id: r.refeicao_id,
        data: r.data,
        completed: r.completed,
      }))
    );
  }, []);

  useEffect(() => {
    Promise.all([fetchPlano(), fetchCheckins()]).finally(() => setLoading(false));
  }, [fetchPlano, fetchCheckins]);

  async function addRefeicao(nome: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const ordem = plano.length;
    await supabase.from("dieta_plano").insert({
      user_id: user.id,
      refeicao: nome,
      ordem,
      alimentos: [],
    });
    await fetchPlano();
  }

  async function deleteRefeicao(id: string) {
    await supabase.from("dieta_plano").delete().eq("id", id);
    await fetchPlano();
  }

  async function updateAlimentos(refeicaoId: string, alimentos: Alimento[]) {
    await supabase.from("dieta_plano").update({ alimentos }).eq("id", refeicaoId);
    await fetchPlano();
  }

  async function toggleCheckin(refeicaoId: string, currentCompleted: boolean) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const today = todayISO();
    await supabase.from("dieta_checkins").upsert(
      { user_id: user.id, data: today, refeicao_id: refeicaoId, completed: !currentCompleted },
      { onConflict: "user_id,data,refeicao_id" }
    );
    await fetchCheckins();
  }

  function isChecked(refeicaoId: string) {
    return checkins.find((c) => c.refeicao_id === refeicaoId)?.completed ?? false;
  }

  function macrosHoje() {
    return plano.reduce(
      (acc, ref) => {
        if (!isChecked(ref.id)) return acc;
        for (const a of ref.alimentos) {
          acc.calorias += a.calorias;
          acc.carboidratos += a.carboidratos;
          acc.proteinas += a.proteinas;
          acc.gorduras += a.gorduras;
        }
        return acc;
      },
      { calorias: 0, carboidratos: 0, proteinas: 0, gorduras: 0 }
    );
  }

  function macrosTotal() {
    return plano.reduce(
      (acc, ref) => {
        for (const a of ref.alimentos) {
          acc.calorias += a.calorias;
          acc.carboidratos += a.carboidratos;
          acc.proteinas += a.proteinas;
          acc.gorduras += a.gorduras;
        }
        return acc;
      },
      { calorias: 0, carboidratos: 0, proteinas: 0, gorduras: 0 }
    );
  }

  return {
    plano,
    checkins,
    loading,
    addRefeicao,
    deleteRefeicao,
    updateAlimentos,
    toggleCheckin,
    isChecked,
    macrosHoje,
    macrosTotal,
  };
}

export async function searchNutrition(query: string): Promise<NutritionResult[]> {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&action=process&json=1&page_size=6&fields=product_name,nutriments,product_name_pt`
    );
    const json = await res.json();
    const products = (json.products ?? []) as Record<string, unknown>[];
    return products
      .filter((p) => {
        const n = p.nutriments as Record<string, number> | undefined;
        return n && typeof n["energy-kcal_100g"] === "number";
      })
      .slice(0, 5)
      .map((p) => {
        const n = p.nutriments as Record<string, number>;
        const nome =
          (p.product_name_pt as string) ||
          (p.product_name as string) ||
          query;
        return {
          nome: nome.trim(),
          calorias_100g: Math.round(n["energy-kcal_100g"] ?? 0),
          carboidratos_100g: Math.round((n["carbohydrates_100g"] ?? 0) * 10) / 10,
          proteinas_100g: Math.round((n["proteins_100g"] ?? 0) * 10) / 10,
          gorduras_100g: Math.round((n["fat_100g"] ?? 0) * 10) / 10,
        };
      });
  } catch {
    return [];
  }
}
