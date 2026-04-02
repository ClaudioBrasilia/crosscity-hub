-- Enable anon/public TV reads for the remaining realtime tables used in /tv.
-- Keep RLS enabled and authenticated policies untouched.

-- Challenges: anon can only read rows that are currently active (or legacy rows without date window).
drop policy if exists "Anon can view active challenges for TV" on public.challenges;
create policy "Anon can view active challenges for TV"
  on public.challenges
  for select
  to anon
  using (
    (start_date is null and end_date is null)
    or (start_date is null and current_date <= end_date)
    or (end_date is null and start_date <= current_date)
    or (start_date <= current_date and current_date <= end_date)
  );

-- Monthly XP: anon can only read current month ranking rows (TV use case).
drop policy if exists "Anon can view current monthly_xp for TV" on public.monthly_xp;
create policy "Anon can view current monthly_xp for TV"
  on public.monthly_xp
  for select
  to anon
  using (month_key = to_char(current_date, 'YYYY-MM'));
