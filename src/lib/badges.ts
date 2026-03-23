import { supabase } from '@/integrations/supabase/client';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'consistency' | 'performance' | 'social' | 'exploration';
  check: (ctx: BadgeContext) => boolean;
}

export interface BadgeContext {
  checkins: string[];
  benchmarks: Record<string, number>;
  wins: number;
  battles: number;
  level: number;
  xp: number;
  streak: number;
  equipmentCount: number;
}

export const allBadges: Badge[] = [
  // Consistência
  { id: 'first_checkin', name: 'Primeiro Passo', description: 'Faça seu primeiro check-in', icon: '👣', category: 'consistency', check: (c) => c.checkins.length >= 1 },
  { id: 'week_warrior', name: 'Guerreiro Semanal', description: '7 check-ins no total', icon: '📅', category: 'consistency', check: (c) => c.checkins.length >= 7 },
  { id: 'iron_habit', name: 'Hábito de Ferro', description: '15 check-ins no total', icon: '🔗', category: 'consistency', check: (c) => c.checkins.length >= 15 },
  { id: 'month_machine', name: 'Máquina Mensal', description: '25 check-ins no total', icon: '⚙️', category: 'consistency', check: (c) => c.checkins.length >= 25 },
  { id: 'streak_5', name: 'Em Chamas', description: 'Sequência de 5 dias', icon: '🔥', category: 'consistency', check: (c) => c.streak >= 5 },
  { id: 'streak_15', name: 'Imparável', description: 'Sequência de 15 dias', icon: '💎', category: 'consistency', check: (c) => c.streak >= 15 },

  // Performance
  { id: 'first_pr', name: 'PR Hunter', description: 'Registre seu primeiro PR', icon: '🎯', category: 'performance', check: (c) => Object.keys(c.benchmarks).length >= 1 },
  { id: 'pr_collector', name: 'Colecionador de PRs', description: 'Registre 5 PRs diferentes', icon: '📊', category: 'performance', check: (c) => Object.keys(c.benchmarks).length >= 5 },
  { id: 'full_benchmarks', name: 'Benchmark Completo', description: 'Registre todos os 8 benchmarks', icon: '✅', category: 'performance', check: (c) => Object.keys(c.benchmarks).length >= 8 },
  { id: 'level_5', name: 'Escalada', description: 'Alcance nível 5', icon: '⬆️', category: 'performance', check: (c) => c.level >= 5 },
  { id: 'level_10', name: 'Elite', description: 'Alcance nível 10', icon: '⚡', category: 'performance', check: (c) => c.level >= 10 },
  { id: 'xp_1000', name: 'XP Mestre', description: 'Acumule 1000 XP', icon: '💫', category: 'performance', check: (c) => c.xp >= 1000 },

  // Social
  { id: 'first_battle', name: 'Desafiante', description: 'Participe da primeira batalha', icon: '⚔️', category: 'social', check: (c) => c.battles >= 1 },
  { id: 'battle_5', name: 'Gladiador', description: 'Participe de 5 batalhas', icon: '🛡️', category: 'social', check: (c) => c.battles >= 5 },
  { id: 'first_win', name: 'Primeira Vitória', description: 'Vença sua primeira batalha', icon: '🏅', category: 'social', check: (c) => c.wins >= 1 },
  { id: 'win_5', name: 'Dominante', description: 'Vença 5 batalhas', icon: '👑', category: 'social', check: (c) => c.wins >= 5 },
  { id: 'win_10', name: 'Lenda', description: 'Vença 10 batalhas', icon: '🏆', category: 'social', check: (c) => c.wins >= 10 },

  // Exploração
  { id: 'equip_1', name: 'Primeiro Equipamento', description: 'Desbloqueie 1 equipamento', icon: '🔧', category: 'exploration', check: (c) => c.equipmentCount >= 1 },
  { id: 'equip_6', name: 'Box Básico', description: 'Desbloqueie 6 equipamentos', icon: '🏗️', category: 'exploration', check: (c) => c.equipmentCount >= 6 },
  { id: 'equip_12', name: 'Box Intermediário', description: 'Desbloqueie 12 equipamentos', icon: '🏋️', category: 'exploration', check: (c) => c.equipmentCount >= 12 },
  { id: 'equip_24', name: 'Box Completo', description: 'Desbloqueie todos os 24 equipamentos', icon: '🏟️', category: 'exploration', check: (c) => c.equipmentCount >= 24 },
];

export const categoryLabels: Record<Badge['category'], string> = {
  consistency: 'Consistência',
  performance: 'Performance',
  social: 'Social',
  exploration: 'Exploração',
};

export const categoryIcons: Record<Badge['category'], string> = {
  consistency: '🔗',
  performance: '📈',
  social: '🤝',
  exploration: '🗺️',
};

/**
 * Async version: fetches badge context from Supabase.
 */
export async function getUserBadgesAsync(userId: string): Promise<{ badge: Badge; unlocked: boolean }[]> {
  const [checkinsRes, benchmarksRes, profileRes] = await Promise.all([
    supabase.from('checkins').select('check_date').eq('user_id', userId),
    supabase.from('benchmarks').select('exercise_id, value').eq('user_id', userId),
    supabase.from('profiles').select('level, xp, streak, wins, battles').eq('id', userId).single(),
  ]);

  const checkins = (checkinsRes.data || []).map((r: any) => r.check_date);
  const benchmarks: Record<string, number> = {};
  (benchmarksRes.data || []).forEach((r: any) => { benchmarks[r.exercise_id] = Number(r.value); });

  const profile = profileRes.data as any;

  const ctx: BadgeContext = {
    checkins,
    benchmarks,
    wins: profile?.wins || 0,
    battles: profile?.battles || 0,
    level: profile?.level || 0,
    xp: profile?.xp || 0,
    streak: profile?.streak || 0,
    equipmentCount: 0, // Equipment system is localStorage-only (cosmetic)
  };

  return allBadges.map((badge) => ({
    badge,
    unlocked: badge.check(ctx),
  }));
}

/**
 * @deprecated Use getUserBadgesAsync instead. Kept for backward compatibility.
 */
export function getUserBadges(userId: string): { badge: Badge; unlocked: boolean }[] {
  // Fallback: return all badges as locked when called synchronously
  return allBadges.map((badge) => ({
    badge,
    unlocked: false,
  }));
}
