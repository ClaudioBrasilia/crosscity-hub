import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { safeParse } from '@/lib/realUsers';
import type { Session } from '@supabase/supabase-js';

type Gender = 'male' | 'female';
type Category = 'rx' | 'scaled' | 'beginner';
type UserRole = 'athlete' | 'coach' | 'admin';

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  avatarUrl?: string;
  boxId: string;
  xp: number;
  individualEnergy?: number;
  level: number;
  streak: number;
  gender: Gender;
  category: Category;
  role: UserRole;
  checkins?: number;
  wins?: number;
  battles?: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, gender: Gender, category: Category, role?: UserRole) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  resetPassword: (email: string) => Promise<void>;
  getAllUsers: () => Promise<User[]>;
  setUserRole: (userId: string, role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAILS = new Set(['alex@crosscity.com', 'initial_admin@crosscity.com']);
const STORAGE_USERS_KEY = 'crosscity_users';
const USER_SCOPED_STORAGE_KEYS = [
  'crosscity_completed_challenges_',
  'crosscity_goals_',
  'crosscity_theme_',
  'crosscity_onboarding_',
  'crosscity_inventory_',
  'crosscity_wins_',
  'crosscity_battles_',
];
const sanitizeLegacyLocalStorage = (users: User[]) => {
  if (typeof window === 'undefined' || !window.localStorage) return;

  const validIds = new Set(users.map((item) => item.id));
  window.localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));

  const parsedResults = safeParse<Array<Record<string, any>>>(window.localStorage.getItem('crosscity_wod_results'), []);
  const filteredResults = parsedResults.filter((item) => validIds.has(String(item.userId || '')));
  if (filteredResults.length !== parsedResults.length) {
    window.localStorage.setItem('crosscity_wod_results', JSON.stringify(filteredResults));
  }

  const parsedDuels = safeParse<Array<Record<string, any>>>(window.localStorage.getItem('crosscity_duels'), []);
  const filteredDuels = parsedDuels.filter((item) => {
    const participantIds = [item?.challengerId, ...(Array.isArray(item?.opponentIds) ? item.opponentIds : [item?.opponentId])]
      .filter(Boolean)
      .map(String);
    return participantIds.length > 0 && participantIds.every((id) => validIds.has(id));
  });
  if (filteredDuels.length !== parsedDuels.length) {
    window.localStorage.setItem('crosscity_duels', JSON.stringify(filteredDuels));
  }

  const parsedFeed = safeParse<Array<Record<string, any>>>(window.localStorage.getItem('crosscity_feed'), []);
  const filteredFeed = parsedFeed.filter((item) => validIds.has(String(item.userId || '')));
  if (filteredFeed.length !== parsedFeed.length) {
    window.localStorage.setItem('crosscity_feed', JSON.stringify(filteredFeed));
  }

  const parsedCheckins = safeParse<Record<string, string[]>>(window.localStorage.getItem('crosscity_checkins'), {});
  const filteredCheckins = Object.fromEntries(Object.entries(parsedCheckins).filter(([userId]) => validIds.has(userId)));
  if (Object.keys(filteredCheckins).length !== Object.keys(parsedCheckins).length) {
    window.localStorage.setItem('crosscity_checkins', JSON.stringify(filteredCheckins));
  }

  const parsedProgress = safeParse<Record<string, Record<string, number>>>(window.localStorage.getItem('crosscity_challenge_progress'), {});
  const filteredProgress = Object.fromEntries(Object.entries(parsedProgress).filter(([userId]) => validIds.has(userId)));
  if (Object.keys(filteredProgress).length !== Object.keys(parsedProgress).length) {
    window.localStorage.setItem('crosscity_challenge_progress', JSON.stringify(filteredProgress));
  }

  const parsedBenchmarks = safeParse<Record<string, Record<string, number>>>(window.localStorage.getItem('crosscity_benchmarks'), {});
  const filteredBenchmarks = Object.fromEntries(Object.entries(parsedBenchmarks).filter(([userId]) => validIds.has(userId)));
  if (Object.keys(filteredBenchmarks).length !== Object.keys(parsedBenchmarks).length) {
    window.localStorage.setItem('crosscity_benchmarks', JSON.stringify(filteredBenchmarks));
  }

  const parsedBenchmarkHistory = safeParse<Record<string, Record<string, Array<Record<string, unknown>>>>>(window.localStorage.getItem('crosscity_benchmark_history'), {});
  const filteredBenchmarkHistory = Object.fromEntries(Object.entries(parsedBenchmarkHistory).filter(([userId]) => validIds.has(userId)));
  if (Object.keys(filteredBenchmarkHistory).length !== Object.keys(parsedBenchmarkHistory).length) {
    window.localStorage.setItem('crosscity_benchmark_history', JSON.stringify(filteredBenchmarkHistory));
  }

  const parsedCompletedChallenges = Object.fromEntries(
    Object.keys(window.localStorage)
      .filter((key) => key.startsWith('crosscity_completed_challenges_'))
      .map((key) => [key, safeParse<string[]>(window.localStorage.getItem(key), [])]),
  );
  Object.keys(parsedCompletedChallenges).forEach((key) => {
    const userId = key.replace('crosscity_completed_challenges_', '');
    if (!validIds.has(userId)) {
      window.localStorage.removeItem(key);
    }
  });

  const hydratedResults = filteredResults.map((item) => ({
    ...item,
    userName: users.find((user) => user.id === String(item.userId || ''))?.name || item.userName,
    avatar: users.find((user) => user.id === String(item.userId || ''))?.avatar || item.avatar,
  }));
  if (JSON.stringify(hydratedResults) !== JSON.stringify(filteredResults)) {
    window.localStorage.setItem('crosscity_wod_results', JSON.stringify(hydratedResults));
  }

  const hydratedFeed = filteredFeed.map((item) => ({
    ...item,
    userName: users.find((user) => user.id === String(item.userId || ''))?.name || item.userName,
    userAvatar: users.find((user) => user.id === String(item.userId || ''))?.avatar || item.userAvatar,
  }));
  if (JSON.stringify(hydratedFeed) !== JSON.stringify(filteredFeed)) {
    window.localStorage.setItem('crosscity_feed', JSON.stringify(hydratedFeed));
  }

  Object.keys(window.localStorage).forEach((key) => {
    const scopedPrefix = USER_SCOPED_STORAGE_KEYS.find((prefix) => key.startsWith(prefix));
    if (!scopedPrefix) return;

    const userId = key.slice(scopedPrefix.length);
    if (userId && !validIds.has(userId)) {
      window.localStorage.removeItem(key);
    }
  });

  window.dispatchEvent(new Event('storage'));
};

