-- Etapa 1: Base de convite/aprovacao para Box (isolada)
-- Objetivo: estrutura minima para convites unicos + solicitacoes pendentes

-- =========================
-- TABELA: box_invites
-- =========================
create table if not exists public.box_invites (
  id uuid primary key default gen_random_uuid(),
  box_id text not null,
  token text not null unique,
  created_by uuid not null references auth.users(id) on delete cascade,
  max_uses integer not null default 1 check (max_uses > 0),
  used_count integer not null default 0 check (used_count >= 0),
  status text not null default 'active' check (status in ('active', 'used', 'revoked', 'expired')),
  expires_at timestamptz null,
  used_by uuid null references auth.users(id) on delete set null,
  used_at timestamptz null,
  created_at timestamptz not null default now(),
  constraint box_invites_used_count_limit check (used_count <= max_uses)
);

create index if not exists idx_box_invites_box_id on public.box_invites (box_id);
create index if not exists idx_box_invites_token on public.box_invites (token);
create index if not exists idx_box_invites_status on public.box_invites (status);

alter table public.box_invites enable row level security;

-- =========================
-- TABELA: box_join_requests
-- =========================
create table if not exists public.box_join_requests (
  id uuid primary key default gen_random_uuid(),
  box_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  invite_id uuid null references public.box_invites(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid null references auth.users(id) on delete set null,
  reviewed_at timestamptz null,
  created_at timestamptz not null default now()
);

create index if not exists idx_box_join_requests_box_id on public.box_join_requests (box_id);
create index if not exists idx_box_join_requests_user_id on public.box_join_requests (user_id);
create index if not exists idx_box_join_requests_status on public.box_join_requests (status);

-- Garante apenas 1 solicitacao pendente por usuario/box
create unique index if not exists uq_box_join_requests_pending_per_user_box
  on public.box_join_requests (box_id, user_id)
  where status = 'pending';

alter table public.box_join_requests enable row level security;

-- =========================
-- FUNCOES AUXILIARES DE SEGURANCA
-- =========================
create or replace function public.is_box_admin(_box_id text, _user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = _user_id
      and p.box_id = _box_id
      and (
        public.has_role(_user_id, 'coach'::public.app_role)
        or public.has_role(_user_id, 'admin'::public.app_role)
      )
  );
$$;

-- =========================
-- POLICIES RLS
-- =========================

-- BOX INVITES: leitura limitada a criador e admin do box
-- Escrita direta bloqueada; fluxo via RPCs security definer

drop policy if exists "Box invites selectable by creator or box admin" on public.box_invites;
create policy "Box invites selectable by creator or box admin"
  on public.box_invites
  for select
  to authenticated
  using (
    auth.uid() = created_by
    or public.is_box_admin(box_id, auth.uid())
  );

-- BOX JOIN REQUESTS: leitura pelo solicitante ou admin do box

drop policy if exists "Box join requests readable by requester or box admin" on public.box_join_requests;
create policy "Box join requests readable by requester or box admin"
  on public.box_join_requests
  for select
  to authenticated
  using (
    auth.uid() = user_id
    or public.is_box_admin(box_id, auth.uid())
  );

-- =========================
-- RPC: gerar convite
-- =========================
create or replace function public.generate_box_invite(
  p_box_id text,
  p_expires_at timestamptz default null,
  p_max_uses integer default 1
)
returns public.box_invites
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_token text;
  v_invite public.box_invites;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Usuário não autenticado';
  end if;

  if p_box_id is null or btrim(p_box_id) = '' then
    raise exception 'box_id é obrigatório';
  end if;

  if p_max_uses is null or p_max_uses <= 0 then
    raise exception 'max_uses deve ser maior que zero';
  end if;

  if not public.is_box_admin(p_box_id, v_user_id) then
    raise exception 'Apenas admin do Box pode gerar convite';
  end if;

  v_token := encode(gen_random_bytes(24), 'hex');

  insert into public.box_invites (
    box_id,
    token,
    created_by,
    max_uses,
    expires_at,
    status
  ) values (
    p_box_id,
    v_token,
    v_user_id,
    p_max_uses,
    p_expires_at,
    'active'
  )
  returning * into v_invite;

  return v_invite;
end;
$$;

-- =========================
-- RPC: consumir convite (sem entrar no box)
-- cria apenas solicitacao pendente
-- =========================
create or replace function public.consume_box_invite(
  p_token text
)
returns public.box_join_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_invite public.box_invites;
  v_join_request public.box_join_requests;
  v_new_used_count integer;
  v_new_status text;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Usuário não autenticado';
  end if;

  if p_token is null or btrim(p_token) = '' then
    raise exception 'token é obrigatório';
  end if;

  select *
    into v_invite
  from public.box_invites
  where token = p_token
  for update;

  if not found then
    raise exception 'Convite não encontrado';
  end if;

  if v_invite.status <> 'active' then
    raise exception 'Convite não está ativo';
  end if;

  if v_invite.expires_at is not null and v_invite.expires_at <= now() then
    update public.box_invites
      set status = 'expired'
    where id = v_invite.id;

    raise exception 'Convite expirado';
  end if;

  if v_invite.used_count >= v_invite.max_uses then
    update public.box_invites
      set status = 'used'
    where id = v_invite.id;

    raise exception 'Convite já utilizado';
  end if;

  insert into public.box_join_requests (
    box_id,
    user_id,
    invite_id,
    status
  ) values (
    v_invite.box_id,
    v_user_id,
    v_invite.id,
    'pending'
  )
  returning * into v_join_request;

  v_new_used_count := v_invite.used_count + 1;
  v_new_status := case when v_new_used_count >= v_invite.max_uses then 'used' else 'active' end;

  update public.box_invites
    set
      used_count = v_new_used_count,
      status = v_new_status,
      used_by = case when v_new_used_count >= v_invite.max_uses then v_user_id else used_by end,
      used_at = case when v_new_used_count >= v_invite.max_uses then now() else used_at end
  where id = v_invite.id;

  return v_join_request;
exception
  when unique_violation then
    raise exception 'Já existe solicitação pendente para este Box';
end;
$$;

-- =========================
-- RPC: aprovar solicitacao
-- =========================
create or replace function public.approve_box_join_request(
  p_request_id uuid
)
returns public.box_join_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_request public.box_join_requests;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Usuário não autenticado';
  end if;

  select *
    into v_request
  from public.box_join_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'Solicitação não encontrada';
  end if;

  if v_request.status <> 'pending' then
    raise exception 'Somente solicitações pendentes podem ser aprovadas';
  end if;

  if not public.is_box_admin(v_request.box_id, v_user_id) then
    raise exception 'Apenas admin do Box pode aprovar';
  end if;

  update public.box_join_requests
    set
      status = 'approved',
      reviewed_by = v_user_id,
      reviewed_at = now()
  where id = p_request_id
  returning * into v_request;

  return v_request;
end;
$$;

-- =========================
-- RPC: recusar solicitacao
-- =========================
create or replace function public.reject_box_join_request(
  p_request_id uuid
)
returns public.box_join_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_request public.box_join_requests;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Usuário não autenticado';
  end if;

  select *
    into v_request
  from public.box_join_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'Solicitação não encontrada';
  end if;

  if v_request.status <> 'pending' then
    raise exception 'Somente solicitações pendentes podem ser recusadas';
  end if;

  if not public.is_box_admin(v_request.box_id, v_user_id) then
    raise exception 'Apenas admin do Box pode recusar';
  end if;

  update public.box_join_requests
    set
      status = 'rejected',
      reviewed_by = v_user_id,
      reviewed_at = now()
  where id = p_request_id
  returning * into v_request;

  return v_request;
end;
$$;

-- =========================
-- PERMISSOES DE EXECUCAO RPC
-- =========================
revoke all on function public.generate_box_invite(text, timestamptz, integer) from public;
revoke all on function public.consume_box_invite(text) from public;
revoke all on function public.approve_box_join_request(uuid) from public;
revoke all on function public.reject_box_join_request(uuid) from public;

grant execute on function public.generate_box_invite(text, timestamptz, integer) to authenticated;
grant execute on function public.consume_box_invite(text) to authenticated;
grant execute on function public.approve_box_join_request(uuid) to authenticated;
grant execute on function public.reject_box_join_request(uuid) to authenticated;
