/**
 * Utility to compute monthly check-in history from localStorage data.
 * Does NOT modify any existing data — read-only aggregation.
 */

export interface MonthlyCheckinSummary {
  /** Format: "YYYY-MM" */
  monthKey: string;
  /** Human-readable label, e.g. "março 2026" */
  label: string;
  /** Total check-ins in that month */
  total: number;
}

/**
 * Returns the current month key in "YYYY-MM" format.
 */
export const getCurrentMonthKey = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

/**
 * Given an array of date strings ("YYYY-MM-DD"), returns the count for the current month.
 */
export const getCurrentMonthCheckins = (dates: string[]): number => {
  const prefix = getCurrentMonthKey();
  return dates.filter((d) => d.startsWith(prefix)).length;
};

/**
 * Given an array of date strings ("YYYY-MM-DD"), groups them by month
 * and returns a sorted array of monthly summaries (most recent first).
 */
export const getMonthlyHistory = (dates: string[]): MonthlyCheckinSummary[] => {
  const map = new Map<string, number>();

  for (const dateStr of dates) {
    if (!dateStr || dateStr.length < 7) continue;
    const monthKey = dateStr.slice(0, 7); // "YYYY-MM"
    map.set(monthKey, (map.get(monthKey) || 0) + 1);
  }

  const entries = Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0])) // most recent first
    .map(([monthKey, total]) => {
      const [year, month] = monthKey.split('-').map(Number);
      const date = new Date(year, month - 1, 1);
      const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      return { monthKey, label, total };
    });

  return entries;
};

/**
 * Reads all check-in data from localStorage safely.
 * Returns Record<userId, dateString[]>.
 */
export const getAllCheckins = (): Record<string, string[]> => {
  try {
    const raw = localStorage.getItem('crosscity_checkins');
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, string[]>;
  } catch {
    return {};
  }
};

// ─── Monthly XP tracking ────────────────────────────────────────────────

const MONTHLY_XP_KEY = 'crosscity_monthly_xp';

export interface MonthlyXpSummary {
  monthKey: string;
  label: string;
  xp: number;
}

/**
 * Reads the monthly XP store: Record<userId, Record<monthKey, number>>
 */
export const getAllMonthlyXp = (): Record<string, Record<string, number>> => {
  try {
    const raw = localStorage.getItem(MONTHLY_XP_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, Record<string, number>>;
  } catch {
    return {};
  }
};

/**
 * Adds XP to a user's current month tally.
 */
export const addMonthlyXp = (userId: string, amount: number): void => {
  const all = getAllMonthlyXp();
  const monthKey = getCurrentMonthKey();
  if (!all[userId]) all[userId] = {};
  all[userId][monthKey] = (all[userId][monthKey] || 0) + amount;
  localStorage.setItem(MONTHLY_XP_KEY, JSON.stringify(all));
};

/**
 * Returns the XP for a user in the current month.
 */
export const getCurrentMonthXp = (userId: string): number => {
  const all = getAllMonthlyXp();
  const monthKey = getCurrentMonthKey();
  return all[userId]?.[monthKey] || 0;
};

/**
 * Returns the monthly XP history for a user (most recent first).
 */
export const getMonthlyXpHistory = (userId: string): MonthlyXpSummary[] => {
  const all = getAllMonthlyXp();
  const userXp = all[userId] || {};
  return Object.entries(userXp)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([monthKey, xp]) => {
      const [year, month] = monthKey.split('-').map(Number);
      const date = new Date(year, month - 1, 1);
      const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      return { monthKey, label, xp };
    });
};
