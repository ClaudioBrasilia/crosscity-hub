/**
 * Utility to compute monthly check-in history from localStorage data.
 * Does NOT modify any existing data — read-only aggregation.
 */

import { supabase } from '@/integrations/supabase/client';

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

type MonthlyXpMap = Record<string, Record<string, number>>;
type MonthlyXpRow = { user_id: string; month_key: string; xp: number | null };

const getMonthLabel = (monthKey: string) => {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
};

const readLocalMonthlyXp = (): MonthlyXpMap => {
  try {
    const raw = localStorage.getItem(MONTHLY_XP_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as MonthlyXpMap;
  } catch {
    return {};
  }
};

const writeLocalMonthlyXp = (all: MonthlyXpMap): void => {
  localStorage.setItem(MONTHLY_XP_KEY, JSON.stringify(all));
};

const mergeMonthlyXpRows = (rows: MonthlyXpRow[]): MonthlyXpMap => {
  const map: MonthlyXpMap = {};

  rows.forEach((row) => {
    if (!row.user_id || !row.month_key) return;
    if (!map[row.user_id]) map[row.user_id] = {};
    map[row.user_id][row.month_key] = Number(row.xp) || 0;
  });

  return map;
};

const mergeWithLocalFallback = (remote: MonthlyXpMap, local: MonthlyXpMap): MonthlyXpMap => {
  const merged: MonthlyXpMap = { ...local };

  Object.entries(remote).forEach(([userId, months]) => {
    merged[userId] = { ...(merged[userId] || {}), ...months };
  });

  return merged;
};

/**
 * Reads the monthly XP store, prioritizing Supabase and falling back to localStorage.
 */
export const getAllMonthlyXp = async (): Promise<MonthlyXpMap> => {
  const local = readLocalMonthlyXp();

  const { data, error } = await supabase
    .from('monthly_xp')
    .select('user_id, month_key, xp');

  if (error || !data) {
    return local;
  }

  const remote = mergeMonthlyXpRows(data as MonthlyXpRow[]);
  const merged = mergeWithLocalFallback(remote, local);
  writeLocalMonthlyXp(merged);
  return merged;
};

/**
 * Adds XP to a user's current month tally in Supabase and keeps localStorage as cache/fallback.
 */
export const addMonthlyXp = async (userId: string, amount: number): Promise<number> => {
  const monthKey = getCurrentMonthKey();
  const local = readLocalMonthlyXp();

  const { data, error } = await supabase.rpc('increment_monthly_xp', {
    p_user_id: userId,
    p_month_key: monthKey,
    p_amount: amount,
  });

  if (error || typeof data !== 'number') {
    if (!local[userId]) local[userId] = {};
    local[userId][monthKey] = (local[userId][monthKey] || 0) + amount;
    writeLocalMonthlyXp(local);
    return local[userId][monthKey];
  }

  if (!local[userId]) local[userId] = {};
  local[userId][monthKey] = data;
  writeLocalMonthlyXp(local);
  return data;
};

/**
 * Returns the XP for a user in the current month.
 */
export const getCurrentMonthXp = async (userId: string): Promise<number> => {
  const all = await getAllMonthlyXp();
  const monthKey = getCurrentMonthKey();
  return all[userId]?.[monthKey] || 0;
};

/**
 * Returns the monthly XP history for a user (most recent first).
 */
export const getMonthlyXpHistory = async (userId: string): Promise<MonthlyXpSummary[]> => {
  const all = await getAllMonthlyXp();
  const userXp = all[userId] || {};

  return Object.entries(userXp)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([monthKey, xp]) => ({
      monthKey,
      label: getMonthLabel(monthKey),
      xp,
    }));
};
