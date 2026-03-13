import { useEffect, useMemo, useState } from 'react';
import { Loader2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { generateDominationEnergyForActivity, hasGeneratedDominationEnergy, type ActivityEnergyClaim } from '@/lib/clanSystem';

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

  useEffect(() => {
    setGenerated(hasGeneratedDominationEnergy(userId, activityId));
  }, [userId, activityId]);

  useEffect(() => {
    const sync = () => setGenerated(hasGeneratedDominationEnergy(userId, activityId));
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, [userId, activityId]);

  const buttonLabel = useMemo(() => {
    if (generated) return 'Energia Gerada';
    if (isBlocked) return blockedText;
    if (isLoading) return 'Gerando energia...';
    return `Gerar Energia (+${energy} XP)`;
  }, [generated, isBlocked, blockedText, isLoading, energy]);

  const handleClick = async () => {
    if (isLoading || generated || isBlocked) return;
    setIsLoading(true);

    const response = generateDominationEnergyForActivity({
      userId,
      activityId,
      activityType,
      energy,
      clanEnergyBonus,
      participationValid,
    });

    if (response.ok) {
      setGenerated(true);
      const clanName = response.clan?.name;
      const clanPart = clanName ? ` e +${response.claim.clanEnergy} Energia ${clanName}` : '';
      setGainFeedback(`+${response.claim.individualEnergy} XP Pessoal${clanPart}`);
      toast({ title: 'Energia gerada! ⚡', description: response.message });
      onSuccess?.();
    } else {
      toast({ title: 'Não foi possível gerar energia', description: response.message, variant: 'destructive' });
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
