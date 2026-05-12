"use client";

import { useState } from "react";
import { Target, TrendingUp, Plus, X, Settings2, Trash2 } from "lucide-react";
import { DailyChecklist } from "@/components/metas/DailyChecklist";
import { useMetas, useDailyChecks, useMetaHistory } from "@/lib/hooks/useMetas";
import { todayISO, isoDateRange, formatDate } from "@/lib/utils/date";
import type { Meta } from "@/types";
import { cn } from "@/lib/utils/cn";

const ICON_OPTIONS = ["BookOpen","BookMarked","Droplets","Apple","Dumbbell","Zap","Star","Heart","Sun","Moon","Coffee","Music","Smile"];

const PRESETS = [
  { type: "leitura"   as const, label: "Leitura",     icon: "BookMarked", color: "#F59E0B", target: 20,  targetUnit: "páginas" },
  { type: "devocional"as const, label: "Devocional",   icon: "Star",       color: "#A78BFA", target: undefined, targetUnit: undefined },
  { type: "agua"      as const, label: "Água",          icon: "Droplets",   color: "#06B6D4", target: 8,   targetUnit: "copos" },
  { type: "exercicio" as const, label: "Exercício",     icon: "Dumbbell",   color: "#22C55E", target: undefined, targetUnit: undefined },
  { type: "dieta"     as const, label: "Dieta",         icon: "Apple",      color: "#F97316", target: undefined, targetUnit: undefined },
  { type: "skincare"  as const, label: "Skincare",      icon: "Sparkles",   color: "#EC4899", target: undefined, targetUnit: undefined },
];
const COLOR_OPTIONS = ["#A78BFA","#3B82F6","#22C55E","#F97316","#EC4899","#EF4444","#F59E0B","#06B6D4","#8B5CF6","#64748B"];

function MetaHistoryRow({ metaId, days = 7 }: { metaId: number; days?: number }) {
  const checks = useMetaHistory(metaId, days);
  const today = todayISO();
  const dates = isoDateRange(
    (() => { const d = new Date(); d.setDate(d.getDate() - days + 1); return d.toISOString().split("T")[0]; })(),
    days
  );

  return (
    <div className="flex gap-1">
      {dates.map((date) => {
        const check = checks.find((c) => c.date === date);
        const isToday = date === today;
        return (
          <div
            key={date}
            title={formatDate(date)}
            className={`w-7 h-7 rounded-lg flex-shrink-0 transition-all ${
              check?.completed ? "bg-purple-500" : isToday ? "bg-purple-100 border-2 border-purple-300" : "bg-gray-100"
            }`}
          />
        );
      })}
    </div>
  );
}

