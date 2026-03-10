import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dumbbell, Swords, Trophy, MoreHorizontal } from 'lucide-react';

interface OnboardingTourProps {
  onComplete: () => void;
}

const steps = [
  {
    title: 'Bem-vindo ao BoxLink! 🏋️',
    description: 'Sua plataforma completa para acompanhar treinos, competir com amigos e evoluir no CrossFit. Vamos fazer um tour rápido!',
    position: 'center' as const,
    icon: null,
  },
  {
    title: 'WOD do Dia',
    description: 'Registre seus treinos diários, acompanhe resultados e veja como você se compara com outros atletas.',
    position: 'bottom-nav' as const,
    navIndex: 1,
    icon: Dumbbell,
  },
  {
    title: 'Duelos',
    description: 'Desafie outros atletas para batalhas 1v1! Aposte XP e equipamentos para provar quem é o melhor.',
    position: 'bottom-nav' as const,
    navIndex: 2,
    icon: Swords,
  },
  {
    title: 'Ranking',
    description: 'Veja sua posição no leaderboard geral e por categoria. Suba de nível para alcançar o topo!',
    position: 'bottom-nav' as const,
    navIndex: 3,
    icon: Trophy,
  },
  {
    title: 'Mais Opções',
    description: 'Acesse Benchmarks, Desafios, Feed da Comunidade, Meu Box e muito mais pelo menu.',
    position: 'top-menu' as const,
    icon: MoreHorizontal,
  },
];

const OnboardingTour = ({ onComplete }: OnboardingTourProps) => {
  const [step, setStep] = useState(0);
  const current = steps[step];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const getCardPosition = () => {
    if (current.position === 'center') {
      return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
    }
    if (current.position === 'bottom-nav') {
      return 'bottom-24 left-1/2 -translate-x-1/2';
    }
    if (current.position === 'top-menu') {
      return 'top-16 right-4';
    }
    return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
  };

  const getSpotlight = () => {
    if (current.position === 'bottom-nav' && current.navIndex !== undefined) {
      const navItems = document.querySelectorAll('nav .grid > a');
      const target = navItems[current.navIndex] as HTMLElement;
      if (target) {
        const rect = target.getBoundingClientRect();
        return {
          top: rect.top - 4,
          left: rect.left - 4,
          width: rect.width + 8,
          height: rect.height + 8,
        };
      }
    }
    if (current.position === 'top-menu') {
      const menuBtn = document.querySelector('header button[aria-haspopup]') as HTMLElement
        || document.querySelector('header button:last-of-type') as HTMLElement;
      if (menuBtn) {
        const rect = menuBtn.getBoundingClientRect();
        return {
          top: rect.top - 4,
          left: rect.left - 4,
          width: rect.width + 8,
          height: rect.height + 8,
        };
      }
    }
    return null;
  };

  const spotlight = getSpotlight();

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/70 transition-opacity animate-fade-in" />

      {/* Spotlight cutout */}
      {spotlight && (
        <div
          className="absolute rounded-xl border-2 border-primary/60 z-[101] animate-scale-in"
          style={{
            top: spotlight.top,
            left: spotlight.left,
            width: spotlight.width,
            height: spotlight.height,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.7), 0 0 20px 4px hsl(217 91% 60% / 0.4)',
          }}
        />
      )}

      {/* Card */}
      <div
        className={`absolute z-[102] w-[85vw] max-w-sm animate-scale-in ${getCardPosition()}`}
      >
        <div className="rounded-xl border border-primary/30 bg-card/95 backdrop-blur-lg p-5 shadow-xl">
          {current.icon && (
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mb-3">
              <current.icon className="h-5 w-5 text-primary" />
            </div>
          )}
          <h3 className="text-lg font-bold mb-1">{current.title}</h3>
          <p className="text-sm text-muted-foreground mb-4">{current.description}</p>

          {/* Progress dots */}
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === step ? 'w-5 bg-primary' : i < step ? 'w-1.5 bg-primary/50' : 'w-1.5 bg-muted'
                  }`}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={onComplete} className="text-xs">
                Pular
              </Button>
              <Button size="sm" onClick={handleNext} className="text-xs">
                {step === steps.length - 1 ? 'Começar!' : 'Próximo'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTour;
