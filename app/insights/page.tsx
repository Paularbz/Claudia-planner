"use client";

import { useState } from "react";
import { Lightbulb, Plus, Search, Tag, Trash2, ExternalLink, BookOpen, CheckSquare, Target, FolderOpen, Link2, Instagram, Youtube, Twitter, Linkedin } from "lucide-react";
import { useInsights, useInsightActions } from "@/lib/hooks/useInsights";
import { useEstudoActions } from "@/lib/hooks/useEstudos";
import { useTasks } from "@/lib/hooks/useTasks";
import { useProjetoActions } from "@/lib/hooks/useProjetos";
import { useContentRefs } from "@/lib/hooks/useContentRefs";
import { todayISO, nowISO } from "@/lib/utils/date";
import type { InsightCategory, Insight, ContentRefNetwork } from "@/types";
import { cn } from "@/lib/utils/cn";

const NETWORK_CONFIG: Record<ContentRefNetwork, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  instagram: { label: "Instagram", color: "text-pink-700",   bg: "bg-pink-50 border-pink-200",     icon: Instagram },
  tiktok:    { label: "TikTok",    color: "text-gray-800",   bg: "bg-gray-100 border-gray-300",    icon: Link2 },
  youtube:   { label: "YouTube",   color: "text-red-700",    bg: "bg-red-50 border-red-200",       icon: Youtube },
  twitter:   { label: "Twitter/X", color: "text-sky-700",    bg: "bg-sky-50 border-sky-200",       icon: Twitter },
  linkedin:  { label: "LinkedIn",  color: "text-blue-700",   bg: "bg-blue-50 border-blue-200",     icon: Linkedin },
  outro:     { label: "Outro",     color: "text-gray-600",   bg: "bg-gray-50 border-gray-200",     icon: Link2 },
};

