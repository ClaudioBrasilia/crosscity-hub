import React, { createContext, useContext, useState, useEffect } from 'react';

type Gender = 'male' | 'female';
type Category = 'rx' | 'scaled' | 'beginner';
type UserRole = 'athlete' | 'coach';

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
  register: (name: string, email: string, password: string, gender: Gender, category: Category) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('crosscity_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (email: string, password: string) => {
    const usersData = localStorage.getItem('crosscity_users') || '[]';
    const users = JSON.parse(usersData);
    const foundUser = users.find((u: any) => u.email === email && u.password === password);

    if (foundUser) {
      const { password: _, ...userWithoutPassword } = foundUser;
      const normalizedUser: User = {
        ...userWithoutPassword,
        gender: userWithoutPassword.gender || 'male',
        category: userWithoutPassword.category || 'beginner',
      };
      setUser(normalizedUser);
      localStorage.setItem('crosscity_user', JSON.stringify(normalizedUser));
    } else {
      throw new Error('Invalid credentials');
    }
  };

  const register = async (name: string, email: string, password: string, gender: Gender, category: Category) => {
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
