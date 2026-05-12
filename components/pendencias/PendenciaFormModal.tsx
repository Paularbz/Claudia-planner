"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { usePendencias, usePendenciaById } from "@/lib/hooks/usePendencias";
import { CATEGORIES, CATEGORY_CONFIG, TIME_RESTRICTION_LABELS } from "@/lib/constants/categories";
import { todayISO } from "@/lib/utils/date";
import type { Category, Priority, TimeRestrictionType } from "@/types";

interface PendenciaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendenciaId?: number | null;
}

const CATEGORY_OPTIONS = CATEGORIES.map((c) => ({ value: c, label: CATEGORY_CONFIG[c].label }));
const PRIORITY_OPTIONS = [
  { value: "Baixa", label: "Baixa" },
  { value: "Média", label: "Média" },
  { value: "Alta", label: "Alta" },
  { value: "Urgente", label: "Urgente" },
];
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
const ALL_RESTRICTIONS = Object.keys(TIME_RESTRICTION_LABELS) as TimeRestrictionType[];

export function PendenciaFormModal({ isOpen, onClose, pendenciaId }: PendenciaFormModalProps) {
  const { createPendencia, updatePendencia } = usePendencias();
  const existing = usePendenciaById(pendenciaId ?? null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [estimatedMinutes, setEstimatedMinutes] = useState("30");
  const [category, setCategory] = useState<Category>("Profissional");
  const [priority, setPriority] = useState<Priority>("Média");
  const [deadline, setDeadline] = useState("");
  const [notes, setNotes] = useState("");
  const [restrictions, setRestrictions] = useState<TimeRestrictionType[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existing) {
      setTitle(existing.title);
      setDescription(existing.description ?? "");
      setEstimatedMinutes(existing.estimatedMinutes.toString());
      setCategory(existing.category);
      setPriority(existing.priority);
      setDeadline(existing.deadline ?? "");
      setNotes(existing.notes ?? "");
      setRestrictions(existing.timeRestrictions ?? []);
    } else {
      setTitle(""); setDescription(""); setEstimatedMinutes("30");
      setCategory("Profissional"); setPriority("Média"); setDeadline("");
      setNotes(""); setRestrictions([]);
    }
  }, [existing, pendenciaId]);

  function toggleRestriction(r: TimeRestrictionType) {
    setRestrictions((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]
    );
  }

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        estimatedMinutes: parseInt(estimatedMinutes),
        category,
        priority,
        status: "Aberta" as const,
        deadline: deadline || undefined,
        notes: notes.trim() || undefined,
        timeRestrictions: restrictions.length ? restrictions : undefined,
      };
      if (pendenciaId && existing) {
        await updatePendencia(pendenciaId, payload);
      } else {
        await createPendencia(payload);
      }
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={pendenciaId ? "Editar Pendência" : "Nova Pendência"} size="md">
      <div className="px-6 py-4 space-y-4">
        <Input
          label="Título *"
          placeholder="O que precisa ser feito?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Textarea
          label="Descrição"
          placeholder="Mais detalhes..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Categoria"
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            options={CATEGORY_OPTIONS}
          />
          <Select
            label="Prioridade"
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            options={PRIORITY_OPTIONS}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Duração estimada"
            value={estimatedMinutes}
            onChange={(e) => setEstimatedMinutes(e.target.value)}
            options={DURATION_OPTIONS}
          />
          <Input
            label="Prazo (opcional)"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            min={todayISO()}
          />
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Restrições de horário</p>
          <div className="flex flex-wrap gap-2">
            {ALL_RESTRICTIONS.map((r) => (
              <button
                key={r}
                onClick={() => toggleRestriction(r)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                  restrictions.includes(r)
                    ? "bg-purple-600 text-white border-purple-600"
                    : "bg-white text-gray-600 border-gray-200 hover:border-purple-300"
                }`}
              >
                {TIME_RESTRICTION_LABELS[r]}
              </button>
            ))}
          </div>
        </div>

        <Textarea
          label="Observações"
          placeholder="Notas extras..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
        />
      </div>
      <div className="px-6 pb-6 pt-2 flex gap-3 border-t border-gray-100 mt-2">
        <Button variant="outline" fullWidth onClick={onClose}>Cancelar</Button>
        <Button fullWidth onClick={handleSave} loading={saving} disabled={!title.trim()}>
          {pendenciaId ? "Salvar" : "Criar Pendência"}
        </Button>
      </div>
    </Modal>
  );
}
