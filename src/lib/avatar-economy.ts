import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesUpdate } from '@/integrations/supabase/types';

export type AvatarEconomySettings = Tables<'avatar_economy_settings'>;

type AvatarEconomySettingsUpdate = TablesUpdate<'avatar_economy_settings'>;

export async function getAvatarEconomySettings(): Promise<AvatarEconomySettings | null> {
  const { data, error } = await supabase
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

  return data;
}

export async function updateAvatarEconomySettings(
  currentId: string | null,
  payload: AvatarEconomySettingsUpdate,
): Promise<{ data: AvatarEconomySettings | null; error: Error | null }> {
  if (payload.is_active === true && currentId) {
    const { error: deactivateError } = await supabase
      .from('avatar_economy_settings')
      .update({ is_active: false })
      .neq('id', currentId);

    if (deactivateError) {
      return { data: null, error: new Error(deactivateError.message) };
    }
  }

  if (currentId) {
    const { data, error } = await supabase
      .from('avatar_economy_settings')
      .update(payload)
      .eq('id', currentId)
      .select('*')
      .single();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data, error: null };
  }

  const { data, error } = await supabase
    .from('avatar_economy_settings')
    .insert(payload)
    .select('*')
    .single();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  return { data, error: null };
}
