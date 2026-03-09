import React, { createContext, useContext, useState, useEffect } from 'react';

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
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, gender: Gender, category: Category, role?: UserRole) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  resetPassword: (email: string) => Promise<void>;
  getAllUsers: () => any[];
  setUserRole: (userId: string, role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const COACH_EMAILS = new Set(['alex@crosscity.com']);

const resolveRole = (raw: { email?: string; role?: unknown }): UserRole => {
  const email = raw.email?.toLowerCase() || '';
  if (COACH_EMAILS.has(email)) return 'coach';
  return raw.role === 'coach' ? 'coach' : 'athlete';
};

const normalizeUser = (raw: any): User => ({
  ...raw,
  gender: raw.gender || 'male',
  category: raw.category || 'beginner',
  role: resolveRole(raw),
});

const migrateStoredUsers = () => {
  const usersData = localStorage.getItem('crosscity_users') || '[]';
  const users = JSON.parse(usersData);

  if (!Array.isArray(users)) return [];

  let changed = false;
  const migratedUsers = users.map((storedUser: any) => {
    const resolvedRole = resolveRole(storedUser);
    if (storedUser.role !== resolvedRole) {
      changed = true;
      return { ...storedUser, role: resolvedRole };
    }

    return storedUser;
  });

  if (changed) {
    localStorage.setItem('crosscity_users', JSON.stringify(migratedUsers));
  }

  return migratedUsers;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    migrateStoredUsers();

    const storedUser = localStorage.getItem('crosscity_user');
    if (storedUser) {
      const normalizedUser = normalizeUser(JSON.parse(storedUser));
      setUser(normalizedUser);
      localStorage.setItem('crosscity_user', JSON.stringify(normalizedUser));
    }
  }, []);

  const login = async (email: string, password: string) => {
    const users = migrateStoredUsers();
    const foundUser = users.find((u: any) => u.email === email && u.password === password);

    if (foundUser) {
      const { password: _, ...userWithoutPassword } = foundUser;
      const normalizedUser = normalizeUser(userWithoutPassword);
      setUser(normalizedUser);
      localStorage.setItem('crosscity_user', JSON.stringify(normalizedUser));
    } else {
      throw new Error('Invalid credentials');
    }
  };

  const register = async (name: string, email: string, password: string, gender: Gender, category: Category, role: UserRole = 'athlete') => {
    const usersData = localStorage.getItem('crosscity_users') || '[]';
    const users = JSON.parse(usersData);

    if (users.find((u: any) => u.email === email)) {
      throw new Error('Email already registered');
    }

    const newUser: User = {
      id: `user_${Date.now()}`,
      name,
      email,
      avatar: '👤',
      boxId: 'box_1',
      xp: 0,
      level: 1,
      streak: 0,
      gender,
      category,
      role,
      checkins: 0,
    };

    users.push({ ...newUser, password });
    localStorage.setItem('crosscity_users', JSON.stringify(users));

    setUser(newUser);
    localStorage.setItem('crosscity_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('crosscity_user');
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('crosscity_user', JSON.stringify(updatedUser));
    }
  };

  const resetPassword = async (email: string) => {
    const usersData = localStorage.getItem('crosscity_users') || '[]';
    const users = JSON.parse(usersData);

    if (!users.find((u: any) => u.email === email)) {
      throw new Error('Email não encontrado');
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
