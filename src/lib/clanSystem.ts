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
  color: string;
  colors: string;
  createdAt: string;
}

export interface Territory {
  id: string;
  name: string;
  icon: string;
  focus: string;
  rotationOrder: number;
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

export interface ClanMembership {
  userId: string;
  clanId: string;
  role: 'member' | 'mentor' | 'captain';
  joinedAt: string;
}

export interface TerritoryBattle {
  id: string;
  territoryId: string;
  period: 'daily' | 'weekly';
  startsAt: string;
  endsAt: string;
  winnerClanId: string | null;
}

export interface DominationEvent {
  id: string;
  battleId: string;
  userId: string;
  clanId: string;
  source: 'checkin' | 'challenge' | 'bonus';
  energy: number;
  createdAt: string;
}

export interface ClanRewardGrant {
  id: string;
  clanId: string;
  rewardType: 'real' | 'digital' | 'power';
  payload: string;
  grantedAt: string;
}

export const clans: Clan[] = [
  { id: 'clan_forge', name: 'Guerreiros da Forja', motto: 'Disciplina constrói campeões.', banner: '⚒️', color: 'orange', colors: 'from-orange-500 to-red-500', createdAt: '2025-01-01T00:00:00.000Z' },
  { id: 'clan_arena', name: 'Titãs da Arena', motto: 'Cada round conta para todos.', banner: '🛡️', color: 'blue', colors: 'from-blue-500 to-cyan-500', createdAt: '2025-01-01T00:00:00.000Z' },
  { id: 'clan_courtyard', name: 'Legião do Pátio', motto: 'Consistência vence talento.', banner: '🏟️', color: 'emerald', colors: 'from-emerald-500 to-lime-500', createdAt: '2025-01-01T00:00:00.000Z' },
  { id: 'clan_temple', name: 'Guardas do Templo', motto: 'Honra, foco e comunidade.', banner: '🏛️', color: 'violet', colors: 'from-violet-500 to-fuchsia-500', createdAt: '2025-01-01T00:00:00.000Z' },
];

export const territories: Territory[] = [
  { id: 'territory_forge', name: 'A Forja', icon: '🔥', focus: 'força e PRs', rotationOrder: 1 },
  { id: 'territory_arena', name: 'A Arena', icon: '⚔️', focus: 'duelos e liderança', rotationOrder: 2 },
  { id: 'territory_courtyard', name: 'O Pátio', icon: '🏋️', focus: 'presença e volume', rotationOrder: 3 },
  { id: 'territory_temple', name: 'O Templo', icon: '🧠', focus: 'técnica e consistência', rotationOrder: 4 },
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
  battles: 'crosscity_territory_battles',
  dominationEvents: 'crosscity_domination_events',
  rewardGrants: 'crosscity_reward_grants',
  activityEnergyClaims: 'crosscity_activity_energy_claims',
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

const nowIso = () => new Date().toISOString();

const makeId = (prefix: string) => `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;

export const autoBalanceClans = (users: UserProfile[]) => {
  const memberships: Record<string, string> = {};

  for (const user of users) {
    const index = hashId(user.id + user.category) % clans.length;
    memberships[user.id] = clans[index].id;
  }

  localStorage.setItem(STORAGE_KEYS.memberships, JSON.stringify(memberships));

  const result: ClanMembership[] = users.map((user) => ({
    userId: user.id,
    clanId: memberships[user.id],
    role: 'member',
    joinedAt: nowIso(),
  }));

  return result;
};

const getBattles = () => safeParse<TerritoryBattle[]>(localStorage.getItem(STORAGE_KEYS.battles), []);

const setBattles = (battles: TerritoryBattle[]) => {
  localStorage.setItem(STORAGE_KEYS.battles, JSON.stringify(battles));
};

const getDominationEvents = () => safeParse<DominationEvent[]>(localStorage.getItem(STORAGE_KEYS.dominationEvents), []);

const setDominationEvents = (events: DominationEvent[]) => {
  localStorage.setItem(STORAGE_KEYS.dominationEvents, JSON.stringify(events));
};

export const getRewardGrants = () => safeParse<ClanRewardGrant[]>(localStorage.getItem(STORAGE_KEYS.rewardGrants), []);

const setRewardGrants = (grants: ClanRewardGrant[]) => {
  localStorage.setItem(STORAGE_KEYS.rewardGrants, JSON.stringify(grants));
};

const ensureCurrentBattle = () => {
  const state = getTerritoryState();
  if (!state) return null;

  const battles = getBattles();
  const current = battles.find((battle) => battle.id === state.dayKey);
  if (current) return current;

  const startsAt = `${state.dayKey}T00:00:00.000Z`;
  const endsAt = `${state.dayKey}T23:59:59.999Z`;
  const created: TerritoryBattle = {
    id: state.dayKey,
    territoryId: state.territoryId,
    period: 'daily',
    startsAt,
    endsAt,
    winnerClanId: state.winnerClanId,
  };

  setBattles([...battles, created]);
  return created;
};

export const getClansApi = (users: UserProfile[]) => {
  ensureClanData(users);
  const leaderboard = getClanLeaderboard(users);
  return leaderboard.map((entry, position) => ({
    position: position + 1,
    clan: entry.clan,
    membersCount: entry.members.length,
    avgLevel: Number(entry.avgLevel.toFixed(2)),
    energy: entry.energy,
  }));
};

export const getClanDetailsApi = (clanId: string, users: UserProfile[]) => {
  ensureClanData(users);
  const memberships = getClanMemberships();
  const clan = clans.find((item) => item.id === clanId);
  if (!clan) return null;

  const members = users.filter((user) => memberships[user.id] === clan.id);
  const events = getDominationEvents().filter((event) => event.clanId === clan.id);
  const grants = getRewardGrants().filter((grant) => grant.clanId === clan.id);

  return {
    clan,
    members,
    events,
    rewards: grants,
  };
};

export const getTerritoriesApi = () => {
  const state = getTerritoryState();
  return territories.map((territory) => ({
    ...territory,
    occupiedByClanId: state?.territoryId === territory.id ? state.winnerClanId : null,
  }));
};

export const postCheckInApi = (
  userId: string,
  options?: { source?: 'checkin' | 'challenge' | 'bonus'; peakBonus?: boolean; streakBonus?: boolean },
) => {
  const source = options?.source ?? 'checkin';
  const energy = 20 + (options?.peakBonus ? 5 : 0) + (options?.streakBonus ? 10 : 0);
  const state = addClanEnergyFromCheckIn(userId, energy);
  if (!state) return null;

  const clan = getUserClan(userId);
  const battle = ensureCurrentBattle();
  if (!battle) return null;

  const event: DominationEvent = {
    id: makeId('event'),
    battleId: battle.id,
    userId,
    clanId: clan.id,
    source,
    energy,
    createdAt: nowIso(),
  };

  const events = getDominationEvents();
  setDominationEvents([...events, event]);
  return event;
};

export const getCurrentBattleApi = () => {
  const battle = ensureCurrentBattle();
  const state = getTerritoryState();
  if (!battle || !state) return null;

  return {
    ...battle,
    winnerClanId: state.winnerClanId,
    scoreboard: state.energyByClan,
  };
};

export const closeTerritoryPeriodApi = (users: UserProfile[]) => {
  const state = getTerritoryState();
  if (!state) return null;

  const battle = ensureCurrentBattle();
  if (!battle) return null;

  const events = getDominationEvents().filter((event) => event.battleId === battle.id);
  const memberships = getClanMemberships();

  const leaderboard = clans.map((clan) => {
    const energy = state.energyByClan[clan.id] || 0;
    const uniqueUsers = new Set(events.filter((event) => event.clanId === clan.id).map((event) => event.userId)).size;
    const members = users.filter((user) => memberships[user.id] === clan.id);
    const avgLevel = members.length ? members.reduce((sum, user) => sum + user.level, 0) / members.length : 0;
    return { clanId: clan.id, energy, uniqueUsers, avgLevel };
  });

  leaderboard.sort((a, b) => b.energy - a.energy || b.uniqueUsers - a.uniqueUsers || b.avgLevel - a.avgLevel);
  const winnerClanId = leaderboard[0]?.clanId ?? null;

  const updatedState: TerritoryState = {
    ...state,
    winnerClanId,
  };
  localStorage.setItem(STORAGE_KEYS.territoryState, JSON.stringify(updatedState));

  const battles = getBattles();
  const updatedBattles = battles.map((item) => (item.id === battle.id ? { ...item, winnerClanId } : item));
  setBattles(updatedBattles);

  return {
    battleId: battle.id,
    winnerClanId,
    ranking: leaderboard,
  };
};

export const distributeRewardsApi = () => {
  const state = getTerritoryState();
  const winnerClanId = state?.winnerClanId;
  if (!winnerClanId) return [];

  const grants = clanRewards.map<ClanRewardGrant>((reward) => ({
    id: makeId('reward'),
    clanId: winnerClanId,
    rewardType: reward.type,
    payload: reward.title,
    grantedAt: nowIso(),
  }));

  const current = getRewardGrants();
  setRewardGrants([...current, ...grants]);
  return grants;
};


export interface ActivityEnergyClaim {
  id: string;
  userId: string;
  clanId: string;
  activityId: string;
  activityType: 'checkin' | 'wod' | 'challenge' | 'event';
  energy: number;
  createdAt: string;
}

const getActivityEnergyClaims = () =>
  safeParse<ActivityEnergyClaim[]>(localStorage.getItem(STORAGE_KEYS.activityEnergyClaims), []);

const setActivityEnergyClaims = (claims: ActivityEnergyClaim[]) => {
  localStorage.setItem(STORAGE_KEYS.activityEnergyClaims, JSON.stringify(claims));
};

const getUsersFromStorage = () => safeParse<Array<{ id: string }>>(localStorage.getItem('crosscity_users'), []);

const isKnownActivity = (activityId: string, activityType: ActivityEnergyClaim['activityType']) => {
  if (!activityId.trim()) return false;

  if (activityType === 'checkin') {
    return /^checkin:\d{4}-\d{2}-\d{2}$/.test(activityId);
  }

  if (activityType === 'wod') {
    const dailyWod = safeParse<{ id?: string } | null>(localStorage.getItem('crosscity_daily_wod'), null);
    return dailyWod?.id === activityId;
  }

  if (activityType === 'challenge') {
    const challenges = safeParse<Array<{ id: string }>>(localStorage.getItem('crosscity_challenges'), []);
    return challenges.some((challenge) => challenge.id === activityId);
  }

  if (activityType === 'event' && activityId.startsWith('territory:')) {
    return true;
  }

  const events = safeParse<Array<{ id: string }>>(localStorage.getItem('crosscity_events'), []);
  return events.some((event) => event.id === activityId);
};

export const hasGeneratedDominationEnergy = (userId: string, activityId: string) => {
  const claims = getActivityEnergyClaims();
  return claims.some((item) => item.userId === userId && item.activityId === activityId);
};

export const generateDominationEnergyForActivity = (params: {
  userId: string;
  activityId: string;
  activityType: ActivityEnergyClaim['activityType'];
  energy?: number;
  participationValid?: boolean;
}) => {
  const { userId, activityId, activityType, energy = 20, participationValid = true } = params;

  if (!isKnownActivity(activityId, activityType)) {
    return { ok: false as const, status: 404, message: 'Atividade inválida.' };
  }

  const users = getUsersFromStorage();
  const userExists = users.some((item) => item.id === userId);
  if (!userExists) {
    return { ok: false as const, status: 404, message: 'Aluno inválido.' };
  }

  const clan = getUserClan(userId);
  if (!clan) {
    return { ok: false as const, status: 422, message: 'Aluno sem clã ativo.' };
  }

  if (!participationValid) {
    return { ok: false as const, status: 422, message: 'Participação na atividade não confirmada.' };
  }

  const claims = getActivityEnergyClaims();
  const existing = claims.find((item) => item.userId === userId && item.activityId === activityId);
  if (existing) {
    return { ok: false as const, status: 409, message: 'Você já gerou energia para esta atividade.' };
  }

  const claim: ActivityEnergyClaim = {
    id: makeId('energy'),
    userId,
    clanId: clan.id,
    activityId,
    activityType,
    energy,
    createdAt: nowIso(),
  };

  setActivityEnergyClaims([claim, ...claims]);
  addClanEnergyFromCheckIn(userId, energy);

  window.dispatchEvent(new Event('storage'));

  return { ok: true as const, status: 201, claim };
};
