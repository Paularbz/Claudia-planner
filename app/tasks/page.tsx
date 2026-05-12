"use client";

import { useState } from "react";
import { Plus, Search, CheckSquare, GripVertical } from "lucide-react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTasks } from "@/lib/hooks/useTasks";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskFormModal } from "@/components/tasks/TaskFormModal";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { CATEGORIES, CATEGORY_CONFIG } from "@/lib/constants/categories";
import { cn } from "@/lib/utils/cn";
import { todayISO, tomorrowISO } from "@/lib/utils/date";
import type { Category, TaskStatus, Task } from "@/types";

function startOfCurrentWeekISO(): string {
  const today = new Date();
  const day = today.getDay(); // 0=Dom, 1=Seg, ..., 6=Sáb
  const diff = day === 0 ? -6 : 1 - day; // distância para segunda-feira
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff);
  return monday.toISOString().split("T")[0];
}

const STATUS_FILTERS: { value: TaskStatus | "all"; label: string }[] = [
  { value: "all",          label: "Todas" },
  { value: "A fazer",      label: "A fazer" },
  { value: "Em andamento", label: "Andamento" },
  { value: "Concluída",    label: "Concluídas" },
  { value: "Adiada",       label: "Adiadas" },
];

const PRIORITY_ORDER: Record<string, number> = { "Urgente": 3, "Alta": 2, "Média": 1, "Baixa": 0, "": -1 };

function groupByDate(tasks: Task[]): { label: string; date: string; active: Task[]; done: Task[] }[] {
  const today = todayISO();
  const tomorrowISOStr = tomorrowISO();

  const map = new Map<string, Task[]>();
  for (const t of tasks) {
    const d = t.date ?? "sem-data";
    if (!map.has(d)) map.set(d, []);
    map.get(d)!.push(t);
  }

  function sortActive(list: Task[]) {
    return [...list].sort((a, b) => {
      const aOrder = a.sortOrder ?? Infinity;
      const bOrder = b.sortOrder ?? Infinity;
      if (aOrder !== bOrder) return aOrder - bOrder;
      const aHasTime = !!a.startTime;
      const bHasTime = !!b.startTime;
      if (aHasTime && bHasTime) return a.startTime!.localeCompare(b.startTime!);
      if (aHasTime !== bHasTime) return aHasTime ? -1 : 1;
      const pa = PRIORITY_ORDER[a.priority] ?? 0;
      const pb = PRIORITY_ORDER[b.priority] ?? 0;
      return pb - pa;
    });
  }

  function sortDone(list: Task[]) {
    return [...list].sort((a, b) => {
      const aHasTime = !!a.startTime;
      const bHasTime = !!b.startTime;
      if (aHasTime && bHasTime) return a.startTime!.localeCompare(b.startTime!);
      if (aHasTime !== bHasTime) return aHasTime ? -1 : 1;
      return 0;
    });
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => {
      if (a === "sem-data") return 1;
      if (b === "sem-data") return -1;
      return a.localeCompare(b);
    })
    .map(([date, tasks]) => {
      let label = date;
      if (date === today) label = "Hoje";
      else if (date === tomorrowISOStr) label = "Amanhã";
      else if (date === "sem-data") label = "Sem data";
      else {
        const d = new Date(date + "T00:00:00");
        label = d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "short" });
        label = label.charAt(0).toUpperCase() + label.slice(1);
      }
      const active = sortActive(tasks.filter((t) => t.status !== "Concluída"));
      const done = sortDone(tasks.filter((t) => t.status === "Concluída"));
      return { label, date, active, done };
    });
}

function SortableTaskCard({ task, onEdit }: { task: Task; onEdit?: (id: number) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id!,
  });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      className="flex items-center gap-1"
    >
      <button
        {...attributes}
        {...listeners}
        className="shrink-0 p-1 cursor-grab active:cursor-grabbing text-gray-200 hover:text-gray-400 touch-none select-none"
        tabIndex={-1}
        aria-label="Arrastar tarefa"
      >
        <GripVertical size={14} />
      </button>
      <div className="flex-1 min-w-0">
        <TaskCard task={task} onEdit={onEdit} />
      </div>
    </div>
  );
}

