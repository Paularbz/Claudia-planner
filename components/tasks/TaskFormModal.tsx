"use client";

import { useState, useEffect, useMemo } from "react";
import { RepeatIcon } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useTasks, useTaskById } from "@/lib/hooks/useTasks";
import { usePendencias, usePendenciaById } from "@/lib/hooks/usePendencias";
import { CATEGORIES, CATEGORY_CONFIG } from "@/lib/constants/categories";
import { todayISO } from "@/lib/utils/date";
import type { Category, Priority, TaskStatus } from "@/types";

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId?: number | null;
  pendenciaId?: number | null;
  initialDate?: string;
  initialStartTime?: string;
  initialTitle?: string;
  initialPriority?: Priority;
  onTaskCreated?: (taskId: number) => void;
}

type Recurrence = "" | "daily" | "weekdays" | "weekly" | "monthly";

const PRIORITY_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Sem prioridade" },
  { value: "Baixa", label: "Baixa" },
  { value: "Média", label: "Média" },
  { value: "Alta", label: "Alta" },
  { value: "Urgente", label: "Urgente" },
];

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Sem status" },
  { value: "A fazer", label: "A fazer" },
  { value: "Em andamento", label: "Em andamento" },
  { value: "Concluída", label: "Concluída" },
  { value: "Adiada", label: "Adiada" },
  { value: "Cancelada", label: "Cancelada" },
];

const RECURRENCE_OPTIONS: { value: Recurrence; label: string }[] = [
  { value: "",          label: "Não repetir" },
  { value: "daily",    label: "Todo dia" },
  { value: "weekdays", label: "Dias úteis (seg–sex)" },
  { value: "weekly",   label: "Toda semana" },
  { value: "monthly",  label: "Todo mês" },
];

const CATEGORY_OPTIONS = CATEGORIES.map((c) => ({ value: c, label: CATEGORY_CONFIG[c].label }));

const DURATION_OPTIONS = [
  { value: "15", label: "15 min" },
  { value: "30", label: "30 min" },
  { value: "45", label: "45 min" },
  { value: "60", label: "1 hora" },
  { value: "90", label: "1h 30min" },
  { value: "120", label: "2 horas" },
  { value: "180", label: "3 horas" },
  { value: "240", label: "4 horas" },
];

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function addMonths(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setMonth(d.getMonth() + n);
  return d.toISOString().slice(0, 10);
}

function defaultEndDate(startDate: string, recurrence: Recurrence): string {
  if (recurrence === "daily" || recurrence === "weekdays") return addDays(startDate, 30);
  if (recurrence === "weekly") return addDays(startDate, 90);
  if (recurrence === "monthly") return addMonths(startDate, 6);
  return startDate;
}

function buildOccurrences(startDate: string, recurrence: Recurrence, endDate: string): string[] {
  if (!recurrence || !endDate || endDate < startDate) return [startDate];
  const dates: string[] = [];
  let cur = startDate;
  const MAX = 366;

  while (cur <= endDate && dates.length < MAX) {
    if (recurrence === "weekdays") {
      const dow = new Date(cur + "T00:00:00").getDay();
      if (dow >= 1 && dow <= 5) dates.push(cur);
    } else {
      dates.push(cur);
    }

    if (recurrence === "daily" || recurrence === "weekdays") cur = addDays(cur, 1);
    else if (recurrence === "weekly") cur = addDays(cur, 7);
    else if (recurrence === "monthly") cur = addMonths(cur, 1);
    else break;
  }

  return dates;
}

