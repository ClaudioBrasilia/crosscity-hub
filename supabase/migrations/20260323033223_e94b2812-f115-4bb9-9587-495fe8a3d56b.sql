
-- ============ CHECKINS ============
CREATE TABLE IF NOT EXISTS public.checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  check_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, check_date)
);
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all checkins" ON public.checkins FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own checkins" ON public.checkins FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own checkins" ON public.checkins FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ MONTHLY XP ============
CREATE TABLE IF NOT EXISTS public.monthly_xp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month_key TEXT NOT NULL, -- "YYYY-MM"
  xp INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, month_key)
);
ALTER TABLE public.monthly_xp ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all monthly_xp" ON public.monthly_xp FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can upsert own monthly_xp" ON public.monthly_xp FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own monthly_xp" ON public.monthly_xp FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ============ WODS ============
CREATE TABLE IF NOT EXISTS public.wods (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  warmup TEXT,
  skill TEXT,
  versions JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.wods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view wods" ON public.wods FOR SELECT TO authenticated USING (true);
CREATE POLICY "Coaches can manage wods" ON public.wods FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'coach') OR public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'coach') OR public.has_role(auth.uid(), 'admin'));

-- ============ WOD RESULTS ============
CREATE TABLE IF NOT EXISTS public.wod_results (
  id TEXT PRIMARY KEY,
  wod_id TEXT NOT NULL REFERENCES public.wods(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'beginner',
  result TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'time',
  submitted_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM now()) * 1000)::BIGINT,
  UNIQUE(wod_id, user_id)
);
ALTER TABLE public.wod_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view wod_results" ON public.wod_results FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own results" ON public.wod_results FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own results" ON public.wod_results FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ============ BENCHMARKS ============
CREATE TABLE IF NOT EXISTS public.benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL,
  value NUMERIC NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, exercise_id)
);
ALTER TABLE public.benchmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view benchmarks" ON public.benchmarks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage own benchmarks" ON public.benchmarks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own benchmarks" ON public.benchmarks FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ============ BENCHMARK HISTORY ============
CREATE TABLE IF NOT EXISTS public.benchmark_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL,
  value NUMERIC NOT NULL,
  recorded_at DATE NOT NULL DEFAULT CURRENT_DATE
);
ALTER TABLE public.benchmark_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view benchmark_history" ON public.benchmark_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own benchmark_history" ON public.benchmark_history FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ============ CHALLENGES ============
CREATE TABLE IF NOT EXISTS public.challenges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT '🔥',
  type TEXT NOT NULL DEFAULT 'weekly',
  xp_reward INTEGER NOT NULL DEFAULT 100,
  target INTEGER NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'vezes',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view challenges" ON public.challenges FOR SELECT TO authenticated USING (true);
CREATE POLICY "Coaches can manage challenges" ON public.challenges FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'coach') OR public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'coach') OR public.has_role(auth.uid(), 'admin'));

-- ============ CHALLENGE PROGRESS ============
CREATE TABLE IF NOT EXISTS public.challenge_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id TEXT NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  progress INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, challenge_id)
);
ALTER TABLE public.challenge_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view challenge_progress" ON public.challenge_progress FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage own progress" ON public.challenge_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON public.challenge_progress FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ============ CHALLENGE COMPLETIONS ============
CREATE TABLE IF NOT EXISTS public.challenge_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id TEXT NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, challenge_id)
);
ALTER TABLE public.challenge_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view completions" ON public.challenge_completions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own completions" ON public.challenge_completions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ============ CHALLENGE PROOFS (metadata) ============
CREATE TABLE IF NOT EXISTS public.challenge_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id TEXT NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  step INTEGER NOT NULL,
  url TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.challenge_proofs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view proofs" ON public.challenge_proofs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own proofs" ON public.challenge_proofs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ============ FEED POSTS ============
CREATE TABLE IF NOT EXISTS public.feed_posts (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  wod_name TEXT,
  time_display TEXT,
  created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM now()) * 1000)::BIGINT
);
ALTER TABLE public.feed_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view posts" ON public.feed_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create own posts" ON public.feed_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON public.feed_posts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ FEED REACTIONS ============
CREATE TABLE IF NOT EXISTS public.feed_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id TEXT NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL DEFAULT 'fire',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id, reaction_type)
);
ALTER TABLE public.feed_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view reactions" ON public.feed_reactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage own reactions" ON public.feed_reactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own reactions" ON public.feed_reactions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ FEED COMMENTS ============
CREATE TABLE IF NOT EXISTS public.feed_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id TEXT NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM now()) * 1000)::BIGINT
);
ALTER TABLE public.feed_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view comments" ON public.feed_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create own comments" ON public.feed_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.feed_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ DUELS ============
CREATE TABLE IF NOT EXISTS public.app_duels (
  id TEXT PRIMARY KEY,
  wod_id TEXT NOT NULL,
  wod_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'beginner',
  challenger_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opponent_ids UUID[] NOT NULL DEFAULT '{}',
  results JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  winner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  bet_mode BOOLEAN NOT NULL DEFAULT false,
  bet_type TEXT,
  bet_items TEXT[] DEFAULT '{}',
  bet_xp_amount INTEGER,
  accepted_by UUID[] DEFAULT '{}',
  bet_reserved BOOLEAN DEFAULT false,
  bet_reserved_at BIGINT,
  bet_settled_at BIGINT,
  bet_canceled_at BIGINT,
  created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM now()) * 1000)::BIGINT
);
ALTER TABLE public.app_duels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants can view their duels" ON public.app_duels FOR SELECT TO authenticated USING (auth.uid() = challenger_id OR auth.uid() = ANY(opponent_ids) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can create duels" ON public.app_duels FOR INSERT TO authenticated WITH CHECK (auth.uid() = challenger_id);
CREATE POLICY "Participants can update duels" ON public.app_duels FOR UPDATE TO authenticated USING (auth.uid() = challenger_id OR auth.uid() = ANY(opponent_ids));

