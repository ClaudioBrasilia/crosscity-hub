/**
 * Centralized Supabase data service.
 * Replaces all localStorage-based data operations with Supabase queries.
 */
import { supabase } from '@/integrations/supabase/client';

// ─── Helpers ────────────────────────────────────────────────────────────────
const getCurrentMonthKey = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const formatDateKey = (date = new Date()) => date.toISOString().split('T')[0];

// ─── Check-ins ──────────────────────────────────────────────────────────────

export async function recordCheckin(userId: string, date?: string): Promise<boolean> {
  const checkDate = date || formatDateKey();
  const { error } = await supabase.rpc('record_checkin', {
    _user_id: userId,
    _check_date: checkDate,
  });
  if (error) {
    console.error('Error recording checkin:', error);
    throw new Error('Falha ao registrar check-in no servidor.');
  }
  return true;
}

export async function getUserCheckins(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('checkins')
    .select('check_date')
    .eq('user_id', userId)
    .order('check_date', { ascending: false });
  if (error) {
    console.error('Error fetching checkins:', error);
    return [];
  }
  return (data || []).map((r: any) => r.check_date);
}

export async function getAllCheckins(): Promise<Record<string, string[]>> {
  const { data, error } = await supabase
    .from('checkins')
    .select('user_id, check_date')
    .order('check_date', { ascending: false });
  if (error) {
    console.error('Error fetching all checkins:', error);
    return {};
  }
  const result: Record<string, string[]> = {};
  (data || []).forEach((r: any) => {
    if (!result[r.user_id]) result[r.user_id] = [];
    result[r.user_id].push(r.check_date);
  });
  return result;
}

// ─── Monthly XP ─────────────────────────────────────────────────────────────

export async function addMonthlyXp(userId: string, amount: number): Promise<void> {
  const monthKey = getCurrentMonthKey();
  const { error } = await supabase.rpc('add_monthly_xp', {
    _user_id: userId,
    _month_key: monthKey,
    _amount: amount,
  });
  if (error) {
    console.error('Error adding monthly XP:', error);
    throw new Error('Falha ao registrar XP mensal.');
  }
}

export async function getCurrentMonthXp(userId: string): Promise<number> {
  const monthKey = getCurrentMonthKey();
  const { data, error } = await supabase
    .from('monthly_xp')
    .select('xp')
    .eq('user_id', userId)
    .eq('month_key', monthKey)
    .maybeSingle();
  if (error) {
    console.error('Error fetching monthly XP:', error);
    return 0;
  }
  return (data as any)?.xp || 0;
}

export async function getMonthlyXpHistory(userId: string): Promise<Array<{ monthKey: string; label: string; xp: number }>> {
  const { data, error } = await supabase
    .from('monthly_xp')
    .select('month_key, xp')
    .eq('user_id', userId)
    .order('month_key', { ascending: false });
  if (error) {
    console.error('Error fetching monthly XP history:', error);
    return [];
  }
  return (data || []).map((r: any) => {
    const [year, month] = r.month_key.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    return { monthKey: r.month_key, label, xp: r.xp };
  });
}

// ─── WODs ───────────────────────────────────────────────────────────────────

export interface WodData {
  id: string;
  date: string;
  name: string;
  type: string;
  warmup?: string;
  skill?: string;
  versions: Record<string, { description: string; weight: string }>;
}

export async function getDailyWod(date?: string): Promise<WodData | null> {
  const targetDate = date || formatDateKey();
  const { data, error } = await supabase
    .from('wods')
    .select('*')
    .eq('date', targetDate)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return {
    id: (data as any).id,
    date: (data as any).date,
    name: (data as any).name,
    type: (data as any).type,
    warmup: (data as any).warmup,
    skill: (data as any).skill,
    versions: (data as any).versions || {},
  };
}

export async function getLatestWod(): Promise<WodData | null> {
  const { data, error } = await supabase
    .from('wods')
    .select('*')
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return {
    id: (data as any).id,
    date: (data as any).date,
    name: (data as any).name,
    type: (data as any).type,
    warmup: (data as any).warmup,
    skill: (data as any).skill,
    versions: (data as any).versions || {},
  };
}

