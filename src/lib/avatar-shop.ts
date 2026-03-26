import { supabase } from '@/integrations/supabase/client';
import { ensureMyAvatar, getMyAvatar } from '@/lib/avatar';

export interface AvatarShopItem {
  id: string;
  name: string;
  category: string;
  rarity: string;
  slot: string | null;
  price_coins: number;
  is_active: boolean;
  created_at: string;
  image_url: string | null;
}

interface UserAvatarItemRow {
  id: string;
  user_id: string;
  item_id: string;
  acquired_at: string;
}

export async function getActiveAvatarShopItems(): Promise<AvatarShopItem[]> {
  const { data, error } = await (supabase as any)
    .from('avatar_items')
    .select('*')
    .eq('is_active', true)
    .order('price_coins', { ascending: true });

  if (error) {
    console.error('Error loading avatar shop items:', error);
    return [];
  }

  return (data || []) as AvatarShopItem[];
}

export async function getMyAvatarInventoryItemIds(): Promise<Set<string>> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return new Set<string>();

  const { data, error } = await (supabase as any)
    .from('user_avatar_items')
    .select('*')
    .eq('user_id', user.id);

  if (error) {
    console.error('Error loading avatar inventory:', error);
    return new Set<string>();
  }

  const ids = new Set<string>();
  ((data || []) as UserAvatarItemRow[]).forEach((entry) => {
    if (entry.item_id) ids.add(entry.item_id);
  });

  return ids;
}

export async function buyAvatarItem(item: AvatarShopItem): Promise<{ success: boolean; message: string }> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, message: 'Usuário não autenticado.' };
  }

  await ensureMyAvatar();

  const inventory = await getMyAvatarInventoryItemIds();
  if (inventory.has(item.id)) {
    return { success: false, message: 'Você já possui este item.' };
  }

  const avatar = await getMyAvatar();
  if (!avatar) {
    return { success: false, message: 'Avatar não encontrado.' };
  }
  const currentCoins = avatar.avatar_coins ?? 0;

  if (currentCoins < item.price_coins) {
    return { success: false, message: 'Saldo insuficiente.' };
  }

  const { data: debitData, error: debitError } = await (supabase as any)
    .from('user_avatars')
    .update({ avatar_coins: currentCoins - item.price_coins })
    .eq('user_id', user.id)
    .gte('avatar_coins', item.price_coins)
    .select('avatar_coins')
    .maybeSingle();

  if (debitError || !debitData) {
    if (debitError) console.error('Error debiting avatar coins:', debitError);
    return { success: false, message: 'Não foi possível concluir a compra.' };
  }

  const { error: insertError } = await (supabase as any).from('user_avatar_items').insert({
    user_id: user.id,
    item_id: item.id,
  });

  if (insertError) {
    console.error('Error adding purchased item to inventory:', insertError);

    await (supabase as any)
      .from('user_avatars')
      .update({ avatar_coins: currentCoins })
      .eq('user_id', user.id);

    if (insertError.code === '23505') {
      return { success: false, message: 'Você já possui este item.' };
    }

    return { success: false, message: 'Compra cancelada. Tente novamente.' };
  }

  return { success: true, message: 'Item comprado com sucesso!' };
}
