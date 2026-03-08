export type ChallengeType = 'weekly' | 'monthly';
export type ChallengeCategory = 'cardio' | 'strength' | 'consistency' | 'social' | 'mixed';

export interface Challenge {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: ChallengeType;
  category: ChallengeCategory;
  xpReward: number;
  target: number;
  unit: string;
  /** key used to compute progress from localStorage data */
  progressKey: string;
  startDate: string;
  endDate: string;
}

const weekStart = '2026-03-02';
const weekEnd = '2026-03-08';
const monthStart = '2026-03-01';
const monthEnd = '2026-03-31';

export const activeChallenges: Challenge[] = [
  // Weekly
  {
    id: 'wk_cardio', name: 'Semana do Cardio', description: 'Faça 5 check-ins esta semana',
    icon: '🫀', type: 'weekly', category: 'cardio', xpReward: 150, target: 5, unit: 'check-ins',
    progressKey: 'checkins_week', startDate: weekStart, endDate: weekEnd,
  },
  {
    id: 'wk_battle', name: 'Duelista Semanal', description: 'Participe de 3 batalhas esta semana',
    icon: '⚔️', type: 'weekly', category: 'social', xpReward: 200, target: 3, unit: 'batalhas',
    progressKey: 'battles_week', startDate: weekStart, endDate: weekEnd,
  },
  {
    id: 'wk_pr', name: 'Caçador de PRs', description: 'Registre 2 novos PRs esta semana',
    icon: '🎯', type: 'weekly', category: 'strength', xpReward: 175, target: 2, unit: 'PRs',
    progressKey: 'prs_week', startDate: weekStart, endDate: weekEnd,
  },
  // Monthly
  {
    id: 'mo_iron', name: 'Mês de Ferro', description: 'Faça 20 check-ins neste mês',
    icon: '🔗', type: 'monthly', category: 'consistency', xpReward: 500, target: 20, unit: 'check-ins',
    progressKey: 'checkins_month', startDate: monthStart, endDate: monthEnd,
  },
  {
    id: 'mo_lpo', name: 'Mês do LPO', description: 'Registre PRs em Clean & Jerk e Snatch',
    icon: '🏋️', type: 'monthly', category: 'strength', xpReward: 400, target: 2, unit: 'PRs olímpicos',
    progressKey: 'olympic_prs', startDate: monthStart, endDate: monthEnd,
  },
  {
    id: 'mo_gladiator', name: 'Gladiador', description: 'Vença 5 batalhas neste mês',
    icon: '👑', type: 'monthly', category: 'social', xpReward: 600, target: 5, unit: 'vitórias',
    progressKey: 'wins_month', startDate: monthStart, endDate: monthEnd,
  },
  {
    id: 'mo_complete', name: 'Benchmarks Completo', description: 'Registre todos os 8 benchmarks',
    icon: '✅', type: 'monthly', category: 'mixed', xpReward: 350, target: 8, unit: 'benchmarks',
    progressKey: 'all_benchmarks', startDate: monthStart, endDate: monthEnd,
  },
];

export function getChallengeProgress(challenge: Challenge, userId: string): number {
  const checkinsData: Record<string, string[]> = JSON.parse(localStorage.getItem('crosscity_checkins') || '{}');
  const userCheckins = checkinsData[userId] || [];
  const benchmarksData: Record<string, Record<string, number>> = JSON.parse(localStorage.getItem('crosscity_benchmarks') || '{}');
  const userBenchmarks = benchmarksData[userId] || {};
  const wins = Number(localStorage.getItem(`crosscity_wins_${userId}`) || '0');
  const battles = Number(localStorage.getItem(`crosscity_battles_${userId}`) || '0');

  switch (challenge.progressKey) {
    case 'checkins_week': {
      return userCheckins.filter(d => d >= challenge.startDate && d <= challenge.endDate).length;
    }
    case 'checkins_month': {
      const prefix = challenge.startDate.slice(0, 7);
      return userCheckins.filter(d => d.startsWith(prefix)).length;
    }
    case 'battles_week':
      return Math.min(battles, challenge.target);
    case 'wins_month':
      return Math.min(wins, challenge.target);
    case 'prs_week': {
      const history = JSON.parse(localStorage.getItem('crosscity_benchmark_history') || '{}');
      const userHist = history[userId] || {};
      let count = 0;
      for (const entries of Object.values(userHist) as any[]) {
        if (entries.some((e: any) => e.date >= challenge.startDate && e.date <= challenge.endDate)) count++;
      }
      return Math.min(count, challenge.target);
    }
    case 'olympic_prs': {
      let count = 0;
      if (userBenchmarks['clean_jerk']) count++;
      if (userBenchmarks['snatch']) count++;
      return count;
    }
    case 'all_benchmarks':
      return Object.keys(userBenchmarks).length;
    default:
      return 0;
  }
}

export function getCompletedChallenges(userId: string): string[] {
  return JSON.parse(localStorage.getItem(`crosscity_completed_challenges_${userId}`) || '[]');
}

export function markChallengeComplete(userId: string, challengeId: string): void {
  const completed = getCompletedChallenges(userId);
  if (!completed.includes(challengeId)) {
    completed.push(challengeId);
    localStorage.setItem(`crosscity_completed_challenges_${userId}`, JSON.stringify(completed));
  }
}
