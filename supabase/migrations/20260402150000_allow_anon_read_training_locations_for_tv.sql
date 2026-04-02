-- TV mode can run as anon, so allow read-only access to active locations.
drop policy if exists "Anon can view active training locations" on public.training_locations;
create policy "Anon can view active training locations"
  on public.training_locations
  for select
  to anon
  using (is_active = true);
