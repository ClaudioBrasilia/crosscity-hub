-- Ensure newly created admin profiles are automatically approved
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  initial_role text := coalesce(new.raw_user_meta_data->>'role', 'athlete');
  initial_approval_status text := case
    when initial_role = 'admin' then 'approved'
    else 'pending'
  end;
begin
  insert into public.profiles (id, name, email, gender, category, approval_status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'Atleta'),
    new.email,
    coalesce(new.raw_user_meta_data->>'gender', 'male'),
    coalesce(new.raw_user_meta_data->>'category', 'beginner'),
    initial_approval_status
  );

  insert into public.user_roles (user_id, role)
  values (new.id, 'athlete');

  return new;
end;
$$;