function RefsTab() {
  const [activeNetwork, setActiveNetwork] = useState<ContentRefNetwork | "all">("all");
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [network, setNetwork] = useState<ContentRefNetwork>("instagram");
  const [notes, setNotes] = useState("");
  const { refs, createRef, deleteRef } = useContentRefs(activeNetwork);

  async function handleSave() {
    if (!title.trim() || !url.trim()) return;
    const normalized = url.startsWith("http") ? url : `https://${url}`;
    await createRef({ title: title.trim(), url: normalized, network, notes: notes.trim() || undefined });
    setTitle(""); setUrl(""); setNotes(""); setAdding(false);
  }

  return (
    <div className="space-y-4">
      {/* Network filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setActiveNetwork("all")}
          className={cn("text-xs font-medium px-3 py-1.5 rounded-full border transition-all", activeNetwork === "all" ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-500 border-gray-200")}
        >
          Todas
        </button>
        {(Object.keys(NETWORK_CONFIG) as ContentRefNetwork[]).map((n) => {
          const cfg = NETWORK_CONFIG[n];
          return (
            <button key={n} onClick={() => setActiveNetwork(n)}
              className={cn("text-xs font-medium px-3 py-1.5 rounded-full border transition-all", activeNetwork === n ? `${cfg.bg} ${cfg.color} border-current` : "bg-white text-gray-500 border-gray-200")}
            >
              {cfg.label}
            </button>
          );
        })}
      </div>

      {/* Add form */}
      {adding ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <input autoFocus placeholder="Título da referência..." value={title} onChange={(e) => setTitle(e.target.value)}
            className="w-full text-sm font-semibold text-gray-900 placeholder-gray-400 border-0 outline-none bg-transparent" />
          <input placeholder="URL (ex: instagram.com/p/...)" value={url} onChange={(e) => setUrl(e.target.value)}
            className="w-full text-sm text-blue-600 placeholder-gray-400 border-0 outline-none bg-transparent" />
          <input placeholder="Notas opcionais..." value={notes} onChange={(e) => setNotes(e.target.value)}
            className="w-full text-sm text-gray-600 placeholder-gray-400 border-0 outline-none bg-transparent" />
          <div className="flex flex-wrap gap-2">
            {(Object.keys(NETWORK_CONFIG) as ContentRefNetwork[]).map((n) => {
              const cfg = NETWORK_CONFIG[n];
              return (
                <button key={n} onClick={() => setNetwork(n)}
                  className={cn("text-xs px-2.5 py-1 rounded-full border font-medium transition-all", network === n ? `${cfg.bg} ${cfg.color} border-current` : "bg-gray-50 text-gray-500 border-gray-200")}
                >
                  {cfg.label}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={handleSave} disabled={!title.trim() || !url.trim()}
              className="flex-1 text-sm font-medium bg-purple-600 text-white rounded-xl py-2 hover:bg-purple-700 disabled:opacity-40 transition-colors">
              Salvar referência
            </button>
            <button onClick={() => setAdding(false)} className="px-4 text-sm text-gray-500 hover:text-gray-700 rounded-xl hover:bg-gray-100">Cancelar</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)}
          className="w-full flex items-center gap-2 text-sm text-purple-600 font-medium py-3 border-2 border-dashed border-purple-200 rounded-2xl justify-center hover:border-purple-400 hover:bg-purple-50 transition-all">
          <Plus size={16} /> Adicionar referência
        </button>
      )}

      {/* Refs list */}
      {refs.length === 0 && !adding ? (
        <div className="text-center py-12 text-gray-400">
          <Link2 size={36} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">Nenhuma referência ainda</p>
          <p className="text-xs mt-1">Salve links de conteúdos que te inspiram</p>
        </div>
      ) : (
        <div className="space-y-2">
          {refs.map((ref) => {
            const cfg = NETWORK_CONFIG[ref.network];
            const Icon = cfg.icon;
            return (
              <div key={ref.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-start gap-3 group hover:shadow-md transition-shadow">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border", cfg.bg)}>
                  <Icon size={16} className={cfg.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <a href={ref.url} target="_blank" rel="noopener noreferrer"
                    className="text-sm font-semibold text-gray-900 hover:text-purple-600 transition-colors line-clamp-1 flex items-center gap-1">
                    {ref.title}
                    <ExternalLink size={11} className="shrink-0 opacity-50" />
                  </a>
                  {ref.notes && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{ref.notes}</p>}
                  <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full border mt-1 inline-block", cfg.bg, cfg.color)}>{cfg.label}</span>
                </div>
                <button onClick={() => deleteRef(ref.id!)}
                  className="opacity-60 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all shrink-0">
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const CATEGORY_CONFIG: Record<InsightCategory, { label: string; color: string; bg: string }> = {
  ideia:      { label: "Ideia",       color: "text-yellow-700",  bg: "bg-yellow-50 border-yellow-200" },
  aprendizado:{ label: "Aprendizado", color: "text-blue-700",    bg: "bg-blue-50 border-blue-200" },
  reflexao:   { label: "Reflexão",    color: "text-purple-700",  bg: "bg-purple-50 border-purple-200" },
  projeto:    { label: "Projeto",     color: "text-green-700",   bg: "bg-green-50 border-green-200" },
  conteudo:   { label: "Conteúdo",    color: "text-pink-700",    bg: "bg-pink-50 border-pink-200" },
  outro:      { label: "Outro",       color: "text-gray-700",    bg: "bg-gray-50 border-gray-200" },
};

function InsightForm({ onSave, onCancel, initial }: { onSave: (data: Omit<Insight, "id" | "createdAt" | "updatedAt">) => void; onCancel: () => void; initial?: Insight }) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [category, setCategory] = useState<InsightCategory>(initial?.category ?? "ideia");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);

  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) { setTags([...tags, t]); setTagInput(""); }
  }

  function submit() {
    if (!title.trim() || !content.trim()) return;
    onSave({ title: title.trim(), content: content.trim(), category, tags });
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
      <input
        autoFocus
        placeholder="Título do insight..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full text-sm font-semibold text-gray-900 placeholder-gray-400 border-0 outline-none bg-transparent"
      />
      <textarea
        placeholder="Desenvolva sua ideia, reflexão ou aprendizado aqui..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
        className="w-full text-sm text-gray-700 placeholder-gray-400 border-0 outline-none bg-transparent resize-none"
      />

      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-gray-400 font-medium">Categoria:</span>
        {(Object.keys(CATEGORY_CONFIG) as InsightCategory[]).map((cat) => {
          const cfg = CATEGORY_CONFIG[cat];
          return (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={cn(
                "text-xs px-2.5 py-1 rounded-full border font-medium transition-all",
                category === cat ? `${cfg.bg} ${cfg.color} border-current` : "bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300"
              )}
            >
              {cfg.label}
            </button>
          );
        })}
      </div>

      <div className="flex gap-2 items-center flex-wrap">
        <Tag size={12} className="text-gray-400" />
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
        <button onClick={submit} disabled={!title.trim() || !content.trim()} className="flex-1 text-sm font-medium bg-purple-600 text-white rounded-xl py-2 hover:bg-purple-700 disabled:opacity-40 transition-colors">
          Salvar Insight
        </button>
        <button onClick={onCancel} className="px-4 text-sm text-gray-500 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors">
          Cancelar
        </button>
      </div>
    </div>
  );
}

function TransformMenu({ insight, onClose }: { insight: Insight; onClose: () => void }) {
  const { createInsight } = useInsightActions();
  const { createEstudo } = useEstudoActions();
  const { createTask } = useTasks();
  const { createProjeto } = useProjetoActions();

  const actions = [
    {
      icon: CheckSquare,
      label: "Transformar em Tarefa",
      color: "text-blue-600 bg-blue-50",
      action: async () => {
        await createTask({
          title: insight.title,
          description: insight.content,
          date: todayISO(),
          category: "Pessoal",
          priority: "Média",
          status: "A fazer",
          notes: `Origem: Insight - ${insight.title}`,
        });
        onClose();
      },
    },
    {
      icon: BookOpen,
      label: "Transformar em Estudo",
      color: "text-green-600 bg-green-50",
      action: async () => {
        await createEstudo({
          title: insight.title,
          description: insight.content,
          source: "outro",
          category: "Estudos",
          priority: "Média",
          status: "quero estudar",
          tags: insight.tags,
          insightId: insight.id,
        });
        onClose();
      },
    },
    {
      icon: FolderOpen,
      label: "Criar Projeto",
      color: "text-purple-600 bg-purple-50",
      action: async () => {
        const { supabase: sb } = await import("@/lib/supabase/client");
        const { count } = await sb.from("projetos").select("*", { count: "exact", head: true }).then((r) => ({ count: r.count ?? 0 }));
        await createProjeto({
          title: insight.title,
          description: insight.content,
          status: "ativo",
          color: "#8B5CF6",
          prazo: "medio",
          order: count,
        });
        onClose();
      },
    },
  ];

  return (
    <div className="absolute right-0 top-8 z-10 bg-white rounded-2xl border border-gray-100 shadow-xl p-2 w-56">
      {actions.map(({ icon: Icon, label, color, action }) => (
        <button
          key={label}
          onClick={action}
          className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <span className={cn("w-7 h-7 rounded-lg flex items-center justify-center", color)}>
            <Icon size={14} />
          </span>
          {label}
        </button>
      ))}
    </div>
  );
}

function InsightCard({ insight, onDelete, onUpdate }: { insight: Insight; onDelete: () => void; onUpdate: (data: Omit<Insight, "id" | "createdAt" | "updatedAt">) => void }) {
  const [showTransform, setShowTransform] = useState(false);
  const [editing, setEditing] = useState(false);
  const cfg = CATEGORY_CONFIG[insight.category];
  const createdDate = new Date(insight.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

  if (editing) {
    return (
      <InsightForm
        initial={insight}
        onSave={(data) => { onUpdate(data); setEditing(false); }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow group relative">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full border", cfg.bg, cfg.color)}>{cfg.label}</span>
          <span className="text-xs text-gray-400">{createdDate}</span>
        </div>
        <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
          <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-purple-600 transition-colors" title="Editar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <div className="relative">
            <button
              onClick={() => setShowTransform(!showTransform)}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-purple-600 transition-colors"
              title="Transformar em..."
            >
              <ExternalLink size={14} />
            </button>
            {showTransform && (
              <div className="fixed z-50" style={{ transform: "translateX(-180px)" }}>
                <TransformMenu insight={insight} onClose={() => setShowTransform(false)} />
              </div>
            )}
          </div>
          <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <h3 className="font-semibold text-gray-900 mb-1.5 text-sm">{insight.title}</h3>
      <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{insight.content}</p>

      {insight.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-gray-50">
          {insight.tags.map((tag) => (
            <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{tag}</span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function InsightsPage() {
  const [tab, setTab] = useState<"insights" | "refs">("insights");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<InsightCategory | "all">("all");
  const [adding, setAdding] = useState(false);
  const { createInsight, updateInsight, deleteInsight } = useInsightActions();
  const insights = useInsights({
    category: activeCategory !== "all" ? activeCategory : undefined,
    search: search || undefined,
  });

  async function handleSave(data: Omit<Insight, "id" | "createdAt" | "updatedAt">) {
    await createInsight(data);
    setAdding(false);
  }

  return (
    <div className="max-w-2xl mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-sm">
            <Lightbulb size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Insights</h1>
          </div>
        </div>
        {tab === "insights" && (
          <button onClick={() => setAdding(true)}
            className="flex items-center gap-2 bg-purple-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-purple-700 transition-colors shadow-sm">
            <Plus size={16} /> Novo
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
        <button onClick={() => setTab("insights")}
          className={cn("flex-1 text-sm font-medium py-2 rounded-lg transition-all", tab === "insights" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500")}>
          Insights
        </button>
        <button onClick={() => setTab("refs")}
          className={cn("flex-1 text-sm font-medium py-2 rounded-lg transition-all flex items-center justify-center gap-1.5", tab === "refs" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500")}>
          <Link2 size={14} /> Referências
        </button>
      </div>

      {tab === "refs" ? <RefsTab /> : (
        <>
          {/* Search */}
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar insights..."
              className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-gray-100 text-sm text-gray-700 placeholder-gray-400 outline-none focus:border-purple-300 shadow-sm" />
          </div>

          {/* Category filter */}
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setActiveCategory("all")}
              className={cn("text-xs font-medium px-3 py-1.5 rounded-full transition-all border", activeCategory === "all" ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-500 border-gray-200 hover:border-gray-300")}>
              Todos
            </button>
            {(Object.keys(CATEGORY_CONFIG) as InsightCategory[]).map((cat) => {
              const cfg = CATEGORY_CONFIG[cat];
              return (
                <button key={cat} onClick={() => setActiveCategory(cat)}
                  className={cn("text-xs font-medium px-3 py-1.5 rounded-full transition-all border", activeCategory === cat ? `${cfg.bg} ${cfg.color} border-current` : "bg-white text-gray-500 border-gray-200 hover:border-gray-300")}>
                  {cfg.label}
                </button>
              );
            })}
          </div>

          {adding && <InsightForm onSave={handleSave} onCancel={() => setAdding(false)} />}

          {insights.length === 0 && !adding ? (
            <div className="text-center py-16 text-gray-400">
              <Lightbulb size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">Nenhum insight ainda</p>
              <p className="text-xs mt-1">Capture suas ideias, reflexões e aprendizados</p>
            </div>
          ) : (
            <div className="space-y-3">
              {insights.map((insight) => (
                <InsightCard key={insight.id} insight={insight}
                  onDelete={() => deleteInsight(insight.id!)}
                  onUpdate={(data) => updateInsight(insight.id!, data)} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
