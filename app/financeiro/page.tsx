"use client";

import { useState, useMemo } from "react";
import {
  Plus, TrendingUp, TrendingDown, Wallet, ChevronLeft, ChevronRight,
  Pencil, Trash2, X, Check, User, Briefcase,
} from "lucide-react";
import { useFinanceiro, calcularResumo, calcularPorCategoria } from "@/lib/hooks/useFinanceiro";
import { cn } from "@/lib/utils/cn";
import type { Transacao, TipoTransacao, EntidadeFinanceira } from "@/types";

// ── Categorias ────────────────────────────────────────────────────────────────

const CATEGORIAS: Record<TipoTransacao, Record<EntidadeFinanceira, string[]>> = {
  receita: {
    pessoal: ["Salário / Pró-labore", "Freelance", "Investimentos", "Aluguel recebido", "Presente / Doação", "Outros"],
    profissional: ["Serviços prestados", "Consultoria", "Projeto", "Parceria", "Produto digital", "Outros"],
  },
  despesa: {
    pessoal: ["Moradia", "Alimentação", "Transporte", "Saúde", "Educação", "Lazer", "Vestuário", "Assinaturas", "Pessoal", "Outros"],
    profissional: ["Fornecedores", "Colaboradores", "Marketing", "Ferramentas / Software", "Impostos", "Escritório", "Capacitação", "Outros"],
  },
};

