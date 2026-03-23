create table if not exists public.monthly_xp (
  user_id uuid not null references public.profiles(id) on delete cascade,
  month_key text not null check (month_key ~ '^\d{4}-\d{2}$'),
  xp integer not null default 0 check (xp >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, month_key)
);

alter table public.monthly_xp enable row level security;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists monthly_xp_set_updated_at on public.monthly_xp;
create trigger monthly_xp_set_updated_at
before update on public.monthly_xp
for each row
execute function public.set_updated_at();

drop policy if exists "Users can view monthly xp" on public.monthly_xp;
create policy "Users can view monthly xp"
  on public.monthly_xp
  for select
  to authenticated
  using (true);

drop policy if exists "Users can insert own monthly xp" on public.monthly_xp;
create policy "Users can insert own monthly xp"
  on public.monthly_xp
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Users can update own monthly xp" on public.monthly_xp;
create policy "Users can update own monthly xp"
  on public.monthly_xp
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create or replace function public.increment_monthly_xp(
  p_user_id uuid,
  p_month_key text,
  p_amount integer
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total integer;
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado';
  end if;

  if auth.uid() <> p_user_id and not public.has_role(auth.uid(), 'admin') then
    raise exception 'Sem permissão para atualizar XP mensal';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Quantidade inválida de XP mensal';
  end if;

  insert into public.monthly_xp (user_id, month_key, xp)
  values (p_user_id, p_month_key, p_amount)
  on conflict (user_id, month_key)
  do update set
    xp = public.monthly_xp.xp + excluded.xp,
    updated_at = now()
  returning xp into v_total;

  return v_total;
end;
$$;

grant execute on function public.increment_monthly_xp(uuid, text, integer) to authenticated;
