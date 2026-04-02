import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getUserClan } from '@/lib/supabaseData';

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
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [generated, setGenerated] = useState(false);
  const [gainFeedback, setGainFeedback] = useState<string | null>(null);
  const [hasValidatedPresenceToday, setHasValidatedPresenceToday] = useState(false);
  const [presenceMessage, setPresenceMessage] = useState<string | null>(null);

  const getSaoPauloDayKey = useCallback(
    (date = new Date()) =>
      new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(date),
    [],
  );

  const getSaoPauloDayRangeUtc = useCallback((date = new Date()) => {
    const dayKey = getSaoPauloDayKey(date);
    const dayStart = new Date(`${dayKey}T00:00:00-03:00`).toISOString();
    const dayEnd = new Date(`${dayKey}T23:59:59.999-03:00`).toISOString();
    return { dayKey, dayStart, dayEnd };
  }, [getSaoPauloDayKey]);

  const validatePresenceToday = useCallback(async (): Promise<boolean> => {
    const dayKey = getSaoPauloDayKey();
    const { data } = await supabase
      .from('checkins')
      .select('id')
      .eq('user_id', userId)
      .eq('check_date', dayKey)
      .limit(1);
    const hasPresence = !!(data && data.length > 0);
    setHasValidatedPresenceToday(hasPresence);
    setPresenceMessage(hasPresence ? 'Presença validada hoje' : 'Faça check-in presencial para gerar energia');
    return hasPresence;
  }, [getSaoPauloDayKey, userId]);

  const isBlocked = !participationValid || !hasValidatedPresenceToday || isBootstrapping;

  // Check if energy was already generated for this activity on São Paulo day (from Supabase)
  useEffect(() => {
    const check = async () => {
      setIsBootstrapping(true);
      const { dayStart, dayEnd } = getSaoPauloDayRangeUtc();
      const [eventResult, hasPresenceToday] = await Promise.all([
        supabase
          .from('domination_events')
          .select('id')
          .eq('user_id', userId)
          .eq('source', activityType)
          .gte('created_at', dayStart)
          .lte('created_at', dayEnd)
          .limit(1),
        validatePresenceToday(),
      ]);

      if (eventResult.data && eventResult.data.length > 0) setGenerated(true);
      setHasValidatedPresenceToday(hasPresenceToday);
      setIsBootstrapping(false);
    };
    check();
  }, [userId, activityId, activityType, getSaoPauloDayRangeUtc, validatePresenceToday]);

  const buttonLabel = useMemo(() => {
    if (isBootstrapping) return 'Verificando...';
    if (generated) return 'Energia Gerada';
    if (isBlocked) return blockedText;
    if (isLoading) return 'Gerando energia...';
    return `Gerar Energia (+${energy} XP)`;
  }, [isBootstrapping, generated, isBlocked, blockedText, isLoading, energy]);

  const handleClick = async () => {
    if (isLoading || generated || isBlocked) return;
    setIsLoading(true);

    try {
      const hasPresenceToday = await validatePresenceToday();
      if (!hasPresenceToday) {
        toast({
          title: 'Energia bloqueada',
          description: 'Faça o check-in presencial de hoje para gerar energia do time.',
          variant: 'destructive',
        });
        return;
      }

      const clan = await getUserClan(userId);
      const { dayKey } = getSaoPauloDayRangeUtc();
      const battleId = dayKey;
      const clanEnergy = clan ? energy + clanEnergyBonus : 0;

      // Record domination event in Supabase
      if (clan) {
        const eventId = `energy_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;
        const { error: insertError } = await supabase.from('domination_events').insert({
          id: eventId,
          battle_id: battleId,
          user_id: userId,
          clan_id: clan.id,
          source: activityType,
          energy: clanEnergy,
        } as any);
        if (insertError) {
          if (insertError.code === '23505') {
            setGenerated(true);
            toast({ title: 'Energia já gerada hoje', description: 'Você já realizou este check-in no dia de hoje.' });
            return;
          }
          throw insertError;
        }

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
    } finally {
      setIsLoading(false);
    }
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
      {presenceMessage && !generated && (
        <p className="text-xs text-muted-foreground">{presenceMessage}</p>
      )}
    </div>
  );
};
