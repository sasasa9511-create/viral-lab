-- ViralLab initial production schema

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  platform text,
  viral_score integer check (viral_score between 0 and 100),
  status text not null default 'draft'
    check (status in ('draft','saved','published','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.ideas enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;

create policy "profiles_select_own"
on public.profiles
for select
using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;

create policy "profiles_insert_own"
on public.profiles
for insert
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;

create policy "profiles_update_own"
on public.profiles
for update
using (auth.uid() = id);

drop policy if exists "ideas_select_own" on public.ideas;

create policy "ideas_select_own"
on public.ideas
for select
using (auth.uid() = user_id);

drop policy if exists "ideas_insert_own" on public.ideas;

create policy "ideas_insert_own"
on public.ideas
for insert
with check (auth.uid() = user_id);

drop policy if exists "ideas_update_own" on public.ideas;

create policy "ideas_update_own"
on public.ideas
for update
using (auth.uid() = user_id);

drop policy if exists "ideas_delete_own" on public.ideas;

create policy "ideas_delete_own"
on public.ideas
for delete
using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public

as $$
begin
  insert into public.profiles (
    id,
    display_name
  )
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();