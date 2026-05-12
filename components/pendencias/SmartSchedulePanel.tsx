"use client";

import { Sparkles, Calendar, Clock, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useSmartScheduler } from "@/lib/hooks/useSmartScheduler";
import { useTasks } from "@/lib/hooks/useTasks";
import { usePendencias } from "@/lib/hooks/usePendencias";
import { formatDate, formatTime, formatDuration, minutesToTime } from "@/lib/utils/date";
import type { FreeSlot, Pendencia } from "@/types";

interface SmartSchedulePanelProps {
  pendenciaId: number;
  isOpen: boolean;
  onClose: () => void;
  onScheduled?: () => void;
}

export function SmartSchedulePanel({ pendenciaId, isOpen, onClose, onScheduled }: SmartSchedulePanelProps) {
  const { suggestions, isLoading } = useSmartScheduler(isOpen ? pendenciaId : null);
  const { createTask } = useTasks();
  const { updatePendencia } = usePendencias();

  async function accept(pendencia: Pendencia, slot: FreeSlot) {
    const endMinutes = (slot.startTime.split(":").reduce((acc, v, i) => acc + (i === 0 ? +v * 60 : +v), 0)) + pendencia.estimatedMinutes;
    const endTime = minutesToTime(endMinutes);

    const newTaskId = await createTask({
      title: pendencia.title,
      description: pendencia.description,
      date: slot.date,
      startTime: slot.startTime,
      endTime,
      estimatedMinutes: pendencia.estimatedMinutes,
      category: pendencia.category,
      priority: pendencia.priority,
      status: "A fazer",
      notes: pendencia.notes,
      pendenciaId: pendencia.id,
    });

    await updatePendencia(pendencia.id!, { status: "Agendada", taskId: Number(newTaskId) });
    onScheduled?.();
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Sugestões de Horário" size="md">
      <div className="px-6 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-purple-500" />
          </div>
        ) : suggestions.length === 0 ? (
          <div className="text-center py-10">
            <Sparkles size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">Nenhum horário disponível encontrado.</p>
            <p className="text-xs text-gray-400 mt-1">Tente remover restrições ou aumentar o período de busca.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-gray-500 mb-4">
              {suggestions.length} opções encontradas — ordenadas por relevância
            </p>
            {suggestions.map((s, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-4 rounded-2xl border border-gray-100 bg-white hover:border-purple-200 hover:bg-purple-50/30 transition-all"
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                  i === 0 ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-500"
                }`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <Calendar size={14} className="text-purple-500" />
                    {formatDate(s.suggestedSlot.date)}
                    <Clock size={14} className="text-gray-400" />
                    {formatTime(s.suggestedSlot.startTime)}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{s.reason}</p>
                  <p className="text-xs text-gray-400">
                    Slot disponível: {formatDuration(s.suggestedSlot.durationMinutes)}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={i === 0 ? "primary" : "outline"}
                  onClick={() => accept(s.pendencia, s.suggestedSlot)}
                >
                  Agendar
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
