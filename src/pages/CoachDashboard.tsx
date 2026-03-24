import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Dumbbell, Flame, Users, Trash2, Plus, Save, ChevronRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import * as db from '@/lib/supabaseData';
import type { WodCategory, DailyWodVersion } from '@/lib/mockData';

interface WodFormData {
  id: string;
  date: string;
  title: string;
  type: string;
  warmup: string;
  skill: string;
  description: string;
  rxWeights: string;
  scaledWeights: string;
  beginnerWeights: string;
}

const createInitialWodData = (): WodFormData => ({
  id: '', date: new Date().toISOString().split('T')[0], title: '', type: 'AMRAP',
  warmup: '', skill: '', description: '', rxWeights: '', scaledWeights: '', beginnerWeights: '',
});

const formatDateInput = (date: Date) => date.toISOString().split('T')[0];

const getDefaultChallengeDates = (type: 'weekly' | 'monthly') => {
  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + (type === 'weekly' ? 7 : 30));
  return {
    startDate: formatDateInput(today),
    endDate: formatDateInput(endDate),
  };
};

const CoachDashboard = () => {
  const { user, getAllUsers } = useAuth();
  const { toast } = useToast();
  const [wodData, setWodData] = useState<WodFormData>(createInitialWodData());
  const [challenges, setChallenges] = useState<db.ChallengeData[]>([]);
  const [athletes, setAthletes] = useState<any[]>([]);
  const [selectedAthlete, setSelectedAthlete] = useState<any | null>(null);
  const [challengeProgress, setChallengeProgress] = useState<Record<string, number>>({});

  const [newChallenge, setNewChallenge] = useState(() => {
    const defaults = getDefaultChallengeDates('weekly');
    return {
    title: '', description: '', type: 'weekly' as 'weekly' | 'monthly',
    xpReward: 100, targetValue: 5, unit: 'treinos',
    startDate: defaults.startDate,
    endDate: defaults.endDate,
    };
  });

  const loadData = useCallback(async () => {
    const [challs, users] = await Promise.all([
      db.getActiveChallenges(),
      getAllUsers(),
    ]);
    setChallenges(challs);
    setAthletes(users.filter(u => u.role === 'athlete'));

    // Load existing WOD
    const wod = await db.getLatestWod();
    if (wod) {
      setWodData({
        id: wod.id,
        date: wod.date,
        title: wod.name,
        type: wod.type,
        warmup: wod.warmup || '',
        skill: wod.skill || '',
        description: wod.versions?.rx?.description || '',
        rxWeights: wod.versions?.rx?.weight || '',
        scaledWeights: wod.versions?.scaled?.weight || '',
        beginnerWeights: wod.versions?.beginner?.weight || '',
      });
    }
  }, [getAllUsers]);

  useEffect(() => { loadData(); }, [loadData]);

  // Load progress for selected athlete
  useEffect(() => {
    if (!selectedAthlete) return;
    const loadProgress = async () => {
      const progress: Record<string, number> = {};
      for (const c of challenges) {
        progress[c.id] = await db.getChallengeProgress(c.id, selectedAthlete.id);
      }
      setChallengeProgress(progress);
    };
    loadProgress();
  }, [selectedAthlete, challenges]);

  if (user?.role !== 'coach' && user?.role !== 'admin') return <Navigate to="/" />;

  const handleSaveWod = async () => {
    try {
      const wodToSave: db.WodData = {
        id: wodData.id || `wod_${Date.now()}`,
        date: wodData.date,
        name: wodData.title,
        type: wodData.type,
        warmup: wodData.warmup.trim(),
        skill: wodData.skill.trim(),
        versions: {
          rx: { description: wodData.description, weight: wodData.rxWeights },
          scaled: { description: wodData.description, weight: wodData.scaledWeights },
          beginner: { description: wodData.description, weight: wodData.beginnerWeights },
        },
      };
      await db.saveWod(wodToSave, user?.id);
      setWodData(prev => ({ ...prev, id: wodToSave.id }));
      toast({ title: 'WOD salvo!', description: 'O WOD do dia foi atualizado.' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  const handleCreateChallenge = async () => {
    if (!newChallenge.title || !newChallenge.description) {
      toast({ title: 'Erro', description: 'Preencha todos os campos.', variant: 'destructive' });
      return;
    }
    if (!newChallenge.startDate || !newChallenge.endDate) {
      toast({ title: 'Erro', description: 'Preencha data de início e data de fim.', variant: 'destructive' });
      return;
    }
    if (newChallenge.endDate < newChallenge.startDate) {
      toast({ title: 'Erro', description: 'A data de fim não pode ser menor que a data de início.', variant: 'destructive' });
      return;
    }

    try {
      await db.addChallenge({
        name: newChallenge.title,
        description: newChallenge.description,
        icon: '🔥',
        type: newChallenge.type,
        xpReward: newChallenge.xpReward || 100,
        target: newChallenge.targetValue || 5,
        unit: newChallenge.unit || 'treinos',
        startDate: newChallenge.startDate || null,
        endDate: newChallenge.endDate || null,
      }, user?.id);
      toast({ title: 'Desafio criado!' });
      const defaults = getDefaultChallengeDates('weekly');
      setNewChallenge({
        title: '',
        description: '',
        type: 'weekly',
        xpReward: 100,
        targetValue: 5,
        unit: 'treinos',
        startDate: defaults.startDate,
        endDate: defaults.endDate,
      });
      loadData();
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  const handleDeleteChallenge = async (id: string) => {
    try {
      await db.removeChallenge(id);
      toast({ title: 'Desafio removido' });
      loadData();
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Painel do Coach</h1>
        <p className="text-muted-foreground">Gerencie WODs, desafios e acompanhe seus atletas</p>
      </div>

      <Tabs defaultValue="wod" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="wod" className="flex items-center gap-2"><Dumbbell className="h-4 w-4" /> WOD</TabsTrigger>
          <TabsTrigger value="challenges" className="flex items-center gap-2"><Flame className="h-4 w-4" /> Desafios</TabsTrigger>
          <TabsTrigger value="athletes" className="flex items-center gap-2"><Users className="h-4 w-4" /> Atletas</TabsTrigger>
        </TabsList>

        <TabsContent value="wod" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>WOD do Dia</CardTitle>
              <CardDescription>Configure o treino de hoje para todos os atletas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input type="date" value={wodData.date} onChange={e => setWodData({ ...wodData, date: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={wodData.type} onValueChange={value => setWodData({ ...wodData, type: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AMRAP">AMRAP</SelectItem>
                      <SelectItem value="For Time">For Time</SelectItem>
                      <SelectItem value="EMOM">EMOM</SelectItem>
                      <SelectItem value="Chipper">Chipper</SelectItem>
                      <SelectItem value="Hero WOD">Hero WOD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Título</Label>
                <Input placeholder="Nome do WOD" value={wodData.title} onChange={e => setWodData({ ...wodData, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Warm-up</Label>
                <Textarea placeholder="Aquecimento..." rows={3} value={wodData.warmup} onChange={e => setWodData({ ...wodData, warmup: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Skill</Label>
                <Textarea placeholder="Parte técnica..." rows={3} value={wodData.skill} onChange={e => setWodData({ ...wodData, skill: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Descrição / Movimentos</Label>
                <Textarea placeholder="Movimentos e repetições..." rows={4} value={wodData.description} onChange={e => setWodData({ ...wodData, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Cargas RX</Label>
                  <Input placeholder="Ex: 60kg" value={wodData.rxWeights} onChange={e => setWodData({ ...wodData, rxWeights: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Cargas Scaled</Label>
                  <Input placeholder="Ex: 40kg" value={wodData.scaledWeights} onChange={e => setWodData({ ...wodData, scaledWeights: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Cargas Iniciante</Label>
                  <Input placeholder="Ex: Barra vazia" value={wodData.beginnerWeights} onChange={e => setWodData({ ...wodData, beginnerWeights: e.target.value })} />
                </div>
              </div>
              <Button onClick={handleSaveWod} className="w-full"><Save className="h-4 w-4 mr-2" /> Salvar WOD</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="challenges" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Criar Novo Desafio</CardTitle>
              <CardDescription>Crie desafios semanais ou mensais</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input placeholder="Nome do desafio" value={newChallenge.title} onChange={e => setNewChallenge({ ...newChallenge, title: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={newChallenge.type} onValueChange={(value: 'weekly' | 'monthly') => {
                    const defaults = getDefaultChallengeDates(value);
                    setNewChallenge({ ...newChallenge, type: value, startDate: defaults.startDate, endDate: defaults.endDate });
                  }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea placeholder="Descreva o desafio..." value={newChallenge.description} onChange={e => setNewChallenge({ ...newChallenge, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data de início</Label>
                  <Input type="date" value={newChallenge.startDate} onChange={e => setNewChallenge({ ...newChallenge, startDate: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Data de fim</Label>
                  <Input type="date" value={newChallenge.endDate} min={newChallenge.startDate} onChange={e => setNewChallenge({ ...newChallenge, endDate: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2"><Label>Meta</Label><Input type="number" value={newChallenge.targetValue} onChange={e => setNewChallenge({ ...newChallenge, targetValue: parseInt(e.target.value) })} /></div>
                <div className="space-y-2"><Label>Unidade</Label><Input placeholder="treinos, km" value={newChallenge.unit} onChange={e => setNewChallenge({ ...newChallenge, unit: e.target.value })} /></div>
                <div className="space-y-2"><Label>XP Recompensa</Label><Input type="number" value={newChallenge.xpReward} onChange={e => setNewChallenge({ ...newChallenge, xpReward: parseInt(e.target.value) })} /></div>
              </div>
              <Button onClick={handleCreateChallenge} className="w-full"><Plus className="h-4 w-4 mr-2" /> Criar Desafio</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Desafios Ativos</CardTitle></CardHeader>
            <CardContent>
              {challenges.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">Nenhum desafio ativo</p>
              ) : (
                <div className="space-y-3">
                  {challenges.map(challenge => (
                    <div key={challenge.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{challenge.name}</span>
                          <Badge variant={challenge.type === 'weekly' ? 'default' : 'secondary'}>
                            {challenge.type === 'weekly' ? 'Semanal' : 'Mensal'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">Meta: {challenge.target} {challenge.unit} • {challenge.xpReward} XP</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteChallenge(challenge.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="athletes" className="space-y-4 mt-4">
          {!selectedAthlete ? (
            <Card>
              <CardHeader>
                <CardTitle>Atletas do Box</CardTitle>
                <CardDescription>Clique em um atleta para ver o progresso</CardDescription>
              </CardHeader>
              <CardContent>
                {athletes.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">Nenhum atleta cadastrado</p>
                ) : (
                  <div className="space-y-3">
                    {athletes.map(athlete => (
                      <div key={athlete.id} onClick={() => setSelectedAthlete(athlete)} className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{athlete.avatar || '👤'}</span>
                          <div>
                            <p className="font-medium">{athlete.name}</p>
                            <p className="text-sm text-muted-foreground">Nível {athlete.level || 1} • {athlete.xp || 0} XP</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{athlete.category === 'rx' ? 'RX' : athlete.category === 'scaled' ? 'Scaled' : 'Iniciante'}</Badge>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <Button variant="ghost" size="sm" onClick={() => setSelectedAthlete(null)}>← Voltar</Button>
              <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                  <span className="text-4xl">{selectedAthlete.avatar}</span>
                  <div>
                    <CardTitle>{selectedAthlete.name}</CardTitle>
                    <CardDescription>Progresso nos Desafios Ativos</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {challenges.length === 0 ? (
                    <p className="text-muted-foreground text-center">Nenhum desafio ativo.</p>
                  ) : (
                    challenges.map(challenge => {
                      const progress = challengeProgress[challenge.id] || 0;
                      const pct = Math.min((progress / challenge.target) * 100, 100);
                      return (
                        <div key={challenge.id} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{challenge.name}</span>
                            <span className="text-muted-foreground">{progress} / {challenge.target} {challenge.unit}</span>
                          </div>
                          <Progress value={pct} className="h-2" />
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CoachDashboard;
