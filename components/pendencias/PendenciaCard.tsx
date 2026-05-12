"use client";

import { useState } from "react";
import { Clock, Calendar, Sparkles, Trash2, Edit, MoreVertical, AlertCircle, CalendarPlus } from "lucide-react";
import { CATEGORY_CONFIG, PRIORITY_CONFIG, PENDENCIA_STATUS_CONFIG } from "@/lib/constants/categories";
import { formatDate, formatDuration, daysUntil } from "@/lib/utils/date";
import { usePendencias } from "@/lib/hooks/usePendencias";
import { cn } from "@/lib/utils/cn";
import { SmartSchedulePanel } from "./SmartSchedulePanel";
import type { Pendencia } from "@/types";

interface PendenciaCardProps {
  pendencia: Pendencia;
  onEdit?: (id: number) => void;
  onAddToCalendar?: (id: number) => void;
}

export function PendenciaCard({ pendencia, onEdit, onAddToCalendar }: PendenciaCardProps) {
  const { updatePendencia, deletePendencia } = usePendencias();
  const [menuOpen, setMenuOpen] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);

  const catConfig = CATEGORY_CONFIG[pendencia.category];
  const priConfig = PRIORITY_CONFIG[pendencia.priority];
  const isUrgent = pendencia.priority === "Urgente" || pendencia.priority === "Alta";
  const isOverdue = pendencia.deadline && daysUntil(pendencia.deadline) < 0;
  const isDueSoon = pendencia.deadline && daysUntil(pendencia.deadline) <= 2 && !isOverdue;

  async function markDone() {
    await updatePendencia(pendencia.id!, { status: "Concluída" });
    setMenuOpen(false);
  }

  async function handleDelete() {
    if (confirm("Remover esta pendência?")) await deletePendencia(pendencia.id!);
    setMenuOpen(false);
  }

  return (
    <>
      <div
        className={cn(
          "bg-white rounded-2xl border border-gray-100 p-4 transition-all hover:shadow-sm",
          pendencia.status === "Agendada" && "opacity-70",
          (isOverdue) && "border-red-200"
        )}
        style={{ borderLeft: `4px solid ${catConfig.color}` }}
      >
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {(isOverdue || isDueSoon) && (
                <AlertCircle size={13} className={isOverdue ? "text-red-500" : "text-orange-400"} />
              )}
              <p className="text-sm font-semibold text-gray-900 truncate">{pendencia.title}</p>
            </div>

            {pendencia.description && (
              <p className="text-xs text-gray-500 mb-2 line-clamp-2">{pendencia.description}</p>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Clock size={11} /> {formatDuration(pendencia.estimatedMinutes)}
              </span>
              {pendencia.deadline && (
                <span className={cn(
                  "flex items-center gap-1 text-xs font-medium",
                  isOverdue ? "text-red-500" : isDueSoon ? "text-orange-500" : "text-gray-500"
                )}>
                  <Calendar size={11} />
                  {isOverdue ? "Venceu " : "Prazo: "}
                  {formatDate(pendencia.deadline)}
                </span>
              )}
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: `${catConfig.color}18`, color: catConfig.color }}
              >
                {pendencia.category}
              </span>
              <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", priConfig.color)}>
                {pendencia.priority}
              </span>
              <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", PENDENCIA_STATUS_CONFIG[pendencia.status].color)}>
                {pendencia.status}
              </span>
            </div>

            {pendencia.status === "Aberta" && (
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() => setSuggestOpen(true)}
                  className="flex items-center gap-1.5 text-xs font-medium text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Sparkles size={12} /> Sugerir horário
                </button>
                <button
                  onClick={() => onAddToCalendar?.(pendencia.id!)}
                  className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <CalendarPlus size={12} /> Adicionar à agenda
                </button>
              </div>
            )}
          </div>

          <div className="relative shrink-0">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
            >
              <MoreVertical size={16} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-8 bg-white border border-gray-100 rounded-xl shadow-lg z-10 min-w-[150px] overflow-hidden">
                <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50" onClick={() => { onEdit?.(pendencia.id!); setMenuOpen(false); }}>
                  <Edit size={14} /> Editar
                </button>
                <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-green-600 hover:bg-green-50" onClick={markDone}>
                  <Calendar size={14} /> Concluir
                </button>
                <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50" onClick={handleDelete}>
                  <Trash2 size={14} /> Remover
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {suggestOpen && (
        <SmartSchedulePanel
          pendenciaId={pendencia.id!}
          isOpen={suggestOpen}
          onClose={() => setSuggestOpen(false)}
        />
      )}
    </>
  );
}
