import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
}

type Placement = 'top' | 'bottom' | 'center';

interface TourStep {
  title: string;
  description: string;
  target?: string;
  placement: Placement;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: 'Bem-vindo ao BoxLink! 👋',
    description: 'Vamos te mostrar rapidamente onde ficam as funcionalidades principais para você começar agora.',
    placement: 'center',
  },
  {
    title: 'WOD',
    description: 'Registre seus treinos diários aqui.',
    target: '[data-tour="wod-nav"]',
    placement: 'top',
  },
  {
    title: 'Duelos',
    description: 'Desafie outros atletas e aposte XP ou equipamentos.',
    target: '[data-tour="duelos-nav"]',
    placement: 'top',
  },
  {
    title: 'Ranking',
    description: 'Veja sua posição no leaderboard.',
    target: '[data-tour="ranking-nav"]',
    placement: 'top',
  },
  {
    title: 'Menu',
    description: 'Acesse Benchmarks, Desafios, Meu Box e mais.',
    target: '[data-tour="menu-button"]',
    placement: 'bottom',
  },
];

const defaultRect = {
  top: 0,
  left: 0,
  width: 0,
  height: 0,
};

const OnboardingTour = ({ isOpen, onClose }: OnboardingTourProps) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState(defaultRect);

  const currentStep = TOUR_STEPS[stepIndex];

  useEffect(() => {
    if (!isOpen) {
      setStepIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const updateTargetRect = () => {
      if (!currentStep.target) {
        setTargetRect(defaultRect);
        return;
      }

      const targetElement = document.querySelector(currentStep.target);

      if (!targetElement) {
        setTargetRect(defaultRect);
        return;
      }

      const rect = targetElement.getBoundingClientRect();
      setTargetRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    };

    updateTargetRect();
    window.addEventListener('resize', updateTargetRect);
    window.addEventListener('scroll', updateTargetRect, true);

    return () => {
      window.removeEventListener('resize', updateTargetRect);
      window.removeEventListener('scroll', updateTargetRect, true);
    };
  }, [currentStep.target, isOpen]);

  const cardStyle = useMemo(() => {
    if (!currentStep.target) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const horizontalCenter = targetRect.left + targetRect.width / 2;
    const minSidePadding = 16;
    const clampedLeft = Math.min(
      (typeof window !== 'undefined' ? window.innerWidth : 0) - minSidePadding,
      Math.max(minSidePadding, horizontalCenter),
    );

    if (currentStep.placement === 'bottom') {
      return {
        top: `${targetRect.top + targetRect.height + 20}px`,
        left: `${clampedLeft}px`,
        transform: 'translateX(-50%)',
      };
    }

    return {
      top: `${Math.max(24, targetRect.top - 20)}px`,
      left: `${clampedLeft}px`,
      transform: 'translate(-50%, -100%)',
    };
  }, [currentStep.placement, currentStep.target, targetRect.height, targetRect.left, targetRect.top, targetRect.width]);

  if (!isOpen) return null;

  const isLastStep = stepIndex === TOUR_STEPS.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onClose();
      return;
    }

    setStepIndex((prev) => prev + 1);
  };

  return (
    <div className="fixed inset-0 z-[120] animate-fade-in">
      <div className="absolute inset-0 bg-black/60" />

      {currentStep.target && targetRect.width > 0 && (
        <div
          className="absolute rounded-xl border-2 border-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] pointer-events-none transition-all duration-300"
          style={{
            top: `${targetRect.top - 8}px`,
            left: `${targetRect.left - 8}px`,
            width: `${targetRect.width + 16}px`,
            height: `${targetRect.height + 16}px`,
          }}
        />
      )}

      <div
        className="fixed z-[121] w-[min(92vw,360px)] rounded-2xl border border-primary/30 bg-background/95 p-5 shadow-xl backdrop-blur animate-scale-in"
        style={cardStyle}
      >
        <p className="text-xs text-muted-foreground mb-1">Passo {stepIndex + 1} de {TOUR_STEPS.length}</p>
        <h3 className="text-lg font-semibold mb-2">{currentStep.title}</h3>
        <p className="text-sm text-muted-foreground">{currentStep.description}</p>

        <div className="mt-4 flex items-center gap-1.5">
          {TOUR_STEPS.map((_, index) => (
            <span
              key={index}
              className={`h-1.5 rounded-full transition-all ${index === stepIndex ? 'w-6 bg-primary' : 'w-1.5 bg-muted-foreground/40'}`}
            />
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between gap-2">
          <Button variant="ghost" onClick={onClose}>Pular</Button>
          <Button onClick={handleNext}>{isLastStep ? 'Finalizar' : 'Próximo'}</Button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTour;
