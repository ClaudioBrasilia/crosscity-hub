-- Etapa 3: ao aprovar solicitação, vincular usuário ao Box real (profiles.box_id)
-- Mudança mínima e isolada: apenas ajusta a RPC de aprovação existente.

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

  update public.profiles
    set box_id = v_request.box_id
  where id = v_request.user_id;

  if not found then
    raise exception 'Perfil do usuário da solicitação não encontrado';
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

revoke all on function public.approve_box_join_request(uuid) from public;
grant execute on function public.approve_box_join_request(uuid) to authenticated;