export async function getAllWods(): Promise<WodData[]> {
  const { data, error } = await supabase
    .from('wods')
    .select('*')
    .order('date', { ascending: false });
  if (error) return [];
  return (data || []).map((d: any) => ({
    id: d.id,
    date: d.date,
    name: d.name,
    type: d.type,
    warmup: d.warmup,
    skill: d.skill,
    versions: d.versions || {},
  }));
}

export async function saveWod(wod: WodData, createdBy?: string): Promise<void> {
  const wodDate = wod.date || formatDateKey();
  const { error } = await supabase
    .from('wods')
    .upsert({
      id: wod.id,
      date: wodDate,
      name: wod.name,
      type: wod.type,
      warmup: wod.warmup || null,
      skill: wod.skill || null,
      versions: wod.versions as any,
      created_by: createdBy || null,
    } as any);
  if (error) {
    console.error('Error saving WOD:', error);
    throw new Error('Falha ao salvar WOD.');
  }
}

// ─── WOD Results ────────────────────────────────────────────────────────────

export interface WodResult {
  id: string;
  wodId: string;
  userId: string;
  userName: string;
  avatar: string;
  category: string;
  result: string;
  unit: string;
  submittedAt: number;
}

export async function getWodResults(wodId?: string): Promise<WodResult[]> {
  let query = supabase
    .from('wod_results')
    .select('*, profiles!inner(name, avatar)')
    .order('submitted_at', { ascending: false });
  
  if (wodId) {
    query = query.eq('wod_id', wodId);
  }
  
  const { data, error } = await query;
  if (error) {
    console.error('Error fetching WOD results:', error);
    return [];
  }
  return (data || []).map((r: any) => ({
    id: r.id,
    wodId: r.wod_id,
    userId: r.user_id,
    userName: r.profiles?.name || 'Atleta',
    avatar: r.profiles?.avatar || '👤',
    category: r.category,
    result: r.result,
    unit: r.unit,
    submittedAt: r.submitted_at,
  }));
}

export async function saveWodResult(result: { id: string; wodId: string; userId: string; category: string; result: string; unit: string }): Promise<void> {
  const { error } = await supabase.rpc('upsert_wod_result', {
    _id: result.id,
    _wod_id: result.wodId,
    _user_id: result.userId,
    _category: result.category,
    _result: result.result,
    _unit: result.unit,
  });
  if (error) {
    console.error('Error saving WOD result:', error);
    throw new Error('Falha ao salvar resultado.');
  }
}

// ─── Benchmarks ─────────────────────────────────────────────────────────────

export async function getUserBenchmarks(userId: string): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('benchmarks')
    .select('exercise_id, value')
    .eq('user_id', userId);
  if (error) {
    console.error('Error fetching benchmarks:', error);
    return {};
  }
  const result: Record<string, number> = {};
  (data || []).forEach((r: any) => { result[r.exercise_id] = Number(r.value); });
  return result;
}

export async function getAllBenchmarks(): Promise<Array<{ userId: string; benchmarks: Record<string, number> }>> {
  const { data, error } = await supabase
    .from('benchmarks')
    .select('user_id, exercise_id, value');
  if (error) return [];
  const map: Record<string, Record<string, number>> = {};
  (data || []).forEach((r: any) => {
    if (!map[r.user_id]) map[r.user_id] = {};
    map[r.user_id][r.exercise_id] = Number(r.value);
  });
  return Object.entries(map).map(([userId, benchmarks]) => ({ userId, benchmarks }));
}

export async function saveBenchmark(userId: string, exerciseId: string, value: number): Promise<void> {
  const { error } = await supabase.rpc('upsert_benchmark', {
    _user_id: userId,
    _exercise_id: exerciseId,
    _value: value,
  });
  if (error) {
    console.error('Error saving benchmark:', error);
    throw new Error('Falha ao salvar benchmark.');
  }
}

