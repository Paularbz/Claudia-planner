"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase/client";

const DEFAULT_METAS = [
  { type: "devocional", label: "Devocional",  icon: "BookOpen",  color: "#A78BFA", is_active: true, order: 0 },
  { type: "agua",       label: "Beber água",   icon: "Droplets",  color: "#3B82F6", is_active: true, order: 1, target: 8, target_unit: "copos" },
  { type: "dieta",      label: "Dieta",        icon: "Apple",     color: "#22C55E", is_active: true, order: 2 },
  { type: "exercicio",  label: "Exercício",    icon: "Dumbbell",  color: "#F97316", is_active: true, order: 3 },
  { type: "creatina",   label: "Creatina",     icon: "Zap",       color: "#EC4899", is_active: true, order: 4 },
  { type: "whey",       label: "Whey",         icon: "Zap",       color: "#F97316", is_active: true, order: 5 },
];

export function InitDb() {
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;

    async function seed() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("metas").delete().eq("user_id", user.id).eq("type", "skincare");
      const { data: existing } = await supabase.from("metas").select("type").eq("user_id", user.id);
      const existingTypes = new Set((existing ?? []).map((m: { type: string }) => m.type));
      const toInsert = DEFAULT_METAS.filter((m) => !existingTypes.has(m.type)).map((m) => ({ ...m, user_id: user.id }));
      if (toInsert.length > 0) await supabase.from("metas").insert(toInsert);
    }

    seed().catch(console.error);
  }, []);

  return null;
}
