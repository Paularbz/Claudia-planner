"use client";

import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard":      "Hoje",
  "/calendar":       "Calendário",
  "/tasks":          "Tarefas",
  "/pendencias":     "Pendências",
  "/metas":          "Metas do Dia",
  "/insights":       "Insights",
  "/estudos":        "Estudos",
  "/espiritualidade":"Espiritualidade",
  "/profissional":   "Área Profissional",
  "/financeiro":     "Financeiro",
  "/settings":       "Configurações",
};

interface TopBarProps {
  action?: React.ReactNode;
}

export function TopBar({ action }: TopBarProps) {
  const pathname = usePathname();
  const title = Object.entries(PAGE_TITLES).find(([k]) => pathname.startsWith(k))?.[1] ?? "Planner";

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 h-14 flex items-center px-4">
      <div className="flex items-center gap-2 flex-1">
        <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-fuchsia-400 to-pink-500 flex items-center justify-center">
          <Sparkles size={14} className="text-white" />
        </div>
        <h1 className="text-base font-bold text-gray-900">{title}</h1>
      </div>
      {action && <div>{action}</div>}
    </header>
  );
}