export async function getBenchmarkHistory(userId: string, exerciseId: string): Promise<Array<{ value: number; date: string }>> {
  const { data, error } = await supabase
    .from('benchmark_history')
    .select('value, recorded_at')
    .eq('user_id', userId)
    .eq('exercise_id', exerciseId)
    .order('recorded_at', { ascending: true });
  if (error) return [];
  return (data || []).map((r: any) => ({ value: Number(r.value), date: r.recorded_at }));
}

// ─── Challenges ─────────────────────────────────────────────────────────────

export interface ChallengeData {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'weekly' | 'monthly';
  xpReward: number;
  target: number;
  unit: string;
  startDate: string | null;
  endDate: string | null;
}

export async function getActiveChallenges(): Promise<ChallengeData[]> {
  const today = formatDateKey();
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching challenges:', error);
    return [];
  }

  const isActive = (startDate?: string | null, endDate?: string | null) => {
    // Legacy fallback: keep old rows visible while dates are being rolled out.
    if (!startDate && !endDate) return true;
    if (!startDate) return !!endDate && today <= endDate;
    if (!endDate) return startDate <= today;
    return startDate <= today && today <= endDate;
  };

  return (data || [])
    .filter((r: any) => isActive(r.start_date, r.end_date))
    .map((r: any) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    icon: r.icon,
    type: r.type,
    xpReward: r.xp_reward,
    target: r.target,
    unit: r.unit,
    startDate: r.start_date ?? null,
    endDate: r.end_date ?? null,
  }));
}

export async function addChallenge(challenge: Omit<ChallengeData, 'id'>, createdBy?: string): Promise<ChallengeData> {
  const id = `ch_${Date.now()}`;
  const { error } = await supabase.from('challenges').insert({
    id,
    name: challenge.name,
    description: challenge.description,
    icon: challenge.icon,
    type: challenge.type,
    xp_reward: challenge.xpReward,
    target: challenge.target,
    unit: challenge.unit,
    start_date: challenge.startDate,
    end_date: challenge.endDate,
    created_by: createdBy || null,
  } as any);
  if (error) {
    console.error('Error adding challenge:', error);
    throw new Error('Falha ao criar desafio.');
  }
  return { ...challenge, id };
}

export async function removeChallenge(id: string): Promise<void> {
  const { error } = await supabase.from('challenges').delete().eq('id', id);
  if (error) {
    console.error('Error removing challenge:', error);
    throw new Error('Falha ao remover desafio.');
  }
}

export async function getChallengeProgress(challengeId: string, userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('challenge_progress')
    .select('progress')
    .eq('challenge_id', challengeId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) return 0;
  return (data as any)?.progress || 0;
}

export async function getAllChallengeProgress(challengeId: string): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('challenge_progress')
    .select('user_id, progress')
    .eq('challenge_id', challengeId);
  if (error) return {};
  const result: Record<string, number> = {};
  (data || []).forEach((r: any) => { result[r.user_id] = r.progress; });
  return result;
}

export async function incrementChallengeProgress(challengeId: string, userId: string): Promise<number> {
  const current = await getChallengeProgress(challengeId, userId);
  const next = current + 1;
  const { error } = await supabase
    .from('challenge_progress')
    .upsert({
      user_id: userId,
      challenge_id: challengeId,
      progress: next,
      updated_at: new Date().toISOString(),
    } as any, { onConflict: 'user_id,challenge_id' });
  if (error) {
    console.error('Error incrementing challenge progress:', error);
    throw new Error('Falha ao atualizar progresso.');
  }
  return next;
}

export async function getCompletedChallenges(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('challenge_completions')
    .select('challenge_id')
    .eq('user_id', userId);
  if (error) return [];
  return (data || []).map((r: any) => r.challenge_id);
}

