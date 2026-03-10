import { useState, useEffect } from 'react';
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
import { Dumbbell, Flame, Users, Trash2, Plus, Save } from 'lucide-react';

interface WodData {
  id: string;
  date: string;
  title: string;
  type: string;
  description: string;
  rxWeights: string;
  scaledWeights: string;
  beginnerWeights: string;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'weekly' | 'monthly';
  xpReward: number;
  targetValue: number;
  unit: string;
  startDate: string;
  endDate: string;
}

const CoachDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [wodData, setWodData] = useState<WodData>({
    id: '',
    date: new Date().toISOString().split('T')[0],
    title: '',
    type: 'AMRAP',
    description: '',
    rxWeights: '',
    scaledWeights: '',
    beginnerWeights: '',
  });

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [newChallenge, setNewChallenge] = useState<Partial<Challenge>>({
    title: '',
    description: '',
    type: 'weekly',
    xpReward: 100,
    targetValue: 5,
    unit: 'treinos',
  });

  const [athletes, setAthletes] = useState<any[]>([]);

  useEffect(() => {
    // Load existing challenges
    const storedChallenges = localStorage.getItem('crosscity_challenges');
    if (storedChallenges) {
      setChallenges(JSON.parse(storedChallenges));
    }

    // Load athletes
    const usersData = localStorage.getItem('crosscity_users') || '[]';
    const users = JSON.parse(usersData);
    setAthletes(users.filter((u: any) => u.role === 'athlete'));

    // Load existing WOD
    const storedWod = localStorage.getItem('crosscity_daily_wod');
    if (storedWod) {
      setWodData(JSON.parse(storedWod));
    }
  }, []);

  // Redirect if not a coach or admin
  if (user?.role !== 'coach' && user?.role !== 'admin') {
    return <Navigate to="/" />;
  }

  const handleSaveWod = () => {
    const wodToSave = {
      ...wodData,
      id: wodData.id || `wod_${Date.now()}`,
    };
    localStorage.setItem('crosscity_daily_wod', JSON.stringify(wodToSave));
    setWodData(wodToSave);
    toast({
      title: 'WOD salvo!',
      description: 'O WOD do dia foi atualizado com sucesso.',
    });
  };

  const handleCreateChallenge = () => {
    if (!newChallenge.title || !newChallenge.description) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    const today = new Date();
    const endDate = new Date();
    endDate.setDate(today.getDate() + (newChallenge.type === 'weekly' ? 7 : 30));

    const challenge: Challenge = {
      id: `challenge_${Date.now()}`,
      title: newChallenge.title!,
      description: newChallenge.description!,
      type: newChallenge.type as 'weekly' | 'monthly',
      xpReward: newChallenge.xpReward || 100,
      targetValue: newChallenge.targetValue || 5,
      unit: newChallenge.unit || 'treinos',
      startDate: today.toISOString(),
      endDate: endDate.toISOString(),
    };

    const updatedChallenges = [...challenges, challenge];
    setChallenges(updatedChallenges);
    localStorage.setItem('crosscity_challenges', JSON.stringify(updatedChallenges));

    setNewChallenge({
      title: '',
      description: '',
      type: 'weekly',
      xpReward: 100,
      targetValue: 5,
      unit: 'treinos',
    });

    toast({
      title: 'Desafio criado!',
      description: `O desafio "${challenge.title}" foi criado com sucesso.`,
    });
  };

  const handleDeleteChallenge = (id: string) => {
    const updatedChallenges = challenges.filter((c) => c.id !== id);
    setChallenges(updatedChallenges);
    localStorage.setItem('crosscity_challenges', JSON.stringify(updatedChallenges));
    toast({
      title: 'Desafio removido',
      description: 'O desafio foi excluído com sucesso.',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Painel do Coach</h1>
        <p className="text-muted-foreground">Gerencie WODs, desafios e acompanhe seus atletas</p>
      </div>

      <Tabs defaultValue="wod" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="wod" className="flex items-center gap-2">
            <Dumbbell className="h-4 w-4" />
            WOD
          </TabsTrigger>
          <TabsTrigger value="challenges" className="flex items-center gap-2">
            <Flame className="h-4 w-4" />
            Desafios
          </TabsTrigger>
          <TabsTrigger value="athletes" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Atletas
          </TabsTrigger>
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
                  <Input
                    type="date"
                    value={wodData.date}
                    onChange={(e) => setWodData({ ...wodData, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={wodData.type}
                    onValueChange={(value) => setWodData({ ...wodData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
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
                <Input
                  placeholder="Nome do WOD (ex: Fran, Murph...)"
                  value={wodData.title}
                  onChange={(e) => setWodData({ ...wodData, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Descrição / Movimentos</Label>
                <Textarea
                  placeholder="Descreva os movimentos e repetições..."
                  rows={4}
                  value={wodData.description}
                  onChange={(e) => setWodData({ ...wodData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Cargas RX</Label>
                  <Input
                    placeholder="Ex: 60kg Clean, 40kg Thruster"
                    value={wodData.rxWeights}
                    onChange={(e) => setWodData({ ...wodData, rxWeights: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cargas Scaled</Label>
                  <Input
                    placeholder="Ex: 40kg Clean, 25kg Thruster"
                    value={wodData.scaledWeights}
                    onChange={(e) => setWodData({ ...wodData, scaledWeights: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cargas Iniciante</Label>
                  <Input
                    placeholder="Ex: Barra vazia, 15kg Thruster"
                    value={wodData.beginnerWeights}
                    onChange={(e) => setWodData({ ...wodData, beginnerWeights: e.target.value })}
                  />
                </div>
              </div>

              <Button onClick={handleSaveWod} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Salvar WOD
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="challenges" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Criar Novo Desafio</CardTitle>
              <CardDescription>Crie desafios semanais ou mensais para seus atletas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input
                    placeholder="Nome do desafio"
                    value={newChallenge.title}
                    onChange={(e) => setNewChallenge({ ...newChallenge, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={newChallenge.type}
                    onValueChange={(value: 'weekly' | 'monthly') =>
                      setNewChallenge({ ...newChallenge, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  placeholder="Descreva o desafio..."
                  value={newChallenge.description}
                  onChange={(e) => setNewChallenge({ ...newChallenge, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Meta</Label>
                  <Input
                    type="number"
                    value={newChallenge.targetValue}
                    onChange={(e) =>
                      setNewChallenge({ ...newChallenge, targetValue: parseInt(e.target.value) })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unidade</Label>
                  <Input
                    placeholder="treinos, km, etc"
                    value={newChallenge.unit}
                    onChange={(e) => setNewChallenge({ ...newChallenge, unit: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>XP Recompensa</Label>
                  <Input
                    type="number"
                    value={newChallenge.xpReward}
                    onChange={(e) =>
                      setNewChallenge({ ...newChallenge, xpReward: parseInt(e.target.value) })
                    }
                  />
                </div>
              </div>

              <Button onClick={handleCreateChallenge} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Criar Desafio
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Desafios Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              {challenges.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">Nenhum desafio ativo</p>
              ) : (
                <div className="space-y-3">
                  {challenges.map((challenge) => (
                    <div
                      key={challenge.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{challenge.title}</span>
                          <Badge variant={challenge.type === 'weekly' ? 'default' : 'secondary'}>
                            {challenge.type === 'weekly' ? 'Semanal' : 'Mensal'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Meta: {challenge.targetValue} {challenge.unit} • {challenge.xpReward} XP
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteChallenge(challenge.id)}
                      >
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
          <Card>
            <CardHeader>
              <CardTitle>Atletas do Box</CardTitle>
              <CardDescription>Acompanhe o progresso dos seus atletas</CardDescription>
            </CardHeader>
            <CardContent>
              {athletes.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">Nenhum atleta cadastrado</p>
              ) : (
                <div className="space-y-3">
                  {athletes.map((athlete) => (
                    <div
                      key={athlete.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{athlete.avatar || '👤'}</span>
                        <div>
                          <p className="font-medium">{athlete.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Nível {athlete.level || 1} • {athlete.xp || 0} XP
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">
                        {athlete.category === 'rx'
                          ? 'RX'
                          : athlete.category === 'scaled'
                          ? 'Scaled'
                          : 'Iniciante'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CoachDashboard;
