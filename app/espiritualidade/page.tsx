"use client";

import { useState } from "react";
import { BookHeart, BookOpen, Star, Heart, Flame, CheckCircle2, Circle, Plus, Trash2, ChevronDown, ChevronUp, X, Sparkles } from "lucide-react";
import {
  useAnotacoes, useAnotacaoActions,
  usePedidosOracao, usePedidoOracaoActions,
  useVersiculosSalvos, useVersiculoActions,
  useLeiturasBiblicas, useLeituraActions,
  useEstudosEstacao, useEstacaoActions,
  useLeituraStreak,
} from "@/lib/hooks/useEspiritualidade";
import { useDailyChecks } from "@/lib/hooks/useMetas";
import { todayISO } from "@/lib/utils/date";
import type { AnotacaoCategory, EstacaoType, AnotacaoEspiritual, PedidoOracao, VersiculoSalvo, LeituraBiblica } from "@/types";
import { cn } from "@/lib/utils/cn";

// ── Constants ──────────────────────────────────────────────────────────────────

const ANOTACAO_CONFIG: Record<AnotacaoCategory, { label: string; color: string; bg: string }> = {
  fe:          { label: "Fé",          color: "text-purple-700", bg: "bg-purple-50" },
  gratidao:    { label: "Gratidão",    color: "text-yellow-700", bg: "bg-yellow-50" },
  aprendizado: { label: "Aprendizado", color: "text-blue-700",   bg: "bg-blue-50" },
  desafio:     { label: "Desafio",     color: "text-orange-700", bg: "bg-orange-50" },
  reflexao:    { label: "Reflexão",    color: "text-pink-700",   bg: "bg-pink-50" },
};

const ESTACOES: Record<EstacaoType, { label: string; emoji: string; desc: string }> = {
  pascoa:        { label: "Páscoa",             emoji: "🐑", desc: "O Cordeiro de Deus" },
  paes_asmos:    { label: "Pães Asmos",         emoji: "🍞", desc: "Santificação e separação do pecado" },
  primicias:     { label: "Primícias",          emoji: "🌾", desc: "Ressurreição e primícias da colheita" },
  pentecostes:   { label: "Pentecostes",        emoji: "🔥", desc: "Derramamento do Espírito Santo" },
  trombetas:     { label: "Trombetas",          emoji: "🎺", desc: "O arrebatamento e retorno do Messias" },
  dia_expiacao:  { label: "Dia da Expiação",    emoji: "✝️", desc: "Arrependimento e reconciliação" },
  tabernaculos:  { label: "Tabernáculos",       emoji: "⛺", desc: "Habitação eterna com Deus" },
};

const LIVROS_BIBLICOS = [
  "Gênesis","Êxodo","Levítico","Números","Deuteronômio","Josué","Juízes","Rute",
  "1 Samuel","2 Samuel","1 Reis","2 Reis","1 Crônicas","2 Crônicas","Esdras","Neemias",
  "Ester","Jó","Salmos","Provérbios","Eclesiastes","Cântico dos Cânticos","Isaías",
  "Jeremias","Lamentações","Ezequiel","Daniel","Oseias","Joel","Amós","Obadias",
  "Jonas","Miquéias","Naum","Habacuque","Sofonias","Ageu","Zacarias","Malaquias",
  "Mateus","Marcos","Lucas","João","Atos","Romanos","1 Coríntios","2 Coríntios",
  "Gálatas","Efésios","Filipenses","Colossenses","1 Tessalonicenses","2 Tessalonicenses",
  "1 Timóteo","2 Timóteo","Tito","Filemon","Hebreus","Tiago","1 Pedro","2 Pedro",
  "1 João","2 João","3 João","Judas","Apocalipse",
];

type Tab = "devocional" | "leitura" | "estacoes" | "oracao" | "versiculos";

// ── Devocional Tab ─────────────────────────────────────────────────────────────

