import { supabase } from '@/integrations/supabase/client';

export interface AvatarEconomySettings {
  id: string;
  coins_per_checkin: number;
  weekly_bonus_3: number;
  weekly_bonus_4: number;
  weekly_bonus_5: number;
  level_up_bonus: number;
  is_active: boolean;
  created_at: string;
}

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
