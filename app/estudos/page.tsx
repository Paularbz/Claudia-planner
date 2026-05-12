"use client";

import { useState } from "react";
import { BookOpen, Plus, Search, Trash2, Edit2, ExternalLink, CheckCircle2, Circle, PauseCircle, BookMarked } from "lucide-react";
import { useEstudos, useEstudoActions } from "@/lib/hooks/useEstudos";
import { nowISO, todayISO } from "@/lib/utils/date";
import type { EstudoItem, EstudoStatus, EstudoSource, Category, Priority } from "@/types";
import { CATEGORY_CONFIG } from "@/lib/constants/categories";
import { cn } from "@/lib/utils/cn";

const SOURCE_CONFIG: Record<EstudoSource, { label: string; icon: string }> = {
  livro:   { label: "Livro",    icon: "📚" },
  video:   { label: "Vídeo",   icon: "🎬" },
  podcast: { label: "Podcast", icon: "🎙️" },
  artigo:  { label: "Artigo",  icon: "📄" },
  curso:   { label: "Curso",   icon: "🎓" },
  outro:   { label: "Outro",   icon: "📎" },
};

const STATUS_CONFIG: Record<EstudoStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  "quero estudar": { label: "Quero estudar", color: "text-gray-600",   bg: "bg-gray-100",   icon: <Circle size={14} /> },
  "em andamento":  { label: "Em andamento",  color: "text-blue-700",   bg: "bg-blue-100",   icon: <BookOpen size={14} /> },
  "concluído":     { label: "Concluído",      color: "text-green-700",  bg: "bg-green-100",  icon: <CheckCircle2 size={14} /> },
  "pausado":       { label: "Pausado",        color: "text-orange-600", bg: "bg-orange-100", icon: <PauseCircle size={14} /> },
};

const ALL_STATUSES: EstudoStatus[] = ["quero estudar", "em andamento", "concluído", "pausado"];

interface EstudoFormProps {
  initial?: Partial<EstudoItem>;
  onSave: (data: Omit<EstudoItem, "id" | "createdAt" | "updatedAt">) => void;
  onCancel: () => void;
}

function EstudoForm({ initial, onSave, onCancel }: EstudoFormProps) {
  const [title, setTitle]       = useState(initial?.title ?? "");
  const [description, setDesc]  = useState(initial?.description ?? "");
  const [source, setSource]     = useState<EstudoSource>(initial?.source ?? "livro");
  const [url, setUrl]           = useState(initial?.url ?? "");
  const [author, setAuthor]     = useState(initial?.author ?? "");
  const [category, setCategory] = useState<Category>(initial?.category ?? "Estudos");
  const [priority, setPriority] = useState<Priority>(initial?.priority ?? "Média");
  const [status, setStatus]     = useState<EstudoStatus>(initial?.status ?? "quero estudar");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags]         = useState<string[]>(initial?.tags ?? []);

  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) { setTags([...tags, t]); setTagInput(""); }
  }

  function submit() {
    if (!title.trim()) return;
    onSave({ title: title.trim(), description, source, url, author, category, priority, status, tags, notes: initial?.notes });
  }

  const inputCls = "w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-purple-300 bg-white text-gray-800 placeholder-gray-400";
  const labelCls = "text-xs font-medium text-gray-500 mb-1 block";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
      <div>
        <label className={labelCls}>Título *</label>
        <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título do material..." className={inputCls} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Tipo</label>
          <select value={source} onChange={(e) => setSource(e.target.value as EstudoSource)} className={inputCls}>
            {(Object.keys(SOURCE_CONFIG) as EstudoSource[]).map((s) => (
              <option key={s} value={s}>{SOURCE_CONFIG[s].icon} {SOURCE_CONFIG[s].label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as EstudoStatus)} className={inputCls}>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Autor / Canal</label>
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Autor..." className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Prioridade</label>
          <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className={inputCls}>
            {(["Baixa", "Média", "Alta", "Urgente"] as Priority[]).map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelCls}>Link / URL</label>
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." className={inputCls} />
      </div>

      <div>
        <label className={labelCls}>Descrição</label>
        <textarea value={description} onChange={(e) => setDesc(e.target.value)} placeholder="Breve descrição..." rows={2} className={cn(inputCls, "resize-none")} />
      </div>

      <div className="flex gap-2 items-center flex-wrap">
        <span className="text-xs text-gray-400 font-medium">Tags:</span>
        {tags.map((t) => (
          <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full flex items-center gap-1">
            {t}
            <button onClick={() => setTags(tags.filter((x) => x !== t))} className="text-gray-400 hover:text-gray-600">×</button>
          </span>
        ))}
        <input
          placeholder="+ tag"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); } }}
          className="text-xs outline-none bg-transparent text-gray-500 placeholder-gray-400 w-20"
        />
      </div>

      <div className="flex gap-2 pt-1">
        <button onClick={submit} disabled={!title.trim()} className="flex-1 text-sm font-medium bg-purple-600 text-white rounded-xl py-2 hover:bg-purple-700 disabled:opacity-40 transition-colors">
          {initial ? "Atualizar" : "Adicionar"}
        </button>
        <button onClick={onCancel} className="px-4 text-sm text-gray-500 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors">
          Cancelar
        </button>
      </div>
    </div>
  );
}

