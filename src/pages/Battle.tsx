import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { wodTemplates } from '@/lib/mockData';
import { simulateBattle, type BattleResult, type Participant } from '@/lib/battleSimulator';
import { equipmentCatalog, getUnlockedEquipment, getNextEquipment } from '@/lib/equipmentData';
import { Swords, Play, Trophy, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type BattlePhase = 'setup' | 'racing' | 'result';

const Battle = () => {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [selectedWod, setSelectedWod] = useState(wodTemplates[0].name);
  const [selectedOpponents, setSelectedOpponents] = useState<string[]>([]);
  const [phase, setPhase] = useState<BattlePhase>('setup');
  const [results, setResults] = useState<BattleResult[]>([]);
  const [progressValues, setProgressValues] = useState<Record<string, number>>({});
  const [betMode, setBetMode] = useState(false);
  const [betEquipment, setBetEquipment] = useState<string>('');
  const animRef = useRef<number>();

  const users = JSON.parse(localStorage.getItem('crosscity_users') || '[]');
  const opponents = users.filter((u: any) => u.id !== user?.id);
  const wod = wodTemplates.find(w => w.name === selectedWod)!;

  const userWins = Number(localStorage.getItem(`crosscity_wins_${user?.id}`) || '0');
  const canBet = (user?.level || 0) >= 10;
  const userInventory: string[] = JSON.parse(localStorage.getItem(`crosscity_inventory_${user?.id}`) || '[]');

  const toggleOpponent = (id: string) => {
    setSelectedOpponents(prev =>
      prev.includes(id) ? prev.filter(o => o !== id) : [...prev, 3 > prev.length ? id : prev[0]]
    );
  };

  const startBattle = () => {
    if (selectedOpponents.length === 0 || !user) return;

    const allBenchmarks = JSON.parse(localStorage.getItem('crosscity_benchmarks') || '{}');

    const participants: Participant[] = [
      { id: user.id, name: user.name, avatar: user.avatar, xp: user.xp, level: user.level, benchmarks: allBenchmarks[user.id] || {} },
      ...selectedOpponents.map(opId => {
        const opp = users.find((u: any) => u.id === opId);
        return {
          id: opp.id, name: opp.name, avatar: opp.avatar, xp: opp.xp || 1000, level: opp.level || 5,
          benchmarks: allBenchmarks[opp.id] || {},
        };
      }),
    ];

    const battleResults = simulateBattle(selectedWod, wod.type, participants);
    setResults(battleResults);

    // Start racing animation
    setPhase('racing');
    const initialProgress: Record<string, number> = {};
    participants.forEach(p => (initialProgress[p.id] = 0));
    setProgressValues(initialProgress);

    const maxScore = Math.max(...battleResults.map(r => r.score));
    const duration = 4000;
    const start = Date.now();

    const animate = () => {
      const elapsed = Date.now() - start;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // ease out cubic

      const newProgress: Record<string, number> = {};
      battleResults.forEach(r => {
        const targetProgress = (r.score / maxScore) * 100;
        newProgress[r.participantId] = eased * targetProgress;
      });
      setProgressValues(newProgress);

      if (t < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        setTimeout(() => finishBattle(battleResults), 500);
      }
    };
    animRef.current = requestAnimationFrame(animate);
  };

  const finishBattle = (battleResults: BattleResult[]) => {
    setPhase('result');
    if (!user) return;

    const winner = battleResults[0];
    const isWinner = winner.participantId === user.id;

    if (isWinner) {
      const newWins = userWins + 1;
      localStorage.setItem(`crosscity_wins_${user.id}`, String(newWins));

      // Grant equipment
      if (betMode && betEquipment) {
        // In bet mode, winner gets all bet equipment
        // For mock: just add a random equipment from opponents
        const opponentEq = equipmentCatalog[Math.floor(Math.random() * 12)];
        const inv = [...userInventory, opponentEq.id];
        localStorage.setItem(`crosscity_inventory_${user.id}`, JSON.stringify([...new Set(inv)]));
        toast({ title: '🎰 Aposta vencida!', description: `Você ganhou ${opponentEq.emoji} ${opponentEq.name}!` });
      } else {
        const next = getNextEquipment(newWins);
        if (next && newWins >= next.winsRequired) {
          const inv = [...userInventory, next.id];
          localStorage.setItem(`crosscity_inventory_${user.id}`, JSON.stringify([...new Set(inv)]));
          toast({ title: '🎉 Novo equipamento!', description: `Você desbloqueou ${next.emoji} ${next.name}!` });
        }
      }

      updateUser({ xp: (user.xp || 0) + 150 });

      // Post to feed
      const feed = JSON.parse(localStorage.getItem('crosscity_feed') || '[]');
      feed.unshift({
        id: `post_${Date.now()}`,
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatar,
        content: `${betMode ? '🎰 ' : ''}Venceu a batalha virtual no WOD ${selectedWod}! ${winner.simulatedTime} ${betMode ? '(modo aposta!)' : ''}`,
        wodName: selectedWod,
        time: winner.simulatedTime,
        reactions: { fire: 0, clap: 0, muscle: 0 },
        comments: 0,
        timestamp: Date.now(),
      });
      localStorage.setItem('crosscity_feed', JSON.stringify(feed));
    } else if (betMode && betEquipment) {
      // Lost bet - remove equipment
      const inv = userInventory.filter(id => id !== betEquipment);
      localStorage.setItem(`crosscity_inventory_${user.id}`, JSON.stringify(inv));
      toast({ title: '😢 Aposta perdida!', description: 'Você perdeu o equipamento apostado.', variant: 'destructive' });
    }

    // Save battle history
    const history = JSON.parse(localStorage.getItem('crosscity_battles') || '[]');
    history.unshift({
      id: `battle_${Date.now()}`,
      wod: selectedWod,
      results: battleResults,
      timestamp: Date.now(),
      betMode,
    });
    localStorage.setItem('crosscity_battles', JSON.stringify(history));
  };

  useEffect(() => {
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  const resetBattle = () => {
    setPhase('setup');
    setResults([]);
    setProgressValues({});
    setBetMode(false);
    setBetEquipment('');
  };

  const battleHistory = JSON.parse(localStorage.getItem('crosscity_battles') || '[]').slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Swords className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Batalha Virtual</h1>
          <p className="text-muted-foreground">Desafie oponentes em simulações baseadas nos seus benchmarks</p>
        </div>
      </div>

      {phase === 'setup' && (
        <>
          <Card className="border-primary/20">
            <CardHeader><CardTitle>Configurar Batalha</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">WOD</label>
                <Select value={selectedWod} onValueChange={setSelectedWod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {wodTemplates.map(w => (
                      <SelectItem key={w.name} value={w.name}>{w.name} — {w.type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">{wod?.description}</p>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Oponentes (até 3)</label>
                <div className="space-y-2">
                  {opponents.map((opp: any) => (
                    <div
                      key={opp.id}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedOpponents.includes(opp.id) ? 'bg-primary/20 border border-primary/40' : 'bg-muted/50'
                      }`}
                      onClick={() => toggleOpponent(opp.id)}
                    >
                      <Checkbox checked={selectedOpponents.includes(opp.id)} />
                      <span className="text-xl">{opp.avatar}</span>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{opp.name}</p>
                        <p className="text-xs text-muted-foreground">Nível {opp.level} • {opp.xp} XP</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {canBet && userInventory.length > 0 && (
                <div className="p-4 rounded-lg border border-secondary/40 bg-secondary/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🎰</span>
                      <span className="font-semibold text-sm">Modo Aposta</span>
                    </div>
                    <Switch checked={betMode} onCheckedChange={setBetMode} />
                  </div>
                  {betMode && (
                    <Select value={betEquipment} onValueChange={setBetEquipment}>
                      <SelectTrigger><SelectValue placeholder="Escolha equipamento para apostar" /></SelectTrigger>
                      <SelectContent>
                        {userInventory.map(eqId => {
                          const eq = equipmentCatalog.find(e => e.id === eqId);
                          return eq ? (
                            <SelectItem key={eq.id} value={eq.id}>{eq.emoji} {eq.name}</SelectItem>
                          ) : null;
                        })}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

              <Button
                onClick={startBattle}
                disabled={selectedOpponents.length === 0 || (betMode && !betEquipment)}
                className="w-full gap-2"
                size="lg"
              >
                <Play className="h-5 w-5" /> Iniciar Batalha
              </Button>
            </CardContent>
          </Card>

          {battleHistory.length > 0 && (
            <Card className="border-primary/20">
              <CardHeader><CardTitle className="text-lg">Histórico</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {battleHistory.map((b: any) => (
                  <div key={b.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-semibold text-sm">
                        {b.betMode && '🎰 '}{b.wod}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(b.timestamp).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">
                        🥇 {b.results[0]?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{b.results[0]?.simulatedTime}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {phase === 'racing' && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-secondary animate-pulse" />
              {selectedWod} — Em andamento!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {results.map(r => (
              <div key={r.participantId} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{r.avatar}</span>
                    <span className="font-semibold text-sm">{r.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {Math.round(progressValues[r.participantId] || 0)}%
                  </span>
                </div>
                <Progress value={progressValues[r.participantId] || 0} className="h-3" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {phase === 'result' && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-center text-2xl">🏆 Resultado — {selectedWod}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {results.map((r, i) => (
              <div
                key={r.participantId}
                className={`flex items-center justify-between p-4 rounded-lg ${
                  i === 0 ? 'bg-primary/20 border border-primary/40' : 'bg-muted/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}º`}
                  </span>
                  <span className="text-2xl">{r.avatar}</span>
                  <div>
                    <p className="font-bold">{r.name}</p>
                    {i === 0 && r.participantId === user?.id && (
                      <p className="text-xs text-secondary font-semibold">+150 XP 🎉</p>
                    )}
                  </div>
                </div>
                <p className="text-xl font-bold text-primary">{r.simulatedTime}</p>
              </div>
            ))}
            <Button onClick={resetBattle} className="w-full mt-4" variant="outline">
              Nova Batalha
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Battle;
