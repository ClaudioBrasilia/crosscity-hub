
-- Allow anonymous users to view WODs (for TV mode)
CREATE POLICY "Anon can view wods" ON public.wods FOR SELECT TO anon USING (true);

-- Allow anonymous users to view checkins (for TV mode)
CREATE POLICY "Anon can view checkins" ON public.checkins FOR SELECT TO anon USING (true);

-- Allow anonymous users to view profiles (for TV mode - names only)
CREATE POLICY "Anon can view profiles" ON public.profiles FOR SELECT TO anon USING (true);

-- Allow anonymous users to view duels (for TV mode)
CREATE POLICY "Anon can view duels" ON public.app_duels FOR SELECT TO anon USING (true);
