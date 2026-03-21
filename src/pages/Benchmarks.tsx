import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { benchmarkExercises } from '@/lib/battleSimulator';
import { BarChart3, Save, Trophy, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { getStoredUsers, safeParse } from '@/lib/realUsers';

const Benchmarks = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedExercise, setSelectedExercise] = useState(benchmarkExercises[0].id);
  const [value, setValue] = useState('');
  const [benchmarks, setBenchmarks] = useState<Record<string, number>>({});
  const [allBenchmarks, setAllBenchmarks] = useState<any[]>([]);

  useEffect(() => {
    const stored = safeParse<Record<string, Record<string, number>>>(localStorage.getItem('crosscity_benchmarks'), {});
    setBenchmarks(stored[user?.id || ''] || {});
    setAllBenchmarks(Object.entries(stored).map(([userId, bm]) => ({ userId, benchmarks: bm })));
  }, [user]);

  const handleSave = () => {
    if (!value || !user) return;
    const stored = safeParse<Record<string, Record<string, number>>>(localStorage.getItem('crosscity_benchmarks'), {});
    if (!stored[user.id]) stored[user.id] = {};
    stored[user.id][selectedExercise] = Number(value);

    // Save history for charts
    const history = safeParse<Record<string, Record<string, Array<{ value: number; date: string }>>>>(localStorage.getItem('crosscity_benchmark_history'), {});
    if (!history[user.id]) history[user.id] = {};
    if (!history[user.id][selectedExercise]) history[user.id][selectedExercise] = [];
    history[user.id][selectedExercise].push({
      value: Number(value),
      date: new Date().toISOString().split('T')[0],
    });
    localStorage.setItem('crosscity_benchmark_history', JSON.stringify(history));

    localStorage.setItem('crosscity_benchmarks', JSON.stringify(stored));
    setBenchmarks(stored[user.id]);
    setAllBenchmarks(Object.entries(stored).map(([userId, bm]) => ({ userId, benchmarks: bm })));
    setValue('');
    toast({ title: 'PR salvo!', description: 'Seu benchmark foi atualizado.' });
  };

  const exercise = benchmarkExercises.find(e => e.id === selectedExercise);

  // Chart data for selected exercise history
  const chartData = useMemo(() => {
    if (!user) return [];
    const history = safeParse<Record<string, Record<string, Array<{ value: number; date: string }>>>>(localStorage.getItem('crosscity_benchmark_history'), {});
    const userHistory = history[user.id]?.[selectedExercise] || [];
    // If no history, use current value as single point
    if (userHistory.length === 0 && benchmarks[selectedExercise]) {
      return [{ date: 'Atual', value: benchmarks[selectedExercise] }];
    }
    return userHistory.map((h: any) => ({
      date: h.date.slice(5), // MM-DD
      value: h.value,
    }));
  }, [user, selectedExercise, benchmarks]);

  // Overview bar chart - all PRs
  const overviewData = useMemo(() => {
    return benchmarkExercises.map(ex => ({
      name: ex.name.length > 10 ? ex.name.slice(0, 10) + '…' : ex.name,
      value: benchmarks[ex.id] || 0,
      unit: ex.unit,
    }));
  }, [benchmarks]);

  const users = getStoredUsers();
  const ranking = users
    .map((u: any) => {
      const userBm = allBenchmarks.find(b => b.userId === u.id);
      return { ...u, value: (userBm?.benchmarks as any)?.[selectedExercise] || 0 };
    })
    .filter((u: any) => u.value > 0)
    .sort((a: any, b: any) => b.value - a.value);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Benchmarks</h1>
          <p className="text-muted-foreground">Registre seus PRs e acompanhe sua evolução</p>
        </div>
      </div>

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg">Registrar PR</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={selectedExercise} onValueChange={setSelectedExercise}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {benchmarkExercises.map(ex => (
                  <SelectItem key={ex.id} value={ex.id}>
                    {ex.name} ({ex.unit})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="number"
              placeholder={`Valor em ${exercise?.unit}`}
              value={value}
              onChange={e => setValue(e.target.value)}
              className="w-full sm:w-32"
            />
            <Button onClick={handleSave} className="gap-2">
              <Save className="h-4 w-4" /> Salvar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Overview Chart */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-secondary" />
            Visão Geral dos PRs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={overviewData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 20%)" />
                <XAxis dataKey="name" tick={{ fill: 'hsl(0 0% 60%)', fontSize: 11 }} angle={-30} textAnchor="end" height={60} />
                <YAxis tick={{ fill: 'hsl(0 0% 60%)', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(0 0% 8%)', border: '1px solid hsl(0 0% 20%)', borderRadius: '8px', color: 'hsl(0 0% 95%)' }}
                />
                <Bar dataKey="value" fill="hsl(217 91% 60%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="prs" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="prs">Meus PRs</TabsTrigger>
          <TabsTrigger value="evolution">Evolução</TabsTrigger>
          <TabsTrigger value="ranking">Ranking</TabsTrigger>
        </TabsList>

        <TabsContent value="prs">
          <Card className="border-primary/20">
            <CardContent className="pt-6 space-y-3">
              {benchmarkExercises.map(ex => (
                <div key={ex.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-semibold text-sm">{ex.name}</p>
                    <p className="text-xs text-muted-foreground">{ex.category}</p>
                  </div>
                  <p className="text-lg font-bold text-primary">
                    {benchmarks[ex.id] ? `${benchmarks[ex.id]} ${ex.unit}` : '—'}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evolution">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg">Evolução — {exercise?.name}</CardTitle>
              <Select value={selectedExercise} onValueChange={setSelectedExercise}>
                <SelectTrigger className="w-full sm:w-64 mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {benchmarkExercises.map(ex => (
                    <SelectItem key={ex.id} value={ex.id}>{ex.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <p className="text-muted-foreground text-sm py-8 text-center">Nenhum registro ainda. Salve um PR para ver o gráfico.</p>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 20%)" />
                      <XAxis dataKey="date" tick={{ fill: 'hsl(0 0% 60%)', fontSize: 12 }} />
                      <YAxis tick={{ fill: 'hsl(0 0% 60%)', fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(0 0% 8%)', border: '1px solid hsl(0 0% 20%)', borderRadius: '8px', color: 'hsl(0 0% 95%)' }}
                      />
                      <Line type="monotone" dataKey="value" stroke="hsl(199 89% 48%)" strokeWidth={3} dot={{ r: 5, fill: 'hsl(199 89% 48%)' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ranking">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="h-5 w-5 text-secondary" />
                Ranking — {exercise?.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {ranking.length === 0 && (
                <p className="text-muted-foreground text-sm">Nenhum registro ainda.</p>
              )}
              {ranking.map((r: any, i: number) => (
                <div key={r.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold text-muted-foreground w-6">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                    </span>
                    <span className="text-xl">{r.avatar}</span>
                    <p className="font-semibold text-sm">{r.name}</p>
                  </div>
                  <p className="font-bold text-primary">{r.value} {exercise?.unit}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Benchmarks;
