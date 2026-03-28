import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Star, Gem } from 'lucide-react';
import { ensureMyAvatar, getMyAvatar } from '@/lib/avatar';
import { AVATAR_SLOTS, buyAvatarItem, equipAvatarItem, getActiveAvatarShopItems, getMyAvatarInventory, type AvatarShopItem, type AvatarSlot, unequipAvatarItem } from '@/lib/avatar-shop';
import type { UserAvatarRow } from '@/lib/avatar';
import AvatarRenderer from '@/components/avatar/AvatarRenderer';

const MyBox = () => {
  const [avatar, setAvatar] = useState<UserAvatarRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [shopLoading, setShopLoading] = useState(true);
  const [shopItems, setShopItems] = useState<AvatarShopItem[]>([]);
  const [inventoryItems, setInventoryItems] = useState<AvatarShopItem[]>([]);
  const [buyingItemId, setBuyingItemId] = useState<string | null>(null);
  const [shopMessage, setShopMessage] = useState<string | null>(null);

  const avatarCoins = (avatar as UserAvatarRow | null)?.avatar_coins ?? 0;
  const equippedHairId = avatar?.equipped_hair ?? null;
  const equippedTopId = avatar?.equipped_top ?? null;
  const equippedBottomId = avatar?.equipped_bottom ?? null;
  const equippedShoesId = avatar?.equipped_shoes ?? null;
  const equippedAccessoryId = avatar?.equipped_accessory ?? null;

  const reloadAvatar = async () => {
    const ensured = await ensureMyAvatar();
    if (ensured) {
      setAvatar(ensured);
      return;
    }
    const loaded = await getMyAvatar();
    setAvatar(loaded);
  };

  const reloadShop = async () => {
    const [items, inventory] = await Promise.all([
      getActiveAvatarShopItems(),
      getMyAvatarInventory(),
    ]);
    setShopItems(items);
    setInventoryItems(inventory);
  };

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      setLoading(true);
      setShopLoading(true);

      // Keep bootstrap sequential to guarantee user_avatars exists
      // before dependent avatar reads on first access.
      await reloadAvatar();
      await reloadShop();

      if (!mounted) return;
      setLoading(false);
      setShopLoading(false);
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  const inventoryItemIds = useMemo(() => new Set(inventoryItems.map((item) => item.id)), [inventoryItems]);
  const inventoryByType = useMemo(() => {
    const map = new Map<AvatarSlot, AvatarShopItem[]>();
    AVATAR_SLOTS.forEach((slot) => map.set(slot, []));
    inventoryItems.forEach((item) => {
      if (AVATAR_SLOTS.includes(item.type as AvatarSlot)) {
        map.get(item.type as AvatarSlot)?.push(item);
      }
    });
    return map;
  }, [inventoryItems]);

  const shopSortedItems = useMemo(() => [...shopItems].sort((a, b) => a.price_coins - b.price_coins), [shopItems]);

  const equippedItemsBySlot = useMemo(() => {
    const findById = (id: string | null) => (id ? inventoryItems.find((item) => item.id === id) ?? null : null);
    return {
      hair: findById(equippedHairId),
      top: findById(equippedTopId),
      bottom: findById(equippedBottomId),
      shoes: findById(equippedShoesId),
      accessory: findById(equippedAccessoryId),
    };
  }, [inventoryItems, equippedHairId, equippedTopId, equippedBottomId, equippedShoesId, equippedAccessoryId]);

  const handleBuy = async (itemId: string) => {
    setShopMessage(null);
    setBuyingItemId(itemId);

    const result = await buyAvatarItem(itemId);
    setShopMessage(result.message);

    if (result.success) {
      await Promise.all([reloadAvatar(), reloadShop()]);
    }

    setBuyingItemId(null);
  };

  const handleEquip = async (slot: AvatarSlot, itemId: string) => {
    setShopMessage(null);
    setBuyingItemId(itemId);

    const result = await equipAvatarItem(slot, itemId);
    setShopMessage(result.message);

    if (result.success) {
      await reloadAvatar();
    }

    setBuyingItemId(null);
  };

  const handleUnequip = async (slot: AvatarSlot) => {
    setShopMessage(null);
    const result = await unequipAvatarItem(slot);
    setShopMessage(result.message);
    if (result.success) await reloadAvatar();
  };

  const layeredAvatarImages = {
    body: '/placeholder.svg',
    hair: equippedItemsBySlot.hair?.image_url ?? null,
    top: equippedItemsBySlot.top?.image_url ?? null,
    bottom: equippedItemsBySlot.bottom?.image_url ?? null,
    shoes: equippedItemsBySlot.shoes?.image_url ?? null,
    accessory: equippedItemsBySlot.accessory?.image_url ?? null,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <User className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Meu Avatar</h1>
          <p className="text-muted-foreground">Cuide do seu avatar, evolua com frequência e desbloqueie itens.</p>
        </div>
      </div>

      {loading ? (
        <Card className="border-primary/20">
          <CardContent className="p-6">
            <p className="text-muted-foreground">Carregando avatar...</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {[
              { label: 'Nome', value: avatar?.display_name || 'Não definido', icon: '🏷️' },
              { label: 'Nível', value: avatar?.avatar_level ?? 1, icon: '⭐' },
              { label: 'XP', value: avatar?.avatar_xp ?? 0, icon: '✨' },
              { label: 'Coins', value: avatarCoins, icon: '🪙' },
              { label: 'Check-ins Sem.', value: avatar?.weekly_checkins ?? 0, icon: '📅' },
              { label: 'Streak Sem.', value: avatar?.weekly_streak ?? 0, icon: '🔥' },
            ].map((stat) => (
              <Card key={stat.label} className="border-border">
                <CardContent className="p-3 text-center">
                  <span className="text-xl">{stat.icon}</span>
                  <p className="text-lg font-bold mt-1">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Visual Avatar */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                Seu Avatar
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <AvatarRenderer
                equipment={{
                  base_outfit: avatar?.base_outfit ?? null,
                  equipped_hair: equippedHairId,
                  equipped_top: equippedTopId,
                  equipped_bottom: equippedBottomId,
                  equipped_shoes: equippedShoesId,
                  equipped_accessory: equippedAccessoryId,
                  equipped_head_accessory: avatar?.equipped_head_accessory ?? null,
                  equipped_wrist_accessory: avatar?.equipped_wrist_accessory ?? null,
                  equipped_special: avatar?.equipped_special ?? null,
                }}
                layeredImages={layeredAvatarImages}
              />
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg">Equipados</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {AVATAR_SLOTS.map((slot) => {
                const item = equippedItemsBySlot[slot];
                return (
                  <div key={slot} className="rounded-lg border border-border p-3 bg-muted/20 space-y-2">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{slot}</p>
                    <p className="text-sm font-semibold">{item?.name ?? 'Vazio'}</p>
                    <Button type="button" size="sm" variant="outline" disabled={!item} onClick={() => handleUnequip(slot)}>
                      Desequipar
                    </Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg">Inventário</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {inventoryItems.length === 0 ? (
                <p className="text-muted-foreground text-sm">Você ainda não possui itens.</p>
              ) : (
                AVATAR_SLOTS.map((slot) => {
                  const items = inventoryByType.get(slot) || [];
                  return (
                    <div key={slot} className="space-y-2">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">{slot}</p>
                      {items.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Nenhum item deste slot.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {items.map((item) => {
                            const equippedBySlot: Record<AvatarSlot, string | null> = {
                              hair: equippedHairId,
                              top: equippedTopId,
                              bottom: equippedBottomId,
                              shoes: equippedShoesId,
                              accessory: equippedAccessoryId,
                            };
                            const equippedId = equippedBySlot[slot];
                            const isEquipped = equippedId === item.id;
                            return (
                              <div key={item.id} className="rounded-lg border border-border p-3 bg-muted/20">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-sm font-semibold">{item.name}</p>
                                  {isEquipped && <Badge variant="secondary">Equipado</Badge>}
                                </div>
                                <Button type="button" size="sm" className="mt-2 w-full" disabled={isEquipped || buyingItemId === item.id} onClick={() => handleEquip(slot, item.id)}>
                                  {buyingItemId === item.id ? 'Salvando...' : 'Equipar'}
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Avatar Shop */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Gem className="h-5 w-5 text-primary" />
                Loja do Avatar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Saldo atual: {avatarCoins} coins</p>
                {shopMessage && <p className="text-sm text-primary font-medium">{shopMessage}</p>}
              </div>

              {shopLoading ? (
                <p className="text-muted-foreground text-sm">Carregando loja...</p>
              ) : shopSortedItems.length === 0 ? (
                <p className="text-muted-foreground text-sm">Nenhum item ativo disponível no momento.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {shopSortedItems.map((item) => {
                    const acquired = inventoryItemIds.has(item.id);
                    const insufficientCoins = avatarCoins < item.price_coins;
                    const isSlot = AVATAR_SLOTS.includes(item.type as AvatarSlot);
                    const avatarKey = isSlot ? (`equipped_${item.type}` as keyof UserAvatarRow) : null;
                    const canEquip = !!(acquired && isSlot && avatarKey);
                    const isEquipped = !!(canEquip && avatar && avatar[avatarKey] === item.id);
                    const buttonLabel = acquired
                      ? isEquipped
                        ? 'Equipado'
                        : canEquip
                          ? 'Equipar'
                          : 'Adquirido'
                      : buyingItemId === item.id
                        ? 'Comprando...'
                        : 'Comprar';
                    const buttonDisabled = buyingItemId === item.id || (acquired && (isEquipped || !canEquip)) || (!acquired && insufficientCoins);
                    const buttonAction = acquired && isSlot ? () => handleEquip(item.type as AvatarSlot, item.id) : () => handleBuy(item.id);

                    return (
                      <div key={item.id} className="flex flex-col gap-2 p-3 rounded-lg border border-border bg-muted/30">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-bold">{item.name}</p>
                            <p className="text-xs text-muted-foreground">{item.type}</p>
                          </div>
                          <Badge variant="outline" className="text-xs font-bold">
                            {item.price_coins} 🪙
                          </Badge>
                        </div>

                        <div className="mt-auto pt-2">
                          <Button
                            type="button"
                            size="sm"
                            className="w-full"
                            disabled={buttonDisabled}
                            onClick={buttonAction}
                          >
                            {buttonLabel}
                          </Button>
                          {!acquired && insufficientCoins && (
                            <p className="text-[10px] text-center text-muted-foreground mt-1">Saldo insuficiente</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default MyBox;