function MetaFormModal({ onSave, onClose, initial }: {
  onSave: (data: Omit<Meta, "id" | "createdAt">) => void;
  onClose: () => void;
  initial?: Meta;
}) {
  const [label, setLabel]   = useState(initial?.label ?? "");
  const [color, setColor]   = useState(initial?.color ?? "#A78BFA");
  const [icon, setIcon]     = useState(initial?.icon ?? "Star");
  const [hasTarget, setHasTarget] = useState(!!(initial?.target));
  const [target, setTarget] = useState(String(initial?.target ?? "8"));
  const [targetUnit, setTargetUnit] = useState(initial?.targetUnit ?? "vezes");

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end md:items-center justify-center z-50 px-4 pb-4 md:pb-0">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-900">{initial ? "Editar meta" : "Nova meta"}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={16} className="text-gray-400" /></button>
        </div>

        <input
          autoFocus
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Nome da meta (ex: Meditar, Leitura...)"
          className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-purple-300"
        />

        <div>
          <p className="text-xs text-gray-500 mb-2 font-medium">Cor</p>
          <div className="flex gap-2 flex-wrap">
            {COLOR_OPTIONS.map((c) => (
              <button key={c} onClick={() => setColor(c)} style={{ backgroundColor: c }}
                className={cn("w-7 h-7 rounded-full transition-all", color === c ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : "hover:scale-105")} />
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-500 mb-2 font-medium">Ícone</p>
          <div className="flex gap-2 flex-wrap">
            {ICON_OPTIONS.map((ic) => (
              <button key={ic} onClick={() => setIcon(ic)}
                className={cn("text-[10px] px-2 py-1 rounded-lg border transition-all font-medium",
                  icon === ic ? "bg-purple-100 border-purple-300 text-purple-700" : "bg-gray-50 border-gray-200 text-gray-500")}>
                {ic}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input type="checkbox" id="has-target" checked={hasTarget} onChange={(e) => setHasTarget(e.target.checked)} className="w-4 h-4 accent-purple-600" />
          <label htmlFor="has-target" className="text-sm text-gray-600 font-medium">Meta com contador (ex: copos d'água)</label>
        </div>

        {hasTarget && (
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">Meta</label>
              <input type="number" min={1} value={target} onChange={(e) => setTarget(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-purple-300" />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">Unidade</label>
              <input value={targetUnit} onChange={(e) => setTargetUnit(e.target.value)} placeholder="copos, min..."
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-purple-300" />
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button
            onClick={() => {
              if (!label.trim()) return;
              onSave({
                type: "custom",
                label: label.trim(),
                icon,
                color,
                isActive: true,
                order: 99,
                target: hasTarget ? parseInt(target) || undefined : undefined,
                targetUnit: hasTarget ? targetUnit : undefined,
              });
            }}
            disabled={!label.trim()}
            className="flex-1 text-sm font-medium bg-purple-600 text-white rounded-xl py-2.5 hover:bg-purple-700 disabled:opacity-40 transition-colors"
          >
            {initial ? "Salvar" : "Criar meta"}
          </button>
          <button onClick={onClose} className="px-4 text-sm text-gray-500 hover:text-gray-700 rounded-xl hover:bg-gray-100">Cancelar</button>
        </div>
      </div>
    </div>
  );
}

export default function MetasPage() {
  const today = todayISO();
  const { metas, createMeta, updateMeta, deleteMeta } = useMetas();
  const { isChecked } = useDailyChecks(today);
  const [showForm, setShowForm] = useState(false);
  const [editingMeta, setEditingMeta] = useState<Meta | null>(null);

  const done = metas.filter((m) => isChecked(m.id!)).length;
  const total = metas.length;
  const rate = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="max-w-lg mx-auto space-y-6 py-2">
      <div className="flex items-center justify-between md:flex hidden">
        <h1 className="text-xl font-bold text-gray-900">Metas do Dia</h1>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 text-sm text-purple-600 font-medium hover:text-purple-700">
          <Plus size={16} /> Nova meta
        </button>
      </div>

      {/* Modal de criação */}
      {showForm && (
        <MetaFormModal
          onSave={async (data) => { await createMeta(data); setShowForm(false); }}
          onClose={() => setShowForm(false)}
        />
      )}
      {editingMeta && (
        <MetaFormModal
          initial={editingMeta}
          onSave={async (data) => { await updateMeta(editingMeta.id!, data); setEditingMeta(null); }}
          onClose={() => setEditingMeta(null)}
        />
      )}

      {/* Progress hero */}
      <div className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-3xl p-5 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-purple-100 text-sm">Hoje</p>
            <p className="text-3xl font-bold">{rate}%</p>
            <p className="text-purple-200 text-sm">{done} de {total} metas</p>
          </div>
          <div className="w-16 h-16 rounded-full border-4 border-white/30 flex items-center justify-center relative">
            <Target size={24} />
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="4" />
              <circle cx="32" cy="32" r="28" fill="none" stroke="white" strokeWidth="4"
                strokeDasharray={`${2 * Math.PI * 28}`}
                strokeDashoffset={`${2 * Math.PI * 28 * (1 - rate / 100)}`}
                strokeLinecap="round" />
            </svg>
          </div>
        </div>
        {total > 0 && (
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: `${rate}%` }} />
          </div>
        )}
      </div>

      {/* Quick-add presets */}
      {PRESETS.some((p) => !metas.find((m) => m.type === p.type)) && (
        <section>
          <p className="text-xs font-medium text-gray-400 mb-2">Adicionar rapidamente</p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.filter((p) => !metas.find((m) => m.type === p.type)).map((p) => (
              <button
                key={p.type}
                onClick={() => createMeta({ type: p.type, label: p.label, icon: p.icon, color: p.color, isActive: true, order: metas.length, target: p.target, targetUnit: p.targetUnit })}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-800 transition-colors"
                style={{ borderLeftColor: p.color, borderLeftWidth: 3 }}
              >
                <span style={{ color: p.color }}>+</span> {p.label}
                {p.targetUnit && <span className="text-gray-400">· {p.targetUnit}</span>}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Checklist */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-900">Marcar metas de hoje</h2>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1 text-xs text-purple-600 font-medium hover:text-purple-700 md:hidden">
            <Plus size={14} /> Nova
          </button>
        </div>
        <DailyChecklist date={today} />
      </section>

      {/* History + gerenciar */}
      {metas.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-purple-500" />
            <h2 className="text-base font-bold text-gray-900">Histórico — últimos 7 dias</h2>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
            {metas.map((meta) => (
              <div key={meta.id} className="px-4 py-3 flex items-center justify-between gap-3 group">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: meta.color }} />
                  <span className="text-sm font-medium text-gray-700 truncate">{meta.label}</span>
                </div>
                <MetaHistoryRow metaId={meta.id!} />
                <div className="flex gap-1 opacity-60 group-hover:opacity-100 transition-opacity ml-1">
                  <button onClick={() => setEditingMeta(meta)} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-purple-600 transition-colors">
                    <Settings2 size={13} />
                  </button>
                  <button onClick={() => deleteMeta(meta.id!)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
