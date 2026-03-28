import { supabase } from '@/integrations/supabase/client';

export interface UserAvatarRow {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_level: number;
  avatar_xp: number;
  avatar_coins: number;
  weekly_checkins: number;
  weekly_streak: number;
  base_outfit: string | null;
  equipped_hair: string | null;
  equipped_top: string | null;
  equipped_bottom: string | null;
  equipped_shoes: string | null;
  equipped_accessory: string | null;
  equipped_head_accessory: string | null;
  equipped_wrist_accessory: string | null;
  equipped_special: string | null;
  created_at: string;
  updated_at: string;
}

const getCurrentUserId = async (): Promise<string | null> => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return user.id;
};

export async function getMyAvatar(): Promise<UserAvatarRow | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const { data, error } = await (supabase as any)
    .from('user_avatars')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user avatar:', error);
    return null;
  }

  return (data as UserAvatarRow) ?? null;
}

export async function ensureMyAvatar(): Promise<UserAvatarRow | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const existing = await getMyAvatar();
  if (existing) return existing;

  let displayName: string | null = null;
  const { data: profileData } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', userId)
    .maybeSingle();

  if (profileData?.name) {
    displayName = profileData.name;
  }

  const payload = {
    user_id: userId,
    display_name: displayName,
  };

  const { data, error } = await (supabase as any)
    .from('user_avatars')
    .insert(payload)
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') {
      return getMyAvatar();
    }

    console.error('Error ensuring user avatar:', error);
    return null;
  }

  return (data as UserAvatarRow) ?? null;
}
