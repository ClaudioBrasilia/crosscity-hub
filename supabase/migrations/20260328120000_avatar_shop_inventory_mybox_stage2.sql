-- Avatar shop + inventory + equip (MyBox stage 2)
-- Minimal/low-risk migration: only creates missing structures and complements existing ones.

create extension if not exists pgcrypto;

-- avatar_items (reuse if exists)
create table if not exists public.avatar_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null,
  image_url text not null,
  price_coins integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz default now()
);

alter table public.avatar_items
  add column if not exists type text,
  add column if not exists image_url text,
  add column if not exists created_at timestamptz default now();

-- Backward-compatible fill for legacy schemas
update public.avatar_items
set type = lower(coalesce(type, category, 'accessory'))
where type is null;

update public.avatar_items
set image_url = coalesce(image_url, '/placeholder.svg')
where image_url is null;

alter table public.avatar_items
  alter column type set not null,
  alter column image_url set not null;

-- user_avatar_items (reuse if exists)
create table if not exists public.user_avatar_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id uuid not null references public.avatar_items(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, item_id)
);

alter table public.user_avatar_items
  add column if not exists created_at timestamptz default now();

-- user_avatars (do not recreate if already exists, just complement)
create table if not exists public.user_avatars (
  user_id uuid primary key references auth.users(id) on delete cascade,
  equipped_hair uuid null references public.avatar_items(id),
  equipped_top uuid null references public.avatar_items(id),
  equipped_bottom uuid null references public.avatar_items(id),
  equipped_shoes uuid null references public.avatar_items(id),
  equipped_accessory uuid null references public.avatar_items(id),
  avatar_coins integer not null default 0,
  updated_at timestamptz default now()
);

alter table public.user_avatars
  add column if not exists equipped_hair uuid references public.avatar_items(id),
  add column if not exists equipped_top uuid references public.avatar_items(id),
  add column if not exists equipped_bottom uuid references public.avatar_items(id),
  add column if not exists equipped_shoes uuid references public.avatar_items(id),
  add column if not exists equipped_accessory uuid references public.avatar_items(id),
  add column if not exists avatar_coins integer not null default 0,
  add column if not exists updated_at timestamptz default now();

-- Minimal RLS
alter table public.avatar_items enable row level security;
alter table public.user_avatar_items enable row level security;
alter table public.user_avatars enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'avatar_items' and policyname = 'Authenticated users can read avatar items'
  ) then
    create policy "Authenticated users can read avatar items"
      on public.avatar_items
      for select
      to authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_avatar_items' and policyname = 'Users can read own avatar inventory'
  ) then
    create policy "Users can read own avatar inventory"
      on public.user_avatar_items
      for select
      to authenticated
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_avatar_items' and policyname = 'Users can insert own avatar inventory'
  ) then
    create policy "Users can insert own avatar inventory"
      on public.user_avatar_items
      for insert
      to authenticated
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_avatars' and policyname = 'Users can read own avatar'
  ) then
    create policy "Users can read own avatar"
      on public.user_avatars
      for select
      to authenticated
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_avatars' and policyname = 'Users can update own avatar'
  ) then
    create policy "Users can update own avatar"
      on public.user_avatars
      for update
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_avatars' and policyname = 'Users can insert own avatar'
  ) then
    create policy "Users can insert own avatar"
      on public.user_avatars
      for insert
      to authenticated
      with check (auth.uid() = user_id);
  end if;
end $$;

-- Small seed for stage testing (5 slots)
insert into public.avatar_items (name, type, image_url, price_coins, is_active)
select * from (
  values
    ('Cabelo Básico', 'hair', '/placeholder.svg', 10, true),
    ('Top Básico', 'top', '/placeholder.svg', 15, true),
    ('Bottom Básico', 'bottom', '/placeholder.svg', 15, true),
    ('Tênis Básico', 'shoes', '/placeholder.svg', 20, true),
    ('Acessório Básico', 'accessory', '/placeholder.svg', 12, true)
) as v(name, type, image_url, price_coins, is_active)
where not exists (
  select 1 from public.avatar_items ai
  where ai.name = v.name and lower(ai.type) = lower(v.type)
);
