import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Timer, Play, StopCircle, Trophy } from 'lucide-react';
import { wodTemplates } from '@/lib/mockData';

const WOD = () => {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [isActive, setIsActive] = useState(false);
  const [selectedWod, setSelectedWod] = useState(wodTemplates[0]);
  const [time, setTime] = useState('');
  const [reps, setReps] = useState('');

  const startWod = () => {
    setIsActive(true);
    toast({ title: 'WOD iniciado!', description: 'Boa sorte! 💪' });
  };

  const finishWod = () => {
    if (!time && !reps) {
      toast({ title: 'Ops!', description: 'Preencha tempo ou repetições', variant: 'destructive' });
      return;
    }

    setIsActive(false);
    
    const xpGained = 100;
    const newXp = (user?.xp || 0) + xpGained;
    const newLevel = Math.floor(newXp / 500) + 1;
    
    updateUser({ 
      xp: newXp, 
      level: newLevel,
      streak: (user?.streak || 0) + 1
    });

    // Add to feed
    const feedData = localStorage.getItem('crosscity_feed') || '[]';
    const feed = JSON.parse(feedData);
    feed.unshift({
      id: `post_${Date.now()}`,
      userId: user?.id,
      userName: user?.name,
      userAvatar: user?.avatar,
      content: `Acabei de completar ${selectedWod.name}! ${time ? `Tempo: ${time}` : `${reps} reps`}`,
      wodName: selectedWod.name,
      time: time || reps,
      reactions: { fire: 0, clap: 0, muscle: 0 },
      comments: 0,
      timestamp: Date.now(),
    });
    localStorage.setItem('crosscity_feed', JSON.stringify(feed));

    toast({ 
      title: 'WOD completo! 🔥', 
      description: `+${xpGained} XP ganhos. Continue assim!` 
    });

    setTime('');
    setReps('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Treino do Dia</h1>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>WODs Disponíveis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {wodTemplates.map((wod) => (
              <button
                key={wod.name}
                onClick={() => setSelectedWod(wod)}
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  selectedWod.name === wod.name 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold">{wod.name}</p>
                    <p className="text-sm text-muted-foreground">{wod.type}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    wod.difficulty === 'Hero' ? 'bg-primary text-primary-foreground' :
                    wod.difficulty === 'Advanced' ? 'bg-secondary text-secondary-foreground' :
                    'bg-muted'
                  }`}>
                    {wod.difficulty}
                  </span>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                {selectedWod.name}
              </CardTitle>
              <CardDescription>{selectedWod.type} • {selectedWod.difficulty}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-lg mb-6">{selectedWod.description}</p>

              {!isActive ? (
                <Button onClick={startWod} className="w-full" size="lg">
                  <Play className="h-5 w-5 mr-2" />
                  Iniciar WOD
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="p-6 bg-primary/10 rounded-lg text-center">
                    <Timer className="h-12 w-12 mx-auto mb-2 text-primary animate-pulse" />
                    <p className="text-sm text-muted-foreground">WOD em andamento...</p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label>Tempo</Label>
                      <Input 
                        placeholder="Ex: 12:45" 
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Repetições/Rounds</Label>
                      <Input 
                        placeholder="Ex: 20 rounds" 
                        value={reps}
                        onChange={(e) => setReps(e.target.value)}
                      />
                    </div>
                  </div>

                  <Button onClick={finishWod} className="w-full" variant="secondary">
                    <StopCircle className="h-5 w-5 mr-2" />
                    Finalizar WOD
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default WOD;
