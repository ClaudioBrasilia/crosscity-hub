import { useState, useEffect, useMemo, useCallback } from 'react';
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
import * as db from '@/lib/supabaseData';

const Benchmarks = () => {
  const { user, getAllUsers } = useAuth();
  const { toast } = useToast();
  const [selectedExercise, setSelectedExercise] = useState(benchmarkExercises[0].id);
  const [value, setValue] = useState('');
  const [benchmarks, setBenchmarks] = useState<Record<string, number>>({});
  const [allBenchmarks, setAllBenchmarks] = useState<Array<{ userId: string; benchmarks: Record<string, number> }>>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [chartData, setChartData] = useState<Array<{ date: string; value: number }>>([]);

  const loadData = useCallback(async () => {
    if (!user) return;
    const [bm, allBm, users] = await Promise.all([
      db.getUserBenchmarks(user.id),
      db.getAllBenchmarks(),
      getAllUsers(),
    ]);
    setBenchmarks(bm);
    setAllBenchmarks(allBm);
    setAllUsers(users);
  }, [user, getAllUsers]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (!user) return;
    db.getBenchmarkHistory(user.id, selectedExercise).then(history => {
      if (history.length === 0 && benchmarks[selectedExercise]) {
        setChartData([{ date: 'Atual', value: benchmarks[selectedExercise] }]);
      } else {
        setChartData(history.map(h => ({ date: h.date.slice(5), value: h.value })));
      }
    });
  }, [user, selectedExercise, benchmarks]);

  const handleSave = async () => {
    if (!value || !user) return;
    try {
      await db.saveBenchmark(user.id, selectedExercise, Number(value));
      const bm = await db.getUserBenchmarks(user.id);
      setBenchmarks(bm);
      const allBm = await db.getAllBenchmarks();
      setAllBenchmarks(allBm);
      setValue('');
      toast({ title: 'PR salvo!', description: 'Seu benchmark foi atualizado.' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  const exercise = benchmarkExercises.find(e => e.id === selectedExercise);

  const overviewData = useMemo(() => {
    return benchmarkExercises.map(ex => ({
      name: ex.name.length > 10 ? ex.name.slice(0, 10) + '…' : ex.name,
      value: benchmarks[ex.id] || 0,
      unit: ex.unit,
    }));
  }, [benchmarks]);

  const ranking = useMemo(() => {
    return allUsers
      .map((u: any) => {
        const userBm = allBenchmarks.find(b => b.userId === u.id);
        return { ...u, value: userBm?.benchmarks?.[selectedExercise] || 0 };
      })
      .filter((u: any) => u.value > 0)
      .sort((a: any, b: any) => b.value - a.value);
  }, [allUsers, allBenchmarks, selectedExercise]);

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
        <CardHeader><CardTitle className="text-lg">Registrar PR</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={selectedExercise} onValueChange={setSelectedExercise}>
              <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {benchmarkExercises.map(ex => (
                  <SelectItem key={ex.id} value={ex.id}>{ex.name} ({ex.unit})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input type="number" placeholder={`Valor em ${exercise?.unit}`} value={value} onChange={e => setValue(e.target.value)} className="w-full sm:w-32" />
            <Button onClick={handleSave} className="gap-2"><Save className="h-4 w-4" /> Salvar</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-secondary" /> Visão Geral dos PRs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={overviewData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 20%)" />
                <XAxis dataKey="name" tick={{ fill: 'hsl(0 0% 60%)', fontSize: 11 }} angle={-30} textAnchor="end" height={60} />
                <YAxis tick={{ fill: 'hsl(0 0% 60%)', fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(0 0% 8%)', border: '1px solid hsl(0 0% 20%)', borderRadius: '8px', color: 'hsl(0 0% 95%)' }} />
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
                  <p className="text-lg font-bold text-primary">{benchmarks[ex.id] ? `${benchmarks[ex.id]} ${ex.unit}` : '—'}</p>
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
                <SelectTrigger className="w-full sm:w-64 mt-2"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {benchmarkExercises.map(ex => (
                    <SelectItem key={ex.id} value={ex.id}>{ex.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <p className="text-muted-foreground text-sm py-8 text-center">Nenhum registro ainda.</p>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 20%)" />
                      <XAxis dataKey="date" tick={{ fill: 'hsl(0 0% 60%)', fontSize: 12 }} />
                      <YAxis tick={{ fill: 'hsl(0 0% 60%)', fontSize: 12 }} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(0 0% 8%)', border: '1px solid hsl(0 0% 20%)', borderRadius: '8px', color: 'hsl(0 0% 95%)' }} />
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
                <Trophy className="h-5 w-5 text-secondary" /> Ranking — {exercise?.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {ranking.length === 0 && <p className="text-muted-foreground text-sm">Nenhum registro ainda.</p>}
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
