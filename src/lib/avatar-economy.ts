import { supabase } from '@/integrations/supabase/client';

export interface AvatarEconomySettings {
  id: string;
  coins_per_checkin: number;
  coins_per_challenge_completion: number;
  coins_per_wod_completion: number;
  coins_per_duel_participation: number;
  coins_per_duel_win: number;
  coins_per_pr: number;
  level_up_bonus: number;
  weekly_bonus_3: number;
  weekly_bonus_4: number;
  weekly_bonus_5: number;
  weekly_bonus_6: number;
  monthly_ranking_bonus: number;
  special_event_bonus: number;
  daily_mission_bonus: number;
  milestone_bonus: number;
  coins_per_checkin_enabled: boolean;
  coins_per_challenge_completion_enabled: boolean;
  coins_per_wod_completion_enabled: boolean;
  coins_per_duel_participation_enabled: boolean;
  coins_per_duel_win_enabled: boolean;
  coins_per_pr_enabled: boolean;
  level_up_bonus_enabled: boolean;
  weekly_bonus_3_enabled: boolean;
  weekly_bonus_4_enabled: boolean;
  weekly_bonus_5_enabled: boolean;
  weekly_bonus_6_enabled: boolean;
  monthly_ranking_bonus_enabled: boolean;
  special_event_bonus_enabled: boolean;
  daily_mission_bonus_enabled: boolean;
  milestone_bonus_enabled: boolean;
  rule_labels: Record<string, string> | null;
  rule_notes: Record<string, string> | null;
  is_active: boolean;
  created_at: string;
}

export type AvatarEconomyRuleKey =
  | 'coins_per_checkin'
  | 'coins_per_challenge_completion'
  | 'coins_per_wod_completion'
  | 'coins_per_duel_participation'
  | 'coins_per_duel_win'
  | 'coins_per_pr'
  | 'level_up_bonus'
  | 'weekly_bonus_3'
  | 'weekly_bonus_4'
  | 'weekly_bonus_5'
  | 'weekly_bonus_6'
  | 'monthly_ranking_bonus'
  | 'special_event_bonus'
  | 'daily_mission_bonus'
  | 'milestone_bonus';

type AvatarEconomySettingsUpdate = Partial<Omit<AvatarEconomySettings, 'id' | 'created_at'>>;

export async function getAvatarEconomySettings(): Promise<AvatarEconomySettings | null> {
  const { data, error } = await (supabase as any)
    .from('avatar_economy_settings')
    .select('*')
    .order('is_active', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching avatar economy settings:', error);
    return null;
  }

  return (data as AvatarEconomySettings) ?? null;
}

export async function updateAvatarEconomySettings(
  currentId: string | null,
  payload: AvatarEconomySettingsUpdate,
): Promise<{ data: AvatarEconomySettings | null; error: Error | null }> {
  if (payload.is_active === true && currentId) {
    const { error: deactivateError } = await (supabase as any)
      .from('avatar_economy_settings')
      .update({ is_active: false })
      .neq('id', currentId);

    if (deactivateError) {
      return { data: null, error: new Error(deactivateError.message) };
    }
  }

  if (currentId) {
    const { data, error } = await (supabase as any)
      .from('avatar_economy_settings')
      .update(payload)
      .eq('id', currentId)
      .select('*')
      .single();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: data as AvatarEconomySettings, error: null };
  }

  const { data, error } = await (supabase as any)
    .from('avatar_economy_settings')
    .insert(payload)
    .select('*')
    .single();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  return { data: data as AvatarEconomySettings, error: null };
}

export async function grantAvatarReward(
  userId: string,
  sourceType: string,
  sourceRef: string,
  coinsDelta: number,
): Promise<boolean> {
  const reward = Math.max(0, Math.floor(coinsDelta));
  if (reward <= 0) return false;

  const { error: ensureAvatarError } = await (supabase as any)
    .from('user_avatars')
    .upsert({ user_id: userId }, { onConflict: 'user_id' });

  if (ensureAvatarError) {
    console.error('Error ensuring user avatar before reward:', ensureAvatarError);
    return false;
  }

  const { data, error } = await (supabase as any).rpc('grant_avatar_reward', {
    _user_id: userId,
    _source_type: sourceType,
    _source_ref: sourceRef,
    _coins_delta: reward,
  });

  if (error) {
    console.error('Error granting avatar reward:', error);
    return false;
  }

  return Boolean(data);
}

export async function grantConfiguredAvatarReward(
  userId: string,
  ruleKey: AvatarEconomyRuleKey,
  sourceType: string,
  sourceRef: string,
): Promise<boolean> {
  const settings = await getAvatarEconomySettings();
  if (!settings || !settings.is_active) return false;

  const enabledKey = `${ruleKey}_enabled` as keyof AvatarEconomySettings;
  const value = Number(settings[ruleKey] || 0);
  const enabled = Boolean(settings[enabledKey]);

  if (!enabled || value <= 0) return false;

  return grantAvatarReward(userId, sourceType, sourceRef, value);
}
