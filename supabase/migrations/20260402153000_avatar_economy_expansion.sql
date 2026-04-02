-- Expand avatar economy with configurable reward rules and safer reward application points

alter table if exists public.avatar_economy_settings
  add column if not exists coins_per_checkin_enabled boolean not null default true,
  add column if not exists coins_per_challenge_completion integer not null default 20,
  add column if not exists coins_per_challenge_completion_enabled boolean not null default true,
  add column if not exists coins_per_wod_completion integer not null default 15,
  add column if not exists coins_per_wod_completion_enabled boolean not null default true,
  add column if not exists coins_per_duel_participation integer not null default 10,
  add column if not exists coins_per_duel_participation_enabled boolean not null default true,
  add column if not exists coins_per_duel_win integer not null default 25,
  add column if not exists coins_per_duel_win_enabled boolean not null default true,
  add column if not exists coins_per_pr integer not null default 30,
  add column if not exists coins_per_pr_enabled boolean not null default true,
  add column if not exists level_up_bonus_enabled boolean not null default true,
  add column if not exists weekly_bonus_3_enabled boolean not null default true,
  add column if not exists weekly_bonus_4_enabled boolean not null default true,
  add column if not exists weekly_bonus_5_enabled boolean not null default true,
  add column if not exists weekly_bonus_6 integer not null default 75,
  add column if not exists weekly_bonus_6_enabled boolean not null default true,
  add column if not exists monthly_ranking_bonus integer not null default 100,
  add column if not exists monthly_ranking_bonus_enabled boolean not null default true,
  add column if not exists special_event_bonus integer not null default 50,
  add column if not exists special_event_bonus_enabled boolean not null default true,
  add column if not exists daily_mission_bonus integer not null default 20,
  add column if not exists daily_mission_bonus_enabled boolean not null default true,
  add column if not exists milestone_bonus integer not null default 40,
  add column if not exists milestone_bonus_enabled boolean not null default true,
  add column if not exists rule_labels jsonb,
  add column if not exists rule_notes jsonb;

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
  _weekly_bonus_6 integer := 75;
  _coins_per_checkin_enabled boolean := true;
  _weekly_bonus_3_enabled boolean := true;
  _weekly_bonus_4_enabled boolean := true;
  _weekly_bonus_5_enabled boolean := true;
  _weekly_bonus_6_enabled boolean := true;
  _week_start date;
  _weekly_checkins integer;
  _bonus4_increment integer;
  _bonus5_increment integer;
  _bonus6_increment integer;
begin
  insert into public.user_avatars (user_id)
  values (new.user_id)
  on conflict (user_id) do nothing;

  select
    coalesce(coins_per_checkin, 10),
    coalesce(weekly_bonus_3, 30),
    coalesce(weekly_bonus_4, 45),
    coalesce(weekly_bonus_5, 60),
    coalesce(weekly_bonus_6, 75),
    coalesce(coins_per_checkin_enabled, true),
    coalesce(weekly_bonus_3_enabled, true),
    coalesce(weekly_bonus_4_enabled, true),
    coalesce(weekly_bonus_5_enabled, true),
    coalesce(weekly_bonus_6_enabled, true)
  into
    _coins_per_checkin,
    _weekly_bonus_3,
    _weekly_bonus_4,
    _weekly_bonus_5,
    _weekly_bonus_6,
    _coins_per_checkin_enabled,
    _weekly_bonus_3_enabled,
    _weekly_bonus_4_enabled,
    _weekly_bonus_5_enabled,
    _weekly_bonus_6_enabled
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

  if _coins_per_checkin_enabled and _coins_per_checkin > 0 then
    perform public.grant_avatar_reward(
      new.user_id,
      'checkin',
      new.check_date::text,
      _coins_per_checkin
    );
  end if;

  _bonus4_increment := greatest(_weekly_bonus_4 - _weekly_bonus_3, 0);
  _bonus5_increment := greatest(_weekly_bonus_5 - _weekly_bonus_4, 0);
  _bonus6_increment := greatest(_weekly_bonus_6 - _weekly_bonus_5, 0);

  if _weekly_checkins >= 3 and _weekly_bonus_3_enabled and _weekly_bonus_3 > 0 then
    perform public.grant_avatar_reward(
      new.user_id,
      'weekly_bonus_3',
      _week_start::text,
      _weekly_bonus_3
    );
  end if;

  if _weekly_checkins >= 4 and _weekly_bonus_4_enabled and _bonus4_increment > 0 then
    perform public.grant_avatar_reward(
      new.user_id,
      'weekly_bonus_4',
      _week_start::text,
      _bonus4_increment
    );
  end if;

  if _weekly_checkins >= 5 and _weekly_bonus_5_enabled and _bonus5_increment > 0 then
    perform public.grant_avatar_reward(
      new.user_id,
      'weekly_bonus_5',
      _week_start::text,
      _bonus5_increment
    );
  end if;

  if _weekly_checkins >= 6 and _weekly_bonus_6_enabled and _bonus6_increment > 0 then
    perform public.grant_avatar_reward(
      new.user_id,
      'weekly_bonus_6',
      _week_start::text,
      _bonus6_increment
    );
  end if;

  return new;
end;
$$;

create or replace function public.apply_avatar_level_up_rewards()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _level_up_bonus integer := 25;
  _level_up_bonus_enabled boolean := true;
  _level_iter integer;
begin
  if new.level is null or old.level is null or new.level <= old.level then
    return new;
  end if;

  insert into public.user_avatars (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  select
    coalesce(level_up_bonus, 25),
    coalesce(level_up_bonus_enabled, true)
  into
    _level_up_bonus,
    _level_up_bonus_enabled
  from public.avatar_economy_settings
  where is_active = true
  order by created_at desc
  limit 1;

  if not _level_up_bonus_enabled or _level_up_bonus <= 0 then
    return new;
  end if;

  for _level_iter in (old.level + 1)..new.level loop
    perform public.grant_avatar_reward(
      new.id,
      'level_up',
      _level_iter::text,
      _level_up_bonus
    );
  end loop;

  return new;
end;
$$;

drop trigger if exists trg_apply_avatar_level_up_rewards on public.profiles;
create trigger trg_apply_avatar_level_up_rewards
after update of level on public.profiles
for each row
when (new.level is distinct from old.level)
execute function public.apply_avatar_level_up_rewards();
