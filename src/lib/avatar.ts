import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

type UserAvatarRow = Tables<'user_avatars'>;
type UserAvatarInsert = TablesInsert<'user_avatars'>;
type ProfileNameRow = Pick<Tables<'profiles'>, 'name'>;

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

  const { data, error } = await supabase
    .from('user_avatars')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user avatar:', error);
    return null;
  }

  return data;
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
    .maybeSingle<ProfileNameRow>();

  if (profileData?.name) {
    displayName = profileData.name;
  }

  const payload: UserAvatarInsert = {
    user_id: userId,
    display_name: displayName,
  };

  const { data, error } = await supabase
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

  return data;
}