const CHART_COLORS = [
  "#D946EF", "#EC4899", "#F43F5E", "#FB923C", "#FBBF24",
  "#34D399", "#38BDF8", "#818CF8", "#A78BFA", "#94A3B8",
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function getMesAtual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function addMes(mes: string, delta: number) {
  const [y, m] = mes.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function labelMes(mes: string) {
  const [y, m] = mes.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function formatData(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

// ── DonutChart ────────────────────────────────────────────────────────────────

function DonutChart({ data, total }: { data: { categoria: string; valor: number }[]; total: number }) {
  const size = 140;
  const r = 52;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;

  let offset = 0;
  const slices = data.slice(0, 8).map((item, i) => {
    const pct = total > 0 ? item.valor / total : 0;
    const dash = pct * circ;
    const slice = { ...item, pct, dash, offset, color: CHART_COLORS[i % CHART_COLORS.length] };
    offset += dash;
    return slice;
  });

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-36 text-gray-300 text-sm">Sem dados</div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} className="flex-shrink-0">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth={22} />
        {slices.map((s, i) => (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={22}
            strokeDasharray={`${s.dash} ${circ - s.dash}`}
            strokeDashoffset={circ / 4 - s.offset}
            style={{ transition: "stroke-dasharray 0.4s" }}
          />
        ))}
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="11" fill="#6b7280" fontFamily="inherit">Total</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize="11" fill="#111827" fontWeight="600" fontFamily="inherit">
          {fmt(total).replace("R$ ", "R$ ")}
        </text>
      </svg>
      <div className="flex flex-col gap-1.5 min-w-0">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-xs min-w-0">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
            <span className="truncate text-gray-600">{s.categoria}</span>
            <span className="ml-auto pl-2 text-gray-800 font-medium flex-shrink-0">{fmt(s.valor)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── BarChart mensal ───────────────────────────────────────────────────────────

function BarPair({ receita, despesa, max }: { receita: number; despesa: number; max: number }) {
  const hMax = 72;
  const hR = max > 0 ? Math.max(4, (receita / max) * hMax) : 4;
  const hD = max > 0 ? Math.max(4, (despesa / max) * hMax) : 4;
  return (
    <div className="flex items-end gap-1">
      <div className="w-5 rounded-t-md bg-emerald-400" style={{ height: hR }} title={fmt(receita)} />
      <div className="w-5 rounded-t-md bg-rose-400" style={{ height: hD }} title={fmt(despesa)} />
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────

interface ModalProps {
  initial?: Transacao;
  onSave: (data: Omit<Transacao, "id" | "createdAt" | "updatedAt">) => void;
  onClose: () => void;
}

function TransacaoModal({ initial, onSave, onClose }: ModalProps) {
  const today = new Date().toISOString().split("T")[0];
  const [tipo, setTipo] = useState<TipoTransacao>(initial?.tipo ?? "receita");
  const [entidade, setEntidade] = useState<EntidadeFinanceira>(initial?.entidade ?? "profissional");
  const [categoria, setCategoria] = useState(initial?.categoria ?? "");
  const [descricao, setDescricao] = useState(initial?.descricao ?? "");
  const [valor, setValor] = useState(initial ? String(initial.valor) : "");
  const [data, setData] = useState(initial?.data ?? today);
  const [observacoes, setObservacoes] = useState(initial?.observacoes ?? "");
  const [saving, setSaving] = useState(false);

  const categorias = CATEGORIAS[tipo][entidade];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!descricao.trim() || !valor || !data || !categoria) return;
    setSaving(true);
    await onSave({ tipo, entidade, categoria, descricao: descricao.trim(), valor: Number(valor), data, observacoes: observacoes.trim() || undefined });
    setSaving(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-4 pb-4 sm:pb-0">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-slide-up overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">{initial ? "Editar transação" : "Nova transação"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {/* Tipo */}
          <div className="grid grid-cols-2 gap-2">
            {(["receita", "despesa"] as TipoTransacao[]).map((t) => (
              <button key={t} type="button" onClick={() => { setTipo(t); setCategoria(""); }}
                className={cn("py-2.5 rounded-2xl text-sm font-semibold transition-all capitalize",
                  tipo === t
                    ? t === "receita" ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                )}>
                {t === "receita" ? "Receita" : "Despesa"}
              </button>
            ))}
          </div>

          {/* Entidade */}
          <div className="grid grid-cols-2 gap-2">
            {(["pessoal", "profissional"] as EntidadeFinanceira[]).map((e) => (
              <button key={e} type="button" onClick={() => { setEntidade(e); setCategoria(""); }}
                className={cn("py-2.5 rounded-2xl text-sm font-medium transition-all flex items-center justify-center gap-2",
                  entidade === e ? "bg-fuchsia-50 text-fuchsia-700 ring-1 ring-fuchsia-300" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                )}>
                {e === "pessoal" ? <User size={14} /> : <Briefcase size={14} />}
                {e === "pessoal" ? "Pessoal (PF)" : "Profissional (PJ)"}
              </button>
            ))}
          </div>

          {/* Categoria */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Categoria</label>
            <select value={categoria} onChange={(e) => setCategoria(e.target.value)} required
              className="w-full border border-gray-200 rounded-2xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-fuchsia-300">
              <option value="">Selecionar...</option>
              {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Descrição */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Descrição</label>
            <input value={descricao} onChange={(e) => setDescricao(e.target.value)} required placeholder="Ex: Pagamento cliente X"
              className="w-full border border-gray-200 rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-300" />
          </div>

          {/* Valor + Data */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Valor (R$)</label>
              <input type="number" min="0.01" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} required placeholder="0,00"
                className="w-full border border-gray-200 rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-300" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Data</label>
              <input type="date" value={data} onChange={(e) => setData(e.target.value)} required
                className="w-full border border-gray-200 rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-300" />
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Observações <span className="text-gray-300 normal-case font-normal">(opcional)</span></label>
            <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={2} placeholder="Notas adicionais..."
              className="w-full border border-gray-200 rounded-2xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-fuchsia-300" />
          </div>

          <button type="submit" disabled={saving}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check size={16} />}
            {initial ? "Salvar alterações" : "Adicionar"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── SummaryCard ───────────────────────────────────────────────────────────────

function SummaryCard({ label, value, color, icon: Icon, sub }: {
  label: string; value: number; color: string; icon: React.ElementType; sub?: string;
}) {
  const isNeg = value < 0;
  return (
    <div className={cn("rounded-3xl p-4 flex flex-col gap-2", color)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold opacity-70 uppercase tracking-wide">{label}</span>
        <Icon size={16} className="opacity-60" />
      </div>
      <p className={cn("text-xl font-bold tracking-tight", isNeg && "text-rose-600")}>{fmt(value)}</p>
      {sub && <p className="text-xs opacity-60">{sub}</p>}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type Tab = "geral" | "pessoal" | "profissional";

export default function FinanceiroPage() {
  const [mes, setMes] = useState(getMesAtual);
  const [tab, setTab] = useState<Tab>("geral");
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<Transacao | undefined>();
  const [filtroTipo, setFiltroTipo] = useState<TipoTransacao | "todos">("todos");
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const entidadeFiltro = tab === "geral" ? undefined : (tab as EntidadeFinanceira);
  const { transacoes, loading, createTransacao, updateTransacao, deleteTransacao } = useFinanceiro({ mes, entidade: entidadeFiltro });
  const resumo = useMemo(() => calcularResumo(transacoes), [transacoes]);

  const transacoesFiltradas = useMemo(() =>
    filtroTipo === "todos" ? transacoes : transacoes.filter((t) => t.tipo === filtroTipo),
    [transacoes, filtroTipo]
  );

  const despesasPorCategoria = useMemo(() => calcularPorCategoria(transacoes, "despesa"), [transacoes]);
  const receitasPorCategoria = useMemo(() => calcularPorCategoria(transacoes, "receita"), [transacoes]);

  const resumoAtual = tab === "pessoal" ? resumo.pf : tab === "profissional" ? resumo.pj : { receita: resumo.receitaTotal, despesa: resumo.despesaTotal, lucro: resumo.lucroLiquido };

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Financeiro</h1>
          <p className="text-xs text-gray-400 mt-0.5">Controle PF & PJ</p>
        </div>
        <button onClick={() => { setEditando(undefined); setShowModal(true); }}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity">
          <Plus size={16} />
          Nova
        </button>
      </div>

      {/* Seletor de mês */}
      <div className="flex items-center justify-between bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
        <button onClick={() => setMes((m) => addMes(m, -1))} className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-500">
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-semibold text-gray-800 capitalize">{labelMes(mes)}</span>
        <button onClick={() => setMes((m) => addMes(m, 1))} className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-500">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Tabs PF / PJ / Geral */}
      <div className="grid grid-cols-3 gap-1.5 bg-gray-100 p-1 rounded-2xl">
        {(["geral", "pessoal", "profissional"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("py-2 rounded-xl text-xs font-semibold transition-all capitalize",
              tab === t ? "bg-white text-fuchsia-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}>
            {t === "geral" ? "Visão Geral" : t === "pessoal" ? "Pessoal (PF)" : "Profissional (PJ)"}
          </button>
        ))}
      </div>

      {/* Cards resumo */}
      <div className="grid grid-cols-3 gap-3">
        <SummaryCard label="Receitas" value={resumoAtual.receita} color="bg-emerald-50 text-emerald-900" icon={TrendingUp} />
        <SummaryCard label="Despesas" value={resumoAtual.despesa} color="bg-rose-50 text-rose-900" icon={TrendingDown} />
        <SummaryCard
          label="Lucro Líquido"
          value={resumoAtual.lucro}
          color={resumoAtual.lucro >= 0 ? "bg-fuchsia-50 text-fuchsia-900" : "bg-orange-50 text-orange-900"}
          icon={Wallet}
        />
      </div>

      {/* Quando geral: mini cards PF e PJ */}
      {tab === "geral" && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-1.5 mb-3">
              <User size={14} className="text-fuchsia-500" />
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Pessoal (PF)</span>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between"><span className="text-gray-500">Receitas</span><span className="text-emerald-600 font-semibold">{fmt(resumo.pf.receita)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Despesas</span><span className="text-rose-500 font-semibold">{fmt(resumo.pf.despesa)}</span></div>
              <div className="flex justify-between border-t border-gray-100 pt-1.5 mt-1.5">
                <span className="font-semibold text-gray-700">Saldo</span>
                <span className={cn("font-bold", resumo.pf.lucro >= 0 ? "text-fuchsia-600" : "text-rose-600")}>{fmt(resumo.pf.lucro)}</span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-1.5 mb-3">
              <Briefcase size={14} className="text-fuchsia-500" />
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Profissional (PJ)</span>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between"><span className="text-gray-500">Receitas</span><span className="text-emerald-600 font-semibold">{fmt(resumo.pj.receita)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Despesas</span><span className="text-rose-500 font-semibold">{fmt(resumo.pj.despesa)}</span></div>
              <div className="flex justify-between border-t border-gray-100 pt-1.5 mt-1.5">
                <span className="font-semibold text-gray-700">Saldo</span>
                <span className={cn("font-bold", resumo.pj.lucro >= 0 ? "text-fuchsia-600" : "text-rose-600")}>{fmt(resumo.pj.lucro)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Despesas por categoria</p>
          <DonutChart data={despesasPorCategoria} total={resumoAtual.despesa} />
        </div>
        <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Receitas por categoria</p>
          <DonutChart data={receitasPorCategoria} total={resumoAtual.receita} />
        </div>
      </div>

      {/* Lista de transações */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Filtro */}
        <div className="px-4 pt-4 pb-3 border-b border-gray-100 flex items-center gap-2">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wide mr-1">Filtrar:</span>
          {(["todos", "receita", "despesa"] as const).map((f) => (
            <button key={f} onClick={() => setFiltroTipo(f)}
              className={cn("px-3 py-1 rounded-full text-xs font-medium transition-all capitalize",
                filtroTipo === f
                  ? f === "receita" ? "bg-emerald-100 text-emerald-700" : f === "despesa" ? "bg-rose-100 text-rose-700" : "bg-fuchsia-100 text-fuchsia-700"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              )}>
              {f === "todos" ? "Todos" : f === "receita" ? "Receitas" : "Despesas"}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-7 h-7 border-3 border-fuchsia-200 border-t-fuchsia-500 rounded-full animate-spin" />
          </div>
        ) : transacoesFiltradas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Wallet size={36} strokeWidth={1.5} className="mb-2 opacity-40" />
            <p className="text-sm">Nenhuma transação neste mês</p>
            <button onClick={() => { setEditando(undefined); setShowModal(true); }}
              className="mt-3 text-xs text-fuchsia-600 font-medium hover:underline">
              Adicionar primeira transação
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {transacoesFiltradas.map((t) => (
              <li key={t.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group">
                <div className={cn("w-8 h-8 rounded-2xl flex items-center justify-center flex-shrink-0",
                  t.tipo === "receita" ? "bg-emerald-100" : "bg-rose-100"
                )}>
                  {t.tipo === "receita"
                    ? <TrendingUp size={14} className="text-emerald-600" />
                    : <TrendingDown size={14} className="text-rose-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{t.descricao}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                      t.entidade === "pessoal" ? "bg-fuchsia-50 text-fuchsia-600" : "bg-blue-50 text-blue-600"
                    )}>
                      {t.entidade === "pessoal" ? "PF" : "PJ"}
                    </span>
                    <span className="text-[10px] text-gray-400">{t.categoria}</span>
                    <span className="text-[10px] text-gray-300">·</span>
                    <span className="text-[10px] text-gray-400">{formatData(t.data)}</span>
                  </div>
                </div>
                <span className={cn("text-sm font-bold flex-shrink-0",
                  t.tipo === "receita" ? "text-emerald-600" : "text-rose-500"
                )}>
                  {t.tipo === "receita" ? "+" : "-"}{fmt(t.valor)}
                </span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditando(t); setShowModal(true); }}
                    className="p-1.5 rounded-xl hover:bg-gray-200 text-gray-400">
                    <Pencil size={13} />
                  </button>
                  {confirmDelete === t.id ? (
                    <button onClick={async () => { await deleteTransacao(t.id!); setConfirmDelete(null); }}
                      className="p-1.5 rounded-xl bg-rose-100 text-rose-600">
                      <Check size={13} />
                    </button>
                  ) : (
                    <button onClick={() => setConfirmDelete(t.id!)}
                      className="p-1.5 rounded-xl hover:bg-rose-100 text-gray-400 hover:text-rose-500">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <TransacaoModal
          initial={editando}
          onSave={editando ? (d) => updateTransacao(editando.id!, d) : createTransacao}
          onClose={() => { setShowModal(false); setEditando(undefined); }}
        />
      )}
    </div>
  );
}
