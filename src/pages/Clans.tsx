import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Swords, Map, Users, Sparkles, Crown, Plus, LogIn } from 'lucide-react';
import { DominationEnergyButton } from '@/components/DominationEnergyButton';
import { territories, clanRewards, getTerritoryOfDay } from '@/lib/clanSystem';
import { useToast } from '@/hooks/use-toast';
import {
  getClans,
  createClan as createClanApi,
  getClanMemberships,
  joinClan,
  getUserClan as getUserClanApi,
  getTerritoryBattle,
  upsertTerritoryBattle,
  type ClanData,
} from '@/lib/supabaseData';

const Clans = () => {
  const { user, getAllUsers } = useAuth();
  const { toast } = useToast();
  const [tick, setTick] = useState(0);

  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [clans, setClans] = useState<ClanData[]>([]);
  const [memberships, setMemberships] = useState<Record<string, string>>({});
  const [myClan, setMyClan] = useState<ClanData | null>(null);
  const [territoryState, setTerritoryState] = useState<any>(null);

  const dayKey = new Date().toISOString().split('T')[0];
  const territoryOfDay = getTerritoryOfDay();

  useEffect(() => {
    const load = async () => {
      const [users, loadedClans, loadedMemberships, battle] = await Promise.all([
        getAllUsers(),
        getClans(),
        getClanMemberships(),
        getTerritoryBattle(dayKey),
      ]);
      setAllUsers(users);
      setClans(loadedClans);
      setMemberships(loadedMemberships);
      setTerritoryState(battle);

      if (user) {
        const userClan = await getUserClanApi(user.id);
        setMyClan(userClan);
      }
    };
    load();
  }, [tick, user?.id]);

  const leaderboard = useMemo(() => {
    const energyByClan: Record<string, number> = territoryState?.energy_by_clan || {};
    return clans
      .map((clan) => {
        const members = allUsers.filter((u) => memberships[u.id] === clan.id);
        const avgLevel = members.length ? members.reduce((sum: number, u: any) => sum + (u.level || 1), 0) / members.length : 0;
        return {
          clan,
          members,
          avgLevel,
          energy: energyByClan[clan.id] || 0,
        };
      })
      .sort((a, b) => b.energy - a.energy);
  }, [clans, allUsers, memberships, territoryState]);

  const maxEnergy = Math.max(...leaderboard.map((item) => item.energy), 1);

  const handleCreateMyClan = async () => {
    if (!user) return;

    const clanName = window.prompt('Nome do seu time:');
    if (!clanName?.trim()) return;

    const motto = window.prompt('Mote do time (opcional):')?.trim() || 'Juntos dominamos o território.';

    try {
      const newClan = await createClanApi({
        name: clanName.trim(),
        motto,
        color: 'slate',
        banner: '🛡️',
        createdBy: user.id,
      });

      await joinClan(user.id, newClan.id);
      toast({ title: 'Time criado com sucesso!', description: `Você agora lidera ${newClan.name}.` });
      setTick((v) => v + 1);
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message || 'Falha ao criar time.', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Times & Territórios</h1>
        <p className="text-muted-foreground">Contribua com check-ins e ajude seu time a dominar o território do dia.</p>
      </div>

      <Card className="border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Swords className="h-5 w-5 text-primary" /> {myClan ? 'Meu Time' : 'Sem Time'}</CardTitle>
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
                  activityId={`territory:${dayKey}`}
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
              <p className="text-sm text-muted-foreground">Você ganhou XP pessoal! Entre em um time para ajudar seu time a dominar territórios.</p>
              <Button type="button" onClick={handleCreateMyClan} className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Criar Meu Time
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
            {territoryState?.winner_clan_id && (
              <Badge variant="secondary">Time líder atualizado em tempo real</Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Crown className="h-5 w-5 text-primary" /> Leaderboard de Times</CardTitle>
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
          <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> Economia de Time</CardTitle>
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
