create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  type text not null default 'business_os',
  questionnaire jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notion_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  workspace_id text not null,
  workspace_name text,
  bot_id text not null,
  owner jsonb not null default '{}'::jsonb,
  access_token_encrypted text not null,
  status text not null default 'active' check (status in ('active', 'revoked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, workspace_id)
);

create table if not exists public.generated_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  template_name text not null,
  blueprint jsonb not null,
  status text not null default 'generated' check (status in ('generated', 'installed', 'failed')),
  installed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.installation_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  generated_template_id uuid references public.generated_templates(id) on delete set null,
  notion_connection_id uuid references public.notion_connections(id) on delete set null,
  destination_page_id text,
  dashboard_page_id text,
  status text not null check (status in ('success', 'partial', 'failed')),
  logs jsonb not null default '[]'::jsonb,
  error_message text,
  created_at timestamptz not null default now()
);

create table if not exists public.usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  event text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;
alter table public.projects enable row level security;
alter table public.notion_connections enable row level security;
alter table public.generated_templates enable row level security;
alter table public.installation_logs enable row level security;
alter table public.usage_logs enable row level security;

create policy "Users can read self" on public.users
  for select to authenticated using (auth.uid() = id);

create policy "Users can read own projects" on public.projects
  for select to authenticated using (auth.uid() = user_id);

create policy "Users can read own templates" on public.generated_templates
  for select to authenticated using (auth.uid() = user_id);

create policy "Users can read own installation logs" on public.installation_logs
  for select to authenticated using (auth.uid() = user_id);

create policy "Users can read own usage logs" on public.usage_logs
  for select to authenticated using (auth.uid() = user_id);

create index if not exists projects_user_id_idx on public.projects(user_id);
create index if not exists generated_templates_user_id_idx on public.generated_templates(user_id);
create index if not exists notion_connections_user_id_idx on public.notion_connections(user_id);
create index if not exists usage_logs_rate_limit_idx on public.usage_logs(user_id, event, created_at desc);
