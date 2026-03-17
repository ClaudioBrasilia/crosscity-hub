export type WodCategory = 'rx' | 'scaled' | 'beginner';
export type WodScoreUnit = 'time' | 'rounds';

export interface DailyWodVersion {
  description: string;
  weight: string;
}

export interface DailyWod {
  id: string;
  date: string;
  name: string;
  type: 'For Time' | 'AMRAP' | 'EMOM';
  versions: Record<WodCategory, DailyWodVersion>;
}

export interface DailyWodResult {
  id: string;
  wodId: string;
  userId: string;
  userName: string;
  avatar: string;
  category: WodCategory;
  result: string;
  unit: WodScoreUnit;
  submittedAt: number;
}

export interface Duel {
  id: string;
  wodId: string;
  wodName: string;
  category: WodCategory;
  challengerId: string;
  opponentIds: string[];
  results: Record<string, string | null>;
  status: 'pending' | 'active' | 'finished';
  winnerId: string | null;
  betMode: boolean;
  betType: 'equipment' | 'xp' | null;
  betItems: string[];
  betXpAmount: number | null;
  acceptedBy: string[];
  betReserved?: boolean;
  betReservedAt?: number | null;
  betSettledAt?: number | null;
  betCanceledAt?: number | null;
  createdAt: number;
}

// Inicialização automática de dados mock desativada para produção.
export const initializeMockData = () => {};


const LEGACY_MOCK_USER_IDS = new Set(['user_1', 'user_2', 'user_3', 'user_4', 'user_5']);

const safeParse = <T,>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

export const cleanupLegacyMockData = () => {
  const users = safeParse<Array<Record<string, any>>>(localStorage.getItem('crosscity_users'), []);
  const filteredUsers = users.filter((user) => !LEGACY_MOCK_USER_IDS.has(String(user.id)));
  if (filteredUsers.length !== users.length) {
    localStorage.setItem('crosscity_users', JSON.stringify(filteredUsers));
  }

  const wodResults = safeParse<Array<Record<string, any>>>(localStorage.getItem('crosscity_wod_results'), []);
  const filteredWodResults = wodResults.filter((result) => !LEGACY_MOCK_USER_IDS.has(String(result.userId)));
  if (filteredWodResults.length !== wodResults.length) {
    localStorage.setItem('crosscity_wod_results', JSON.stringify(filteredWodResults));
  }

  const duels = safeParse<Array<Record<string, any>>>(localStorage.getItem('crosscity_duels'), []);
  const filteredDuels = duels.filter((duel) => {
    const challengerId = String(duel.challengerId || '');
    const opponentIds = Array.isArray(duel.opponentIds) ? duel.opponentIds.map(String) : [];
    return !LEGACY_MOCK_USER_IDS.has(challengerId) && !opponentIds.some((id) => LEGACY_MOCK_USER_IDS.has(id));
  });
  if (filteredDuels.length !== duels.length) {
    localStorage.setItem('crosscity_duels', JSON.stringify(filteredDuels));
  }

  const feed = safeParse<Array<Record<string, any>>>(localStorage.getItem('crosscity_feed'), []);
  const filteredFeed = feed.filter((post) => !LEGACY_MOCK_USER_IDS.has(String(post.userId)));
  if (filteredFeed.length !== feed.length) {
    localStorage.setItem('crosscity_feed', JSON.stringify(filteredFeed));
  }

  const checkins = safeParse<Record<string, string[]>>(localStorage.getItem('crosscity_checkins'), {});
  const checkinEntries = Object.entries(checkins);
  const filteredCheckins = Object.fromEntries(
    checkinEntries.filter(([userId]) => !LEGACY_MOCK_USER_IDS.has(userId)),
  );
  if (Object.keys(filteredCheckins).length !== checkinEntries.length) {
    localStorage.setItem('crosscity_checkins', JSON.stringify(filteredCheckins));
  }

  const benchmarks = safeParse<Record<string, Record<string, number>>>(localStorage.getItem('crosscity_benchmarks'), {});
  const benchmarkEntries = Object.entries(benchmarks);
  const filteredBenchmarks = Object.fromEntries(
    benchmarkEntries.filter(([userId]) => !LEGACY_MOCK_USER_IDS.has(userId)),
  );
  if (Object.keys(filteredBenchmarks).length !== benchmarkEntries.length) {
    localStorage.setItem('crosscity_benchmarks', JSON.stringify(filteredBenchmarks));
  }
};

export const avatarEmojis = ['💪', '🔥', '⚡', '🌟', '💥', '🏋️', '⚔️', '🎯', '🚀', '👊'];
