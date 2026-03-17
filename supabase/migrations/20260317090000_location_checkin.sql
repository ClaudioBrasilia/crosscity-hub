-- Location-based check-in support

create table if not exists public.training_locations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  latitude double precision not null,
  longitude double precision not null,
  radius_meters integer not null check (radius_meters > 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.training_locations enable row level security;

drop policy if exists "Training locations are readable by all" on public.training_locations;
create policy "Training locations are readable by all"
  on public.training_locations
  for select
  to authenticated
  using (true);

insert into public.training_locations (name, latitude, longitude, radius_meters, active)
values ('CrossUberlandia', -18.912236, -48.294526, 150, true)
on conflict (name)
do update set
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  radius_meters = excluded.radius_meters,
  active = excluded.active,
  updated_at = now();

alter table public.checkins
  add column if not exists location_id uuid references public.training_locations(id),
  add column if not exists user_latitude double precision,
  add column if not exists user_longitude double precision,
  add column if not exists calculated_distance_meters double precision,
  add column if not exists geolocation_validated boolean not null default false,
  add column if not exists checked_in_at timestamptz;

create or replace function public.perform_location_checkin(
  p_location_id uuid,
  p_user_latitude double precision,
  p_user_longitude double precision
)
returns table (
  allowed boolean,
  distance_meters double precision,
  message text,
  checkin_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_location record;
  v_distance_meters double precision;
  v_today date := (now() at time zone 'utc')::date;
  v_checkin_id uuid;
  v_already_validated boolean;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Usuário não autenticado';
  end if;

  select id, latitude, longitude, radius_meters
    into v_location
  from public.training_locations
  where id = p_location_id
    and active = true
  limit 1;

  if not found then
    return query select false, null::double precision, 'Local de treino inválido ou inativo', null::uuid;
    return;
  end if;

  if p_user_latitude is null or p_user_longitude is null then
    return query select false, null::double precision, 'Coordenadas não informadas', null::uuid;
    return;
  end if;

  v_distance_meters := 6371000 * 2 * asin(
    sqrt(
      power(sin(radians((p_user_latitude - v_location.latitude) / 2)), 2)
      + cos(radians(v_location.latitude))
      * cos(radians(p_user_latitude))
      * power(sin(radians((p_user_longitude - v_location.longitude) / 2)), 2)
    )
  );

  v_already_validated := exists(
    select 1
    from public.checkins
    where user_id = v_user_id
      and check_in_date = v_today
      and geolocation_validated = true
  );

  if v_already_validated then
    select id into v_checkin_id
    from public.checkins
    where user_id = v_user_id
      and check_in_date = v_today
    order by created_at desc
    limit 1;

    return query select false, v_distance_meters, 'Check-in já realizado hoje', v_checkin_id;
    return;
  end if;

  insert into public.checkins (
    user_id,
    check_in_date,
    location_id,
    user_latitude,
    user_longitude,
    calculated_distance_meters,
    geolocation_validated,
    checked_in_at
  )
  values (
    v_user_id,
    v_today,
    v_location.id,
    p_user_latitude,
    p_user_longitude,
    v_distance_meters,
    v_distance_meters <= v_location.radius_meters,
    now()
  )
  on conflict (user_id, check_in_date)
  do update set
    location_id = excluded.location_id,
    user_latitude = excluded.user_latitude,
    user_longitude = excluded.user_longitude,
    calculated_distance_meters = excluded.calculated_distance_meters,
    geolocation_validated = excluded.geolocation_validated,
    checked_in_at = excluded.checked_in_at
  returning id into v_checkin_id;

  if v_distance_meters <= v_location.radius_meters then
    return query select true, v_distance_meters, 'Check-in validado por localização', v_checkin_id;
  else
    return query select false, v_distance_meters, 'Fora da área permitida', v_checkin_id;
  end if;
end;
$$;

grant execute on function public.perform_location_checkin(uuid, double precision, double precision) to authenticated;
