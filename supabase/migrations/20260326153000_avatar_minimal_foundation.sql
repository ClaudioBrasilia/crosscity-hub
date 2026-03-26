-- Avatar system minimal foundation (catalog, inventory, profile linkage and economy fallback)

-- 1) Catalog of avatar shop items
create table if not exists public.avatar_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  rarity text not null default 'common',
  slot text,
  price_coins integer not null default 0 check (price_coins >= 0),
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) User avatar profile/equipment (create only if missing; existing table kept)
create table if not exists public.user_avatars (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text,
  avatar_level integer not null default 1,
  avatar_xp integer not null default 0,
  avatar_coins integer not null default 0,
  base_skin text not null default 'default',
  base_outfit text not null default 'basic',
  equipped_top text,
  equipped_bottom text,
  equipped_shoes text,
  equipped_accessory text,
  equipped_head_accessory text,
  equipped_wrist_accessory text,
  equipped_special text,
  weekly_checkins integer not null default 0,
  weekly_streak integer not null default 0,
  last_checkin_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3) User unlocked avatar items
create table if not exists public.user_avatar_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id uuid not null references public.avatar_items(id) on delete cascade,
  acquired_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, item_id)
);

-- 4) Economy settings (create only if missing; existing table kept)
create table if not exists public.avatar_economy_settings (
  id uuid primary key default gen_random_uuid(),
  coins_per_checkin integer not null default 10 check (coins_per_checkin >= 0),
  weekly_bonus_3 integer not null default 30 check (weekly_bonus_3 >= 0),
  weekly_bonus_4 integer not null default 45 check (weekly_bonus_4 >= 0),
  weekly_bonus_5 integer not null default 60 check (weekly_bonus_5 >= 0),
  level_up_bonus integer not null default 25 check (level_up_bonus >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_avatar_items_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_avatar_items_set_updated_at on public.avatar_items;
create trigger trg_avatar_items_set_updated_at
before update on public.avatar_items
for each row
execute function public.set_avatar_items_updated_at();

create or replace function public.set_user_avatars_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_user_avatars_set_updated_at on public.user_avatars;
create trigger trg_user_avatars_set_updated_at
before update on public.user_avatars
for each row
execute function public.set_user_avatars_updated_at();

create or replace function public.set_avatar_economy_settings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_avatar_economy_settings_set_updated_at on public.avatar_economy_settings;
create trigger trg_avatar_economy_settings_set_updated_at
before update on public.avatar_economy_settings
for each row
execute function public.set_avatar_economy_settings_updated_at();

alter table public.avatar_items enable row level security;
alter table public.user_avatars enable row level security;
alter table public.user_avatar_items enable row level security;
alter table public.avatar_economy_settings enable row level security;

-- user_avatars: authenticated users can access only their own row
drop policy if exists "Users can read own avatar" on public.user_avatars;
create policy "Users can read own avatar"
  on public.user_avatars
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own avatar" on public.user_avatars;
create policy "Users can insert own avatar"
  on public.user_avatars
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own avatar" on public.user_avatars;
create policy "Users can update own avatar"
  on public.user_avatars
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- user_avatar_items: authenticated users can read (and minimally insert) only own inventory
drop policy if exists "Users can read own avatar inventory" on public.user_avatar_items;
create policy "Users can read own avatar inventory"
  on public.user_avatar_items
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own avatar inventory" on public.user_avatar_items;
create policy "Users can insert own avatar inventory"
  on public.user_avatar_items
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- avatar_items catalog: authenticated users can read active/inactive rows (writes restricted)
drop policy if exists "Authenticated users can read avatar items" on public.avatar_items;
create policy "Authenticated users can read avatar items"
  on public.avatar_items
  for select
  to authenticated
  using (true);

-- economy settings: authenticated users can read
drop policy if exists "Authenticated users can read avatar economy settings" on public.avatar_economy_settings;
create policy "Authenticated users can read avatar economy settings"
  on public.avatar_economy_settings
  for select
  to authenticated
  using (true);

-- Minimal seed data (safe and idempotent)
insert into public.avatar_items (name, category, rarity, slot, price_coins, is_active)
values
  ('Regata Starter', 'upper', 'common', 'equipped_top', 20, true),
  ('Shorts Starter', 'lower', 'common', 'equipped_bottom', 20, true),
  ('Tênis Starter', 'footwear', 'common', 'equipped_shoes', 25, true),
  ('Faixa Wrist Basic', 'accessory', 'common', 'equipped_wrist_accessory', 15, true)
on conflict do nothing;

insert into public.avatar_economy_settings (coins_per_checkin, weekly_bonus_3, weekly_bonus_4, weekly_bonus_5, level_up_bonus, is_active)
select 10, 30, 45, 60, 25, true
where not exists (select 1 from public.avatar_economy_settings);