-- ============ CLANS ============
CREATE TABLE IF NOT EXISTS public.app_clans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  motto TEXT NOT NULL DEFAULT '',
  banner TEXT NOT NULL DEFAULT '🛡️',
  color TEXT NOT NULL DEFAULT 'slate',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.app_clans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view clans" ON public.app_clans FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create clans" ON public.app_clans FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Creator or admin can update" ON public.app_clans FOR UPDATE TO authenticated USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'));

-- ============ CLAN MEMBERSHIPS ============
CREATE TABLE IF NOT EXISTS public.clan_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clan_id TEXT NOT NULL REFERENCES public.app_clans(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);
ALTER TABLE public.clan_memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view memberships" ON public.clan_memberships FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can join clans" ON public.clan_memberships FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave or admin can manage" ON public.clan_memberships FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can update own membership" ON public.clan_memberships FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- ============ TERRITORY BATTLES ============
CREATE TABLE IF NOT EXISTS public.territory_battles (
  id TEXT PRIMARY KEY,
  territory_id TEXT NOT NULL,
  period TEXT NOT NULL DEFAULT 'daily',
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  energy_by_clan JSONB NOT NULL DEFAULT '{}'::jsonb,
  winner_clan_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.territory_battles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view battles" ON public.territory_battles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage battles" ON public.territory_battles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ DOMINATION EVENTS ============
CREATE TABLE IF NOT EXISTS public.domination_events (
  id TEXT PRIMARY KEY,
  battle_id TEXT NOT NULL REFERENCES public.territory_battles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clan_id TEXT NOT NULL REFERENCES public.app_clans(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'checkin',
  energy INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.domination_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view events" ON public.domination_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create own events" ON public.domination_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ============ USER GOALS ============
CREATE TABLE IF NOT EXISTS public.user_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  objective TEXT,
  frequency TEXT,
  level TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all goals" ON public.user_goals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage own goals" ON public.user_goals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON public.user_goals FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ============ INDEXES ============
CREATE INDEX IF NOT EXISTS idx_checkins_user ON public.checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_checkins_date ON public.checkins(check_date);
CREATE INDEX IF NOT EXISTS idx_monthly_xp_user ON public.monthly_xp(user_id);
CREATE INDEX IF NOT EXISTS idx_wod_results_wod ON public.wod_results(wod_id);
CREATE INDEX IF NOT EXISTS idx_wod_results_user ON public.wod_results(user_id);
CREATE INDEX IF NOT EXISTS idx_benchmarks_user ON public.benchmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_benchmark_history_user ON public.benchmark_history(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_progress_user ON public.challenge_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_feed_posts_user ON public.feed_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_feed_reactions_post ON public.feed_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_feed_comments_post ON public.feed_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_app_duels_challenger ON public.app_duels(challenger_id);
CREATE INDEX IF NOT EXISTS idx_clan_memberships_clan ON public.clan_memberships(clan_id);
CREATE INDEX IF NOT EXISTS idx_domination_events_battle ON public.domination_events(battle_id);

-- ============ RPC: UPSERT MONTHLY XP ============
CREATE OR REPLACE FUNCTION public.add_monthly_xp(_user_id UUID, _month_key TEXT, _amount INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.monthly_xp (user_id, month_key, xp, updated_at)
  VALUES (_user_id, _month_key, _amount, now())
  ON CONFLICT (user_id, month_key) DO UPDATE SET xp = monthly_xp.xp + _amount, updated_at = now();
END;
$$;

-- ============ RPC: RECORD CHECKIN (idempotent) ============
CREATE OR REPLACE FUNCTION public.record_checkin(_user_id UUID, _check_date DATE)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.checkins (user_id, check_date) VALUES (_user_id, _check_date)
  ON CONFLICT (user_id, check_date) DO NOTHING;
  RETURN FOUND;
END;
$$;

-- ============ RPC: UPSERT BENCHMARK ============
CREATE OR REPLACE FUNCTION public.upsert_benchmark(_user_id UUID, _exercise_id TEXT, _value NUMERIC)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.benchmarks (user_id, exercise_id, value, updated_at)
  VALUES (_user_id, _exercise_id, _value, now())
  ON CONFLICT (user_id, exercise_id) DO UPDATE SET value = _value, updated_at = now();
  
  INSERT INTO public.benchmark_history (user_id, exercise_id, value, recorded_at)
  VALUES (_user_id, _exercise_id, _value, CURRENT_DATE);
END;
$$;

-- ============ RPC: UPSERT WOD RESULT ============
CREATE OR REPLACE FUNCTION public.upsert_wod_result(_id TEXT, _wod_id TEXT, _user_id UUID, _category TEXT, _result TEXT, _unit TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.wod_results (id, wod_id, user_id, category, result, unit, submitted_at)
  VALUES (_id, _wod_id, _user_id, _category, _result, _unit, (EXTRACT(EPOCH FROM now()) * 1000)::BIGINT)
  ON CONFLICT (wod_id, user_id) DO UPDATE SET category = _category, result = _result, unit = _unit, submitted_at = (EXTRACT(EPOCH FROM now()) * 1000)::BIGINT;
END;
$$;
