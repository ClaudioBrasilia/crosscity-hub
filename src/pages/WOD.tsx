import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Trophy, Timer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { DailyWod, DailyWodResult, Duel, WodCategory, WodScoreUnit } from '@/lib/mockData';

const categoryLabels: Record<WodCategory, string> = {
  rx: 'RX',
  scaled: 'Scaled',
  beginner: 'Iniciante',
};

const toTimeValue = (value: string) => {
  const [minutes, seconds] = value.split(':').map(Number);
  if (Number.isNaN(minutes) || Number.isNaN(seconds)) return Number.POSITIVE_INFINITY;
  return minutes * 60 + seconds;
};

const toRoundsValue = (value: string) => {
  const n = Number(value);
  return Number.isNaN(n) ? 0 : n;
};

const WOD = () => {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [dailyWod, setDailyWod] = useState<DailyWod | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<WodCategory>('rx');
  const [scoreUnit, setScoreUnit] = useState<WodScoreUnit>('time');
  const [resultValue, setResultValue] = useState('');
  const [submitToDuel, setSubmitToDuel] = useState(true);
  const [results, setResults] = useState<DailyWodResult[]>([]);
  const [duels, setDuels] = useState<Duel[]>([]);

  useEffect(() => {
    setDailyWod(JSON.parse(localStorage.getItem('crosscity_daily_wod') || 'null'));
    setResults(JSON.parse(localStorage.getItem('crosscity_wod_results') || '[]'));
    setDuels(JSON.parse(localStorage.getItem('crosscity_duels') || '[]'));
  }, []);

  const activeDuel = useMemo(() => {
    if (!dailyWod || !user) return null;
    return duels.find(
      (duel) =>
        duel.wodId === dailyWod.id &&
        duel.category === selectedCategory &&
        duel.status === 'active' &&
        (duel.challengerId === user.id || duel.opponentId === user.id)
    );
  }, [dailyWod, duels, selectedCategory, user]);

  const categoryRanking = useMemo(() => {
    if (!dailyWod) return [];
    const entries = results.filter((item) => item.wodId === dailyWod.id && item.category === selectedCategory);
    const sorted = [...entries].sort((a, b) => {
      if (a.unit === 'time' && b.unit === 'time') return toTimeValue(a.result) - toTimeValue(b.result);
      if (a.unit === 'rounds' && b.unit === 'rounds') return toRoundsValue(b.result) - toRoundsValue(a.result);
      return a.submittedAt - b.submittedAt;
    });
    return sorted;
  }, [dailyWod, results, selectedCategory]);

  const userEntry = categoryRanking.find((item) => item.userId === user?.id);
  const userPosition = userEntry ? categoryRanking.findIndex((item) => item.id === userEntry.id) + 1 : null;

  const submitResult = () => {
    if (!dailyWod || !user || !resultValue.trim()) {
      toast({ title: 'Resultado inválido', description: 'Preencha seu resultado para registrar.', variant: 'destructive' });
      return;
    }

    const existing = results.find(
      (item) => item.wodId === dailyWod.id && item.userId === user.id && item.category === selectedCategory
    );

    const payload: DailyWodResult = {
      id: existing?.id || `res_${Date.now()}`,
      wodId: dailyWod.id,
      userId: user.id,
      userName: user.name,
      avatar: user.avatar,
      category: selectedCategory,
      result: resultValue,
      unit: scoreUnit,
      submittedAt: Date.now(),
    };

    const updatedResults = existing
      ? results.map((item) => (item.id === existing.id ? payload : item))
      : [payload, ...results];

    localStorage.setItem('crosscity_wod_results', JSON.stringify(updatedResults));
    setResults(updatedResults);

    const currentCategoryResults = updatedResults
      .filter((item) => item.wodId === dailyWod.id && item.category === selectedCategory)
      .sort((a, b) => {
        if (scoreUnit === 'time') return toTimeValue(a.result) - toTimeValue(b.result);
        return toRoundsValue(b.result) - toRoundsValue(a.result);
      });

    const rank = currentCategoryResults.findIndex((item) => item.userId === user.id) + 1;
    const xpBonus = rank === 1 ? 150 : rank <= 3 ? 75 : 0;
    const xpGained = 50 + xpBonus;
    const newXp = (user.xp || 0) + xpGained;
    updateUser({ xp: newXp, level: Math.floor(newXp / 500) + 1, streak: (user.streak || 0) + 1 });

    if (rank === 1) {
      const userWins = Number(localStorage.getItem(`crosscity_wins_${user.id}`) || '0') + 1;
      localStorage.setItem(`crosscity_wins_${user.id}`, String(userWins));
    }

    if (activeDuel && submitToDuel) {
      const updatedDuels = duels.map((duel) => {
        if (duel.id !== activeDuel.id) return duel;
        return duel.challengerId === user.id
          ? { ...duel, challengerResult: resultValue }
          : { ...duel, opponentResult: resultValue };
      });
      localStorage.setItem('crosscity_duels', JSON.stringify(updatedDuels));
      setDuels(updatedDuels);
    }

    const feed = JSON.parse(localStorage.getItem('crosscity_feed') || '[]');
    feed.unshift({
      id: `post_${Date.now()}`,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      content: `Registrou ${resultValue} no ${dailyWod.name} (${categoryLabels[selectedCategory]}).`,
      wodName: `${dailyWod.name} • ${categoryLabels[selectedCategory]}`,
      time: scoreUnit === 'time' ? resultValue : `${resultValue} rounds`,
      reactions: { fire: 0, clap: 0, muscle: 0 },
      comments: 0,
      timestamp: Date.now(),
    });
    localStorage.setItem('crosscity_feed', JSON.stringify(feed));

    toast({ title: 'Resultado registrado!', description: `+${xpGained} XP e posição #${rank} na categoria.` });
    setResultValue('');
  };

  if (!dailyWod) {
    return <div>Carregando WOD do dia...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">WOD do Dia</h1>

      <Tabs value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as WodCategory)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="rx">RX</TabsTrigger>
          <TabsTrigger value="scaled">Scaled</TabsTrigger>
          <TabsTrigger value="beginner">Iniciante</TabsTrigger>
        </TabsList>

        {(Object.keys(categoryLabels) as WodCategory[]).map((category) => (
          <TabsContent key={category} value={category}>
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  {dailyWod.name} <Badge variant="secondary">{categoryLabels[category]}</Badge>
                </CardTitle>
                <CardDescription>{dailyWod.type} • {dailyWod.date}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>{dailyWod.versions[category].description}</p>
                <p className="text-sm text-muted-foreground">Carga referência: {dailyWod.versions[category].weight}</p>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Timer className="h-5 w-5" /> Registrar resultado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Tipo de score</Label>
              <div className="flex gap-2 mt-2">
                <Button variant={scoreUnit === 'time' ? 'default' : 'outline'} onClick={() => setScoreUnit('time')}>Tempo</Button>
                <Button variant={scoreUnit === 'rounds' ? 'default' : 'outline'} onClick={() => setScoreUnit('rounds')}>Rounds/Reps</Button>
              </div>
            </div>
            <div>
              <Label>{scoreUnit === 'time' ? 'Tempo (mm:ss)' : 'Rounds/Reps'}</Label>
              <Input value={resultValue} onChange={(e) => setResultValue(e.target.value)} placeholder={scoreUnit === 'time' ? '12:34' : '15'} />
            </div>
          </div>

          {activeDuel && (
            <div className="flex items-center justify-between p-3 border rounded-lg bg-secondary/10">
              <p className="text-sm">Há um duelo ativo nesta categoria. Submeter também no duelo?</p>
              <Switch checked={submitToDuel} onCheckedChange={setSubmitToDuel} />
            </div>
          )}

          <Button onClick={submitResult} className="w-full">Salvar resultado</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Leaderboard do Dia • {categoryLabels[selectedCategory]}</CardTitle>
          {userPosition && <CardDescription>Sua posição atual: #{userPosition}</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-3">
          {categoryRanking.length === 0 && <p className="text-muted-foreground">Ainda sem resultados nesta categoria.</p>}
          {categoryRanking.map((entry, index) => (
            <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <span className="font-bold w-6">#{index + 1}</span>
                <span className="text-xl">{entry.avatar}</span>
                <span className="font-medium">{entry.userName}</span>
              </div>
              <span className="font-bold text-primary">{entry.unit === 'time' ? entry.result : `${entry.result} rounds`}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default WOD;