function EstudoCard({ item, onDelete, onUpdate }: { item: EstudoItem; onDelete: () => void; onUpdate: (data: Partial<EstudoItem>) => void }) {
  const [editing, setEditing] = useState(false);
  const { updateEstudo } = useEstudoActions();
  const cfg = STATUS_CONFIG[item.status];
  const srcCfg = SOURCE_CONFIG[item.source];
  const catColor = CATEGORY_CONFIG[item.category]?.color ?? "#6B7280";

  async function cycleStatus() {
    const order: EstudoStatus[] = ["quero estudar", "em andamento", "concluído", "pausado"];
    const next = order[(order.indexOf(item.status) + 1) % order.length];
    const extra = next === "concluído" ? { completedAt: nowISO() } : {};
    await updateEstudo(item.id!, { status: next, ...extra });
  }

  if (editing) {
    return (
      <EstudoForm
        initial={item}
        onSave={async (data) => { await updateEstudo(item.id!, data); setEditing(false); }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow group">
      <div className="flex items-start gap-3">
        <button onClick={cycleStatus} className="mt-0.5 text-gray-400 hover:text-purple-600 flex-shrink-0 transition-colors">
          {cfg.icon}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap mb-1">
            <span className="text-base">{srcCfg.icon}</span>
            <h3 className={cn("text-sm font-semibold flex-1", item.status === "concluído" ? "line-through text-gray-400" : "text-gray-900")}>
              {item.title}
            </h3>
          </div>

          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", cfg.bg, cfg.color)}>{cfg.label}</span>
            {item.author && <span className="text-xs text-gray-400">{item.author}</span>}
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${catColor}18`, color: catColor }}>{item.category}</span>
          </div>

          {item.description && <p className="text-xs text-gray-500 mb-2">{item.description}</p>}

          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {item.tags.map((t) => (
                <span key={t} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{t}</span>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-1 opacity-60 group-hover:opacity-100 transition-opacity flex-shrink-0">
          {item.url && (
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-colors">
              <ExternalLink size={14} />
            </a>
          )}
          <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-purple-600 transition-colors">
            <Edit2 size={14} />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EstudosPage() {
  const [search, setSearch] = useState("");
  const [activeStatus, setActiveStatus] = useState<EstudoStatus | "all">("all");
  const [adding, setAdding] = useState(false);
  const { createEstudo, updateEstudo, deleteEstudo } = useEstudoActions();
  const estudos = useEstudos({ status: activeStatus !== "all" ? activeStatus : undefined, search: search || undefined });

  const counts: Record<string, number> = { all: estudos.length };
  for (const s of ALL_STATUSES) {
    counts[s] = estudos.filter((e) => e.status === s).length;
  }

  return (
    <div className="max-w-2xl mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
            <BookMarked size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Estudos</h1>
            <p className="text-xs text-gray-400">{estudos.length} {estudos.length === 1 ? "item" : "itens"}</p>
          </div>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 bg-purple-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-purple-700 transition-colors shadow-sm"
        >
          <Plus size={16} />
          Adicionar
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar estudos..."
          className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-gray-100 text-sm text-gray-700 placeholder-gray-400 outline-none focus:border-purple-300 shadow-sm"
        />
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto">
        {([["all", "Todos"]] as [string, string][]).concat(ALL_STATUSES.map((s) => [s, STATUS_CONFIG[s].label])).map(([s, label]) => (
          <button
            key={s}
            onClick={() => setActiveStatus(s as EstudoStatus | "all")}
            className={cn("flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg transition-all whitespace-nowrap", activeStatus === s ? "bg-white text-purple-700 shadow-sm" : "text-gray-500 hover:text-gray-700")}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Form */}
      {adding && (
        <EstudoForm
          onSave={async (data) => { await createEstudo(data); setAdding(false); }}
          onCancel={() => setAdding(false)}
        />
      )}

      {/* List */}
      {estudos.length === 0 && !adding ? (
        <div className="text-center py-16 text-gray-400">
          <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">Nenhum estudo encontrado</p>
          <p className="text-xs mt-1">Adicione livros, vídeos, podcasts e artigos para estudar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {estudos.map((item) => (
            <EstudoCard
              key={item.id}
              item={item}
              onDelete={() => deleteEstudo(item.id!)}
              onUpdate={(data) => updateEstudo(item.id!, data)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
