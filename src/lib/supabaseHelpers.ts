import { supabase } from './supabase';
import type { Database } from './database.types';

/**
 * Funções auxiliares para integração com Supabase
 * Estas funções ajudam na migração gradual do localStorage para o banco de dados real
 */

// ============ USERS ============
export async function fetchUser(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) console.error('Error fetching user:', error);
  return data;
}

export async function updateUserXP(userId: string, xpAmount: number) {
  const user = await fetchUser(userId);
  if (!user) return null;

  const newXp = (user.xp || 0) + xpAmount;
  const newLevel = Math.floor(newXp / 500) + 1;

  const { data, error } = await supabase
    .from('users')
    .update({ xp: newXp, level: newLevel, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();

  if (error) console.error('Error updating user XP:', error);
  return data;
}

// ============ DUELS ============
export async function fetchDuels(userId?: string) {
  let query = supabase.from('duels').select('*');
  
  if (userId) {
    query = query.or(`challenger_id.eq.${userId},opponent_id.eq.${userId}`);
  }

  const { data, error } = await query;
  if (error) console.error('Error fetching duels:', error);
  return data || [];
}

export async function createDuel(duel: Database['public']['Tables']['duels']['Insert']) {
  const { data, error } = await supabase
    .from('duels')
    .insert([duel])
    .select()
    .single();

  if (error) console.error('Error creating duel:', error);
  return data;
}

export async function updateDuelStatus(duelId: string, status: 'pending' | 'active' | 'finished', winnerId?: string) {
  const { data, error } = await supabase
    .from('duels')
    .update({ status, winner_id: winnerId, updated_at: new Date().toISOString() })
    .eq('id', duelId)
    .select()
    .single();

  if (error) console.error('Error updating duel status:', error);
  return data;
}

export async function submitDuelResult(duelId: string, userId: string, result: string) {
  const duel = await supabase
    .from('duels')
    .select('*')
    .eq('id', duelId)
    .single();

  if (!duel.data) return null;

  const isChallenger = duel.data.challenger_id === userId;
  const updateData = isChallenger 
    ? { challenger_result: result }
    : { opponent_result: result };

  const { data, error } = await supabase
    .from('duels')
    .update({ ...updateData, updated_at: new Date().toISOString() })
    .eq('id', duelId)
    .select()
    .single();

  if (error) console.error('Error submitting duel result:', error);
  return data;
}

// ============ CLANS ============
export async function fetchClan(clanId: string) {
  const { data, error } = await supabase
    .from('clans')
    .select('*')
    .eq('id', clanId)
    .single();

  if (error) console.error('Error fetching clan:', error);
  return data;
}

export async function fetchUserClan(userId: string) {
  const { data, error } = await supabase
    .from('clans')
    .select('*')
    .contains('members', [userId])
    .single();

  if (error && error.code !== 'PGRST116') console.error('Error fetching user clan:', error);
  return data || null;
}

export async function createClan(clan: Database['public']['Tables']['clans']['Insert']) {
  const { data, error } = await supabase
    .from('clans')
    .insert([clan])
    .select()
    .single();

  if (error) console.error('Error creating clan:', error);
  return data;
}

export async function updateClanXP(clanId: string, xpAmount: number) {
  const clan = await fetchClan(clanId);
  if (!clan) return null;

  const newXp = (clan.xp || 0) + xpAmount;

  const { data, error } = await supabase
    .from('clans')
    .update({ xp: newXp })
    .eq('id', clanId)
    .select()
    .single();

  if (error) console.error('Error updating clan XP:', error);
  return data;
}

// ============ WODS ============
export async function fetchWODs() {
  const { data, error } = await supabase
    .from('wods')
    .select('*')
    .order('date', { ascending: false });

  if (error) console.error('Error fetching WODs:', error);
  return data || [];
}

export async function createWOD(wod: Database['public']['Tables']['wods']['Insert']) {
  const { data, error } = await supabase
    .from('wods')
    .insert([wod])
    .select()
    .single();

  if (error) console.error('Error creating WOD:', error);
  return data;
}

// ============ REAL-TIME SUBSCRIPTIONS ============
// Note: Real-time subscriptions com Supabase v2 devem usar supabase.channel()
// As funções abaixo foram removidas pois usam a API v1 obsoleta.
// Para implementar real-time, use:
// const channel = supabase.channel('users').on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, (payload) => { ... }).subscribe();

