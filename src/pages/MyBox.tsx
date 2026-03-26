import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from 'lucide-react';
import { ensureMyAvatar, getMyAvatar } from '@/lib/avatar';
import { buyAvatarItem, getActiveAvatarShopItems, getMyAvatarInventoryItemIds, type AvatarShopItem } from '@/lib/avatar-shop';
import type { Database } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';

type UserAvatar = Database['public']['Tables']['user_avatars']['Row'];

const MyBox = () => {
  const [avatar, setAvatar] = useState<UserAvatar | null>(null);
  const [loading, setLoading] = useState(true);
  const [shopLoading, setShopLoading] = useState(true);
  const [shopItems, setShopItems] = useState<AvatarShopItem[]>([]);
  const [inventoryItemIds, setInventoryItemIds] = useState<Set<string>>(new Set());
  const [buyingItemId, setBuyingItemId] = useState<string | null>(null);
  const [shopMessage, setShopMessage] = useState<string | null>(null);

  const avatarCoins = avatar?.avatar_coins ?? 0;

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

      await Promise.all([reloadAvatar(), reloadShop()]);

      if (!mounted) return;
      setLoading(false);
      setShopLoading(false);
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <User className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Meu Avatar</h1>
          <p className="text-muted-foreground">Cuide do seu avatar, evolua com frequência e desbloqueie itens.</p>
        </div>
      </div>

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg">Visão geral do Avatar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {loading ? (
            <p className="text-muted-foreground">Carregando avatar...</p>
          ) : (
            <>
              <p><span className="font-medium">Nome:</span> {avatar?.display_name || 'Não definido'}</p>
              <p><span className="font-medium">Nível:</span> {avatar?.avatar_level ?? 1}</p>
              <p><span className="font-medium">XP:</span> {avatar?.avatar_xp ?? 0}</p>
              <p><span className="font-medium">Coins:</span> {avatarCoins}</p>
              <p><span className="font-medium">Roupa base:</span> {avatar?.base_outfit ?? 'basic'}</p>
              <p><span className="font-medium">Topo equipado:</span> {avatar?.equipped_top || 'Nenhum'}</p>
              <p><span className="font-medium">Parte de baixo equipada:</span> {avatar?.equipped_bottom || 'Nenhuma'}</p>
              <p><span className="font-medium">Calçado equipado:</span> {avatar?.equipped_shoes || 'Nenhum'}</p>
              <p><span className="font-medium">Acessório equipado:</span> {avatar?.equipped_accessory || 'Nenhum'}</p>
              <p><span className="font-medium">Acessório de cabeça:</span> {avatar?.equipped_head_accessory || 'Nenhum'}</p>
              <p><span className="font-medium">Acessório de pulso:</span> {avatar?.equipped_wrist_accessory || 'Nenhum'}</p>
              <p><span className="font-medium">Item especial:</span> {avatar?.equipped_special || 'Nenhum'}</p>
              <p><span className="font-medium">Check-ins semanais:</span> {avatar?.weekly_checkins ?? 0}</p>
              <p><span className="font-medium">Streak semanal:</span> {avatar?.weekly_streak ?? 0}</p>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg">Loja do Avatar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p><span className="font-medium">Saldo atual:</span> {avatarCoins} coins</p>
          {shopMessage && <p className="text-muted-foreground">{shopMessage}</p>}

          {shopLoading ? (
            <p className="text-muted-foreground">Carregando loja...</p>
          ) : sortedItems.length === 0 ? (
            <p className="text-muted-foreground">Nenhum item ativo disponível no momento.</p>
          ) : (
            <div className="space-y-3">
              {sortedItems.map((item) => {
                const acquired = inventoryItemIds.has(item.id);
                const insufficientCoins = avatarCoins < item.price_coins;

                return (
                  <div key={item.id} className="rounded-md border border-border p-3">
                    <p><span className="font-medium">Nome:</span> {item.name}</p>
                    <p><span className="font-medium">Categoria:</span> {item.category}</p>
                    <p><span className="font-medium">Raridade:</span> {item.rarity}</p>
                    <p><span className="font-medium">Preço:</span> {item.price_coins} coins</p>
                    <p><span className="font-medium">Status:</span> {acquired ? 'Adquirido' : 'Disponível'}</p>

                    <div className="mt-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={acquired || insufficientCoins || buyingItemId === item.id}
                        onClick={() => handleBuy(item)}
                      >
                        {acquired ? 'Adquirido' : buyingItemId === item.id ? 'Comprando...' : 'Comprar'}
                      </Button>
                      {!acquired && insufficientCoins && (
                        <p className="text-xs text-muted-foreground mt-1">Saldo insuficiente para este item.</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MyBox;