export async function markChallengeComplete(userId: string, challengeId: string): Promise<boolean> {
  const { error } = await supabase.from('challenge_completions').insert({
    user_id: userId,
    challenge_id: challengeId,
  } as any);
  if (!error) {
    return true;
  }

  if (error.code === '23505') {
    return false;
  }

  console.error('Error marking challenge complete:', error);
  throw new Error('Falha ao marcar desafio como completo.');
}

export async function grantChallengeCompletionCoins(
  userId: string,
  challengeId: string,
  coinsReward: number,
): Promise<boolean> {
  const reward = Math.max(0, Math.floor(coinsReward));
  if (reward <= 0) return false;

  const { error: ensureAvatarError } = await (supabase as any)
    .from('user_avatars')
    .upsert({ user_id: userId }, { onConflict: 'user_id' });
  if (ensureAvatarError) {
    console.error('Error ensuring user avatar before reward:', ensureAvatarError);
    throw new Error('Falha ao preparar avatar para recompensa.');
  }

  const { data, error } = await (supabase as any).rpc('grant_avatar_reward', {
    _user_id: userId,
    _source_type: 'challenge_completion',
    _source_ref: challengeId,
    _coins_delta: reward,
  });

  if (error) {
    console.error('Error granting challenge completion coins:', error);
    throw new Error('Falha ao conceder BrazaCoin do desafio.');
  }

  return Boolean(data);
}

export async function getChallengeProofs(challengeId: string, userId: string): Promise<Array<{ url: string; step: number; uploadedAt: string }>> {
  const { data, error } = await supabase
    .from('challenge_proofs')
    .select('url, step, uploaded_at')
    .eq('challenge_id', challengeId)
    .eq('user_id', userId)
    .order('uploaded_at', { ascending: true });
  if (error) return [];
  return (data || []).map((r: any) => ({ url: r.url, step: r.step, uploadedAt: r.uploaded_at }));
}

export async function saveChallengeProof(challengeId: string, userId: string, url: string, step: number): Promise<void> {
  const { error } = await supabase.from('challenge_proofs').insert({
    user_id: userId,
    challenge_id: challengeId,
    step,
    url,
  } as any);
  if (error) console.error('Error saving challenge proof:', error);
}

// ─── Feed ───────────────────────────────────────────────────────────────────

export interface FeedPost {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  wodName: string;
  timeDisplay: string;
  reactions: { fire: number; clap: number; muscle: number };
  comments: number;
  timestamp: number;
}

export async function getFeedPosts(limit = 50): Promise<FeedPost[]> {
  const { data, error } = await supabase
    .from('feed_posts')
    .select('*, profiles!inner(name, avatar)')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) {
    console.error('Error fetching feed:', error);
    return [];
  }

  const postIds = (data || []).map((p: any) => p.id);
  
  // Fetch reaction counts
  const { data: reactions } = await supabase
    .from('feed_reactions')
    .select('post_id, reaction_type')
    .in('post_id', postIds.length > 0 ? postIds : ['__none__']);

  // Fetch comment counts
  const { data: comments } = await supabase
    .from('feed_comments')
    .select('post_id')
    .in('post_id', postIds.length > 0 ? postIds : ['__none__']);

  const reactionMap: Record<string, { fire: number; clap: number; muscle: number }> = {};
  (reactions || []).forEach((r: any) => {
    if (!reactionMap[r.post_id]) reactionMap[r.post_id] = { fire: 0, clap: 0, muscle: 0 };
    if (r.reaction_type === 'fire') reactionMap[r.post_id].fire++;
    else if (r.reaction_type === 'clap') reactionMap[r.post_id].clap++;
    else if (r.reaction_type === 'muscle') reactionMap[r.post_id].muscle++;
  });

  const commentMap: Record<string, number> = {};
  (comments || []).forEach((c: any) => {
    commentMap[c.post_id] = (commentMap[c.post_id] || 0) + 1;
  });

  return (data || []).map((p: any) => ({
    id: p.id,
    userId: p.user_id,
    userName: p.profiles?.name || 'Atleta',
    userAvatar: p.profiles?.avatar || '👤',
    content: p.content,
    wodName: p.wod_name || '',
    timeDisplay: p.time_display || '',
    reactions: reactionMap[p.id] || { fire: 0, clap: 0, muscle: 0 },
    comments: commentMap[p.id] || 0,
    timestamp: p.created_at,
  }));
}

