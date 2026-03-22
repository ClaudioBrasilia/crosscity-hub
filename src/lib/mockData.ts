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
  type: 'For Time' | 'AMRAP' | 'EMOM' | 'Chipper' | 'Hero WOD';
  warmup?: string;
  skill?: string;
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

  const LEGACY_CLAN_IDS = new Set(['clan_forge', 'clan_arena', 'clan_courtyard', 'clan_temple']);

  const safeParse = <T,>(value: string | null, fallback: T): T => {
    if (!value) return fallback;
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  };

  const clans = safeParse<Array<{ id?: string }>>(window.localStorage.getItem('crosscity_clans'), []);
  const hasLegacyClans = clans.some((clan) => typeof clan.id === 'string' && LEGACY_CLAN_IDS.has(clan.id));
  if (hasLegacyClans) {
    window.localStorage.removeItem('crosscity_clans');
  }

  const membershipKeys = ['crosscity_memberships', 'crosscity_clan_memberships'];
  membershipKeys.forEach((key) => {
    const memberships = safeParse<Record<string, string>>(window.localStorage.getItem(key), {});
    const hasLegacyMembership = Object.values(memberships).some((clanId) => LEGACY_CLAN_IDS.has(clanId));
    if (hasLegacyMembership) {
      window.localStorage.removeItem(key);
    }
  });

  const territoryState = safeParse<{
    energyByClan?: Record<string, number>;
    winnerClanId?: string | null;
  } | null>(window.localStorage.getItem('crosscity_territory_state'), null);

  const hasLegacyTerritoryState = !!territoryState && (
    Object.keys(territoryState.energyByClan || {}).some((clanId) => LEGACY_CLAN_IDS.has(clanId)) ||
    (typeof territoryState.winnerClanId === 'string' && LEGACY_CLAN_IDS.has(territoryState.winnerClanId))
  );

  if (hasLegacyTerritoryState) {
    window.localStorage.removeItem('crosscity_territory_state');
  }
};

export const avatarEmojis = ['💪', '🔥', '⚡', '🌟', '💥', '🏋️', '⚔️', '🎯', '🚀', '👊'];
