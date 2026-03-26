import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Star, Gem } from 'lucide-react';
import { ensureMyAvatar, getMyAvatar } from '@/lib/avatar';
import { buyAvatarItem, equipAvatarItem, getActiveAvatarShopItems, getMyAvatarInventoryItemIds, resolveAvatarItemSlot, type AvatarShopItem } from '@/lib/avatar-shop';
import type { UserAvatarRow } from '@/lib/avatar';
import AvatarRenderer from '@/components/avatar/AvatarRenderer';
import AvatarSlotLegend from '@/components/avatar/AvatarSlotLegend';

const MyBox = () => {
  const [avatar, setAvatar] = useState<UserAvatarRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [shopLoading, setShopLoading] = useState(true);
  const [shopItems, setShopItems] = useState<AvatarShopItem[]>([]);
  const [inventoryItemIds, setInventoryItemIds] = useState<Set<string>>(new Set());
  const [buyingItemId, setBuyingItemId] = useState<string | null>(null);
  const [shopMessage, setShopMessage] = useState<string | null>(null);

  const avatarCoins = (avatar as UserAvatarRow | null)?.avatar_coins ?? 0;

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
      getMyAvatarInventoryItemIds(),
    ]);
    setShopItems(items);
    setInventoryItemIds(inventory);
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

  const getSlotValue = (key: string): string | null => {
    if (!avatar) return null;
    return (avatar as any)[key] ?? null;
  };

  const sortedItems = useMemo(() => {
    return [...shopItems].sort((a, b) => a.price_coins - b.price_coins);
  }, [shopItems]);

  const handleBuy = async (item: AvatarShopItem) => {
    setShopMessage(null);
    setBuyingItemId(item.id);

    const result = await buyAvatarItem(item);
    setShopMessage(result.message);

    if (result.success) {
      await Promise.all([reloadAvatar(), reloadShop()]);
    }

    setBuyingItemId(null);
  };

  const handleEquip = async (item: AvatarShopItem) => {
    setShopMessage(null);
    setBuyingItemId(item.id);

    const result = await equipAvatarItem(item);
    setShopMessage(result.message);

    if (result.success) {
      await reloadAvatar();
    }

    setBuyingItemId(null);
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
                  base_outfit: getSlotValue('base_outfit'),
                  equipped_top: getSlotValue('equipped_top'),
                  equipped_bottom: getSlotValue('equipped_bottom'),
                  equipped_shoes: getSlotValue('equipped_shoes'),
                  equipped_accessory: getSlotValue('equipped_accessory'),
                  equipped_head_accessory: getSlotValue('equipped_head_accessory'),
                  equipped_wrist_accessory: getSlotValue('equipped_wrist_accessory'),
                  equipped_special: getSlotValue('equipped_special'),
                }}
              />
              <AvatarSlotLegend
                equipment={{
                  equipped_top: getSlotValue('equipped_top'),
                  equipped_bottom: getSlotValue('equipped_bottom'),
                  equipped_shoes: getSlotValue('equipped_shoes'),
                  equipped_accessory: getSlotValue('equipped_accessory'),
                  equipped_head_accessory: getSlotValue('equipped_head_accessory'),
                  equipped_wrist_accessory: getSlotValue('equipped_wrist_accessory'),
                  equipped_special: getSlotValue('equipped_special'),
                }}
              />
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
              ) : sortedItems.length === 0 ? (
                <p className="text-muted-foreground text-sm">Nenhum item ativo disponível no momento.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {sortedItems.map((item) => {
                    const acquired = inventoryItemIds.has(item.id);
                    const insufficientCoins = avatarCoins < item.price_coins;
                    const resolvedSlot = resolveAvatarItemSlot(item) as keyof UserAvatarRow | null;
                    const canEquip = !!(acquired && resolvedSlot);
                    const isEquipped = !!(canEquip && avatar && avatar[resolvedSlot] === item.id);
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
                    const buttonAction = acquired ? () => handleEquip(item) : () => handleBuy(item);

                    return (
                      <div key={item.id} className="flex flex-col gap-2 p-3 rounded-lg border border-border bg-muted/30">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-bold">{item.name}</p>
                            <p className="text-xs text-muted-foreground">{item.category} • {item.rarity}</p>
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
