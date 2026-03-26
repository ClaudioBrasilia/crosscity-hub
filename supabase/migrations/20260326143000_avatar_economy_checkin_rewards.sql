-- Avatar economy settings + automatic coin rewards for valid check-ins

create table if not exists public.avatar_economy_settings (
  id uuid primary key default gen_random_uuid(),
  coins_per_checkin integer not null default 10,
  weekly_bonus_3 integer not null default 30,
  weekly_bonus_4 integer not null default 45,
  weekly_bonus_5 integer not null default 60,
  level_up_bonus integer not null default 25,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.avatar_reward_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_type text not null,
  source_ref text not null,
  coins_delta integer not null,
  created_at timestamptz not null default now(),
  unique (user_id, source_type, source_ref)
);

alter table public.avatar_economy_settings enable row level security;
alter table public.avatar_reward_events enable row level security;

drop policy if exists "Authenticated users can read active avatar economy settings" on public.avatar_economy_settings;
create policy "Authenticated users can read active avatar economy settings"
  on public.avatar_economy_settings
  for select
  to authenticated
  using (is_active = true or public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins can manage avatar economy settings" on public.avatar_economy_settings;
create policy "Admins can manage avatar economy settings"
  on public.avatar_economy_settings
  for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Users can read own avatar reward events" on public.avatar_reward_events;
create policy "Users can read own avatar reward events"
  on public.avatar_reward_events
  for select
  to authenticated
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

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

insert into public.avatar_economy_settings (coins_per_checkin, weekly_bonus_3, weekly_bonus_4, weekly_bonus_5, level_up_bonus, is_active)
select 10, 30, 45, 60, 25, true
where not exists (select 1 from public.avatar_economy_settings);

create or replace function public.grant_avatar_reward(
  _user_id uuid,
  _source_type text,
  _source_ref text,
  _coins_delta integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  _inserted_id uuid;
begin
  if _coins_delta is null or _coins_delta = 0 then
    return false;
  end if;

  insert into public.avatar_reward_events (user_id, source_type, source_ref, coins_delta)
  values (_user_id, _source_type, _source_ref, _coins_delta)
  on conflict (user_id, source_type, source_ref) do nothing
  returning id into _inserted_id;

  if _inserted_id is null then
    return false;
  end if;

  update public.user_avatars
  set avatar_coins = avatar_coins + _coins_delta
  where user_id = _user_id;

  return true;
end;
$$;

create or replace function public.apply_avatar_checkin_rewards()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _coins_per_checkin integer := 10;
  _weekly_bonus_3 integer := 30;
  _weekly_bonus_4 integer := 45;
  _weekly_bonus_5 integer := 60;
  _week_start date;
  _weekly_checkins integer;
  _bonus4_increment integer;
  _bonus5_increment integer;
begin
  -- Ensure avatar row exists for the user.
  insert into public.user_avatars (user_id)
  values (new.user_id)
  on conflict (user_id) do nothing;

  select
    coalesce(coins_per_checkin, 10),
    coalesce(weekly_bonus_3, 30),
    coalesce(weekly_bonus_4, 45),
    coalesce(weekly_bonus_5, 60)
  into
    _coins_per_checkin,
    _weekly_bonus_3,
    _weekly_bonus_4,
    _weekly_bonus_5
  from public.avatar_economy_settings
  where is_active = true
  order by created_at desc
  limit 1;

  _week_start := date_trunc('week', new.check_date::timestamp)::date;

  select count(*)::integer
    into _weekly_checkins
  from public.checkins
  where user_id = new.user_id
    and check_date >= _week_start
    and check_date < (_week_start + interval '7 days')::date;

  update public.user_avatars
  set weekly_checkins = _weekly_checkins,
      weekly_streak = greatest(weekly_streak, _weekly_checkins),
      last_checkin_at = now()
  where user_id = new.user_id;

  perform public.grant_avatar_reward(
    new.user_id,
    'checkin',
    new.check_date::text,
    _coins_per_checkin
  );

  _bonus4_increment := greatest(_weekly_bonus_4 - _weekly_bonus_3, 0);
  _bonus5_increment := greatest(_weekly_bonus_5 - _weekly_bonus_4, 0);

  if _weekly_checkins >= 3 then
    perform public.grant_avatar_reward(
      new.user_id,
      'weekly_bonus_3',
      _week_start::text,
      _weekly_bonus_3
    );
  end if;

  if _weekly_checkins >= 4 then
    perform public.grant_avatar_reward(
      new.user_id,
      'weekly_bonus_4',
      _week_start::text,
      _bonus4_increment
    );
  end if;

  if _weekly_checkins >= 5 then
    perform public.grant_avatar_reward(
      new.user_id,
      'weekly_bonus_5',
      _week_start::text,
      _bonus5_increment
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_apply_avatar_checkin_rewards on public.checkins;
create trigger trg_apply_avatar_checkin_rewards
after insert on public.checkins
for each row
execute function public.apply_avatar_checkin_rewards();
