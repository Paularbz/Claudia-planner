-- ================================================================
-- Amanda Planner — Schema completo para Supabase
-- Execute no SQL Editor do Supabase (New query → cola tudo → Run)
-- ================================================================

-- Habilitar extensão UUID
create extension if not exists "uuid-ossp";

-- ── Tasks ─────────────────────────────────────────────────────────
create table tasks (
  id          bigint primary key generated always as identity,
  user_id     uuid references auth.users(id) on delete cascade not null,
  title       text not null,
  description text,
  date        date not null,
  start_time  time,
  end_time    time,
  estimated_minutes int,
  category    text not null default 'Outros',
  priority    text not null default 'Média',
  status      text not null default 'A fazer',
  notes       text,
  pendencia_id bigint,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── Pendências ────────────────────────────────────────────────────
create table pendencias (
  id                bigint primary key generated always as identity,
  user_id           uuid references auth.users(id) on delete cascade not null,
  title             text not null,
  description       text,
  deadline          date,
  estimated_minutes int not null default 30,
  category          text not null default 'Outros',
  priority          text not null default 'Média',
  status            text not null default 'Aberta',
  notes             text,
  time_restrictions text[] default '{}',
  task_id           bigint,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ── Metas ─────────────────────────────────────────────────────────
create table metas (
  id          bigint primary key generated always as identity,
  user_id     uuid references auth.users(id) on delete cascade not null,
  type        text not null,
  label       text not null,
  icon        text not null,
  color       text not null,
  is_active   boolean not null default true,
  "order"     int not null default 0,
  target      int,
  target_unit text,
  created_at  timestamptz not null default now()
);

create unique index metas_user_type_idx on metas(user_id, type);

-- ── Meta Checks ───────────────────────────────────────────────────
create table meta_checks (
  id           bigint primary key generated always as identity,
  user_id      uuid references auth.users(id) on delete cascade not null,
  meta_id      bigint references metas(id) on delete cascade not null,
  date         date not null,
  completed    boolean not null default false,
  value        int,
  completed_at timestamptz,
  unique(user_id, meta_id, date)
);

-- ── Insights ──────────────────────────────────────────────────────
create table insights (
  id                bigint primary key generated always as identity,
  user_id           uuid references auth.users(id) on delete cascade not null,
  title             text not null,
  content           text not null,
  category          text not null default 'ideia',
  tags              text[] default '{}',
  linked_task_id    bigint,
  linked_estudo_id  bigint,
  linked_projeto_id bigint,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ── Estudos ───────────────────────────────────────────────────────
create table estudos (
  id             bigint primary key generated always as identity,
  user_id        uuid references auth.users(id) on delete cascade not null,
  title          text not null,
  description    text,
  source         text not null default 'outro',
  url            text,
  author         text,
  category       text not null default 'Estudos',
  priority       text not null default 'Média',
  status         text not null default 'quero estudar',
  tags           text[] default '{}',
  notes          text,
  insight_id     bigint references insights(id) on delete set null,
  scheduled_date date,
  completed_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ── Projetos ──────────────────────────────────────────────────────
create table projetos (
  id          bigint primary key generated always as identity,
  user_id     uuid references auth.users(id) on delete cascade not null,
  title       text not null,
  description text,
  status      text not null default 'ativo',
  color       text not null default '#8B5CF6',
  deadline    date,
  prazo       text not null default 'medio',
  "order"     int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── Projeto Tasks ─────────────────────────────────────────────────
create table projeto_tasks (
  id           bigint primary key generated always as identity,
  user_id      uuid references auth.users(id) on delete cascade not null,
  projeto_id   bigint references projetos(id) on delete cascade not null,
  title        text not null,
  description  text,
  status       text not null default 'A fazer',
  priority     text not null default 'Média',
  due_date     date,
  task_id      bigint,
  "order"      int not null default 0,
  completed    boolean not null default false,
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ── Anotações Espirituais ─────────────────────────────────────────
create table anotacoes_espirituais (
  id         bigint primary key generated always as identity,
  user_id    uuid references auth.users(id) on delete cascade not null,
  date       date not null,
  content    text not null,
  category   text not null default 'reflexao',
  versiculo  text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Pedidos de Oração ─────────────────────────────────────────────
create table pedidos_oracao (
  id            bigint primary key generated always as identity,
  user_id       uuid references auth.users(id) on delete cascade not null,
  title         text not null,
  description   text,
  answered      boolean not null default false,
  answered_at   timestamptz,
  answered_note text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ── Versículos Salvos ─────────────────────────────────────────────
create table versiculos_salvos (
  id        bigint primary key generated always as identity,
  user_id   uuid references auth.users(id) on delete cascade not null,
  reference text not null,
  text      text not null,
  theme     text,
  date      date not null default current_date,
  created_at timestamptz not null default now()
);

-- ── Leituras Bíblicas ─────────────────────────────────────────────
create table leituras_biblicas (
  id         bigint primary key generated always as identity,
  user_id    uuid references auth.users(id) on delete cascade not null,
  livro      text not null,
  capitulo   int not null,
  date       date not null default current_date,
  notes      text,
  created_at timestamptz not null default now()
);

-- ── Estudos das Estações ──────────────────────────────────────────
create table estudos_estacao (
  id         bigint primary key generated always as identity,
  user_id    uuid references auth.users(id) on delete cascade not null,
  estacao    text not null,
  semana     int not null default 1,
  titulo     text not null,
  conteudo   text,
  versiculo  text,
  date       date not null default current_date,
  completed  boolean not null default false,
  anotacoes  text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ================================================================
-- Row Level Security — cada usuário vê só os próprios dados
-- ================================================================

alter table tasks                enable row level security;
alter table pendencias           enable row level security;
alter table metas                enable row level security;
alter table meta_checks          enable row level security;
alter table insights             enable row level security;
alter table estudos              enable row level security;
alter table projetos             enable row level security;
alter table projeto_tasks        enable row level security;
alter table anotacoes_espirituais enable row level security;
alter table pedidos_oracao       enable row level security;
alter table versiculos_salvos    enable row level security;
alter table leituras_biblicas    enable row level security;
alter table estudos_estacao      enable row level security;

-- Políticas: usuário autenticado acessa apenas seus próprios registros
do $$
declare
  t text;
begin
  foreach t in array array[
    'tasks','pendencias','metas','meta_checks','insights','estudos',
    'projetos','projeto_tasks','anotacoes_espirituais','pedidos_oracao',
    'versiculos_salvos','leituras_biblicas','estudos_estacao'
  ] loop
    execute format('
      create policy "%s_own" on %s
      for all using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
    ', t, t);
  end loop;
end;
$$;

-- ================================================================
-- Updated_at automático
-- ================================================================

create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'tasks','pendencias','insights','estudos','projetos','projeto_tasks',
    'anotacoes_espirituais','pedidos_oracao','estudos_estacao'
  ] loop
    execute format('
      create trigger trg_%s_updated_at
      before update on %s
      for each row execute function update_updated_at();
    ', t, t);
  end loop;
end;
$$;
