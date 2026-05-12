"use client";

import Dexie from "dexie";
import type {
  Task, Pendencia, Meta, MetaCheck,
  Insight, EstudoItem, Projeto, ProjetoTask,
  AnotacaoEspiritual, PedidoOracao, VersiculoSalvo, LeituraBiblica, EstudoEstacao,
} from "@/types";

export class PlannerDatabase extends Dexie {
  tasks!: Dexie.Table<Task, number>;
  pendencias!: Dexie.Table<Pendencia, number>;
  metas!: Dexie.Table<Meta, number>;
  metaChecks!: Dexie.Table<MetaCheck, number>;
  insights!: Dexie.Table<Insight, number>;
  estudos!: Dexie.Table<EstudoItem, number>;
  projetos!: Dexie.Table<Projeto, number>;
  projetoTasks!: Dexie.Table<ProjetoTask, number>;
  anotacoesEspirituais!: Dexie.Table<AnotacaoEspiritual, number>;
  pedidosOracao!: Dexie.Table<PedidoOracao, number>;
  versiculosSalvos!: Dexie.Table<VersiculoSalvo, number>;
  leiturasBiblicas!: Dexie.Table<LeituraBiblica, number>;
  estudosEstacao!: Dexie.Table<EstudoEstacao, number>;

  constructor() {
    super("AmandaPlanner");
    this.version(1).stores({
      tasks: "++id, date, status, priority, category, pendenciaId, createdAt",
      pendencias: "++id, status, priority, category, deadline, taskId, createdAt",
      metas: "++id, type, isActive, order",
      metaChecks: "++id, metaId, date, [metaId+date]",
    });
    this.version(2).stores({
      tasks: "++id, date, status, priority, category, pendenciaId, createdAt",
      pendencias: "++id, status, priority, category, deadline, taskId, createdAt",
      metas: "++id, type, isActive, order",
      metaChecks: "++id, metaId, date, [metaId+date]",
      insights: "++id, category, createdAt",
      estudos: "++id, status, source, category, priority, insightId, createdAt",
      projetos: "++id, status, prazo, order, createdAt",
      projetoTasks: "++id, projetoId, status, priority, order, createdAt",
      anotacoesEspirituais: "++id, date, category, createdAt",
      pedidosOracao: "++id, answered, createdAt",
      versiculosSalvos: "++id, date, theme, createdAt",
      leiturasBiblicas: "++id, livro, date, createdAt",
      estudosEstacao: "++id, estacao, semana, date, completed, createdAt",
    });
  }
}

let _db: PlannerDatabase | null = null;

export function getDb(): PlannerDatabase {
  if (!_db) _db = new PlannerDatabase();
  return _db;
}

export const db = typeof window !== "undefined" ? getDb() : null as unknown as PlannerDatabase;

const now = () => new Date().toISOString();

let seedingInProgress = false;

const DEFAULT_META_TYPES = ["devocional", "agua", "dieta", "exercicio", "skincare"];

export async function seedDefaultMetas() {
  if (seedingInProgress) return;
  seedingInProgress = true;
  try {
    const database = getDb();

    // Remove duplicates — keep only the first of each type
    const allMetas = await database.metas.toArray();
    const seen = new Set<string>();
    const toDelete: number[] = [];
    for (const meta of allMetas) {
      if (seen.has(meta.type)) {
        if (meta.id !== undefined) toDelete.push(meta.id);
      } else {
        seen.add(meta.type);
      }
    }
    if (toDelete.length > 0) await database.metas.bulkDelete(toDelete);

    // Seed only missing types
    const existing = await database.metas.toArray();
    const existingTypes = new Set(existing.map((m) => m.type));
    const defaults: Meta[] = [
      { type: "devocional", label: "Devocional", icon: "BookOpen", color: "#A78BFA", isActive: true, order: 0, createdAt: now() },
      { type: "agua", label: "Beber água", icon: "Droplets", color: "#3B82F6", isActive: true, order: 1, target: 8, targetUnit: "copos", createdAt: now() },
      { type: "dieta", label: "Dieta", icon: "Apple", color: "#22C55E", isActive: true, order: 2, createdAt: now() },
      { type: "exercicio", label: "Exercício", icon: "Dumbbell", color: "#F97316", isActive: true, order: 3, createdAt: now() },
      { type: "skincare", label: "Skincare", icon: "Sparkles", color: "#EC4899", isActive: true, order: 4, createdAt: now() },
    ];
    const toAdd = defaults.filter((d) => !existingTypes.has(d.type));
    if (toAdd.length > 0) await database.metas.bulkAdd(toAdd);
  } finally {
    seedingInProgress = false;
  }
}
