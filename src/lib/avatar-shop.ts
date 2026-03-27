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

const EQUIPPED_SLOT_COLUMNS = [
  'equipped_top',
  'equipped_bottom',
  'equipped_shoes',
  'equipped_accessory',
  'equipped_head_accessory',
  'equipped_wrist_accessory',
  'equipped_special',
] as const;

type EquippedSlotColumn = (typeof EQUIPPED_SLOT_COLUMNS)[number];

const isEquippedSlotColumn = (value: string | null): value is EquippedSlotColumn =>
  !!value && EQUIPPED_SLOT_COLUMNS.includes(value as EquippedSlotColumn);

const CATEGORY_TO_SLOT: Record<string, EquippedSlotColumn> = {
  top: 'equipped_top',
  upper: 'equipped_top',
  shirt: 'equipped_top',
  camiseta: 'equipped_top',
  regata: 'equipped_top',
  bottom: 'equipped_bottom',
  lower: 'equipped_bottom',
  shorts: 'equipped_bottom',
  calca: 'equipped_bottom',
  shoes: 'equipped_shoes',
  footwear: 'equipped_shoes',
  tenis: 'equipped_shoes',
  accessory: 'equipped_accessory',
  head: 'equipped_head_accessory',
  head_accessory: 'equipped_head_accessory',
  wrist: 'equipped_wrist_accessory',
  wrist_accessory: 'equipped_wrist_accessory',
  special: 'equipped_special',
};

export const resolveAvatarItemSlot = (item: Pick<AvatarShopItem, 'slot' | 'category'>): EquippedSlotColumn | null => {
  if (isEquippedSlotColumn(item.slot)) return item.slot;
  const normalizedCategory = (item.category || '').trim().toLowerCase();
  return CATEGORY_TO_SLOT[normalizedCategory] ?? null;
};

const RARITY_VISUAL_BY_SLOT: Record<EquippedSlotColumn, Record<string, string>> = {
  equipped_top: {
    common: 'camiseta_branca',
    rare: 'regata_azul',
    epic: 'camiseta_gradiente',
    legendary: 'camiseta_gradiente',
  },
  equipped_bottom: {
    common: 'shorts_preto',
    rare: 'shorts_azul',
    epic: 'calca_verde',
    legendary: 'calca_verde',
  },
  equipped_shoes: {
    common: 'tenis_branco',
    rare: 'tenis_preto',
    epic: 'tenis_vermelho',
    legendary: 'tenis_vermelho',
  },
  equipped_accessory: {
    common: 'faixa_preta',
    rare: 'colar_prata',
    epic: 'cinto_dourado',
    legendary: 'cinto_dourado',
  },
  equipped_head_accessory: {
    common: 'bone_preto',
    rare: 'headband_vermelho',
    epic: 'coroa_ouro',
    legendary: 'coroa_ouro',
  },
  equipped_wrist_accessory: {
    common: 'munhequeira_preta',
    rare: 'relogio_prata',
    epic: 'bracelete_ouro',
    legendary: 'bracelete_ouro',
  },
  equipped_special: {
    common: 'aura_gelo',
    rare: 'aura_fogo',
    epic: 'aura_ouro',
    legendary: 'aura_ouro',
  },
};

export const getAvatarItemEquipValue = (item: Pick<AvatarShopItem, 'id' | 'slot' | 'category' | 'rarity'>): string => {
  const slot = resolveAvatarItemSlot(item);
  if (!slot) return item.id;
  const normalizedRarity = (item.rarity || 'common').trim().toLowerCase();
  return RARITY_VISUAL_BY_SLOT[slot][normalizedRarity] ?? RARITY_VISUAL_BY_SLOT[slot].common;
};

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

export async function equipAvatarItem(item: AvatarShopItem): Promise<{ success: boolean; message: string }> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, message: 'Usuário não autenticado.' };
  }

  const targetSlot = resolveAvatarItemSlot(item);
  if (!targetSlot) {
    return { success: false, message: 'Item sem slot de equipamento válido.' };
  }

  await ensureMyAvatar();

  const { data: ownedItem, error: ownershipError } = await (supabase as any)
    .from('user_avatar_items')
    .select('id')
    .eq('user_id', user.id)
    .eq('item_id', item.id)
    .maybeSingle();

  if (ownershipError) {
    console.error('Error validating avatar item ownership:', ownershipError);
    return { success: false, message: 'Não foi possível validar o inventário.' };
  }

  if (!ownedItem) {
    return { success: false, message: 'Você precisa comprar este item antes de equipar.' };
  }

  const { error: equipError } = await (supabase as any)
    .from('user_avatars')
    .update({ [targetSlot]: getAvatarItemEquipValue(item) })
    .eq('user_id', user.id);

  if (equipError) {
    console.error('Error equipping avatar item:', equipError);
    return { success: false, message: 'Não foi possível equipar o item.' };
  }

  return { success: true, message: 'Item equipado com sucesso!' };
}
