create table if not exists public.boxes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  creator_id uuid not null references auth.users(id) on delete cascade,
  member_count integer not null default 1 check (member_count >= 0),
  points integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.boxes enable row level security;

create policy "Authenticated users can view boxes"
  on public.boxes
  for select
  to authenticated
  using (true);

create or replace function public.generate_box_invite_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
begin
  loop
    v_code := upper(substring(md5(gen_random_uuid()::text) from 1 for 6));
    exit when not exists (
      select 1
      from public.boxes
      where invite_code = v_code
    );
  end loop;

  return v_code;
end;
$$;

create or replace function public.create_box(p_name text)
returns public.boxes
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_box public.boxes;
begin
  if v_user_id is null then
    raise exception 'Usuário não autenticado';
  end if;

  if not public.has_role(v_user_id, 'admin') then
    raise exception 'Apenas administradores podem criar Box.';
  end if;

  if trim(coalesce(p_name, '')) = '' then
    raise exception 'Nome do Box é obrigatório';
  end if;

  insert into public.boxes (name, invite_code, creator_id)
  values (trim(p_name), public.generate_box_invite_code(), v_user_id)
  returning * into v_box;

  update public.profiles
  set box_id = v_box.id::text
  where id = v_user_id;

  return v_box;
end;
$$;

create or replace function public.join_box_by_code(p_invite_code text)
returns public.boxes
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_box public.boxes;
  v_previous_box_id uuid;
begin
  if v_user_id is null then
    raise exception 'Usuário não autenticado';
  end if;

  select *
    into v_box
  from public.boxes
  where invite_code = upper(trim(p_invite_code))
  limit 1;

  if not found then
    raise exception 'Código de convite inválido';
  end if;

  select case
           when coalesce(box_id, '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then box_id::uuid
           else null
         end
    into v_previous_box_id
  from public.profiles
  where id = v_user_id;

  if v_previous_box_id is not null and v_previous_box_id <> v_box.id then
    update public.boxes
    set member_count = greatest(member_count - 1, 0),
        updated_at = now()
    where id = v_previous_box_id;
  end if;

  if v_previous_box_id is distinct from v_box.id then
    update public.boxes
    set member_count = member_count + 1,
        updated_at = now()
    where id = v_box.id;

    update public.profiles
    set box_id = v_box.id::text
    where id = v_user_id;

    select * into v_box from public.boxes where id = v_box.id;
  end if;

  return v_box;
end;
$$;

grant execute on function public.generate_box_invite_code() to authenticated;
grant execute on function public.create_box(text) to authenticated;
grant execute on function public.join_box_by_code(text) to authenticated;
