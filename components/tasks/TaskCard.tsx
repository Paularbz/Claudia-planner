"use client";

import { Clock, CheckCircle2, Circle, MoreVertical, Trash2, Edit, PauseCircle, XCircle } from "lucide-react";
import { CATEGORY_CONFIG, PRIORITY_CONFIG, TASK_STATUS_CONFIG } from "@/lib/constants/categories";
import { formatTime, formatDuration } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import { useTasks } from "@/lib/hooks/useTasks";
import { useState } from "react";
import type { Task, TaskStatus } from "@/types";

interface TaskCardProps {
  task: Task;
  onEdit?: (id: number) => void;
  compact?: boolean;
}

const STATUS_ICONS: Record<TaskStatus, React.ReactNode> = {
  "":             <Circle size={16} className="text-gray-300" />,
  "A fazer":      <Circle size={16} className="text-gray-400" />,
  "Em andamento": <Clock size={16} className="text-blue-500" />,
  "Concluída":    <CheckCircle2 size={16} className="text-green-500" />,
  "Adiada":       <PauseCircle size={16} className="text-yellow-500" />,
  "Cancelada":    <XCircle size={16} className="text-red-400" />,
};

export function TaskCard({ task, onEdit, compact }: TaskCardProps) {
  const { updateTask, deleteTask } = useTasks();
  const [menuOpen, setMenuOpen] = useState(false);

  const catConfig = CATEGORY_CONFIG[task.category];
  const priConfig = PRIORITY_CONFIG[task.priority];
  const isDone = task.status === "Concluída";

  async function toggleDone() {
    await updateTask(task.id!, {
      status: isDone ? "" : "Concluída",
    });
  }

  async function handleDelete() {
    if (confirm("Remover esta tarefa?")) await deleteTask(task.id!);
    setMenuOpen(false);
  }

  if (compact) {
    return (
      <div
        className="flex items-center gap-3 px-3 py-2.5 bg-white rounded-xl border border-gray-100 hover:border-gray-200 transition-colors"
        style={{ borderLeft: `3px solid ${catConfig.color}` }}
      >
        <button onClick={toggleDone} className="shrink-0">{STATUS_ICONS[task.status]}</button>
        <div className="flex-1 min-w-0">
          <p className={cn("text-sm font-medium truncate", isDone && "line-through text-gray-400")}>{task.title}</p>
          {task.startTime && <p className="text-xs text-gray-400">{formatTime(task.startTime)}{task.endTime && ` – ${formatTime(task.endTime)}`}</p>}
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0" style={{ backgroundColor: `${catConfig.color}18`, color: catConfig.color }}>
          {task.category}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "bg-white rounded-2xl border border-gray-100 p-4 transition-all hover:shadow-sm",
        isDone && "opacity-60"
      )}
      style={{ borderLeft: `4px solid ${task.color || catConfig.color}` }}
    >
      <div className="flex items-start gap-3">
        <button onClick={toggleDone} className="mt-0.5 shrink-0 p-2 -m-2">{STATUS_ICONS[task.status]}</button>
        <div className="flex-1 min-w-0">
          <p className={cn("text-sm font-semibold text-gray-900", isDone && "line-through text-gray-400")}>
            {task.title}
          </p>
          {task.description && (
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{task.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {task.tag && (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-semibold border"
                style={task.color
                  ? { backgroundColor: `${task.color}18`, color: task.color, borderColor: `${task.color}40` }
                  : { backgroundColor: `${catConfig.color}18`, color: catConfig.color, borderColor: `${catConfig.color}40` }
                }
              >
                {task.tag}
              </span>
            )}
            {(task.startTime || task.endTime) && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Clock size={11} />
                {task.startTime && formatTime(task.startTime)}
                {task.endTime && ` – ${formatTime(task.endTime)}`}
              </span>
            )}
            {task.estimatedMinutes && (
              <span className="text-xs text-gray-400">{formatDuration(task.estimatedMinutes)}</span>
            )}
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: `${catConfig.color}18`, color: catConfig.color }}
            >
              {task.category}
            </span>
            {task.priority && (
              <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", priConfig.color)}>
                {task.priority}
              </span>
            )}
            {task.status && (
              <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", TASK_STATUS_CONFIG[task.status]?.color)}>
                {task.status}
              </span>
            )}
          </div>
        </div>
        <div className="relative shrink-0">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
          >
            <MoreVertical size={16} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 bg-white border border-gray-100 rounded-xl shadow-lg z-10 min-w-[140px] overflow-hidden">
              <button
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => { onEdit?.(task.id!); setMenuOpen(false); }}
              >
                <Edit size={14} /> Editar
              </button>
              <button
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50"
                onClick={handleDelete}
              >
                <Trash2 size={14} /> Remover
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
