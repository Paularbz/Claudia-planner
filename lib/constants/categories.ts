import type { Category } from "@/types";

export const CATEGORY_CONFIG: Record<Category, { color: string; bg: string; light: string; label: string }> = {
  "Profissional":    { color: "#3B82F6", bg: "bg-blue-500",   light: "bg-blue-50 text-blue-700",   label: "Profissional" },
  "Saúde":           { color: "#22C55E", bg: "bg-green-500",  light: "bg-green-50 text-green-700", label: "Saúde" },
  "Atividade Física": { color: "#10B981", bg: "bg-emerald-500", light: "bg-emerald-50 text-emerald-700", label: "Atividade Física" },
  "Pessoal":         { color: "#EC4899", bg: "bg-pink-500",   light: "bg-pink-50 text-pink-700",   label: "Pessoal" },
  "Espiritualidade": { color: "#A78BFA", bg: "bg-violet-400", light: "bg-violet-50 text-violet-700", label: "Espiritualidade" },
  "Rotina":          { color: "#EAB308", bg: "bg-yellow-500", light: "bg-yellow-50 text-yellow-700", label: "Rotina" },
  "Estudos":         { color: "#8B5CF6", bg: "bg-purple-500", light: "bg-purple-50 text-purple-700", label: "Estudos" },
  "Casa":            { color: "#F97316", bg: "bg-orange-500", light: "bg-orange-50 text-orange-700", label: "Casa" },
  "Casamento":       { color: "#F43F8A", bg: "bg-rose-500",   light: "bg-rose-50 text-rose-700",   label: "Casamento" },
  "Outros":          { color: "#6B7280", bg: "bg-gray-500",   light: "bg-gray-50 text-gray-700",   label: "Outros" },
};

export const CATEGORIES = Object.keys(CATEGORY_CONFIG) as Category[];

export const PRIORITY_CONFIG = {
  "":        { label: "",        color: "",                              dot: "bg-gray-200",   order: -1 },
  "Baixa":   { label: "Baixa",   color: "bg-gray-100 text-gray-600",   dot: "bg-gray-400",   order: 0 },
  "Média":   { label: "Média",   color: "bg-blue-100 text-blue-700",   dot: "bg-blue-400",   order: 1 },
  "Alta":    { label: "Alta",    color: "bg-orange-100 text-orange-700", dot: "bg-orange-400", order: 2 },
  "Urgente": { label: "Urgente", color: "bg-red-100 text-red-700",     dot: "bg-red-500",    order: 3 },
};

export const TASK_STATUS_CONFIG = {
  "":             { label: "",             color: "",                              icon: "Circle" },
  "A fazer":      { label: "A fazer",      color: "bg-gray-100 text-gray-600",   icon: "Circle" },
  "Em andamento": { label: "Em andamento", color: "bg-blue-100 text-blue-700",   icon: "Clock" },
  "Concluída":    { label: "Concluída",    color: "bg-green-100 text-green-700", icon: "CheckCircle2" },
  "Adiada":       { label: "Adiada",      color: "bg-yellow-100 text-yellow-700", icon: "PauseCircle" },
  "Cancelada":    { label: "Cancelada",   color: "bg-red-100 text-red-700",     icon: "XCircle" },
};

export const PENDENCIA_STATUS_CONFIG = {
  "Aberta":    { label: "Aberta",    color: "bg-gray-100 text-gray-600" },
  "Agendada":  { label: "Agendada",  color: "bg-blue-100 text-blue-700" },
  "Concluída": { label: "Concluída", color: "bg-green-100 text-green-700" },
  "Cancelada": { label: "Cancelada", color: "bg-red-100 text-red-700" },
};

export const TIME_RESTRICTION_LABELS: Record<string, string> = {
  only_morning:   "Somente manhã (antes das 12h)",
  only_afternoon: "Somente tarde (12h–18h)",
  only_evening:   "Somente noite (após 18h)",
  not_weekend:    "Somente dias úteis",
  only_weekend:   "Somente fins de semana",
};