export function TaskFormModal({ isOpen, onClose, taskId, pendenciaId, initialDate, initialStartTime, initialTitle, initialPriority, onTaskCreated }: TaskFormModalProps) {
  const { createTask, updateTask } = useTasks();
  const { updatePendencia } = usePendencias();

  const existingTask = useTaskById(taskId ?? null);
  const sourcePendencia = usePendenciaById(pendenciaId ?? null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(initialDate ?? todayISO());
  const [startTime, setStartTime] = useState(initialStartTime ?? "");
  const [endTime, setEndTime] = useState("");
  const [estimatedMinutes, setEstimatedMinutes] = useState("");
  const [category, setCategory] = useState<Category>("Profissional");
  const [priority, setPriority] = useState<Priority>("");
  const [status, setStatus] = useState<TaskStatus>("");
  const [notes, setNotes] = useState("");
  const [tag, setTag] = useState("");
  const [color, setColor] = useState("");
  const [recurrence, setRecurrence] = useState<Recurrence>("");
  const [recurrenceEnd, setRecurrenceEnd] = useState("");
  const [showInCalendar, setShowInCalendar] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existingTask) {
      setTitle(existingTask.title);
      setDescription(existingTask.description ?? "");
      setDate(existingTask.date);
      setStartTime(existingTask.startTime ?? "");
      setEndTime(existingTask.endTime ?? "");
      setEstimatedMinutes(existingTask.estimatedMinutes?.toString() ?? "");
      setCategory(existingTask.category);
      setPriority(existingTask.priority);
      setStatus(existingTask.status);
      setNotes(existingTask.notes ?? "");
      setTag(existingTask.tag ?? "");
      setColor(existingTask.color ?? "");
      setShowInCalendar(existingTask.showInCalendar ?? true);
      setRecurrence("");
      setRecurrenceEnd("");
    } else if (sourcePendencia && !taskId) {
      setTitle(sourcePendencia.title);
      setDescription(sourcePendencia.description ?? "");
      setCategory(sourcePendencia.category);
      setPriority(sourcePendencia.priority);
      setEstimatedMinutes(sourcePendencia.estimatedMinutes?.toString() ?? "");
      setNotes(sourcePendencia.notes ?? "");
      setTag(""); setColor("");
      setShowInCalendar(true);
      setRecurrence(""); setRecurrenceEnd("");
    } else if (!taskId && !pendenciaId) {
      setTitle(initialTitle ?? "");
      setDescription("");
      setDate(initialDate ?? todayISO());
      setStartTime(initialStartTime ?? "");
      setEndTime("");
      setEstimatedMinutes("");
      setCategory("Profissional");
      setPriority(initialPriority ?? "Média");
      setStatus("");
      setNotes("");
      setTag(""); setColor("");
      setShowInCalendar(false);
      setRecurrence(""); setRecurrenceEnd("");
    }
  }, [existingTask, sourcePendencia, taskId, pendenciaId, initialDate, initialStartTime, initialTitle, initialPriority]);

  // Auto-enable calendar when a time is set
  useEffect(() => {
    if (startTime && !taskId) setShowInCalendar(true);
  }, [startTime]);

  // Auto-fill end date when recurrence is selected
  useEffect(() => {
    if (recurrence && !recurrenceEnd) {
      setRecurrenceEnd(defaultEndDate(date || todayISO(), recurrence));
    }
    if (!recurrence) setRecurrenceEnd("");
  }, [recurrence]);

  const occurrences = useMemo(
    () => buildOccurrences(date, recurrence, recurrenceEnd),
    [date, recurrence, recurrenceEnd]
  );

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const base = {
        title: title.trim(),
        description: description.trim() || undefined,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        estimatedMinutes: estimatedMinutes ? parseInt(estimatedMinutes) : undefined,
        category,
        priority,
        status,
        notes: notes.trim() || undefined,
        tag: tag.trim() || undefined,
        color: color || undefined,
        pendenciaId: pendenciaId ?? undefined,
        showInCalendar,
      };

      if (taskId) {
        await updateTask(taskId, { ...base, date });
      } else if (recurrence && occurrences.length > 1) {
        // Create one task per occurrence in sequence
        let firstId: number | undefined;
        for (const d of occurrences) {
          const id = await createTask({ ...base, date: d, pendenciaId: undefined });
          if (!firstId) firstId = id;
        }
        if (pendenciaId) {
          await updatePendencia(pendenciaId, { status: "Agendada", taskId: Number(firstId) });
        }
        if (firstId) onTaskCreated?.(firstId);
      } else {
        const newTaskId = await createTask({ ...base, date });
        if (pendenciaId) {
          await updatePendencia(pendenciaId, { status: "Agendada", taskId: Number(newTaskId) });
        }
        if (newTaskId) onTaskCreated?.(newTaskId);
      }
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const isRecurring = !taskId && recurrence !== "";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={taskId ? "Editar Tarefa" : "Nova Tarefa"} size="md">
      <div className="px-6 py-4 space-y-4">
        <Input
          label="Título *"
          placeholder="O que precisa ser feito?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <Textarea
          label="Descrição"
          placeholder="Detalhes, links, referências..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Data inicial"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <Select
            label="Duração"
            value={estimatedMinutes}
            onChange={(e) => setEstimatedMinutes(e.target.value)}
            options={DURATION_OPTIONS}
            placeholder="Estimativa"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Início"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
          <Input
            label="Fim"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>

        {/* Calendário toggle */}
        <button
          type="button"
          onClick={() => setShowInCalendar(!showInCalendar)}
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl border transition-all text-left ${
            showInCalendar
              ? "border-purple-200 bg-purple-50"
              : "border-gray-200 bg-gray-50"
          }`}
        >
          <div className={`w-9 h-5 rounded-full transition-colors relative flex-shrink-0 ${showInCalendar ? "bg-purple-500" : "bg-gray-300"}`}>
            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${showInCalendar ? "left-4" : "left-0.5"}`} />
          </div>
          <div>
            <p className={`text-xs font-semibold ${showInCalendar ? "text-purple-700" : "text-gray-500"}`}>
              {showInCalendar ? "Aparece no calendário" : "Não aparece no calendário"}
            </p>
            <p className="text-[10px] text-gray-400">
              {showInCalendar ? "Visível na aba Calendário" : "Só aparece em Tarefas"}
            </p>
          </div>
        </button>

        {/* Recorrência — só para novas tarefas */}
        {!taskId && (
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3 space-y-3">
            <div className="flex items-center gap-2">
              <RepeatIcon size={14} className="text-purple-500" />
              <span className="text-xs font-semibold text-gray-700">Recorrência</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Repetir</label>
                <select
                  value={recurrence}
                  onChange={(e) => setRecurrence(e.target.value as Recurrence)}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-purple-300 bg-white"
                >
                  {RECURRENCE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {recurrence && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Até quando</label>
                  <input
                    type="date"
                    value={recurrenceEnd}
                    min={date}
                    onChange={(e) => setRecurrenceEnd(e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-purple-300 bg-white"
                  />
                </div>
              )}
            </div>

            {isRecurring && occurrences.length > 0 && (
              <p className="text-xs text-purple-700 bg-purple-50 border border-purple-100 rounded-xl px-3 py-2 font-medium">
                {occurrences.length} tarefa{occurrences.length > 1 ? "s" : ""} serão criadas
                {occurrences.length > 1 && ` · de ${new Date(occurrences[0] + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} até ${new Date(occurrences[occurrences.length - 1] + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}`}
              </p>
            )}
          </div>
        )}

        <Select
          label="Categoria"
          value={category}
          onChange={(e) => setCategory(e.target.value as Category)}
          options={CATEGORY_OPTIONS}
        />

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Prioridade"
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            options={PRIORITY_OPTIONS}
          />
          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus)}
            options={STATUS_OPTIONS}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Âmbito / Tag</label>
          <input
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            placeholder="Ex: Furtacor, Amanda Diniz Mkt, Pessoal..."
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-purple-300"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Cor da tarefa</label>
          <div className="flex gap-2 flex-wrap">
            {["", "#8B5CF6","#3B82F6","#22C55E","#F97316","#EC4899","#EF4444","#F59E0B","#06B6D4","#64748B"].map((c) => (
              <button
                key={c || "default"}
                type="button"
                onClick={() => setColor(c)}
                title={c || "Padrão (categoria)"}
                className={`w-7 h-7 rounded-full border-2 transition-all ${color === c ? "border-gray-800 scale-110" : "border-transparent hover:scale-105"}`}
                style={{ backgroundColor: c || "#e5e7eb" }}
              />
            ))}
          </div>
        </div>

        <Textarea
          label="Observações"
          placeholder="Notas adicionais..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
        />
      </div>

      <div className="px-6 pb-6 pt-2 flex gap-3 border-t border-gray-100 mt-2">
        <Button variant="outline" fullWidth onClick={onClose}>Cancelar</Button>
        <Button fullWidth onClick={handleSave} loading={saving} disabled={!title.trim()}>
          {taskId ? "Salvar" : isRecurring ? `Criar ${occurrences.length} tarefa${occurrences.length > 1 ? "s" : ""}` : "Criar Tarefa"}
        </Button>
      </div>
    </Modal>
  );
}
