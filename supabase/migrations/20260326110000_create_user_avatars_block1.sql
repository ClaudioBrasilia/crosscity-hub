-- Avatar system (Block 1): isolated per-user base progression

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

alter table public.user_avatars enable row level security;

drop policy if exists "Users can read own avatar" on public.user_avatars;
create policy "Users can read own avatar"
  on public.user_avatars
  for select
  to authenticated
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

drop policy if exists "Users can insert own avatar" on public.user_avatars;
create policy "Users can insert own avatar"
  on public.user_avatars
  for insert
  to authenticated
  with check (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

drop policy if exists "Users can update own avatar" on public.user_avatars;
create policy "Users can update own avatar"
  on public.user_avatars
  for update
  to authenticated
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'))
  with check (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
