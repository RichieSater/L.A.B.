-- The L.A.B - Life Advisory Board
-- Database schema for Supabase
-- Run this in the Supabase SQL Editor after creating your project

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- Tables
-- ============================================================

-- User preferences / settings
create table public.user_profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  scheduling_enabled boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Advisor state (one row per user per advisor)
-- The `state` column stores the full AdvisorState JSON blob
create table public.advisor_states (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  advisor_id text not null,
  state jsonb not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, advisor_id)
);

-- Shared metrics (one row per user)
create table public.shared_metrics (
  user_id uuid references auth.users on delete cascade primary key,
  metrics jsonb not null default '{}',
  updated_at timestamptz default now()
);

-- Quick logs (one row per user, stores the array)
create table public.quick_logs (
  user_id uuid references auth.users on delete cascade primary key,
  logs jsonb not null default '[]',
  updated_at timestamptz default now()
);

-- Scheduled appointments
create table public.scheduled_sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  advisor_id text not null,
  scheduled_at timestamptz not null,
  window_minutes integer default 60,
  status text default 'scheduled' check (status in ('scheduled', 'completed', 'missed', 'cancelled')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- App metadata per user (schema version, etc.)
create table public.user_app_meta (
  user_id uuid references auth.users on delete cascade primary key,
  schema_version integer default 2,
  updated_at timestamptz default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.user_profiles enable row level security;
alter table public.advisor_states enable row level security;
alter table public.shared_metrics enable row level security;
alter table public.quick_logs enable row level security;
alter table public.scheduled_sessions enable row level security;
alter table public.user_app_meta enable row level security;

-- user_profiles
create policy "Users can view own profile" on public.user_profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.user_profiles
  for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.user_profiles
  for insert with check (auth.uid() = id);

-- advisor_states
create policy "Users can view own advisor states" on public.advisor_states
  for select using (auth.uid() = user_id);
create policy "Users can insert own advisor states" on public.advisor_states
  for insert with check (auth.uid() = user_id);
create policy "Users can update own advisor states" on public.advisor_states
  for update using (auth.uid() = user_id);
create policy "Users can delete own advisor states" on public.advisor_states
  for delete using (auth.uid() = user_id);

-- shared_metrics
create policy "Users can view own shared metrics" on public.shared_metrics
  for select using (auth.uid() = user_id);
create policy "Users can insert own shared metrics" on public.shared_metrics
  for insert with check (auth.uid() = user_id);
create policy "Users can update own shared metrics" on public.shared_metrics
  for update using (auth.uid() = user_id);

-- quick_logs
create policy "Users can view own quick logs" on public.quick_logs
  for select using (auth.uid() = user_id);
create policy "Users can insert own quick logs" on public.quick_logs
  for insert with check (auth.uid() = user_id);
create policy "Users can update own quick logs" on public.quick_logs
  for update using (auth.uid() = user_id);

-- scheduled_sessions
create policy "Users can manage own scheduled sessions" on public.scheduled_sessions
  for all using (auth.uid() = user_id);

-- user_app_meta
create policy "Users can manage own app meta" on public.user_app_meta
  for all using (auth.uid() = user_id);

-- ============================================================
-- Auto-create profile on signup
-- ============================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'display_name');

  insert into public.shared_metrics (user_id) values (new.id);
  insert into public.quick_logs (user_id) values (new.id);
  insert into public.user_app_meta (user_id) values (new.id);

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