export async function createFeedPost(post: { id: string; userId: string; content: string; wodName?: string; timeDisplay?: string }): Promise<void> {
  const { error } = await supabase.from('feed_posts').insert({
    id: post.id,
    user_id: post.userId,
    content: post.content,
    wod_name: post.wodName || null,
    time_display: post.timeDisplay || null,
  } as any);
  if (error) console.error('Error creating feed post:', error);
}

export async function toggleReaction(postId: string, userId: string, type: string): Promise<void> {
  const { data: existing } = await supabase
    .from('feed_reactions')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .eq('reaction_type', type)
    .maybeSingle();

  if (existing) {
    await supabase.from('feed_reactions').delete().eq('id', (existing as any).id);
  } else {
    await supabase.from('feed_reactions').insert({
      post_id: postId,
      user_id: userId,
      reaction_type: type,
    } as any);
  }
}

export async function getPostComments(postId: string): Promise<Array<{ id: string; userId: string; userName: string; userAvatar: string; content: string; timestamp: number }>> {
  const { data, error } = await supabase
    .from('feed_comments')
    .select('*, profiles!inner(name, avatar)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  if (error) return [];
  return (data || []).map((c: any) => ({
    id: c.id,
    userId: c.user_id,
    userName: c.profiles?.name || 'Atleta',
    userAvatar: c.profiles?.avatar || '👤',
    content: c.content,
    timestamp: c.created_at,
  }));
}

export async function addComment(postId: string, userId: string, content: string): Promise<void> {
  const { error } = await supabase.from('feed_comments').insert({
    post_id: postId,
    user_id: userId,
    content,
  } as any);
  if (error) {
    console.error('Error adding comment:', error);
    throw new Error('Falha ao adicionar comentário.');
  }
}

// ─── Duels ──────────────────────────────────────────────────────────────────

export interface DuelData {
  id: string;
  wodId: string;
  wodName: string;
  category: string;
  challengerId: string;
  opponentIds: string[];
  results: Record<string, string | null>;
  status: 'pending' | 'active' | 'finished';
  winnerId: string | null;
  betMode: boolean;
  betType: string | null;
  betItems: string[];
  betXpAmount: number | null;
  acceptedBy: string[];
  betReserved: boolean;
  betReservedAt: number | null;
  betSettledAt: number | null;
  betCanceledAt: number | null;
  createdAt: number;
}

export async function getDuels(userId?: string): Promise<DuelData[]> {
  let query = supabase
    .from('app_duels')
    .select('*')
    .order('created_at', { ascending: false });
  
  // RLS handles filtering for participants
  const { data, error } = await query;
  if (error) {
    console.error('Error fetching duels:', error);
    return [];
  }
  return (data || []).map(mapDuelFromDb);
}

function mapDuelFromDb(r: any): DuelData {
  return {
    id: r.id,
    wodId: r.wod_id,
    wodName: r.wod_name,
    category: r.category,
    challengerId: r.challenger_id,
    opponentIds: r.opponent_ids || [],
    results: r.results || {},
    status: r.status,
    winnerId: r.winner_id,
    betMode: r.bet_mode,
    betType: r.bet_type,
    betItems: r.bet_items || [],
    betXpAmount: r.bet_xp_amount,
    acceptedBy: r.accepted_by || [],
    betReserved: r.bet_reserved || false,
    betReservedAt: r.bet_reserved_at,
    betSettledAt: r.bet_settled_at,
    betCanceledAt: r.bet_canceled_at,
    createdAt: r.created_at,
  };
}

export async function createDuel(duel: DuelData): Promise<void> {
  const { error } = await supabase.from('app_duels').insert({
    id: duel.id,
    wod_id: duel.wodId,
    wod_name: duel.wodName,
    category: duel.category,
    challenger_id: duel.challengerId,
    opponent_ids: duel.opponentIds,
    results: duel.results as any,
    status: duel.status,
    winner_id: duel.winnerId,
    bet_mode: duel.betMode,
    bet_type: duel.betType,
    bet_items: duel.betItems,
    bet_xp_amount: duel.betXpAmount,
    accepted_by: duel.acceptedBy,
    bet_reserved: duel.betReserved,
    bet_reserved_at: duel.betReservedAt,
    bet_settled_at: duel.betSettledAt,
    bet_canceled_at: duel.betCanceledAt,
  } as any);
  if (error) {
    console.error('Error creating duel:', error);
    throw new Error('Falha ao criar duelo.');
  }
}

export async function updateDuel(id: string, updates: Partial<Record<string, any>>): Promise<void> {
  const dbUpdates: Record<string, any> = {};
  if (updates.results !== undefined) dbUpdates.results = updates.results;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.winnerId !== undefined) dbUpdates.winner_id = updates.winnerId;
  if (updates.acceptedBy !== undefined) dbUpdates.accepted_by = updates.acceptedBy;
  if (updates.betReserved !== undefined) dbUpdates.bet_reserved = updates.betReserved;
  if (updates.betReservedAt !== undefined) dbUpdates.bet_reserved_at = updates.betReservedAt;
  if (updates.betSettledAt !== undefined) dbUpdates.bet_settled_at = updates.betSettledAt;
  if (updates.betCanceledAt !== undefined) dbUpdates.bet_canceled_at = updates.betCanceledAt;

  const { error } = await supabase.from('app_duels').update(dbUpdates).eq('id', id);
  if (error) {
    console.error('Error updating duel:', error);
    throw new Error('Falha ao atualizar duelo.');
  }
}

