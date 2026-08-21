-- ViralLab Phase 1 foundation: projects + normalized videos + analysis outputs.
-- Safe to run after supabase/schema.sql.

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  niche text,
  default_platform text not null default 'youtube',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  platform text not null,
  external_id text not null,
  title text not null,
  channel_name text,
  url text,
  thumbnail_url text,
  published_at timestamptz,
  views bigint not null default 0,
  likes bigint not null default 0,
  comments bigint not null default 0,
  duration_seconds integer,
  viral_score integer check (viral_score between 0 and 100),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id, platform, external_id)
);

create table if not exists public.analysis_runs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  status text not null default 'queued' check (status in ('queued','running','completed','failed')),
  analysis_type text not null default 'quick',
  summary jsonb not null default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.patterns (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  analysis_run_id uuid references public.analysis_runs(id) on delete cascade,
  name text not null,
  category text,
  evidence jsonb not null default '{}'::jsonb,
  score numeric(5,2),
  created_at timestamptz not null default now()
);

create table if not exists public.blueprints (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  analysis_run_id uuid references public.analysis_runs(id) on delete cascade,
  title text not null,
  hook text,
  script text,
  shot_list jsonb not null default '[]'::jsonb,
  cta text,
  originality_notes text,
  created_at timestamptz not null default now()
);

create index if not exists projects_user_id_idx on public.projects(user_id);
create index if not exists videos_project_id_idx on public.videos(project_id);
create index if not exists videos_platform_published_idx on public.videos(platform, published_at desc);
create index if not exists analysis_runs_project_id_idx on public.analysis_runs(project_id);
create index if not exists patterns_project_id_idx on public.patterns(project_id);
create index if not exists blueprints_project_id_idx on public.blueprints(project_id);

alter table public.projects enable row level security;
alter table public.videos enable row level security;
alter table public.analysis_runs enable row level security;
alter table public.patterns enable row level security;
alter table public.blueprints enable row level security;

drop policy if exists "projects_select_own" on public.projects;
create policy "projects_select_own" on public.projects for select using (auth.uid() = user_id);
drop policy if exists "projects_insert_own" on public.projects;
create policy "projects_insert_own" on public.projects for insert with check (auth.uid() = user_id);
drop policy if exists "projects_update_own" on public.projects;
create policy "projects_update_own" on public.projects for update using (auth.uid() = user_id);
drop policy if exists "projects_delete_own" on public.projects;
create policy "projects_delete_own" on public.projects for delete using (auth.uid() = user_id);

drop policy if exists "videos_select_own" on public.videos;
create policy "videos_select_own" on public.videos for select using (exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()));
drop policy if exists "videos_insert_own" on public.videos;
create policy "videos_insert_own" on public.videos for insert with check (exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()));
drop policy if exists "videos_update_own" on public.videos;
create policy "videos_update_own" on public.videos for update using (exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()));
drop policy if exists "videos_delete_own" on public.videos;
create policy "videos_delete_own" on public.videos for delete using (exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()));

create or replace function public.project_owned_by_user(project_uuid uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.projects where id = project_uuid and user_id = auth.uid()) $$;

drop policy if exists "analysis_runs_select_own" on public.analysis_runs;
create policy "analysis_runs_select_own" on public.analysis_runs for select using (public.project_owned_by_user(project_id));
drop policy if exists "analysis_runs_insert_own" on public.analysis_runs;
create policy "analysis_runs_insert_own" on public.analysis_runs for insert with check (public.project_owned_by_user(project_id));
drop policy if exists "analysis_runs_update_own" on public.analysis_runs;
create policy "analysis_runs_update_own" on public.analysis_runs for update using (public.project_owned_by_user(project_id));

drop policy if exists "patterns_select_own" on public.patterns;
create policy "patterns_select_own" on public.patterns for select using (public.project_owned_by_user(project_id));
drop policy if exists "patterns_insert_own" on public.patterns;
create policy "patterns_insert_own" on public.patterns for insert with check (public.project_owned_by_user(project_id));

drop policy if exists "blueprints_select_own" on public.blueprints;
create policy "blueprints_select_own" on public.blueprints for select using (public.project_owned_by_user(project_id));
drop policy if exists "blueprints_insert_own" on public.blueprints;
create policy "blueprints_insert_own" on public.blueprints for insert with check (public.project_owned_by_user(project_id));
