"use client";

import { useState, useMemo } from "react";
import {
  Briefcase, Plus, Trash2, Edit2, ChevronDown, ChevronRight,
  Circle, CheckCircle2, Calendar, X, ArrowRight, CalendarCheck,
  User, Clock, Users,
} from "lucide-react";
import { useProjetos, useAllProjetoTasks, useProjetoActions } from "@/lib/hooks/useProjetos";
import { TaskFormModal } from "@/components/tasks/TaskFormModal";
import type { Projeto, ProjetoTask, Priority } from "@/types";
import { cn } from "@/lib/utils/cn";

// ─── Constants ─────────────────────────────────────────────────────────────────

const ITEM_PRAZO_CONFIG = {
  curto: { label: "Curto prazo",  color: "text-orange-600 bg-orange-50 border-orange-200" },
  medio: { label: "Médio prazo",  color: "text-blue-600 bg-blue-50 border-blue-200" },
  longo: { label: "Longo prazo",  color: "text-purple-600 bg-purple-50 border-purple-200" },
} as const;

const STATUS_DOT: Record<string, string> = {
  "A fazer":      "bg-gray-300",
  "Em andamento": "bg-blue-500",
  "Concluído":    "bg-green-500",
};

const PRIORITIES: Priority[] = ["Baixa", "Média", "Alta", "Urgente"];
const PRIORITY_COLORS: Record<Priority, string> = {
  "":        "bg-gray-50 text-gray-400 border-gray-100",
  "Baixa":   "bg-gray-100 text-gray-500 border-gray-200",
  "Média":   "bg-yellow-50 text-yellow-700 border-yellow-200",
  "Alta":    "bg-orange-50 text-orange-700 border-orange-200",
  "Urgente": "bg-red-50 text-red-700 border-red-200",
};

type GroupBy = "prazo" | "pessoa";

