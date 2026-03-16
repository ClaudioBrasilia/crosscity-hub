import type { Duel } from './mockData';

type DuelUser = { id: string; xp: number; [key: string]: any };

export const normalizeDuel = (item: any): Duel => ({
  ...item,
  opponentIds: Array.isArray(item?.opponentIds) ? item.opponentIds : [item?.opponentId || ''],
  results: typeof item?.results === 'object' ? item.results : { [item?.challengerId]: item?.challengerResult, [item?.opponentId]: item?.opponentResult },
  acceptedBy: Array.isArray(item?.acceptedBy) ? item.acceptedBy : (item?.betAccepted ? [item?.opponentId] : []),
  status: item?.status === 'pending' || item?.status === 'active' || item?.status === 'finished' ? item.status : 'active',
  winnerId: item?.winnerId ?? null,
  betMode: Boolean(item?.betMode),
  betType: item?.betType === 'xp' || item?.betType === 'equipment' ? item.betType : null,
  betItems: Array.isArray(item?.betItems) ? item.betItems : [],
  betXpAmount: typeof item?.betXpAmount === 'number' ? item.betXpAmount : null,
  betReserved: Boolean(item?.betReserved),
  betReservedAt: typeof item?.betReservedAt === 'number' ? item.betReservedAt : null,
  betSettledAt: typeof item?.betSettledAt === 'number' ? item.betSettledAt : null,
  betCanceledAt: typeof item?.betCanceledAt === 'number' ? item.betCanceledAt : null,
});

export const calculateWinner = (duel: Duel, users: User[]): string | null => {
  // Implementar lógica de cálculo do vencedor aqui
  // Por enquanto, retorna o desafiante como vencedor se houver resultados
  const participantIds = [duel.challengerId, ...duel.opponentIds];
  const results = duel.results;

  const validResults = participantIds.filter((id) => results[id]);
  if (validResults.length === 0) return null;

  // Lógica simplificada para determinar o vencedor (precisa ser mais robusta)
  // Para duelos de tempo, menor tempo ganha. Para rounds, maior rounds ganha.
  // Assumindo que todos os resultados são do mesmo tipo (tempo ou rounds)
  const firstResult = results[validResults[0]];
  if (!firstResult) return null;

  const isTimeBased = firstResult.includes(':'); // Heurística simples para tempo

  let winnerId = validResults[0];
  let winnerValue = isTimeBased ? parseTime(firstResult) : parseInt(firstResult);

  for (let i = 1; i < validResults.length; i++) {
    const currentId = validResults[i];
    const currentValueStr = results[currentId];
    if (!currentValueStr) continue;

    const currentValue = isTimeBased ? parseTime(currentValueStr) : parseInt(currentValueStr);

    if (isTimeBased) {
      if (currentValue < winnerValue) {
        winnerId = currentId;
        winnerValue = currentValue;
      }
    } else {
      if (currentValue > winnerValue) {
        winnerId = currentId;
        winnerValue = currentValue;
      }
    }
  }

  return winnerId;
};

const parseTime = (timeStr: string): number => {
  const parts = timeStr.split(':');
  if (parts.length === 2) {
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  }
  return 0;
};

export const reserveXp = (duel: Duel, users: User[]): { updatedUsers: User[]; updatedDuel: Duel; } => {
  if (!duel.betMode || duel.betType !== 'xp' || !duel.betXpAmount || duel.betReserved) {
    return { updatedUsers: users, updatedDuel: duel };
  }

  const amount = duel.betXpAmount;
  const participantIds = [duel.challengerId, ...duel.opponentIds];

  const updatedUsers = users.map(user => {
    if (participantIds.includes(user.id)) {
      return { ...user, xp: user.xp - amount };
    }
    return user;
  });

  const updatedDuel = { ...duel, betReserved: true, betReservedAt: Date.now() };

  return { updatedUsers, updatedDuel };
};

export const refundXp = (duel: Duel, users: User[]): User[] => {
  if (!duel.betMode || duel.betType !== 'xp' || !duel.betXpAmount || !duel.betReserved || duel.betSettledAt) {
    return users;
  }

  const amount = duel.betXpAmount;
  const participantIds = [duel.challengerId, ...duel.opponentIds];

  const updatedUsers = users.map(user => {
    if (participantIds.includes(user.id)) {
      return { ...user, xp: user.xp + amount };
    }
    return user;
  });

  return updatedUsers;
};

export const settleBet = (duel: Duel, winnerId: string | null, users: User[]): { updatedUsers: User[]; updatedDuel: Duel; } => {
  if (!duel.betMode || duel.betType !== 'xp' || !duel.betXpAmount || !duel.betReserved || duel.betSettledAt) {
    return { updatedUsers: users, updatedDuel: duel };
  }

  const amount = duel.betXpAmount;
  const participantIds = [duel.challengerId, ...duel.opponentIds];

  let updatedUsers = users.map(user => {
    if (participantIds.includes(user.id)) {
      // Devolve a aposta para todos os participantes primeiro
      return { ...user, xp: user.xp + amount };
    }
    return user;
  });

  if (winnerId) {
    // O vencedor recebe as apostas dos perdedores
    const losers = participantIds.filter(id => id !== winnerId);
    const winnings = amount * losers.length;

    updatedUsers = updatedUsers.map(user => {
      if (user.id === winnerId) {
        return { ...user, xp: user.xp + winnings };
      }
      return user;
    });
  }

  const updatedDuel = { ...duel, status: 'finished' as Duel['status'], winnerId, betSettledAt: Date.now() };

  return { updatedUsers, updatedDuel };
};

export const checkAllResultsSubmitted = (duel: Duel): boolean => {
  const allParticipants = [duel.challengerId, ...duel.opponentIds];
  return allParticipants.every(id => duel.results[id] !== null && duel.results[id] !== undefined);
};