function DevoTab() {
  const today = todayISO();
  const anotacoes = useAnotacoes(today);
  const { createAnotacao, deleteAnotacao } = useAnotacaoActions();
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<AnotacaoCategory>("reflexao");
  const [versiculo, setVersiculo] = useState("");
  const [adding, setAdding] = useState(false);

  async function save() {
    if (!content.trim()) return;
    await createAnotacao({ date: today, content: content.trim(), category, versiculo: versiculo.trim() || undefined });
    setContent(""); setVersiculo(""); setAdding(false);
  }

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-purple-500 to-violet-600 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-2 mb-1">
          <BookHeart size={18} />
          <p className="font-semibold">Devocional de Hoje</p>
        </div>
        <p className="text-sm opacity-90">{new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}</p>
      </div>

      {!adding && (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 w-full bg-white rounded-xl border border-gray-100 shadow-sm p-3.5 text-sm text-gray-500 hover:border-purple-200 transition-colors"
        >
          <Plus size={16} className="text-purple-500" />
          Adicionar anotação do dia...
        </button>
      )}

      {adding && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
          <div className="flex gap-2 flex-wrap">
            {(Object.keys(ANOTACAO_CONFIG) as AnotacaoCategory[]).map((cat) => {
              const cfg = ANOTACAO_CONFIG[cat];
              return (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={cn("text-xs px-3 py-1 rounded-full border font-medium transition-all",
                    category === cat ? `${cfg.bg} ${cfg.color} border-current` : "border-gray-200 text-gray-500 hover:border-gray-300"
                  )}
                >
                  {cfg.label}
                </button>
              );
            })}
          </div>
          <input
            value={versiculo}
            onChange={(e) => setVersiculo(e.target.value)}
            placeholder="Versículo de referência (ex: João 3:16)..."
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-purple-300"
          />
          <textarea
            autoFocus
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Sua reflexão, aprendizado ou gratidão de hoje..."
            rows={4}
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-purple-300 resize-none"
          />
          <div className="flex gap-2">
            <button onClick={save} disabled={!content.trim()} className="flex-1 text-sm font-medium bg-purple-600 text-white rounded-xl py-2 hover:bg-purple-700 disabled:opacity-40 transition-colors">
              Salvar
            </button>
            <button onClick={() => setAdding(false)} className="px-4 text-sm text-gray-500 hover:bg-gray-100 rounded-xl">Cancelar</button>
          </div>
        </div>
      )}

      {anotacoes.length === 0 && !adding && (
        <div className="text-center py-8 text-gray-400">
          <BookHeart size={36} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">Nenhuma anotação ainda hoje</p>
        </div>
      )}

      <div className="space-y-3">
        {anotacoes.map((a) => {
          const cfg = ANOTACAO_CONFIG[a.category];
          return (
            <div key={a.id} className={cn("rounded-2xl p-4 border border-transparent group", cfg.bg)}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn("text-xs font-medium", cfg.color)}>{cfg.label}</span>
                    {a.versiculo && <span className="text-xs text-gray-500 italic">📖 {a.versiculo}</span>}
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{a.content}</p>
                </div>
                <button onClick={() => deleteAnotacao(a.id!)} className="opacity-60 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all p-1 rounded-lg hover:bg-white/50">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Leitura Bíblica Tab ────────────────────────────────────────────────────────

function LeituraTab() {
  const leituras = useLeiturasBiblicas();
  const { registrarLeitura, deleteLeitura } = useLeituraActions();
  const streak = useLeituraStreak();
  const [livro, setLivro] = useState("Salmos");
  const [capitulo, setCapitulo] = useState(1);
  const [notes, setNotes] = useState("");
  const [adding, setAdding] = useState(false);

  const unique = [...new Set(leituras.map((l) => `${l.livro} ${l.capitulo}`))];

  async function save() {
    await registrarLeitura({ livro, capitulo, date: todayISO(), notes: notes.trim() || undefined });
    setNotes(""); setAdding(false);
  }

  return (
    <div className="space-y-4">
      {/* Streak */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-orange-50 rounded-2xl p-4 text-center border border-orange-100">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Flame size={18} className="text-orange-500" />
            <p className="text-2xl font-bold text-orange-600">{streak}</p>
          </div>
          <p className="text-xs text-orange-600 font-medium">{streak === 1 ? "dia seguido" : "dias seguidos"}</p>
        </div>
        <div className="bg-blue-50 rounded-2xl p-4 text-center border border-blue-100">
          <p className="text-2xl font-bold text-blue-600">{unique.length}</p>
          <p className="text-xs text-blue-600 font-medium">capítulos lidos</p>
        </div>
      </div>

      {!adding ? (
        <button onClick={() => setAdding(true)} className="flex items-center gap-2 w-full bg-white rounded-xl border border-gray-100 shadow-sm p-3.5 text-sm text-gray-500 hover:border-purple-200 transition-colors">
          <Plus size={16} className="text-purple-500" />
          Registrar leitura de hoje...
        </button>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Livro</label>
              <select value={livro} onChange={(e) => setLivro(e.target.value)} className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none">
                {LIVROS_BIBLICOS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Capítulo</label>
              <input type="number" min={1} value={capitulo} onChange={(e) => setCapitulo(Number(e.target.value))} className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none" />
            </div>
          </div>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anotações sobre a leitura (opcional)..." rows={2} className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none resize-none" />
          <div className="flex gap-2">
            <button onClick={save} className="flex-1 text-sm font-medium bg-purple-600 text-white rounded-xl py-2 hover:bg-purple-700 transition-colors">Registrar</button>
            <button onClick={() => setAdding(false)} className="px-4 text-sm text-gray-500 hover:bg-gray-100 rounded-xl">Cancelar</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {leituras.slice(0, 20).map((l) => (
          <div key={l.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex items-center gap-3 group">
            <BookOpen size={15} className="text-purple-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800">{l.livro} {l.capitulo}</p>
              {l.notes && <p className="text-xs text-gray-500 truncate">{l.notes}</p>}
            </div>
            <span className="text-xs text-gray-400">{new Date(l.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</span>
            <button onClick={() => deleteLeitura(l.id!)} className="opacity-60 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all">
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Estações Tab ───────────────────────────────────────────────────────────────

function EstacaoTab() {
  const [selected, setSelected] = useState<EstacaoType>("pascoa");
  const estudos = useEstudosEstacao(selected);
  const { createEstudoEstacao, updateEstudoEstacao, deleteEstudoEstacao } = useEstacaoActions();
  const [adding, setAdding] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [versiculo, setVersiculo] = useState("");

  async function save() {
    if (!titulo.trim()) return;
    await createEstudoEstacao({
      estacao: selected,
      semana: estudos.length + 1,
      titulo: titulo.trim(),
      conteudo: conteudo.trim(),
      versiculo: versiculo.trim() || undefined,
      date: todayISO(),
      completed: false,
    });
    setTitulo(""); setConteudo(""); setVersiculo(""); setAdding(false);
  }

  const estacaoInfo = ESTACOES[selected];

  return (
    <div className="space-y-4">
      {/* Estação selector */}
      <div className="grid grid-cols-2 gap-2">
        {(Object.keys(ESTACOES) as EstacaoType[]).map((e) => {
          const info = ESTACOES[e];
          return (
            <button
              key={e}
              onClick={() => setSelected(e)}
              className={cn("text-left p-3 rounded-xl border transition-all", selected === e ? "bg-purple-50 border-purple-300" : "bg-white border-gray-100 hover:border-gray-200")}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{info.emoji}</span>
                <div>
                  <p className={cn("text-xs font-semibold", selected === e ? "text-purple-800" : "text-gray-700")}>{info.label}</p>
                  <p className="text-xs text-gray-400 leading-tight">{info.desc}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected estação content */}
      <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-2xl p-4 border border-purple-100">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">{estacaoInfo.emoji}</span>
          <div>
            <p className="font-semibold text-purple-900">{estacaoInfo.label}</p>
            <p className="text-xs text-purple-600">{estacaoInfo.desc}</p>
          </div>
        </div>
      </div>

      {!adding ? (
        <button onClick={() => setAdding(true)} className="flex items-center gap-2 w-full bg-white rounded-xl border border-gray-100 shadow-sm p-3.5 text-sm text-gray-500 hover:border-purple-200 transition-colors">
          <Plus size={16} className="text-purple-500" />
          Adicionar estudo desta estação...
        </button>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
          <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título do estudo..." className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-purple-300" />
          <input value={versiculo} onChange={(e) => setVersiculo(e.target.value)} placeholder="Versículo principal (ex: Êxodo 12:1-14)..." className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-purple-300" />
          <textarea value={conteudo} onChange={(e) => setConteudo(e.target.value)} placeholder="Conteúdo, reflexões e anotações..." rows={3} className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none resize-none focus:border-purple-300" />
          <div className="flex gap-2">
            <button onClick={save} disabled={!titulo.trim()} className="flex-1 text-sm font-medium bg-purple-600 text-white rounded-xl py-2 hover:bg-purple-700 disabled:opacity-40 transition-colors">Salvar</button>
            <button onClick={() => setAdding(false)} className="px-4 text-sm text-gray-500 hover:bg-gray-100 rounded-xl">Cancelar</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {estudos.length === 0 && !adding && (
          <p className="text-center text-sm text-gray-400 py-6">Nenhum estudo registrado para {estacaoInfo.label}</p>
        )}
        {estudos.map((e) => (
          <div key={e.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 group">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <button onClick={() => updateEstudoEstacao(e.id!, { completed: !e.completed })} className="text-gray-400 hover:text-green-600 transition-colors">
                  {e.completed ? <CheckCircle2 size={16} className="text-green-500" /> : <Circle size={16} />}
                </button>
                <p className={cn("text-sm font-semibold", e.completed ? "line-through text-gray-400" : "text-gray-900")}>{e.titulo}</p>
              </div>
              <button onClick={() => deleteEstudoEstacao(e.id!)} className="opacity-60 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all">
                <Trash2 size={13} />
              </button>
            </div>
            {e.versiculo && <p className="text-xs text-purple-600 italic mb-1">📖 {e.versiculo}</p>}
            {e.conteudo && <p className="text-sm text-gray-600 whitespace-pre-wrap">{e.conteudo}</p>}
            <p className="text-xs text-gray-400 mt-2">Semana {e.semana} · {new Date(e.date).toLocaleDateString("pt-BR")}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Oração Tab ─────────────────────────────────────────────────────────────────

function OracaoTab() {
  const pedidos = usePedidosOracao();
  const { createPedido, deletePedido, markAnswered } = usePedidoOracaoActions();
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDesc] = useState("");
  const [answeringId, setAnsweringId] = useState<number | null>(null);
  const [answerNote, setAnswerNote] = useState("");

  const active = pedidos.filter((p) => !p.answered);
  const answered = pedidos.filter((p) => p.answered);

  async function save() {
    if (!title.trim()) return;
    await createPedido({ title: title.trim(), description: description.trim() || undefined, answered: false });
    setTitle(""); setDesc(""); setAdding(false);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-rose-50 rounded-2xl p-4 text-center border border-rose-100">
          <p className="text-2xl font-bold text-rose-600">{active.length}</p>
          <p className="text-xs text-rose-600 font-medium">pedidos ativos</p>
        </div>
        <div className="bg-green-50 rounded-2xl p-4 text-center border border-green-100">
          <p className="text-2xl font-bold text-green-600">{answered.length}</p>
          <p className="text-xs text-green-600 font-medium">respondidos</p>
        </div>
      </div>

      {!adding ? (
        <button onClick={() => setAdding(true)} className="flex items-center gap-2 w-full bg-white rounded-xl border border-gray-100 shadow-sm p-3.5 text-sm text-gray-500 hover:border-purple-200 transition-colors">
          <Plus size={16} className="text-purple-500" />
          Novo pedido de oração...
        </button>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
          <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Pedido de oração..." className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-purple-300" />
          <textarea value={description} onChange={(e) => setDesc(e.target.value)} placeholder="Detalhes (opcional)..." rows={2} className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none resize-none" />
          <div className="flex gap-2">
            <button onClick={save} disabled={!title.trim()} className="flex-1 text-sm font-medium bg-purple-600 text-white rounded-xl py-2 hover:bg-purple-700 disabled:opacity-40">Salvar</button>
            <button onClick={() => setAdding(false)} className="px-4 text-sm text-gray-500 hover:bg-gray-100 rounded-xl">Cancelar</button>
          </div>
        </div>
      )}

      {answeringId !== null && (
        <div className="bg-green-50 rounded-2xl p-4 border border-green-200 space-y-3">
          <p className="text-sm font-medium text-green-800">🙏 Como Deus respondeu?</p>
          <textarea value={answerNote} onChange={(e) => setAnswerNote(e.target.value)} placeholder="Testemunho de como foi respondido..." rows={2} className="w-full text-sm border border-green-300 rounded-xl px-3 py-2 outline-none bg-white resize-none" />
          <div className="flex gap-2">
            <button onClick={async () => { await markAnswered(answeringId!, answerNote); setAnsweringId(null); setAnswerNote(""); }} className="flex-1 text-sm font-medium bg-green-600 text-white rounded-xl py-2 hover:bg-green-700">Marcar como respondido</button>
            <button onClick={() => { setAnsweringId(null); setAnswerNote(""); }} className="px-4 text-sm text-gray-500 hover:bg-gray-100 rounded-xl">Cancelar</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {active.length === 0 && !adding && <p className="text-center text-sm text-gray-400 py-4">Nenhum pedido ativo</p>}
        {active.map((p) => (
          <div key={p.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3.5 group">
            <div className="flex items-start gap-3">
              <Heart size={15} className="text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{p.title}</p>
                {p.description && <p className="text-xs text-gray-500 mt-0.5">{p.description}</p>}
                <p className="text-xs text-gray-400 mt-1">{new Date(p.createdAt).toLocaleDateString("pt-BR")}</p>
              </div>
              <div className="flex gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                <button onClick={() => setAnsweringId(p.id!)} className="text-xs text-green-600 hover:bg-green-50 px-2 py-1 rounded-lg font-medium transition-colors">✓ respondido</button>
                <button onClick={() => deletePedido(p.id!)} className="p-1 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {answered.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Respondidos 🙌</p>
          <div className="space-y-2">
            {answered.map((p) => (
              <div key={p.id} className="bg-green-50 rounded-xl border border-green-100 p-3.5 group">
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={15} className="text-green-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 line-through">{p.title}</p>
                    {p.answeredNote && <p className="text-xs text-green-700 mt-1 italic">"{p.answeredNote}"</p>}
                  </div>
                  <button onClick={() => deletePedido(p.id!)} className="opacity-60 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Versículos Tab ─────────────────────────────────────────────────────────────

function VersiculosTab() {
  const versiculos = useVersiculosSalvos();
  const { saveVersiculo, deleteVersiculo } = useVersiculoActions();
  const [adding, setAdding] = useState(false);
  const [reference, setReference] = useState("");
  const [text, setText] = useState("");
  const [theme, setTheme] = useState("");

  async function save() {
    if (!reference.trim() || !text.trim()) return;
    await saveVersiculo({ reference: reference.trim(), text: text.trim(), theme: theme.trim() || undefined, date: todayISO() });
    setReference(""); setText(""); setTheme(""); setAdding(false);
  }

  return (
    <div className="space-y-4">
      {!adding ? (
        <button onClick={() => setAdding(true)} className="flex items-center gap-2 w-full bg-white rounded-xl border border-gray-100 shadow-sm p-3.5 text-sm text-gray-500 hover:border-purple-200 transition-colors">
          <Plus size={16} className="text-purple-500" />
          Salvar versículo...
        </button>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
          <input autoFocus value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Referência (ex: João 3:16)..." className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-purple-300" />
          <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Texto do versículo..." rows={3} className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none resize-none" />
          <input value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="Tema (ex: fé, provisão, cura)..." className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none" />
          <div className="flex gap-2">
            <button onClick={save} disabled={!reference.trim() || !text.trim()} className="flex-1 text-sm font-medium bg-purple-600 text-white rounded-xl py-2 hover:bg-purple-700 disabled:opacity-40">Salvar</button>
            <button onClick={() => setAdding(false)} className="px-4 text-sm text-gray-500 hover:bg-gray-100 rounded-xl">Cancelar</button>
          </div>
        </div>
      )}

      {versiculos.length === 0 && !adding && (
        <div className="text-center py-8 text-gray-400">
          <Star size={36} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">Nenhum versículo salvo ainda</p>
        </div>
      )}

      <div className="space-y-3">
        {versiculos.map((v) => (
          <div key={v.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 group relative">
            <div className="absolute top-3 right-3 opacity-60 group-hover:opacity-100 transition-opacity">
              <button onClick={() => deleteVersiculo(v.id!)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50">
                <Trash2 size={13} />
              </button>
            </div>
            <p className="text-xs font-bold text-purple-600 mb-2">📖 {v.reference}</p>
            <p className="text-sm text-gray-700 italic leading-relaxed">"{v.text}"</p>
            {v.theme && <span className="mt-2 inline-block text-xs bg-purple-50 text-purple-600 px-2.5 py-0.5 rounded-full">{v.theme}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "devocional", label: "Devocional",  icon: <BookHeart size={14} /> },
  { id: "leitura",   label: "Leitura",      icon: <BookOpen size={14} /> },
  { id: "estacoes",  label: "Estações",     icon: <Sparkles size={14} /> },
  { id: "oracao",    label: "Oração",       icon: <Heart size={14} /> },
  { id: "versiculos",label: "Versículos",   icon: <Star size={14} /> },
];

export default function EspiritualidadePage() {
  const [tab, setTab] = useState<Tab>("devocional");

  return (
    <div className="max-w-2xl mx-auto py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-sm">
          <BookHeart size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Espiritualidade</h1>
          <p className="text-xs text-gray-400">Devocionais, leitura bíblica e oração</p>
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 overflow-x-auto bg-gray-100 p-1 rounded-xl">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex-shrink-0 flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg transition-all whitespace-nowrap",
              tab === t.id ? "bg-white text-purple-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "devocional"  && <DevoTab />}
      {tab === "leitura"     && <LeituraTab />}
      {tab === "estacoes"    && <EstacaoTab />}
      {tab === "oracao"      && <OracaoTab />}
      {tab === "versiculos"  && <VersiculosTab />}
    </div>
  );
}