// ─── Projeto Form Modal ────────────────────────────────────────────────────────
function ProjetoFormModal({ onSave, onClose, initial }: {
  onSave: (data: Omit<Projeto, "id" | "createdAt" | "updatedAt">) => void;
  onClose: () => void;
  initial?: Partial<Projeto>;
}) {
  const [title, setTitle]       = useState(initial?.title ?? "");
  const [description, setDesc]  = useState(initial?.description ?? "");
  const [color, setColor]       = useState(initial?.color ?? "#8B5CF6");
  const [deadline, setDeadline] = useState(initial?.deadline ?? "");
  const [status, setStatus]     = useState<Projeto["status"]>(initial?.status ?? "ativo");

  const COLORS = ["#8B5CF6","#3B82F6","#22C55E","#F97316","#EC4899","#EF4444","#F59E0B","#06B6D4","#64748B"];
  const STATUS_OPTS: { value: Projeto["status"]; label: string }[] = [
    { value: "ativo", label: "Ativo" }, { value: "pausado", label: "Pausado" },
    { value: "concluído", label: "Concluído" }, { value: "cancelado", label: "Cancelado" },
  ];

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end md:items-center justify-center z-50 px-4 pb-4 md:pb-0">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-900">{initial ? "Editar Projeto" : "Novo Projeto"}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={16} className="text-gray-400" /></button>
        </div>
        <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nome do projeto..." className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-purple-300" />
        <textarea value={description} onChange={(e) => setDesc(e.target.value)} placeholder="Descrição (opcional)..." rows={2} className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-purple-300 resize-none" />
        <div>
          <p className="text-xs text-gray-500 mb-2 font-medium">Cor</p>
          <div className="flex gap-2 flex-wrap">
            {COLORS.map((c) => (
              <button key={c} onClick={() => setColor(c)} style={{ backgroundColor: c }}
                className={cn("w-7 h-7 rounded-full transition-all", color === c ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : "hover:scale-105")} />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block font-medium">Deadline</label>
            <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none" />
          </div>
          {initial && (
            <div>
              <label className="text-xs text-gray-500 mb-1 block font-medium">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as Projeto["status"])} className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none">
                {STATUS_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          )}
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={() => { if (title.trim()) onSave({ title: title.trim(), description, color, prazo: "medio", deadline: deadline || undefined, status, order: 0 }); }}
            disabled={!title.trim()} className="flex-1 text-sm font-medium bg-purple-600 text-white rounded-xl py-2 hover:bg-purple-700 disabled:opacity-40 transition-colors">
            {initial ? "Salvar" : "Criar Projeto"}
          </button>
          <button onClick={onClose} className="px-4 text-sm text-gray-500 hover:text-gray-700 rounded-xl hover:bg-gray-100">Cancelar</button>
        </div>
      </div>
    </div>
  );
}

// ─── Item Form ─────────────────────────────────────────────────────────────────
function ItemForm({ initial, onSave, onCancel }: {
  initial?: Partial<ProjetoTask>;
  onSave: (data: Partial<ProjetoTask>) => void;
  onCancel: () => void;
}) {
  const [title, setTitle]             = useState(initial?.title ?? "");
  const [responsible, setResponsible] = useState(initial?.responsible ?? "");
  const [itemPrazo, setItemPrazo]     = useState<ProjetoTask["itemPrazo"]>(initial?.itemPrazo ?? undefined);
  const [dueDate, setDueDate]         = useState(initial?.dueDate ?? "");
  const [description, setDesc]        = useState(initial?.description ?? "");
  const [priority, setPriority]       = useState<Priority>(initial?.priority ?? "Média");
  const [status, setStatus]           = useState(initial?.status ?? "A fazer");

  return (
    <div className="bg-white rounded-xl border border-purple-200 shadow-sm p-4 space-y-3">
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Escape") onCancel(); }}
        placeholder="O que precisa ser feito?"
        className="w-full text-sm font-medium border-0 outline-none text-gray-800 placeholder-gray-400 bg-transparent"
      />

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-gray-400 font-medium block mb-1">Responsável</label>
          <input
            value={responsible}
            onChange={(e) => setResponsible(e.target.value)}
            placeholder="Ex: Amanda, Nicolas..."
            className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-purple-300"
          />
        </div>
        <div>
          <label className="text-[10px] text-gray-400 font-medium block mb-1">Prazo</label>
          <select value={itemPrazo ?? ""} onChange={(e) => setItemPrazo((e.target.value || undefined) as ProjetoTask["itemPrazo"])}
            className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-purple-300 bg-white">
            <option value="">Sem prazo</option>
            <option value="curto">Curto prazo</option>
            <option value="medio">Médio prazo</option>
            <option value="longo">Longo prazo</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-gray-400 font-medium block mb-1">Deadline</label>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
            className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-purple-300" />
        </div>
        <div>
          <label className="text-[10px] text-gray-400 font-medium block mb-1">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as ProjetoTask["status"])}
            className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-purple-300 bg-white">
            <option value="A fazer">A fazer</option>
            <option value="Em andamento">Em andamento</option>
            <option value="Concluído">Concluído</option>
          </select>
        </div>
      </div>

      <div>
        <label className="text-[10px] text-gray-400 font-medium block mb-1">Prioridade</label>
        <div className="flex gap-1 flex-wrap">
          {PRIORITIES.map((p) => (
            <button key={p} onClick={() => setPriority(p)}
              className={cn("text-[10px] px-2 py-0.5 rounded-full border font-medium transition-all",
                priority === p ? PRIORITY_COLORS[p] : "bg-gray-50 text-gray-400 border-gray-100")}>
              {p}
            </button>
          ))}
        </div>
      </div>

      <textarea value={description} onChange={(e) => setDesc(e.target.value)} placeholder="Observações (opcional)..." rows={2}
        className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none resize-none focus:border-purple-300 placeholder-gray-400" />

      <div className="flex gap-1.5 pt-0.5">
        <button
          onClick={() => { if (title.trim()) onSave({ title: title.trim(), responsible: responsible || undefined, itemPrazo, dueDate: dueDate || undefined, description: description || undefined, priority, status }); }}
          disabled={!title.trim()}
          className="flex-1 text-xs font-semibold bg-purple-600 text-white rounded-lg py-1.5 hover:bg-purple-700 disabled:opacity-40 transition-colors">
          {initial?.id ? "Salvar" : "Adicionar"}
        </button>
        <button onClick={onCancel} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"><X size={13} /></button>
      </div>
    </div>
  );
}

