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


// Remove dados legados de versões antigas que semeavam mocks automaticamente.
export const cleanupLegacyMockData = () => {
  if (typeof window === 'undefined' || !window.localStorage) return;

  const legacyKeys = [
    'crosscity_users',
    'crosscity_boxes',
    'crosscity_feed',
    'crosscity_daily_wods',
    'crosscity_daily_wod',
    'crosscity_wod_results',
    'crosscity_checkins',
    'crosscity_duels',
  ];

  legacyKeys.forEach((key) => window.localStorage.removeItem(key));
};

export const avatarEmojis = ['💪', '🔥', '⚡', '🌟', '💥', '🏋️', '⚔️', '🎯', '🚀', '👊'];