export default function TasksPage() {
  const [filterStatus, setFilterStatus] = useState<TaskStatus | "all">("all");
  const [filterCategory, setFilterCategory] = useState<Category | "all">("all");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTaskId, setEditTaskId] = useState<number | null>(null);

  const { tasks, reorderTasks } = useTasks({
    status: filterStatus !== "all" ? filterStatus : undefined,
    category: filterCategory !== "all" ? filterCategory : undefined,
  });

  const weekStart = startOfCurrentWeekISO();

  const filtered = tasks.filter((t) => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    // Esconde tarefas de semanas anteriores (mantém sem data e semana atual em diante)
    if (t.date && t.date < weekStart) return false;
    return true;
  });

  const grouped = groupByDate(filtered);
  const totalFiltered = filtered.length;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  async function handleDragEnd(event: DragEndEvent, activeTasks: Task[]) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = activeTasks.findIndex((t) => t.id === active.id);
    const newIndex = activeTasks.findIndex((t) => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(activeTasks, oldIndex, newIndex);
    await reorderTasks(reordered.map((t) => t.id!));
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 py-2">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 md:block hidden">Tarefas</h1>
        <Button onClick={() => { setEditTaskId(null); setModalOpen(true); }} size="sm" className="ml-auto">
          <Plus size={16} /> Nova tarefa
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar tarefas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {/* Filters */}
      <div className="space-y-2">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilterStatus(f.value)}
              className={cn(
                "text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap transition-all flex-shrink-0",
                filterStatus === f.value
                  ? "bg-purple-600 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-purple-300"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setFilterCategory("all")}
            className={cn(
              "text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap border transition-all flex-shrink-0",
              filterCategory === "all" ? "bg-gray-800 text-white border-gray-800" : "bg-white border-gray-200 text-gray-600"
            )}
          >
            Todas categorias
          </button>
          {CATEGORIES.map((cat) => {
            const config = CATEGORY_CONFIG[cat];
            const active = filterCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setFilterCategory(active ? "all" : cat)}
                className="text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap border transition-all flex-shrink-0"
                style={active
                  ? { backgroundColor: config.color, color: "#fff", borderColor: config.color }
                  : { backgroundColor: "#fff", color: config.color, borderColor: `${config.color}40` }
                }
              >
                {config.label}
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-gray-400">{totalFiltered} tarefa{totalFiltered !== 1 ? "s" : ""}</p>

      {totalFiltered === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="Nenhuma tarefa encontrada"
          description="Tente ajustar os filtros ou crie uma nova tarefa."
          action={<Button size="sm" onClick={() => { setEditTaskId(null); setModalOpen(true); }}>+ Nova tarefa</Button>}
        />
      ) : (
        <div className="space-y-5">
          {grouped.map(({ label, date, active: activeTasks, done: doneTasks }) => (
            <div key={date}>
              <div className="flex items-center gap-2 mb-2">
                <span className={cn(
                  "text-xs font-bold px-2 py-0.5 rounded-full",
                  date === todayISO() ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-500"
                )}>
                  {label}
                </span>
                <span className="text-xs text-gray-300">
                  {activeTasks.length + doneTasks.length} tarefa{activeTasks.length + doneTasks.length !== 1 ? "s" : ""}
                </span>
              </div>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(e) => handleDragEnd(e, activeTasks)}
              >
                <SortableContext
                  items={activeTasks.map((t) => t.id!)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {activeTasks.map((task) => (
                      <SortableTaskCard
                        key={task.id}
                        task={task}
                        onEdit={(id) => { setEditTaskId(id); setModalOpen(true); }}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              {doneTasks.length > 0 && (
                <div className="space-y-2 mt-2 pl-5">
                  {doneTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onEdit={(id) => { setEditTaskId(id); setModalOpen(true); }}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <TaskFormModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditTaskId(null); }}
        taskId={editTaskId}
      />
    </div>
  );
}