// ─── Action Item Card ──────────────────────────────────────────────────────────
function ActionItemCard({ task, projetoColor, onToggle, onDelete, onEdit, onConvert }: {
  task: ProjetoTask;
  projetoColor: string;
  onToggle: (id: number, completed: boolean) => void;
  onDelete: (id: number) => void;
  onEdit: (id: number, data: Partial<ProjetoTask>) => void;
  onConvert: (task: ProjetoTask) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const isDone = task.completed;

  if (editing) {
    return (
      <ItemForm
        initial={task}
        onSave={(data) => { onEdit(task.id!, data); setEditing(false); }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  const isOverdue = task.dueDate && !isDone && task.dueDate < new Date().toISOString().slice(0, 10);

  return (
    <div className={cn(
      "group bg-white rounded-xl border transition-all hover:shadow-sm",
      isDone ? "border-gray-100 opacity-60" : "border-gray-100 hover:border-gray-200"
    )}>
      <div className="flex items-start gap-2.5 p-3">
        {/* Status dot + checkbox */}
        <button onClick={() => onToggle(task.id!, !isDone)} className="mt-0.5 flex-shrink-0">
          {isDone
            ? <CheckCircle2 size={16} className="text-green-500" />
            : <div className={cn("w-4 h-4 rounded-full border-2 transition-all", `border-[${projetoColor}]`)}
                style={{ borderColor: projetoColor }} />
          }
        </button>

        <div className="flex-1 min-w-0">
          <p className={cn("text-sm font-medium leading-snug", isDone && "line-through text-gray-400")}>
            {task.title}
          </p>

          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            {task.status !== "A fazer" && (
              <span className="flex items-center gap-1 text-[10px] font-medium">
                <span className={cn("w-1.5 h-1.5 rounded-full", STATUS_DOT[task.status])} />
                <span className="text-gray-500">{task.status}</span>
              </span>
            )}
            {task.responsible && (
              <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium border border-gray-200">
                <User size={9} /> {task.responsible}
              </span>
            )}
            {task.itemPrazo && (
              <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full border font-medium", ITEM_PRAZO_CONFIG[task.itemPrazo].color)}>
                {ITEM_PRAZO_CONFIG[task.itemPrazo].label}
              </span>
            )}
            {task.dueDate && (
              <span className={cn("flex items-center gap-1 text-[10px] font-medium", isOverdue ? "text-red-500" : "text-gray-400")}>
                <Calendar size={9} />
                {new Date(task.dueDate + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
              </span>
            )}
            {task.taskId && (
              <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-100 font-medium">
                <CalendarCheck size={9} /> Agendada
              </span>
            )}
          </div>

          {/* Notes expandable */}
          {task.description && (
            <button onClick={() => setNotesOpen(!notesOpen)}
              className="text-[10px] text-gray-400 hover:text-gray-600 mt-1 transition-colors">
              {notesOpen ? "▲ ocultar obs." : "▼ ver obs."}
            </button>
          )}
          {notesOpen && task.description && (
            <p className="text-xs text-gray-500 mt-1 bg-gray-50 rounded-lg px-2 py-1.5 leading-relaxed">
              {task.description}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity flex-shrink-0">
          {!task.taskId && !isDone && (
            <button onClick={() => onConvert(task)} title="Agendar como tarefa"
              className="flex items-center gap-1 text-[10px] font-medium text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded-lg transition-colors">
              <ArrowRight size={9} /> Agendar
            </button>
          )}
          <button onClick={() => setEditing(true)} className="p-1 rounded hover:bg-gray-100 text-gray-300 hover:text-purple-500 transition-colors">
            <Edit2 size={11} />
          </button>
          <button onClick={() => onDelete(task.id!)} className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors">
            <Trash2 size={11} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Projeto Card ──────────────────────────────────────────────────────────────
function ProjetoCard({ projeto, allTasks, onRefresh, onConvert }: {
  projeto: Projeto;
  allTasks: ProjetoTask[];
  onRefresh: () => void;
  onConvert: (task: ProjetoTask) => void;
}) {
  const [expanded, setExpanded]         = useState(true);
  const [editingProjeto, setEditingProjeto] = useState(false);
  const [addingItem, setAddingItem]     = useState(false);
  const [groupBy, setGroupBy]           = useState<GroupBy>("prazo");

  const { updateProjeto, deleteProjeto, createProjetoTask, updateProjetoTask, deleteProjetoTask } = useProjetoActions(onRefresh);

  const tasks = allTasks.filter((t) => t.projetoId === projeto.id);
  const done = tasks.filter((t) => t.completed).length;
  const total = tasks.length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;
  const urgentes = tasks.filter((t) => t.priority === "Urgente" && !t.completed).length;
  const overdue = tasks.filter((t) => t.dueDate && !t.completed && t.dueDate < new Date().toISOString().slice(0, 10)).length;

  // Group active tasks
  const active = tasks.filter((t) => !t.completed);
  const completed = tasks.filter((t) => t.completed);

  const grouped = useMemo(() => {
    if (groupBy === "prazo") {
      const sections: { key: string; label: string; items: ProjetoTask[] }[] = [
        { key: "curto", label: "Curto prazo",  items: active.filter((t) => t.itemPrazo === "curto") },
        { key: "medio", label: "Médio prazo",  items: active.filter((t) => t.itemPrazo === "medio") },
        { key: "longo", label: "Longo prazo",  items: active.filter((t) => t.itemPrazo === "longo") },
        { key: "none",  label: "Sem prazo",    items: active.filter((t) => !t.itemPrazo) },
      ];
      return sections.filter((s) => s.items.length > 0);
    } else {
      const people = Array.from(new Set(active.map((t) => t.responsible || "Sem responsável")));
      return people.map((p) => ({
        key: p,
        label: p,
        items: active.filter((t) => (t.responsible || "Sem responsável") === p),
      }));
    }
  }, [active, groupBy]);

  const itemProps = {
    projetoColor: projeto.color,
    onToggle: (id: number, completed: boolean) =>
      updateProjetoTask(id, { completed, status: completed ? "Concluído" : "A fazer" }),
    onDelete: deleteProjetoTask,
    onEdit: (id: number, data: Partial<ProjetoTask>) => updateProjetoTask(id, data),
    onConvert,
  };

  return (
    <>
      {editingProjeto && (
        <ProjetoFormModal
          initial={projeto}
          onSave={async (data) => { await updateProjeto(projeto.id!, data); setEditingProjeto(false); }}
          onClose={() => setEditingProjeto(false)}
        />
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: projeto.color }} />
            <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1.5 flex-1 min-w-0 text-left">
              <h3 className="font-bold text-gray-900 truncate">{projeto.title}</h3>
              {expanded ? <ChevronDown size={14} className="text-gray-400 shrink-0" /> : <ChevronRight size={14} className="text-gray-400 shrink-0" />}
            </button>
            <div className="flex items-center gap-2 shrink-0">
              {urgentes > 0 && <span className="text-[10px] bg-red-50 text-red-600 font-medium px-1.5 py-0.5 rounded-full">{urgentes} urgente{urgentes > 1 ? "s" : ""}</span>}
              {overdue > 0 && <span className="text-[10px] bg-orange-50 text-orange-600 font-medium px-1.5 py-0.5 rounded-full">{overdue} no prazo</span>}
              <button onClick={() => setEditingProjeto(true)} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-purple-600 transition-colors"><Edit2 size={13} /></button>
              <button onClick={() => { if (confirm("Remover projeto?")) deleteProjeto(projeto.id!); }} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
            </div>
          </div>

          {projeto.description && <p className="text-xs text-gray-500 mt-1.5 ml-6">{projeto.description}</p>}

          {total > 0 && (
            <div className="mt-2.5 ml-6 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, backgroundColor: projeto.color }} />
              </div>
              <span className="text-xs text-gray-400 font-medium">{done}/{total}</span>
            </div>
          )}

          {projeto.deadline && (
            <div className="flex items-center gap-1 mt-1.5 ml-6">
              <Calendar size={11} className="text-gray-400" />
              <span className="text-[11px] text-gray-400">
                Deadline: {new Date(projeto.deadline + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
              </span>
            </div>
          )}
        </div>

        {/* Body */}
        {expanded && (
          <div className="p-4 space-y-4">
            {/* Group toggle */}
            {active.length > 0 && (
              <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg w-fit">
                <button onClick={() => setGroupBy("prazo")}
                  className={cn("flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-md transition-all",
                    groupBy === "prazo" ? "bg-white text-purple-700 shadow-sm" : "text-gray-500 hover:text-gray-700")}>
                  <Clock size={10} /> Por prazo
                </button>
                <button onClick={() => setGroupBy("pessoa")}
                  className={cn("flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-md transition-all",
                    groupBy === "pessoa" ? "bg-white text-purple-700 shadow-sm" : "text-gray-500 hover:text-gray-700")}>
                  <Users size={10} /> Por pessoa
                </button>
              </div>
            )}

            {/* Grouped sections */}
            {grouped.map((section) => (
              <div key={section.key}>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">{section.label}</p>
                <div className="space-y-2">
                  {section.items.map((task) => (
                    <ActionItemCard key={task.id} task={task} {...itemProps} />
                  ))}
                </div>
              </div>
            ))}

            {/* Add item */}
            {addingItem ? (
              <ItemForm
                onSave={async (data) => {
                  await createProjetoTask({
                    projetoId: projeto.id!,
                    title: data.title!,
                    status: data.status ?? "A fazer",
                    priority: data.priority ?? "Média",
                    description: data.description,
                    dueDate: data.dueDate,
                    responsible: data.responsible,
                    itemPrazo: data.itemPrazo,
                    order: active.length,
                    completed: false,
                  });
                  setAddingItem(false);
                }}
                onCancel={() => setAddingItem(false)}
              />
            ) : (
              <button onClick={() => setAddingItem(true)}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-purple-600 transition-colors w-full py-1">
                <Plus size={12} /> Adicionar ação
              </button>
            )}

            {/* Completed */}
            {completed.length > 0 && (
              <details className="mt-1">
                <summary className="text-[11px] text-gray-400 cursor-pointer hover:text-gray-600 transition-colors select-none">
                  {completed.length} concluída{completed.length > 1 ? "s" : ""}
                </summary>
                <div className="mt-2 space-y-1.5">
                  {completed.map((task) => (
                    <ActionItemCard key={task.id} task={task} {...itemProps} />
                  ))}
                </div>
              </details>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function ProfissionalPage() {
  const [showForm, setShowForm]           = useState(false);
  const [convertingTask, setConvertingTask] = useState<ProjetoTask | null>(null);

  const { projetos, refetch: refetchProjetos } = useProjetos();
  const { tasks: allTasks, refetch: refetchTasks } = useAllProjetoTasks();
  const { createProjeto, updateProjetoTask } = useProjetoActions(() => { refetchProjetos(); refetchTasks(); });

  function handleRefresh() { refetchProjetos(); refetchTasks(); }

  return (
    <div className="max-w-2xl mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center shadow-sm">
            <Briefcase size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Projetos</h1>
            <p className="text-xs text-gray-400">{projetos.length} {projetos.length === 1 ? "projeto" : "projetos"}</p>
          </div>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-purple-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-purple-700 transition-colors shadow-sm">
          <Plus size={16} /> Novo Projeto
        </button>
      </div>

      {showForm && (
        <ProjetoFormModal
          onSave={async (data) => { await createProjeto({ ...data, order: projetos.length }); setShowForm(false); }}
          onClose={() => setShowForm(false)}
        />
      )}

      {projetos.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Briefcase size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">Nenhum projeto ainda</p>
          <p className="text-xs mt-1">Crie projetos e organize suas ações com responsável, prazo e detalhes</p>
        </div>
      ) : (
        <div className="space-y-4">
          {projetos.map((projeto) => (
            <ProjetoCard
              key={projeto.id}
              projeto={projeto}
              allTasks={allTasks}
              onRefresh={handleRefresh}
              onConvert={setConvertingTask}
            />
          ))}
        </div>
      )}

      {convertingTask && (
        <TaskFormModal
          isOpen={true}
          onClose={() => setConvertingTask(null)}
          initialTitle={convertingTask.title}
          initialPriority={convertingTask.priority}
          onTaskCreated={async (taskId) => {
            await updateProjetoTask(convertingTask.id!, { taskId });
            setConvertingTask(null);
          }}
        />
      )}
    </div>
  );
}
