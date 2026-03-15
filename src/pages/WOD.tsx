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
import { generateDominationEnergyForActivity } from '@/lib/clanSystem';
import { formatDurationInput, getDurationValidationError, toDurationSeconds } from '@/lib/timeScore';
import type { DailyWod, DailyWodResult, Duel, WodCategory, WodScoreUnit } from '@/lib/mockData';

const categoryLabels: Record<WodCategory, string> = {
  rx: 'RX',
  scaled: 'Scaled',
  beginner: 'Iniciante',
};

const getResultCategory = (result: DailyWodResult): WodCategory => result.category || 'beginner';

const toTimeValue = (value: string) => toDurationSeconds(value);

const toRoundsValue = (value: string) => {
  const n = Number(value);
  return Number.isNaN(n) ? 0 : n;
};

const formatTimeInput = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (!digits) return '';

  if (digits.length <= 2) {
    return `0:${digits.padStart(2, '0')}`;
  }

  const minutes = digits.slice(0, -2).replace(/^0+(?=\d)/, '');
  const seconds = digits.slice(-2);
  return `${minutes || '0'}:${seconds}`;
};

const getTimeValidationError = (value: string) => {
  const trimmedValue = value.trim();

  if (!trimmedValue) return 'Preencha seu tempo para registrar.';
  if (!/^\d+:[0-5]\d$/.test(trimmedValue)) {
    return 'Tempo inválido. Use o formato m:ss ou mm:ss com segundos entre 00 e 59.';
  }

  return null;
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setDailyWod(JSON.parse(localStorage.getItem('crosscity_daily_wod') || 'null'));
    setResults(JSON.parse(localStorage.getItem('crosscity_wod_results') || '[]'));
    setDuels(JSON.parse(localStorage.getItem('crosscity_duels') || '[]'));

    // Listen for storage changes (updates from other tabs/windows)
    const handleStorageChange = () => {
      setResults(JSON.parse(localStorage.getItem('crosscity_wod_results') || '[]'));
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const activeDuel = useMemo(() => {
    if (!dailyWod || !user) return null;
    return duels.find(
      (duel) =>
        duel.wodId === dailyWod.id &&
        duel.category === selectedCategory &&
        duel.status === 'active' &&
        (duel.challengerId === user.id || duel.opponentIds.includes(user.id))
    );
  }, [dailyWod, duels, selectedCategory, user, results]);

  const categoryRanking = useMemo(() => {
    if (!dailyWod) return [];
    const entries = results.filter((item) => item.wodId === dailyWod.id && getResultCategory(item) === selectedCategory);
    const sorted = [...entries].sort((a, b) => {
      if (a.unit === 'time' && b.unit === 'time') return toTimeValue(a.result) - toTimeValue(b.result);
      if (a.unit === 'rounds' && b.unit === 'rounds') return toRoundsValue(b.result) - toRoundsValue(a.result);
      return a.submittedAt - b.submittedAt;
    });
    return sorted;
  }, [dailyWod, results, selectedCategory, user]);

  const userEntry = categoryRanking.find((item) => item.userId === user?.id);
  const userPosition = userEntry ? categoryRanking.findIndex((item) => item.id === userEntry.id) + 1 : null;

  // Check if user already submitted for this WOD in the selected category
  const existingResult = useMemo(() => {
    if (!dailyWod || !user) return null;
    return results.find((r) => r.wodId === dailyWod.id && r.userId === user.id && getResultCategory(r) === selectedCategory) || null;
  }, [dailyWod, results, user, selectedCategory, selectedCategory]);

  // Pre-fill form when existing result is found for the selected category
  useEffect(() => {
    if (existingResult) {
      setResultValue(existingResult.result);
      setScoreUnit(existingResult.unit);
    } else {
      // Clear form if no result for this category
      setResultValue('');
    }
  }, [existingResult, selectedCategory]);

  const submitResult = () => {
    if (isSubmitting) return;

    if (!dailyWod || !user || !resultValue.trim()) {
      toast({ title: 'Resultado inválido', description: 'Preencha seu resultado para registrar.', variant: 'destructive' });
      return;
    }

    if (scoreUnit === 'time') {
      const timeError = getDurationValidationError(resultValue);
      if (timeError) {
        toast({ title: 'Tempo inválido', description: timeError, variant: 'destructive' });
        return;
      }
    }

    setIsSubmitting(true);

    const existing = results.find((item) => item.wodId === dailyWod.id && item.userId === user.id);
    const isEdit = !!existing;

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
    // Force a re-render to update the ranking immediately
    window.dispatchEvent(new Event('storage'));

    const currentCategoryResults = updatedResults
      .filter((item) => item.wodId === dailyWod.id && getResultCategory(item) === selectedCategory)
      .sort((a, b) => {
        if (scoreUnit === 'time') return toTimeValue(a.result) - toTimeValue(b.result);
        return toRoundsValue(b.result) - toRoundsValue(a.result);
      });

    const rank = currentCategoryResults.findIndex((item) => item.userId === user.id) + 1;

    if (!isEdit) {
      const xpBonus = rank === 1 ? 150 : rank <= 3 ? 75 : 0;
      const xpGained = 50 + xpBonus;
      const newXp = (user.xp || 0) + xpGained;
      updateUser({ xp: newXp, level: Math.floor(newXp / 500) + 1, streak: (user.streak || 0) + 1 });

      if (rank === 1) {
        const userWins = Number(localStorage.getItem(`crosscity_wins_${user.id}`) || '0') + 1;
        localStorage.setItem(`crosscity_wins_${user.id}`, String(userWins));
      }
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
      // Force a re-render
      window.dispatchEvent(new Event('storage'));
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
    // Force a re-render
    window.dispatchEvent(new Event('storage'));

    const energyResult = generateDominationEnergyForActivity({
      userId: user.id,
      activityId: dailyWod.id,
      activityType: 'wod',
      energy: 20,
      participationValid: true,
    });

    const successDescription = isEdit
      ? `Posição #${rank} na categoria.`
      : `+${50 + (rank === 1 ? 150 : rank <= 3 ? 75 : 0)} XP e posição #${rank} na categoria.`;

    const energyDescription = energyResult.ok
      ? ' Energia gerada automaticamente.'
      : energyResult.status === 409
        ? ' Energia já havia sido gerada.'
        : '';

    toast({ title: isEdit ? 'Resultado atualizado!' : 'Resultado registrado!', description: `${successDescription}${energyDescription}` });
    if (!isEdit) setResultValue('');
    // Reload results from storage to ensure UI updates
    setTimeout(() => {
      setResults(JSON.parse(localStorage.getItem('crosscity_wod_results') || '[]'));
    }, 100);
    setIsSubmitting(false);
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
              <Input
                value={resultValue}
                onChange={(e) => setResultValue(scoreUnit === 'time' ? formatDurationInput(e.target.value) : e.target.value)}
                placeholder={scoreUnit === 'time' ? '12:34' : '15'}
                inputMode={scoreUnit === 'time' ? 'numeric' : 'text'}
              />
            </div>
          </div>

          {activeDuel && (
            <div className="flex items-center justify-between p-3 border rounded-lg bg-secondary/10">
              <p className="text-sm">Há um duelo ativo nesta categoria. Submeter também no duelo?</p>
              <Switch checked={submitToDuel} onCheckedChange={setSubmitToDuel} />
            </div>
          )}

          <Button onClick={submitResult} className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : existingResult ? 'Atualizar resultado' : 'Salvar resultado'}
          </Button>
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
