-- Etapa 2: infraestrutura de convites únicos (uso único)
create table if not exists public.app_invites (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  created_by uuid not null references auth.users(id) on delete restrict,
  used_by uuid null references auth.users(id) on delete set null,
  status text not null default 'active' check (status in ('active', 'used', 'revoked', 'expired')),
  use_count integer not null default 0,
  max_uses integer not null default 1,
  expires_at timestamptz null,
  created_at timestamptz not null default now(),
  used_at timestamptz null,
  constraint app_invites_use_count_limit check (use_count <= max_uses),
  constraint app_invites_max_uses_one check (max_uses = 1)
);

create index if not exists idx_app_invites_token on public.app_invites (token);
create index if not exists idx_app_invites_status on public.app_invites (status);

alter table public.app_invites enable row level security;

drop policy if exists "Admins can select app invites" on public.app_invites;
create policy "Admins can select app invites"
  on public.app_invites
  for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- Cria convite único (somente admin)
create or replace function public.create_app_invite(
  p_expires_at timestamptz default null
)
returns public.app_invites
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_token text;
  v_invite public.app_invites;
begin
  if v_user_id is null then
    raise exception 'usuário não autenticado';
  end if;

  if not public.has_role(v_user_id, 'admin') then
    raise exception 'apenas admin pode gerar convite';
  end if;

  v_token := encode(gen_random_bytes(24), 'hex');

  insert into public.app_invites (
    token,
    created_by,
    expires_at
  )
  values (
    v_token,
    v_user_id,
    p_expires_at
  )
  returning * into v_invite;

  return v_invite;
end;
$$;

-- Consome convite único (usuário autenticado)
create or replace function public.consume_app_invite(
  p_token text
)
returns table (
  success boolean,
  message text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_invite public.app_invites;
begin
  if v_user_id is null then
    return query select false, 'usuário não autenticado';
    return;
  end if;

  if p_token is null or btrim(p_token) = '' then
    return query select false, 'convite inválido';
    return;
  end if;

  select *
    into v_invite
  from public.app_invites
  where token = btrim(p_token)
  for update;

  if not found then
    return query select false, 'convite inválido';
    return;
  end if;

  if v_invite.status <> 'active' then
    return query select false, 'convite já utilizado ou indisponível';
    return;
  end if;

  if v_invite.expires_at is not null and v_invite.expires_at <= now() then
    update public.app_invites
    set status = 'expired'
    where id = v_invite.id;
    return query select false, 'convite expirado';
    return;
  end if;

  if v_invite.use_count <> 0 then
    update public.app_invites
    set status = 'used'
    where id = v_invite.id;
    return query select false, 'convite já utilizado';
    return;
  end if;

  update public.app_invites
  set
    used_by = v_user_id,
    used_at = now(),
    use_count = 1,
    status = 'used'
  where id = v_invite.id;

  return query select true, 'convite aplicado com sucesso';
end;
$$;

revoke all on table public.app_invites from public;
revoke all on function public.create_app_invite(timestamptz) from public;
revoke all on function public.consume_app_invite(text) from public;

grant execute on function public.create_app_invite(timestamptz) to authenticated;
grant execute on function public.consume_app_invite(text) to authenticated;
