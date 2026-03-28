import { supabase } from '@/integrations/supabase/client';
import { ensureMyAvatar, getMyAvatar } from '@/lib/avatar';

export interface AvatarShopItem {
  id: string;
  name: string;
  type: 'hair' | 'top' | 'bottom' | 'shoes' | 'accessory' | string;
  price_coins: number;
  is_active: boolean;
  created_at: string;
  image_url: string;
}

export const AVATAR_SLOTS = ['hair', 'top', 'bottom', 'shoes', 'accessory'] as const;
export type AvatarSlot = (typeof AVATAR_SLOTS)[number];
type EquippedSlotColumn =
  | 'equipped_hair'
  | 'equipped_top'
  | 'equipped_bottom'
  | 'equipped_shoes'
  | 'equipped_accessory';

const SLOT_TO_COLUMN: Record<AvatarSlot, EquippedSlotColumn> = {
  hair: 'equipped_hair',
  top: 'equipped_top',
  bottom: 'equipped_bottom',
  shoes: 'equipped_shoes',
  accessory: 'equipped_accessory',
};

const SLOT_SET = new Set<string>(AVATAR_SLOTS);
const isAvatarSlot = (value: string | null | undefined): value is AvatarSlot => !!value && SLOT_SET.has(value);

export async function getActiveAvatarShopItems(): Promise<AvatarShopItem[]> {
  const { data, error } = await (supabase as any)
    .from('avatar_items')
    .select('id,name,type,image_url,price_coins,is_active,created_at')
    .eq('is_active', true)
    .order('price_coins', { ascending: true });

  if (error) {
    console.error('Error loading avatar shop items:', error);
    return [];
  }

  return (data || []) as AvatarShopItem[];
}

export async function getMyAvatarInventory(): Promise<AvatarShopItem[]> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return [];

  const { data, error } = await (supabase as any)
    .from('user_avatar_items')
    .select('avatar_items(id,name,type,image_url,price_coins,is_active,created_at)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading avatar inventory:', error);
    return [];
  }

  return ((data || []) as any[])
    .map((entry) => entry.avatar_items as AvatarShopItem | null)
    .filter((item): item is AvatarShopItem => !!item);
}

export async function getMyAvatarInventoryItemIds(): Promise<Set<string>> {
  const rows = await getMyAvatarInventory();
  const ids = new Set<string>();
  rows.forEach((row) => ids.add(row.id));
  return ids;
}

export async function buyAvatarItem(itemId: string): Promise<{ success: boolean; message: string }> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, message: 'Usuário não autenticado.' };
  }

  await ensureMyAvatar();

  const { data: item, error: itemError } = await (supabase as any)
    .from('avatar_items')
    .select('id,name,type,image_url,price_coins,is_active,created_at')
    .eq('id', itemId)
    .eq('is_active', true)
    .maybeSingle();

  if (itemError || !item) {
    if (itemError) console.error('Error loading item before buy:', itemError);
    return { success: false, message: 'Item indisponível na loja.' };
  }

  const inventory = await getMyAvatarInventoryItemIds();
  if (inventory.has(itemId)) {
    return { success: false, message: 'Você já possui este item.' };
  }

  const avatar = await getMyAvatar();
  if (!avatar) {
    return { success: false, message: 'Avatar não encontrado.' };
  }
  const currentCoins = avatar.avatar_coins ?? 0;

  if (currentCoins < (item as AvatarShopItem).price_coins) {
    return { success: false, message: 'Saldo insuficiente.' };
  }

  const { data: debitData, error: debitError } = await (supabase as any)
    .from('user_avatars')
    .update({ avatar_coins: currentCoins - (item as AvatarShopItem).price_coins })
    .eq('user_id', user.id)
    .gte('avatar_coins', (item as AvatarShopItem).price_coins)
    .select('avatar_coins')
    .maybeSingle();

  if (debitError || !debitData) {
    if (debitError) console.error('Error debiting avatar coins:', debitError);
    return { success: false, message: 'Não foi possível concluir a compra.' };
  }

  const { error: insertError } = await (supabase as any).from('user_avatar_items').insert({
    user_id: user.id,
    item_id: itemId,
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

export async function equipAvatarItem(itemId: string): Promise<{ success: boolean; message: string }> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, message: 'Usuário não autenticado.' };
  }

  await ensureMyAvatar();

  const { data: item, error: itemError } = await (supabase as any)
    .from('avatar_items')
    .select('id,type,is_active')
    .eq('id', itemId)
    .maybeSingle();

  if (itemError || !item) {
    if (itemError) console.error('Error loading item before equip:', itemError);
    return { success: false, message: 'Item não encontrado.' };
  }

  if (!item.is_active) {
    return { success: false, message: 'Item inativo não pode ser equipado.' };
  }

  if (!isAvatarSlot(item.type)) {
    return { success: false, message: 'Item não pertence a um slot equipável.' };
  }

  const { data: ownedItem, error: ownershipError } = await (supabase as any)
    .from('user_avatar_items')
    .select('id')
    .eq('user_id', user.id)
    .eq('item_id', itemId)
    .maybeSingle();

  if (ownershipError) {
    console.error('Error validating avatar item ownership:', ownershipError);
    return { success: false, message: 'Não foi possível validar o inventário.' };
  }

  if (!ownedItem) {
    return { success: false, message: 'Você precisa comprar este item antes de equipar.' };
  }

  const targetSlot = SLOT_TO_COLUMN[item.type];
  const { error: equipError } = await (supabase as any)
    .from('user_avatars')
    .update({ [targetSlot]: itemId })
    .eq('user_id', user.id);

  if (equipError) {
    console.error('Error equipping avatar item:', equipError);
    return { success: false, message: 'Não foi possível equipar o item.' };
  }

  return { success: true, message: 'Item equipado com sucesso!' };
}

export async function unequipAvatarItem(slot: AvatarSlot): Promise<{ success: boolean; message: string }> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, message: 'Usuário não autenticado.' };
  }

  if (!isAvatarSlot(slot)) {
    return { success: false, message: 'Slot inválido.' };
  }

  await ensureMyAvatar();
  const targetSlot = SLOT_TO_COLUMN[slot];

  const { error } = await (supabase as any)
    .from('user_avatars')
    .update({ [targetSlot]: null })
    .eq('user_id', user.id);

  if (error) {
    console.error('Error unequipping avatar item:', error);
    return { success: false, message: 'Não foi possível desequipar o item.' };
  }

  return { success: true, message: 'Item desequipado com sucesso!' };
}
