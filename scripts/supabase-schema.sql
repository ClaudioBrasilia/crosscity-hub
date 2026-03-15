-- CrossCity Hub - Supabase Database Schema
-- Execute este script no SQL Editor do Supabase para criar as tabelas

-- ============ USERS TABLE ============
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  avatar VARCHAR(10) DEFAULT '🏋️',
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  streak INTEGER DEFAULT 0,
  checkins INTEGER DEFAULT 0,
  role VARCHAR(20) DEFAULT 'athlete' CHECK (role IN ('athlete', 'coach', 'admin')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============ DUELS TABLE ============
CREATE TABLE IF NOT EXISTS duels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  opponent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wod_id VARCHAR(255) NOT NULL,
  wod_name VARCHAR(255) NOT NULL,
  category VARCHAR(20) NOT NULL CHECK (category IN ('rx', 'scaled', 'beginner')),
  challenger_result VARCHAR(255),
  opponent_result VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'finished')),
  winner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  bet_mode BOOLEAN DEFAULT FALSE,
  bet_type VARCHAR(20) CHECK (bet_type IN ('xp', 'equipment', NULL)),
  bet_xp_amount INTEGER,
  bet_accepted BOOLEAN DEFAULT FALSE,
  bet_reserved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============ WODS TABLE ============
CREATE TABLE IF NOT EXISTS wods (
  id VARCHAR(255) PRIMARY KEY,
  date DATE NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('For Time', 'AMRAP', 'EMOM')),
  description TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============ CLANS TABLE ============
CREATE TABLE IF NOT EXISTS clans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  banner VARCHAR(10) NOT NULL,
  leader_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  xp INTEGER DEFAULT 0,
  members UUID[] DEFAULT ARRAY[]::uuid[],
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============ BENCHMARKS TABLE ============
CREATE TABLE IF NOT EXISTS benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exercise_id VARCHAR(255) NOT NULL,
  exercise_name VARCHAR(255) NOT NULL,
  value NUMERIC NOT NULL,
  unit VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, exercise_id)
);

-- ============ ACHIEVEMENTS TABLE ============
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id VARCHAR(255) NOT NULL,
  achievement_name VARCHAR(255) NOT NULL,
  unlocked_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- ============ CHECK-INS TABLE ============
CREATE TABLE IF NOT EXISTS checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  check_in_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, check_in_date)
);

-- ============ INDEXES ============
CREATE INDEX IF NOT EXISTS idx_duels_challenger ON duels(challenger_id);
CREATE INDEX IF NOT EXISTS idx_duels_opponent ON duels(opponent_id);
CREATE INDEX IF NOT EXISTS idx_duels_status ON duels(status);
CREATE INDEX IF NOT EXISTS idx_benchmarks_user ON benchmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_user ON achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_checkins_user ON checkins(user_id);

-- ============ ROW LEVEL SECURITY (RLS) ============
-- Habilitar RLS em todas as tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE duels ENABLE ROW LEVEL SECURITY;
ALTER TABLE wods ENABLE ROW LEVEL SECURITY;
ALTER TABLE clans ENABLE ROW LEVEL SECURITY;
ALTER TABLE benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;

-- Políticas para a tabela users
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Políticas para a tabela duels
CREATE POLICY "Users can view duels they participate in" ON duels FOR SELECT 
  USING (auth.uid() = challenger_id OR auth.uid() = opponent_id);
CREATE POLICY "Users can create duels" ON duels FOR INSERT 
  WITH CHECK (auth.uid() = challenger_id);
CREATE POLICY "Users can update duels they participate in" ON duels FOR UPDATE 
  USING (auth.uid() = challenger_id OR auth.uid() = opponent_id);

-- Políticas para a tabela wods
CREATE POLICY "WODs are readable by all" ON wods FOR SELECT USING (true);

-- Políticas para a tabela clans
CREATE POLICY "Clans are readable by all" ON clans FOR SELECT USING (true);
CREATE POLICY "Users can create clans" ON clans FOR INSERT WITH CHECK (auth.uid() = leader_id);
CREATE POLICY "Clan leaders can update their clan" ON clans FOR UPDATE 
  USING (auth.uid() = leader_id);

-- Políticas para a tabela benchmarks
CREATE POLICY "Users can view all benchmarks" ON benchmarks FOR SELECT USING (true);
CREATE POLICY "Users can manage their own benchmarks" ON benchmarks FOR ALL 
  USING (auth.uid() = user_id);

-- Políticas para a tabela achievements
CREATE POLICY "Users can view all achievements" ON achievements FOR SELECT USING (true);
CREATE POLICY "Users can manage their own achievements" ON achievements FOR ALL 
  USING (auth.uid() = user_id);

-- Políticas para a tabela checkins
CREATE POLICY "Users can view all checkins" ON checkins FOR SELECT USING (true);
CREATE POLICY "Users can manage their own checkins" ON checkins FOR ALL 
  USING (auth.uid() = user_id);
