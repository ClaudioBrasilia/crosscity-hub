import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { benchmarkExercises } from '@/lib/battleSimulator';
import { BarChart3, Save, Trophy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Benchmarks = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedExercise, setSelectedExercise] = useState(benchmarkExercises[0].id);
  const [value, setValue] = useState('');
  const [benchmarks, setBenchmarks] = useState<Record<string, number>>({});
  const [allBenchmarks, setAllBenchmarks] = useState<any[]>([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('crosscity_benchmarks') || '{}');
    setBenchmarks(stored[user?.id || ''] || {});
    setAllBenchmarks(Object.entries(stored).map(([userId, bm]) => ({ userId, benchmarks: bm })));
  }, [user]);

  const handleSave = () => {
    if (!value || !user) return;
    const stored = JSON.parse(localStorage.getItem('crosscity_benchmarks') || '{}');
    if (!stored[user.id]) stored[user.id] = {};
    stored[user.id][selectedExercise] = Number(value);
    localStorage.setItem('crosscity_benchmarks', JSON.stringify(stored));
    setBenchmarks(stored[user.id]);
    setAllBenchmarks(Object.entries(stored).map(([userId, bm]) => ({ userId, benchmarks: bm })));
    setValue('');
    toast({ title: 'PR salvo!', description: 'Seu benchmark foi atualizado.' });
  };

  const exercise = benchmarkExercises.find(e => e.id === selectedExercise);

  // Get ranking for selected exercise
  const users = JSON.parse(localStorage.getItem('crosscity_users') || '[]');
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

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">Meus PRs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
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
      </div>
    </div>
  );
};

export default Benchmarks;
