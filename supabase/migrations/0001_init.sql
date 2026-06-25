-- ===========================================================================
-- Sari AI Fashion Generator — initial schema, RLS, triggers & storage
-- Run this in the Supabase SQL Editor (Dashboard → SQL → New query).
-- Safe to re-run: uses IF NOT EXISTS / OR REPLACE / ON CONFLICT throughout.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id               uuid primary key references auth.users (id) on delete cascade,
  email            text,
  full_name        text,
  avatar_url       text,
  generation_count integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table if not exists public.generations (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.profiles (id) on delete cascade,
  sari_image_url     text not null,
  generated_image_url text,
  background_image_url text,
  final_image_url    text,
  background_type    text check (background_type in ('preset','custom','solid')),
  background_value   text,
  resolution_width   integer,
  resolution_height  integer,
  prompt_used        text,
  model_used         text not null default 'google/gemini-3-pro-image-preview',
  status             text not null default 'pending'
                       check (status in ('pending','generating','completed','failed')),
  error_message      text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists generations_user_id_created_at_idx
  on public.generations (user_id, created_at desc);
create index if not exists generations_status_idx
  on public.generations (status);

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists generations_set_updated_at on public.generations;
create trigger generations_set_updated_at
  before update on public.generations
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Auto-create a profile row when a new auth user signs up
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.generations enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "generations_select_own" on public.generations;
drop policy if exists "generations_insert_own" on public.generations;
drop policy if exists "generations_update_own" on public.generations;
drop policy if exists "generations_delete_own" on public.generations;
create policy "generations_select_own" on public.generations
  for select using (auth.uid() = user_id);
create policy "generations_insert_own" on public.generations
  for insert with check (auth.uid() = user_id);
create policy "generations_update_own" on public.generations
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "generations_delete_own" on public.generations
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Storage buckets (public read) + policies
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
  values ('sari-uploads', 'sari-uploads', true)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public)
  values ('generated-outputs', 'generated-outputs', true)
  on conflict (id) do nothing;

-- Public read for both buckets
drop policy if exists "public_read_sari" on storage.objects;
drop policy if exists "public_read_generated" on storage.objects;
create policy "public_read_sari" on storage.objects
  for select using (bucket_id = 'sari-uploads');
create policy "public_read_generated" on storage.objects
  for select using (bucket_id = 'generated-outputs');

-- Authenticated users may write only inside their own {user_id}/ folder.
drop policy if exists "user_write_own_sari" on storage.objects;
drop policy if exists "user_write_own_generated" on storage.objects;
create policy "user_write_own_sari" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'sari-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "user_write_own_generated" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'generated-outputs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- (The server uses the service-role key for generated-outputs writes, which
--  bypasses RLS; the policy above also lets the browser write if ever needed.)