async function fetchUserProfile(userId: string): Promise<User | null> {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (profileError || !profile) return null;

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single();

  const dbRole = (roleData?.role as UserRole) || 'athlete';
  const finalRole = ADMIN_EMAILS.has(profile.email?.toLowerCase()) ? 'admin' : dbRole;

  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    avatar: profile.avatar || '👤',
    avatarUrl: (profile as any).avatar_url || undefined,
    boxId: profile.box_id || 'box_1',
    xp: profile.xp || 0,
    individualEnergy: profile.xp || 0,
    level: profile.level || 1,
    streak: profile.streak || 0,
    gender: (profile.gender as Gender) || 'male',
    category: (profile.category as Category) || 'beginner',
    role: finalRole,
    checkins: profile.checkins || 0,
    wins: profile.wins || 0,
    battles: profile.battles || 0,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const getAllUsers = useCallback(async (): Promise<User[]> => {
    const { data: profiles } = await supabase.from('profiles').select('*');
    const { data: roles } = await supabase.from('user_roles').select('user_id, role');

    if (!profiles) return [];

    const roleMap = new Map<string, UserRole>();
    roles?.forEach((r: any) => roleMap.set(r.user_id, r.role as UserRole));

    return profiles.map((p: any) => {
      const dbRole = roleMap.get(p.id) || 'athlete';
      const finalRole = ADMIN_EMAILS.has(p.email?.toLowerCase()) ? 'admin' : dbRole;
      return {
        id: p.id,
        name: p.name,
        email: p.email,
        avatar: p.avatar || '👤',
        avatarUrl: p.avatar_url || undefined,
        boxId: p.box_id || 'box_1',
        xp: p.xp || 0,
        individualEnergy: p.xp || 0,
        level: p.level || 1,
        streak: p.streak || 0,
        gender: (p.gender as Gender) || 'male',
        category: (p.category as Category) || 'beginner',
        role: finalRole,
        checkins: p.checkins || 0,
        wins: p.wins || 0,
        battles: p.battles || 0,
      };
    });
  }, []);

  const handleSession = useCallback(async (session: Session | null) => {
    if (!session?.user) {
      setUser(null);
      setLoading(false);
      return;
    }
    const profile = await fetchUserProfile(session.user.id);
    setUser(profile);
    setLoading(false);
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    });

    return () => subscription.unsubscribe();
  }, [handleSession]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.localStorage) return;

    if (!user) {
      window.localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify([]));
      return;
    }

    let cancelled = false;

    const syncRealUsersToStorage = async () => {
      const users = await getAllUsers();
      if (!cancelled) {
        sanitizeLegacyLocalStorage(users);
      }
    };

    syncRealUsersToStorage();

    return () => {
      cancelled = true;
    };
  }, [user, getAllUsers]);

  const login = async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const { error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
    if (error) throw new Error(error.message);
  };

  const register = async (name: string, email: string, password: string, gender: Gender, category: Category, _role?: UserRole) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, gender, category },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) throw new Error(error.message);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;
    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.avatar !== undefined) dbUpdates.avatar = updates.avatar;
    if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
    if (updates.xp !== undefined) dbUpdates.xp = updates.xp;
    if (updates.level !== undefined) dbUpdates.level = updates.level;
    if (updates.streak !== undefined) dbUpdates.streak = updates.streak;
    if (updates.checkins !== undefined) dbUpdates.checkins = updates.checkins;
    if (updates.wins !== undefined) dbUpdates.wins = updates.wins;
    if (updates.battles !== undefined) dbUpdates.battles = updates.battles;
    if (updates.boxId !== undefined) dbUpdates.box_id = updates.boxId;
    if (updates.gender !== undefined) dbUpdates.gender = updates.gender;
    if (updates.category !== undefined) dbUpdates.category = updates.category;

    if (Object.keys(dbUpdates).length > 0) {
      await supabase.from('profiles').update(dbUpdates).eq('id', user.id);
    }

    setUser(prev => prev ? { ...prev, ...updates } : null);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw new Error(error.message);
  };

  const setUserRole = async (userId: string, role: UserRole) => {
    const { data: existing } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existing) {
      await supabase.from('user_roles').update({ role }).eq('user_id', userId);
    } else {
      await supabase.from('user_roles').insert({ user_id: userId, role });
    }

    if (user && user.id === userId) {
      setUser(prev => prev ? { ...prev, role } : null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, resetPassword, getAllUsers, setUserRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
