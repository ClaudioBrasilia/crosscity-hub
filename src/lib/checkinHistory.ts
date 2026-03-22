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
