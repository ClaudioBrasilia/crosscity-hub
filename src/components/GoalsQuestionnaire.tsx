import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Target } from 'lucide-react';

interface GoalsQuestionnaireProps {
  userId: string;
  onComplete: () => void;
}

const objectives = [
  { id: 'strength', label: 'Ganhar Força', icon: '💪' },
  { id: 'weight', label: 'Perder Peso', icon: '🏃' },
  { id: 'conditioning', label: 'Melhorar Condicionamento', icon: '❤️‍🔥' },
  { id: 'compete', label: 'Competir', icon: '🏆' },
];

const frequencies = [
  { id: '3x', label: '3x por semana' },
  { id: '4x', label: '4x por semana' },
  { id: '5x', label: '5x por semana' },
  { id: '6x', label: '6x ou mais' },
];

const levels = [
  { id: 'beginner', label: 'Iniciante', desc: 'Menos de 6 meses' },
  { id: 'intermediate', label: 'Intermediário', desc: '6 meses a 2 anos' },
  { id: 'advanced', label: 'Avançado', desc: 'Mais de 2 anos' },
];

const GoalsQuestionnaire = ({ userId, onComplete }: GoalsQuestionnaireProps) => {
  const [step, setStep] = useState(0);
  const [objective, setObjective] = useState('');
  const [frequency, setFrequency] = useState('');
  const [level, setLevel] = useState('');

  const handleFinish = () => {
    const goals = { objective, frequency, level };
    localStorage.setItem(`crosscity_goals_${userId}`, JSON.stringify(goals));
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 animate-fade-in" />
      <div className="relative z-10 w-[90vw] max-w-md animate-scale-in">
        <Card className="border-primary/30 bg-card/95 backdrop-blur-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-5">
              <Target className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold">Defina seus Objetivos</h2>
            </div>

            {step === 0 && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground mb-3">Qual seu objetivo principal?</p>
                {objectives.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => setObjective(o.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                      objective === o.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <span className="text-2xl">{o.icon}</span>
                    <span className="font-medium text-sm">{o.label}</span>
                  </button>
                ))}
              </div>
            )}

            {step === 1 && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground mb-3">Com que frequência você treina?</p>
                {frequencies.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFrequency(f.id)}
                    className={`w-full p-3 rounded-lg border text-left text-sm font-medium transition-all ${
                      frequency === f.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/40'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground mb-3">Qual seu nível de experiência?</p>
                {levels.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setLevel(l.id)}
                    className={`w-full p-3 rounded-lg border text-left transition-all ${
                      level === l.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <span className="font-medium text-sm">{l.label}</span>
                    <span className="text-xs text-muted-foreground ml-2">{l.desc}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Progress + actions */}
            <div className="flex items-center justify-between mt-5">
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
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
                {step < 2 ? (
                  <Button
                    size="sm"
                    className="text-xs"
                    disabled={(step === 0 && !objective) || (step === 1 && !frequency)}
                    onClick={() => setStep(step + 1)}
                  >
                    Próximo
                  </Button>
                ) : (
                  <Button size="sm" className="text-xs" disabled={!level} onClick={handleFinish}>
                    Concluir
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GoalsQuestionnaire;
