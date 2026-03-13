import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Swords, Map, Users, Sparkles, Crown, Plus } from 'lucide-react';
import { DominationEnergyButton } from '@/components/DominationEnergyButton';
import {
  assignUserToClan,
  clanRewards,
  createClan,
  ensureClanData,
  getClanLeaderboard,
  getTerritoryOfDay,
  getTerritoryState,
  getUserClan,
  territories,
} from '@/lib/clanSystem';
import { useToast } from '@/hooks/use-toast';

const Clans = () => {
  const { user, getAllUsers } = useAuth();
  const { toast } = useToast();
  const [tick, setTick] = useState(0);

  const allUsers = useMemo(() => getAllUsers(), [getAllUsers]);

  useEffect(() => {
    ensureClanData(allUsers);
  }, [allUsers]);

  const territoryState = useMemo(() => getTerritoryState(), [tick]);
  const leaderboard = useMemo(() => getClanLeaderboard(allUsers), [allUsers, tick]);
  const myClan = user ? getUserClan(user.id) : null;
  const territoryOfDay = getTerritoryOfDay();

  const maxEnergy = Math.max(...leaderboard.map((item) => item.energy), 1);

  const handleCreateMyClan = () => {
    if (!user) return;

    const clanName = window.prompt('Nome do seu clã:');
    if (!clanName?.trim()) return;

    const motto = window.prompt('Mote do clã (opcional):')?.trim() || 'Juntos dominamos o território.';
    const newClan = createClan({
      name: clanName,
      motto,
      color: 'slate',
      banner: '🛡️',
    });

    assignUserToClan(user.id, newClan.id);
    toast({ title: 'Clã criado com sucesso!', description: `Você agora lidera ${newClan.name}.` });
    setTick((value) => value + 1);
  };


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Clãs & Territórios</h1>
        <p className="text-muted-foreground">Contribua com check-ins e ajude seu clã a dominar o território do dia.</p>
      </div>

      <Card className="border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Swords className="h-5 w-5 text-primary" /> {myClan ? 'Meu Clã' : 'Sem Clã'}</CardTitle>
          <CardDescription>Formação mista para promover mentoria e evolução coletiva.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4 flex-wrap">
          {myClan ? (
            <>
              <div>
                <p className="text-2xl font-bold">{myClan.banner} {myClan.name}</p>
                <p className="text-sm text-muted-foreground">{myClan.motto}</p>
              </div>
              {user && (
                <DominationEnergyButton
                  userId={user.id}
                  activityId={`territory:${territoryState?.dayKey || new Date().toISOString().split('T')[0]}`}
                  activityType="event"
                  energy={25}
                  participationValid
                  className="w-full sm:w-auto"
                  onSuccess={() => setTick((value) => value + 1)}
                />
              )}
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">Você ganhou XP pessoal! Entre em um clã para ajudar seu time a dominar territórios.</p>
              <Button type="button" onClick={handleCreateMyClan} className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Criar Meu Clã
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Map className="h-5 w-5 text-primary" /> Território do Dia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 rounded-lg border bg-muted/30">
              <p className="font-semibold">{territoryOfDay.icon} {territoryOfDay.name}</p>
              <p className="text-sm text-muted-foreground">Foco: {territoryOfDay.focus}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {territories.map((territory) => (
                <div key={territory.id} className="rounded-lg border p-2">
                  <p>{territory.icon} {territory.name}</p>
                </div>
              ))}
            </div>
            {territoryState?.winnerClanId && (
              <Badge variant="secondary">Clã líder atualizado em tempo real</Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Crown className="h-5 w-5 text-primary" /> Leaderboard de Clãs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {leaderboard.map((entry, index) => (
              <div key={entry.clan.id} className="space-y-1 rounded-lg border p-3">
                <div className="flex items-center justify-between text-sm">
                  <p className="font-semibold">#{index + 1} {entry.clan.banner} {entry.clan.name}</p>
                  <p>{entry.energy} energia</p>
                </div>
                <Progress value={(entry.energy / maxEnergy) * 100} className="h-2" />
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="h-3 w-3" /> {entry.members.length} membros • nível médio {entry.avgLevel.toFixed(1)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> Economia de Clã</CardTitle>
          <CardDescription>Benefícios desbloqueados por presença e domínio de território.</CardDescription>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-3 gap-3">
          {clanRewards.map((reward) => (
            <div key={reward.id} className="rounded-lg border p-3">
              <p className="font-semibold">{reward.title}</p>
              <p className="text-xs text-muted-foreground">{reward.description}</p>
              <Badge className="mt-2" variant="outline">{reward.type}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default Clans;