// ─── Clans ──────────────────────────────────────────────────────────────────

export interface ClanData {
  id: string;
  name: string;
  motto: string;
  banner: string;
  color: string;
  createdBy: string | null;
}

export interface ClanMembershipData {
  userId: string;
  clanId: string;
  role: string;
  status: 'pending' | 'approved';
}

export async function getClans(): Promise<ClanData[]> {
  const { data, error } = await supabase
    .from('app_clans')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) {
    console.error('Error fetching clans:', error);
    return [];
  }
  return (data || []).map((r: any) => ({
    id: r.id,
    name: r.name,
    motto: r.motto,
    banner: r.banner,
    color: r.color,
    createdBy: r.created_by,
  }));
}

export async function createClan(clan: { name: string; motto: string; banner: string; color: string; createdBy: string }): Promise<ClanData> {
  const id = `clan_${Date.now()}`;
  const { error } = await supabase.from('app_clans').insert({
    id,
    name: clan.name,
    motto: clan.motto,
    banner: clan.banner,
    color: clan.color,
    created_by: clan.createdBy,
  } as any);
  if (error) {
    console.error('Error creating clan:', error);
    throw new Error('Falha ao criar time.');
  }

  const { error: membershipError } = await supabase.from('clan_memberships').upsert({
    user_id: clan.createdBy,
    clan_id: id,
    role: 'captain',
    status: 'approved',
  } as any, { onConflict: 'user_id' });
  if (membershipError) {
    console.error('Error creating captain membership:', membershipError);
    throw new Error('Falha ao criar liderança do time.');
  }

  return { id, ...clan, createdBy: clan.createdBy };
}

export async function getClanMemberships(): Promise<Record<string, string>> {
  const { data, error } = await (supabase
    .from('clan_memberships')
    .select('user_id, clan_id') as any)
    .eq('status', 'approved');
  if (error) return {};
  const result: Record<string, string> = {};
  (data || []).forEach((r: any) => { result[r.user_id] = r.clan_id; });
  return result;
}

export async function joinClan(userId: string, clanId: string): Promise<void> {
  const { error } = await supabase.from('clan_memberships').upsert({
    user_id: userId,
    clan_id: clanId,
    role: 'member',
    status: 'pending',
  } as any, { onConflict: 'user_id' });
  if (error) {
    console.error('Error joining clan:', error);
    throw new Error('Falha ao entrar no time.');
  }
}

