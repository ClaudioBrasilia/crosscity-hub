import { useEffect, useMemo, useState } from 'react';
import { Loader2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getUserClan, type ClanData } from '@/lib/supabaseData';

interface ActivityEnergyClaim {
  activityType: 'checkin' | 'wod' | 'challenge' | 'event';
}

interface DominationEnergyButtonProps {
  userId: string;
  activityId: string;
  activityType: ActivityEnergyClaim['activityType'];
  energy?: number;
  clanEnergyBonus?: number;
  participationValid?: boolean;
  blockedText?: string;
  className?: string;
  onSuccess?: () => void;
}

export const DominationEnergyButton = ({
  userId,
  activityId,
  activityType,
  energy = 20,
  clanEnergyBonus = 0,
  participationValid = true,
  blockedText = 'Conclua a atividade para gerar energia',
  className,
  onSuccess,
}: DominationEnergyButtonProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [gainFeedback, setGainFeedback] = useState<string | null>(null);

  const isBlocked = !participationValid;

  // Check if energy was already generated for this activity (from Supabase)
  useEffect(() => {
    const check = async () => {
      const dayKey = new Date().toISOString().split('T')[0];
      const battleId = dayKey;
      const { data } = await supabase
        .from('domination_events')
        .select('id')
        .eq('user_id', userId)
        .eq('battle_id', battleId)
        .eq('source', activityType)
        .limit(1);
      if (data && data.length > 0) setGenerated(true);
    };
    check();
  }, [userId, activityId, activityType]);

  const buttonLabel = useMemo(() => {
    if (generated) return 'Energia Gerada';
    if (isBlocked) return blockedText;
    if (isLoading) return 'Gerando energia...';
    return `Gerar Energia (+${energy} XP)`;
  }, [generated, isBlocked, blockedText, isLoading, energy]);

  const handleClick = async () => {
    if (isLoading || generated || isBlocked) return;
    setIsLoading(true);

    try {
      const clan = await getUserClan(userId);
      const dayKey = new Date().toISOString().split('T')[0];
      const battleId = dayKey;
      const clanEnergy = clan ? energy + clanEnergyBonus : 0;

      // Record domination event in Supabase
      if (clan) {
        const eventId = `energy_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;
        await supabase.from('domination_events').insert({
          id: eventId,
          battle_id: battleId,
          user_id: userId,
          clan_id: clan.id,
          source: activityType,
          energy: clanEnergy,
        } as any);

        // Update territory battle energy
        const { data: battle } = await supabase
          .from('territory_battles')
          .select('*')
          .eq('id', battleId)
          .maybeSingle();

        if (battle) {
          const currentEnergy = (battle as any).energy_by_clan || {};
          currentEnergy[clan.id] = (currentEnergy[clan.id] || 0) + clanEnergy;
          await supabase.from('territory_battles').update({
            energy_by_clan: currentEnergy,
          }).eq('id', battleId);
        }
      }

      // Update user XP in profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('xp')
        .eq('id', userId)
        .single();
      if (profile) {
        const newXp = ((profile as any).xp || 0) + energy;
        await supabase.from('profiles').update({
          xp: newXp,
          level: Math.floor(newXp / 500) + 1,
        }).eq('id', userId);
      }

      setGenerated(true);
      const clanPart = clan ? ` e +${clanEnergy} Energia ${clan.name}` : '';
      setGainFeedback(`+${energy} XP Pessoal${clanPart}`);
      toast({ title: 'Energia gerada! ⚡', description: clan
        ? `+${energy} XP pessoal e +${clanEnergy} energia para ${clan.name}.`
        : 'Você ganhou XP pessoal! Entre em um time para contribuir com energia.' });
      onSuccess?.();
    } catch (err) {
      toast({ title: 'Erro', description: 'Falha ao gerar energia no servidor.', variant: 'destructive' });
    }

    setIsLoading(false);
  };

  return (
    <div className="space-y-1">
      <Button
        type="button"
        onClick={handleClick}
        disabled={generated || isBlocked || isLoading}
        className={className}
        variant={generated ? 'secondary' : 'default'}
      >
        {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
        {buttonLabel}
      </Button>
      {gainFeedback && <p className="text-xs text-emerald-600 font-medium animate-in fade-in-0">{gainFeedback}</p>}
    </div>
  );
};
