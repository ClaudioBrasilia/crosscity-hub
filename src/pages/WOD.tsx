import { useEffect, useMemo, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Timer, Flame, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDurationInput, getDurationValidationError, toDurationSeconds } from '@/lib/timeScore';
import type { WodCategory, WodScoreUnit } from '@/lib/mockData';
import * as db from '@/lib/supabaseData';
import { supabase } from '@/integrations/supabase/client';

const categoryLabels: Record<WodCategory, string> = {
  rx: 'RX', scaled: 'Scaled', beginner: 'Iniciante',
};

const toTimeValue = (value: string) => toDurationSeconds(value);
const toRoundsValue = (value: string) => { const n = Number(value); return Number.isNaN(n) ? 0 : n; };

const WOD = () => {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [dailyWod, setDailyWod] = useState<db.WodData | null>(null);
  const [hasLoadedWod, setHasLoadedWod] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<WodCategory>('rx');
  const [scoreUnit, setScoreUnit] = useState<WodScoreUnit>('time');
  const [resultValue, setResultValue] = useState('');
  const [results, setResults] = useState<db.WodResult[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchResults = useCallback(async (wodId: string) => {
    const res = await db.getWodResults(wodId);
    setResults(res);
    return res;
  }, []);

  const loadData = useCallback(async () => {
    const wod = await db.getLatestWod();
    setDailyWod(wod);
    if (wod) {
      await fetchResults(wod.id);
    }
    setHasLoadedWod(true);
  }, [fetchResults]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (!dailyWod?.id) return;

    const channel = supabase
      .channel(`wod-results-${dailyWod.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'wod_results', filter: `wod_id=eq.${dailyWod.id}` },
        async () => {
          await fetchResults(dailyWod.id);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dailyWod?.id, fetchResults]);

  const categoryRanking = useMemo(() => {
    if (!dailyWod) return [];
    const entries = results.filter(item => item.wodId === dailyWod.id && item.category === selectedCategory);
    return [...entries].sort((a, b) => {
      if (a.unit === 'time' && b.unit === 'time') return toTimeValue(a.result) - toTimeValue(b.result);
      if (a.unit === 'rounds' && b.unit === 'rounds') return toRoundsValue(b.result) - toRoundsValue(a.result);
      return a.submittedAt - b.submittedAt;
    });
  }, [dailyWod, results, selectedCategory]);

  const userEntry = categoryRanking.find(item => item.userId === user?.id);
  const userPosition = userEntry ? categoryRanking.findIndex(item => item.id === userEntry.id) + 1 : null;

  const existingResult = useMemo(() => {
    if (!dailyWod || !user) return null;
    return results.find(r => r.wodId === dailyWod.id && r.userId === user.id && r.category === selectedCategory) || null;
  }, [dailyWod, results, user, selectedCategory]);

  useEffect(() => {
    if (existingResult) {
      setResultValue(existingResult.result);
      setScoreUnit(existingResult.unit as WodScoreUnit);
    } else {
      setResultValue('');
    }
  }, [existingResult, selectedCategory]);

  const submitResult = async () => {
    if (isSubmitting || !dailyWod || !user || !resultValue.trim()) {
      toast({ title: 'Resultado inválido', description: 'Preencha seu resultado.', variant: 'destructive' });
      return;
    }
    if (scoreUnit === 'time') {
      const timeError = getDurationValidationError(resultValue);
      if (timeError) { toast({ title: 'Tempo inválido', description: timeError, variant: 'destructive' }); return; }
    }

    setIsSubmitting(true);
    try {
      const isEdit = !!existingResult;
      const resultId = existingResult?.id || `res_${Date.now()}`;

      await db.saveWodResult({
        id: resultId,
        wodId: dailyWod.id,
        userId: user.id,
        category: selectedCategory,
        result: resultValue,
        unit: scoreUnit,
      });

      // Reload results
      const updatedResults = await fetchResults(dailyWod.id);

      const currentCategoryResults = updatedResults
        .filter(item => item.wodId === dailyWod.id && item.category === selectedCategory)
        .sort((a, b) => scoreUnit === 'time' ? toTimeValue(a.result) - toTimeValue(b.result) : toRoundsValue(b.result) - toRoundsValue(a.result));
      const rank = currentCategoryResults.findIndex(item => item.userId === user.id) + 1;

      if (!isEdit) {
        const xpBonus = rank === 1 ? 150 : rank <= 3 ? 75 : 0;
        const xpGained = 50 + xpBonus;
        const newXp = (user.xp || 0) + xpGained;
        await updateUser({ xp: newXp, level: Math.floor(newXp / 500) + 1, streak: (user.streak || 0) + 1 });

        // Create feed post
        await db.createFeedPost({
          id: `post_${Date.now()}`,
          userId: user.id,
          content: `Registrou ${resultValue} no ${dailyWod.name} (${categoryLabels[selectedCategory]}).`,
          wodName: `${dailyWod.name} • ${categoryLabels[selectedCategory]}`,
          timeDisplay: scoreUnit === 'time' ? resultValue : `${resultValue} rounds`,
        });
      }

      toast({
        title: isEdit ? 'Resultado atualizado!' : 'Resultado registrado!',
        description: isEdit ? `Posição #${rank} na categoria.` : `+${50 + (rank === 1 ? 150 : rank <= 3 ? 75 : 0)} XP e posição #${rank}.`,
      });
      if (!isEdit) setResultValue('');
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message || 'Falha ao salvar resultado.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!hasLoadedWod) return <div>Carregando WOD do dia...</div>;
  if (!dailyWod) return <div>Nenhum WOD do dia cadastrado.</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">WOD do Dia</h1>

      {/* Warm-up */}
      {dailyWod.warmup && (
        <Card className="border-orange-500/20 bg-orange-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Flame className="h-5 w-5 text-orange-400" />
              Warm-up
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line text-muted-foreground">{dailyWod.warmup}</p>
          </CardContent>
        </Card>
      )}

      {/* Skill */}
      {dailyWod.skill && (
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-blue-400" />
              Skill
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line text-muted-foreground">{dailyWod.skill}</p>
          </CardContent>
        </Card>
      )}

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
                <p>{dailyWod.versions[category]?.description}</p>
                <p className="text-sm text-muted-foreground">Carga referência: {dailyWod.versions[category]?.weight}</p>
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
