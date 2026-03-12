export interface UserProfile {
  id: string;
  level: number;
  category: 'rx' | 'scaled' | 'beginner';
}

export interface Clan {
  id: string;
  name: string;
  motto: string;
  banner: string;
  colors: string;
}

export interface Territory {
  id: string;
  name: string;
  icon: string;
  focus: string;
}

export interface TerritoryState {
  territoryId: string;
  dayKey: string;
  energyByClan: Record<string, number>;
  winnerClanId: string | null;
}

export interface ClanReward {
  id: string;
  title: string;
  description: string;
  type: 'real' | 'digital' | 'power';
}

export const clans: Clan[] = [
  { id: 'clan_forge', name: 'Guerreiros da Forja', motto: 'Disciplina constrói campeões.', banner: '⚒️', colors: 'from-orange-500 to-red-500' },
  { id: 'clan_arena', name: 'Titãs da Arena', motto: 'Cada round conta para todos.', banner: '🛡️', colors: 'from-blue-500 to-cyan-500' },
  { id: 'clan_courtyard', name: 'Legião do Pátio', motto: 'Consistência vence talento.', banner: '🏟️', colors: 'from-emerald-500 to-lime-500' },
  { id: 'clan_temple', name: 'Guardas do Templo', motto: 'Honra, foco e comunidade.', banner: '🏛️', colors: 'from-violet-500 to-fuchsia-500' },
];

export const territories: Territory[] = [
  { id: 'territory_forge', name: 'A Forja', icon: '🔥', focus: 'força e PRs' },
  { id: 'territory_arena', name: 'A Arena', icon: '⚔️', focus: 'duelos e liderança' },
  { id: 'territory_courtyard', name: 'O Pátio', icon: '🏋️', focus: 'presença e volume' },
  { id: 'territory_temple', name: 'O Templo', icon: '🧠', focus: 'técnica e consistência' },
];

export const clanRewards: ClanReward[] = [
  { id: 'reward_workshop', title: 'Workshop Exclusivo', description: 'Aula técnica avançada para o clã vencedor do mês.', type: 'real' },
  { id: 'reward_badges', title: 'Badges de Honra', description: 'Medalha digital para guerreiros de consistência.', type: 'digital' },
  { id: 'reward_xp', title: 'Bônus de XP', description: 'Multiplicador de XP em horários de pico.', type: 'power' },
];

const STORAGE_KEYS = {
  clans: 'crosscity_clans',
  memberships: 'crosscity_clan_memberships',
  territoryState: 'crosscity_territory_state',
} as const;

const getDateKey = (date = new Date()) => date.toISOString().split('T')[0];

export const getTerritoryOfDay = (date = new Date()) => {
  const day = date.getDay();
  return territories[day % territories.length];
};

const safeParse = <T,>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const hashId = (value: string) => value.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

export const ensureClanData = (users: UserProfile[]) => {
  if (!localStorage.getItem(STORAGE_KEYS.clans)) {
    localStorage.setItem(STORAGE_KEYS.clans, JSON.stringify(clans));
  }

  const memberships = safeParse<Record<string, string>>(localStorage.getItem(STORAGE_KEYS.memberships), {});
  let changed = false;

  for (const user of users) {
    if (!memberships[user.id]) {
      const index = hashId(user.id + user.category) % clans.length;
      memberships[user.id] = clans[index].id;
      changed = true;
    }
  }

  if (changed) {
    localStorage.setItem(STORAGE_KEYS.memberships, JSON.stringify(memberships));
  }

  const todayKey = getDateKey();
  const state = safeParse<TerritoryState | null>(localStorage.getItem(STORAGE_KEYS.territoryState), null);
  if (!state || state.dayKey !== todayKey) {
    const seededEnergy = Object.fromEntries(
      clans.map((clan, index) => [clan.id, 80 + index * 15]),
    ) as Record<string, number>;

    localStorage.setItem(
      STORAGE_KEYS.territoryState,
      JSON.stringify({
        territoryId: getTerritoryOfDay().id,
        dayKey: todayKey,
        energyByClan: seededEnergy,
        winnerClanId: null,
      } satisfies TerritoryState),
    );
  }
};

export const getClanMemberships = () => safeParse<Record<string, string>>(localStorage.getItem(STORAGE_KEYS.memberships), {});

export const getUserClan = (userId: string) => {
  const memberships = getClanMemberships();
  const clanId = memberships[userId];
  return clans.find((clan) => clan.id === clanId) ?? clans[0];
};

export const getTerritoryState = () => safeParse<TerritoryState | null>(localStorage.getItem(STORAGE_KEYS.territoryState), null);

export const addClanEnergyFromCheckIn = (userId: string, amount = 20) => {
  const state = getTerritoryState();
  if (!state) return null;

  const clan = getUserClan(userId);
  const updated = {
    ...state,
    energyByClan: {
      ...state.energyByClan,
      [clan.id]: (state.energyByClan[clan.id] || 0) + amount,
    },
  };

  const sorted = Object.entries(updated.energyByClan).sort((a, b) => b[1] - a[1]);
  updated.winnerClanId = sorted[0]?.[0] ?? null;

  localStorage.setItem(STORAGE_KEYS.territoryState, JSON.stringify(updated));
  return updated;
};

export const getClanLeaderboard = (users: UserProfile[]) => {
  const memberships = getClanMemberships();
  const state = getTerritoryState();

  return clans
    .map((clan) => {
      const members = users.filter((user) => memberships[user.id] === clan.id);
      const avgLevel = members.length ? members.reduce((sum, item) => sum + item.level, 0) / members.length : 0;
      return {
        clan,
        members,
        avgLevel,
        energy: state?.energyByClan[clan.id] || 0,
      };
    })
    .sort((a, b) => b.energy - a.energy);
};
