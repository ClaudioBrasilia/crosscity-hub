import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

type Gender = 'male' | 'female';
type Category = 'rx' | 'scaled' | 'beginner';
type UserRole = 'athlete' | 'coach' | 'admin';

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
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
  // Admin email fallback for bootstrapping the first admin
  const finalRole = ADMIN_EMAILS.has(profile.email?.toLowerCase()) ? 'admin' : dbRole;

  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    avatar: profile.avatar || '👤',
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
    // Set up listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });

    // Then check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    });

    return () => subscription.unsubscribe();
  }, [handleSession]);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
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

  const getAllUsers = async (): Promise<User[]> => {
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
  };

  const setUserRole = async (userId: string, role: UserRole) => {
    // Upsert: update if exists, insert if not
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

    // Update local state if changing own role
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
