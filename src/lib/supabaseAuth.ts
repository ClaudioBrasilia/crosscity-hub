import { supabase } from './supabase';

/**
 * Funções de autenticação com Supabase Auth
 * Estas funções substituem a autenticação mockada do localStorage
 */

export async function signUpWithEmail(email: string, password: string, name: string, avatar: string = '🏋️') {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    console.error('Sign up error:', error);
    return { user: null, error };
  }

  // Criar perfil do usuário na tabela 'users'
  if (data.user) {
    const { error: profileError } = await supabase
      .from('users')
      .insert([
        {
          id: data.user.id,
          email,
          name,
          avatar,
          level: 1,
          xp: 0,
          role: 'athlete',
        },
      ]);

    if (profileError) {
      console.error('Profile creation error:', profileError);
      return { user: data.user, error: profileError };
    }
  }

  return { user: data.user, error: null };
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Sign in error:', error);
    return { user: null, session: null, error };
  }

  return { user: data.user, session: data.session, error: null };
}

export async function signInWithGitHub() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    console.error('GitHub sign in error:', error);
    return { error };
  }

  return { error: null };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('Sign out error:', error);
    return { error };
  }

  return { error: null };
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    console.error('Get user error:', error);
    return { user: null, error };
  }

  return { user: data.user, error: null };
}

export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.error('Get session error:', error);
    return { session: null, error };
  }

  return { session: data.session, error: null };
}

export function onAuthStateChange(callback: (user: any) => void) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user || null);
  });
}

export async function resetPassword(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });

  if (error) {
    console.error('Reset password error:', error);
    return { error };
  }

  return { error: null };
}

export async function updatePassword(newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    console.error('Update password error:', error);
    return { error };
  }

  return { user: data.user, error: null };
}
