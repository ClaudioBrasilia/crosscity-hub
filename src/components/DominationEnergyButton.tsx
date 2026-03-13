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
  participationValid = true,
  blockedText = 'Conclua a atividade para gerar energia',
  className,
  onSuccess,
}: DominationEnergyButtonProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

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
    return `Gerar Energia de Dominação (+${energy})`;
  }, [generated, isBlocked, blockedText, isLoading, energy]);

  const handleClick = async () => {
    if (isLoading || generated || isBlocked) return;
    setIsLoading(true);

    const response = generateDominationEnergyForActivity({
      userId,
      activityId,
      activityType,
      energy,
      participationValid,
    });

    if (response.ok) {
      setGenerated(true);
      toast({ title: 'Energia gerada! ⚡', description: `+${energy} para o seu clã.` });
      onSuccess?.();
    } else {
      toast({ title: 'Não foi possível gerar energia', description: response.message, variant: 'destructive' });
    }

    setIsLoading(false);
  };

  return (
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
  );
};
