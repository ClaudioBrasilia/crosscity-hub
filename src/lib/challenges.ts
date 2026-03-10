export type ChallengeType = 'weekly' | 'monthly';

export interface Challenge {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: ChallengeType;
  xpReward: number;
  target: number;
  unit: string;
  startDate: string;
  endDate: string;
}

const STORAGE_KEY = 'crosscity_challenges';

export function getActiveChallenges(): Challenge[] {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

export function saveChallenges(challenges: Challenge[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(challenges));
}

export function addChallenge(challenge: Omit<Challenge, 'id'>): Challenge | null {
  const existing = getActiveChallenges();
  // Limites removidos conforme solicitação do usuário
  const newChallenge: Challenge = { ...challenge, id: `ch_${Date.now()}` };
  existing.push(newChallenge);
  saveChallenges(existing);
  return newChallenge;
}

export function removeChallenge(id: string): void {
  const existing = getActiveChallenges().filter(c => c.id !== id);
  saveChallenges(existing);
}

export function updateChallenge(id: string, updates: Partial<Omit<Challenge, 'id'>>): void {
  const existing = getActiveChallenges().map(c => c.id === id ? { ...c, ...updates } : c);
  saveChallenges(existing);
}

/** Manual progress tracking – professor or athlete increments */
export function getChallengeProgress(challengeId: string, userId: string): number {
  const data: Record<string, Record<string, number>> = JSON.parse(localStorage.getItem('crosscity_challenge_progress') || '{}');
  return data[userId]?.[challengeId] || 0;
}

export function setChallengeProgress(challengeId: string, userId: string, value: number): void {
  const data: Record<string, Record<string, number>> = JSON.parse(localStorage.getItem('crosscity_challenge_progress') || '{}');
  if (!data[userId]) data[userId] = {};
  data[userId][challengeId] = value;
  localStorage.setItem('crosscity_challenge_progress', JSON.stringify(data));
}

export function incrementChallengeProgress(challengeId: string, userId: string): number {
  const current = getChallengeProgress(challengeId, userId);
  const next = current + 1;
  setChallengeProgress(challengeId, userId, next);
  return next;
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
