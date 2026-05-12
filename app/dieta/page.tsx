"use client";

import { useState, useRef } from "react";
import {
  Salad, Plus, Search, Trash2, Check, ChevronDown, ChevronUp,
  Loader2, X, Pencil, CheckCircle2,
} from "lucide-react";
import { useDieta, searchNutrition, type Alimento, type NutritionResult } from "@/lib/hooks/useDieta";
import { cn } from "@/lib/utils/cn";

const REFEICOES_SUGERIDAS = ["Manhã", "Lanche da manhã", "Almoço", "Lanche da tarde", "Jantar", "Ceia"];

function MacroCard({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  return (
    <div className={cn("rounded-2xl p-3 flex flex-col items-center", color)}>
      <span className="text-xs font-medium opacity-70">{label}</span>
      <span className="text-lg font-bold mt-0.5">{Math.round(value)}</span>
      <span className="text-[10px] opacity-60">{unit}</span>
    </div>
  );
}

function AlimentoForm({
  onAdd,
  onCancel,
}: {
  onAdd: (a: Alimento) => void;
  onCancel: () => void;
}) {
  const [nome, setNome] = useState("");
  const [quantidade, setQuantidade] = useState("100");
  const [unidade, setUnidade] = useState("g");
  const [calorias, setCalorias] = useState("");
  const [carbs, setCarbs] = useState("");
  const [prot, setProt] = useState("");
  const [gord, setGord] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<NutritionResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [base100, setBase100] = useState<NutritionResult | null>(null);

  async function handleSearch() {
    if (!nome.trim()) return;
    setSearching(true);
    setSearched(false);
    const res = await searchNutrition(nome.trim());
    setResults(res);
    setSearched(true);
    setSearching(false);
  }

  function selectResult(r: NutritionResult) {
    setBase100(r);
    setNome(r.nome);
    recalculate(r, parseFloat(quantidade) || 100);
    setResults([]);
  }

  function recalculate(r: NutritionResult, qtd: number) {
    const factor = qtd / 100;
    setCalorias(String(Math.round(r.calorias_100g * factor)));
    setCarbs(String(Math.round(r.carboidratos_100g * factor * 10) / 10));
    setProt(String(Math.round(r.proteinas_100g * factor * 10) / 10));
    setGord(String(Math.round(r.gorduras_100g * factor * 10) / 10));
  }

  function handleQtdChange(val: string) {
    setQuantidade(val);
    if (base100 && val) recalculate(base100, parseFloat(val) || 0);
  }

  function handleAdd() {
    if (!nome.trim()) return;
    onAdd({
      id: crypto.randomUUID(),
      nome: nome.trim(),
      quantidade: parseFloat(quantidade) || 0,
      unidade,
      calorias: parseFloat(calorias) || 0,
      carboidratos: parseFloat(carbs) || 0,
      proteinas: parseFloat(prot) || 0,
      gorduras: parseFloat(gord) || 0,
    });
  }

  return (
    <div className="bg-purple-50 rounded-2xl p-4 space-y-3 border border-purple-100">
      {/* Nome + busca */}
      <div className="flex gap-2">
        <input
          placeholder="Nome do alimento..."
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="flex-1 text-sm bg-white border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-purple-400"
        />
        <button
          onClick={handleSearch}
          disabled={searching || !nome.trim()}
          className="p-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-40 transition-colors"
        >
          {searching ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
        </button>
      </div>

      {/* Resultados da busca */}
      {results.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
          {results.map((r, i) => (
            <button
              key={i}
              onClick={() => selectResult(r)}
              className="w-full text-left px-3 py-2.5 hover:bg-purple-50 transition-colors first:rounded-t-xl last:rounded-b-xl"
            >
              <p className="text-sm font-medium text-gray-800 truncate">{r.nome}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {r.calorias_100g} kcal · C:{r.carboidratos_100g}g · P:{r.proteinas_100g}g · G:{r.gorduras_100g}g (por 100g)
              </p>
            </button>
          ))}
        </div>
      )}

      {searched && results.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-1">Nenhum resultado. Preencha os valores manualmente.</p>
      )}

      {/* Quantidade + unidade */}
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Quantidade</label>
          <input
            type="number"
            value={quantidade}
            onChange={(e) => handleQtdChange(e.target.value)}
            className="w-full text-sm bg-white border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-purple-400 mt-1"
          />
        </div>
        <div className="w-24">
          <label className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Unidade</label>
          <select
            value={unidade}
            onChange={(e) => setUnidade(e.target.value)}
            className="w-full text-sm bg-white border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-purple-400 mt-1"
          >
            <option value="g">g</option>
            <option value="ml">ml</option>
            <option value="unid.">unid.</option>
            <option value="colher">colher</option>
            <option value="xícara">xícara</option>
          </select>
        </div>
      </div>

      {/* Macros */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Kcal", val: calorias, set: setCalorias },
          { label: "Carbs g", val: carbs, set: setCarbs },
          { label: "Prot g", val: prot, set: setProt },
          { label: "Gord g", val: gord, set: setGord },
        ].map(({ label, val, set }) => (
          <div key={label}>
            <label className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{label}</label>
            <input
              type="number"
              value={val}
              onChange={(e) => set(e.target.value)}
              placeholder="0"
              className="w-full text-sm bg-white border border-gray-200 rounded-xl px-2 py-2 outline-none focus:border-purple-400 mt-1"
            />
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleAdd}
          disabled={!nome.trim()}
          className="flex-1 bg-purple-600 text-white text-sm font-medium py-2 rounded-xl hover:bg-purple-700 disabled:opacity-40 transition-colors"
        >
          Adicionar alimento
        </button>
        <button onClick={onCancel} className="px-4 text-sm text-gray-500 hover:text-gray-700 rounded-xl hover:bg-white transition-colors">
          Cancelar
        </button>
      </div>
    </div>
  );
}

function RefeicaoCard({
  refeicao,
  checked,
  onToggle,
  onUpdate,
  onDelete,
}: {
  refeicao: { id: string; refeicao: string; ordem: number; alimentos: Alimento[] };
  checked: boolean;
  onToggle: () => void;
  onUpdate: (alimentos: Alimento[]) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState(false);
  const [addingFood, setAddingFood] = useState(false);

  const macros = refeicao.alimentos.reduce(
    (acc, a) => ({
      calorias: acc.calorias + a.calorias,
      carbs: acc.carbs + a.carboidratos,
      prot: acc.prot + a.proteinas,
      gord: acc.gord + a.gorduras,
    }),
    { calorias: 0, carbs: 0, prot: 0, gord: 0 }
  );

  function removeAlimento(id: string) {
    onUpdate(refeicao.alimentos.filter((a) => a.id !== id));
  }

  function addAlimento(a: Alimento) {
    onUpdate([...refeicao.alimentos, a]);
    setAddingFood(false);
  }

  return (
    <div className={cn(
      "bg-white rounded-2xl border shadow-sm transition-all",
      checked ? "border-green-200" : "border-gray-100"
    )}>
      {/* Header da refeição */}
      <div className="flex items-center gap-3 p-4">
        <button
          onClick={onToggle}
          className={cn(
            "w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
            checked ? "bg-green-500 border-green-500 text-white" : "border-gray-300 hover:border-green-400"
          )}
        >
          {checked && <Check size={14} strokeWidth={3} />}
        </button>

        <div className="flex-1 min-w-0">
          <p className={cn("text-sm font-semibold", checked ? "text-green-700 line-through" : "text-gray-800")}>
            {refeicao.refeicao}
          </p>
          {macros.calorias > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">
              {Math.round(macros.calorias)} kcal · C:{Math.round(macros.carbs)}g · P:{Math.round(macros.prot)}g · G:{Math.round(macros.gord)}g
            </p>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => { setEditing(!editing); setExpanded(true); }}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-purple-600 transition-colors"
          >
            <Pencil size={13} />
          </button>
          <button onClick={() => setExpanded(!expanded)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>
      </div>

      {/* Lista de alimentos */}
      {expanded && (
        <div className="px-4 pb-4 space-y-2">
          {refeicao.alimentos.length === 0 && !addingFood && (
            <p className="text-xs text-gray-400 text-center py-2">Nenhum alimento cadastrado</p>
          )}

          {refeicao.alimentos.map((a) => (
            <div key={a.id} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-700">{a.nome}</p>
                <p className="text-[10px] text-gray-400">
                  {a.quantidade}{a.unidade} · {Math.round(a.calorias)} kcal
                  {a.carboidratos > 0 && ` · C:${a.carboidratos}g`}
                  {a.proteinas > 0 && ` · P:${a.proteinas}g`}
                </p>
              </div>
              {editing && (
                <button onClick={() => removeAlimento(a.id)} className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0">
                  <X size={14} />
                </button>
              )}
            </div>
          ))}

          {addingFood && (
            <AlimentoForm onAdd={addAlimento} onCancel={() => setAddingFood(false)} />
          )}

          {editing && !addingFood && (
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setAddingFood(true)}
                className="flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-700 font-medium"
              >
                <Plus size={13} /> Adicionar alimento
              </button>
              <span className="text-gray-200">·</span>
              <button
                onClick={onDelete}
                className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 font-medium"
              >
                <Trash2 size={13} /> Remover refeição
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function DietaPage() {
  const { plano, loading, addRefeicao, deleteRefeicao, updateAlimentos, toggleCheckin, isChecked, macrosHoje, macrosTotal } = useDieta();
  const [addingRefeicao, setAddingRefeicao] = useState(false);
  const [novaRefeicao, setNovaRefeicao] = useState("");
  const [customNome, setCustomNome] = useState(false);

  const hoje = macrosHoje();
  const total = macrosTotal();
  const progresso = total.calorias > 0 ? Math.min((hoje.calorias / total.calorias) * 100, 100) : 0;
  const refeicoesConcluidas = plano.filter((r) => isChecked(r.id)).length;

  async function handleAddRefeicao() {
    if (!novaRefeicao.trim()) return;
    await addRefeicao(novaRefeicao.trim());
    setNovaRefeicao("");
    setAddingRefeicao(false);
    setCustomNome(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={24} className="animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-sm">
            <Salad size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Dieta</h1>
            <p className="text-xs text-gray-400">
              {refeicoesConcluidas}/{plano.length} refeições hoje
            </p>
          </div>
        </div>
        <button
          onClick={() => setAddingRefeicao(true)}
          className="flex items-center gap-2 bg-purple-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-purple-700 transition-colors shadow-sm"
        >
          <Plus size={16} /> Nova refeição
        </button>
      </div>

      {/* Resumo de macros */}
      {total.calorias > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">Macros do dia</p>
            <p className="text-xs text-gray-400">
              {Math.round(hoje.calorias)} / {Math.round(total.calorias)} kcal
            </p>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all"
              style={{ width: `${progresso}%` }}
            />
          </div>
          <div className="grid grid-cols-4 gap-2">
            <MacroCard label="Calorias" value={hoje.calorias} unit="kcal" color="bg-orange-50 text-orange-700" />
            <MacroCard label="Carboidr." value={hoje.carboidratos} unit="g" color="bg-yellow-50 text-yellow-700" />
            <MacroCard label="Proteína" value={hoje.proteinas} unit="g" color="bg-blue-50 text-blue-700" />
            <MacroCard label="Gordura" value={hoje.gorduras} unit="g" color="bg-pink-50 text-pink-700" />
          </div>
          <p className="text-[10px] text-gray-400 text-center">Baseado nas refeições marcadas como feitas</p>
        </div>
      )}

      {/* Adicionar refeição */}
      {addingRefeicao && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
          <p className="text-sm font-semibold text-gray-700">Qual refeição?</p>
          {!customNome ? (
            <div className="grid grid-cols-2 gap-2">
              {REFEICOES_SUGERIDAS.map((r) => (
                <button
                  key={r}
                  onClick={() => setNovaRefeicao(r)}
                  className={cn(
                    "text-sm px-3 py-2 rounded-xl border text-left transition-all",
                    novaRefeicao === r
                      ? "bg-purple-50 border-purple-300 text-purple-700 font-medium"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  )}
                >
                  {r}
                </button>
              ))}
              <button
                onClick={() => { setCustomNome(true); setNovaRefeicao(""); }}
                className="text-sm px-3 py-2 rounded-xl border border-dashed border-gray-300 text-gray-400 hover:border-gray-400 col-span-2 text-center"
              >
                Outro nome...
              </button>
            </div>
          ) : (
            <input
              autoFocus
              placeholder="Nome da refeição..."
              value={novaRefeicao}
              onChange={(e) => setNovaRefeicao(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddRefeicao()}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-purple-400"
            />
          )}
          <div className="flex gap-2">
            <button
              onClick={handleAddRefeicao}
              disabled={!novaRefeicao.trim()}
              className="flex-1 bg-purple-600 text-white text-sm font-medium py-2 rounded-xl hover:bg-purple-700 disabled:opacity-40 transition-colors"
            >
              Adicionar
            </button>
            <button onClick={() => { setAddingRefeicao(false); setNovaRefeicao(""); setCustomNome(false); }} className="px-4 text-sm text-gray-500 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de refeições */}
      {plano.length === 0 && !addingRefeicao ? (
        <div className="text-center py-16 text-gray-400">
          <Salad size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">Nenhuma refeição cadastrada</p>
          <p className="text-xs mt-1">Adicione as refeições que sua nutricionista passou</p>
        </div>
      ) : (
        <div className="space-y-3">
          {plano.map((ref) => (
            <RefeicaoCard
              key={ref.id}
              refeicao={ref}
              checked={isChecked(ref.id)}
              onToggle={() => toggleCheckin(ref.id, isChecked(ref.id))}
              onUpdate={(alimentos) => updateAlimentos(ref.id, alimentos)}
              onDelete={() => deleteRefeicao(ref.id)}
            />
          ))}
        </div>
      )}

      {plano.length > 0 && refeicoesConcluidas === plano.length && (
        <div className="flex items-center gap-2 justify-center py-3 text-green-600">
          <CheckCircle2 size={18} />
          <p className="text-sm font-semibold">Todas as refeições do dia concluídas!</p>
        </div>
      )}
    </div>
  );
}
