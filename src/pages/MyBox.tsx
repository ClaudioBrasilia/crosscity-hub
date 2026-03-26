import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from 'lucide-react';
import { ensureMyAvatar, getMyAvatar } from '@/lib/avatar';
import type { Database } from '@/integrations/supabase/types';

type UserAvatar = Database['public']['Tables']['user_avatars']['Row'];

const MyBox = () => {
  const [avatar, setAvatar] = useState<UserAvatar | null>(null);
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
              <p><span className="font-medium">Coins:</span> {avatar?.avatar_coins ?? 0}</p>
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
    </div>
  );
};

export default MyBox;