export async function getUserClanMembership(userId: string): Promise<ClanMembershipData | null> {
  const { data, error } = await (supabase
    .from('clan_memberships')
    .select('user_id, clan_id, role, status') as any)
    .eq('user_id', userId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    userId: data.user_id,
    clanId: data.clan_id,
    role: data.role,
    status: data.status,
  };
}

const ensureCurrentUserIsCaptain = async (clanId: string): Promise<void> => {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) throw new Error('Usuário não autenticado.');
  const { data, error } = await supabase
    .from('clan_memberships')
    .select('role')
    .eq('clan_id', clanId)
    .eq('user_id', authData.user.id)
    .eq('status', 'approved')
    .maybeSingle();
  if (error || data?.role !== 'captain') {
    throw new Error('Apenas capitães podem gerenciar membros.');
  }
};

export async function approveMember(userId: string, clanId: string): Promise<void> {
  await ensureCurrentUserIsCaptain(clanId);
  const { error } = await supabase
    .from('clan_memberships')
    .update({ status: 'approved' } as any)
    .eq('user_id', userId)
    .eq('clan_id', clanId);
  if (error) {
    console.error('Error approving clan member:', error);
    throw new Error('Falha ao aprovar membro.');
  }
}

export async function removeMember(userId: string, clanId: string): Promise<void> {
  await ensureCurrentUserIsCaptain(clanId);
  const { error } = await supabase
    .from('clan_memberships')
    .delete()
    .eq('user_id', userId)
    .eq('clan_id', clanId);
  if (error) {
    console.error('Error removing clan member:', error);
    throw new Error('Falha ao remover membro.');
  }
}

export async function getClanMembers(clanId: string): Promise<ClanMembershipData[]> {
  const { data, error } = await supabase
    .from('clan_memberships')
    .select('user_id, clan_id, role, status')
    .eq('clan_id', clanId)
    .order('created_at', { ascending: true });
  if (error) {
    console.error('Error fetching clan members:', error);
    return [];
  }
  return (data || []).map((row: any) => ({
    userId: row.user_id,
    clanId: row.clan_id,
    role: row.role,
    status: row.status,
  }));
}

export async function getUserClan(userId: string): Promise<ClanData | null> {
  const memberships = await getClanMemberships();
  const clanId = memberships[userId];
  if (!clanId) return null;
  const clans = await getClans();
  return clans.find(c => c.id === clanId) || null;
}

// ─── Territory Battles ──────────────────────────────────────────────────────

export async function getTerritoryBattle(dayKey: string): Promise<any | null> {
  const { data, error } = await supabase
    .from('territory_battles')
    .select('*')
    .eq('id', dayKey)
    .maybeSingle();
  if (error) return null;
  return data;
}

export async function upsertTerritoryBattle(battle: any): Promise<void> {
  const { error } = await supabase.from('territory_battles').upsert(battle as any);
  if (error) console.error('Error upserting territory battle:', error);
}

// ─── User Goals ─────────────────────────────────────────────────────────────

export async function getUserGoals(userId: string): Promise<{ objective?: string; frequency?: string; level?: string } | null> {
  const { data, error } = await supabase
    .from('user_goals')
    .select('objective, frequency, level')
    .eq('user_id', userId)
    .maybeSingle();
  if (error || !data) return null;
  return data as any;
}

export async function saveUserGoals(userId: string, goals: { objective?: string; frequency?: string; level?: string }): Promise<void> {
  const { error } = await supabase.from('user_goals').upsert({
    user_id: userId,
    objective: goals.objective || null,
    frequency: goals.frequency || null,
    level: goals.level || null,
    updated_at: new Date().toISOString(),
  } as any, { onConflict: 'user_id' });
  if (error) {
    console.error('Error saving goals:', error);
    throw new Error('Falha ao salvar metas.');
  }
}
