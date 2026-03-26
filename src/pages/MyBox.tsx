import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Shirt, Footprints, Crown, Watch, Sparkles, Star, Gem } from 'lucide-react';
import { ensureMyAvatar, getMyAvatar } from '@/lib/avatar';
import type { UserAvatarRow } from '@/lib/avatar';

const EQUIPMENT_SLOTS = [
  { key: 'base_outfit', label: 'Roupa Base', icon: Shirt, fallback: 'basic' },
  { key: 'equipped_top', label: 'Parte Superior', icon: Shirt, fallback: null },
  { key: 'equipped_bottom', label: 'Parte Inferior', icon: Shirt, fallback: null },
  { key: 'equipped_shoes', label: 'Calçado', icon: Footprints, fallback: null },
  { key: 'equipped_accessory', label: 'Acessório', icon: Gem, fallback: null },
  { key: 'equipped_head_accessory', label: 'Acessório de Cabeça', icon: Crown, fallback: null },
  { key: 'equipped_wrist_accessory', label: 'Acessório de Pulso', icon: Watch, fallback: null },
  { key: 'equipped_special', label: 'Item Especial', icon: Sparkles, fallback: null },
] as const;

const MyBox = () => {
  const [avatar, setAvatar] = useState<UserAvatarRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadAvatar = async () => {
      setLoading(true);

      const ensured = await ensureMyAvatar();
      if (!mounted) return;

      if (ensured) {
        setAvatar(ensured);
        setLoading(false);
        return;
      }

      const loaded = await getMyAvatar();
      if (!mounted) return;

      setAvatar(loaded);
      setLoading(false);
    };

    loadAvatar();

    return () => {
      mounted = false;
    };
  }, []);

  const getSlotValue = (key: string): string | null => {
    if (!avatar) return null;
    return (avatar as any)[key] ?? null;
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
              { label: 'Coins', value: avatar?.avatar_coins ?? 0, icon: '🪙' },
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

          {/* Equipment Slots */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                Visual do Avatar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {EQUIPMENT_SLOTS.map((slot) => {
                  const Icon = slot.icon;
                  const value = getSlotValue(slot.key);
                  const equipped = value && value !== 'basic' && slot.key !== 'base_outfit';
                  const displayValue =
                    slot.key === 'base_outfit'
                      ? value || 'basic'
                      : value || null;

                  return (
                    <div
                      key={slot.key}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30"
                    >
                      <div className="flex items-center justify-center h-10 w-10 rounded-md bg-muted">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{slot.label}</p>
                        {displayValue ? (
                          <Badge variant="secondary" className="mt-0.5 text-xs">
                            {displayValue}
                          </Badge>
                        ) : (
                          <p className="text-xs text-muted-foreground mt-0.5">Não equipado</p>
                        )}
                      </div>
                      {equipped && (
                        <span className="text-primary text-xs font-medium">Equipado</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default MyBox;
