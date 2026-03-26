import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type UserAvatarRow = Database['public']['Tables']['user_avatars']['Row'];
type UserAvatarInsert = Database['public']['Tables']['user_avatars']['Insert'];

export async function getMyAvatar(): Promise<UserAvatarRow | null> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return null;

  const { data, error } = await supabase
    .from('user_avatars')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user avatar:', error);
    return null;
  }

  return data;
}

export async function ensureMyAvatar(): Promise<UserAvatarRow | null> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return null;

  const existing = await getMyAvatar();
  if (existing) return existing;

  let displayName: string | null = null;
  const { data: profileData } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .maybeSingle();

  if (profileData?.name) {
    displayName = profileData.name;
  }

  const payload: UserAvatarInsert = {
    user_id: user.id,
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
