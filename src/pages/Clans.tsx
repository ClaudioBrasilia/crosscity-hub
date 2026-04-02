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
  getUserClanMembership,
  getClanMembers,
  approveMember,
  removeMember,
  getTerritoryBattle,
  type ClanData,
  type ClanMembershipData,
  leaveClan,
} from '@/lib/supabaseData';

const Clans = () => {
  const { user, getAllUsers } = useAuth();
  const { toast } = useToast();
  const [tick, setTick] = useState(0);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [clans, setClans] = useState<ClanData[]>([]);
  const [memberships, setMemberships] = useState<Record<string, string>>({});
  const [myClan, setMyClan] = useState<ClanData | null>(null);
  const [myMembership, setMyMembership] = useState<ClanMembershipData | null>(null);
  const [managedMembers, setManagedMembers] = useState<ClanMembershipData[]>([]);
  const [viewMembersOpen, setViewMembersOpen] = useState(false);
  const [selectedClanForView, setSelectedClanForView] = useState<ClanData | null>(null);
  const [selectedClanMembers, setSelectedClanMembers] = useState<ClanMembershipData[]>([]);
  const [territoryState, setTerritoryState] = useState<any>(null);

  const dayKey = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
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
        const [userClan, userMembership] = await Promise.all([
          getUserClanApi(user.id),
          getUserClanMembership(user.id),
        ]);
        setMyClan(userClan);
        setMyMembership(userMembership);

        if (userMembership?.clanId) {
          const clanMembers = await getClanMembers(userMembership.clanId);
          setManagedMembers(clanMembers);
        } else {
          setManagedMembers([]);
        }
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
      toast({ title: 'Time criado com sucesso!', description: `Você agora lidera ${newClan.name}.` });
      setTick((v) => v + 1);
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message || 'Falha ao criar time.', variant: 'destructive' });
    }
  };

  const handleJoinClan = async (clanId: string) => {
    if (!user) return;
    try {
      await joinClan(user.id, clanId);
      toast({ title: 'Solicitação enviada!', description: 'Aguarde aprovação do capitão.' });
      setJoinDialogOpen(false);
      setTick((v) => v + 1);
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message || 'Falha ao entrar no time.', variant: 'destructive' });
    }
  };

  const handleApproveMember = async (memberId: string) => {
    if (!myMembership?.clanId) return;
    try {
      await approveMember(memberId, myMembership.clanId);
      toast({ title: 'Membro aprovado!', description: 'Agora ele já pode somar energia para o time.' });
      setTick((v) => v + 1);
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message || 'Falha ao aprovar membro.', variant: 'destructive' });
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!myMembership?.clanId) return;
    try {
      await removeMember(memberId, myMembership.clanId);
      toast({ title: 'Membro removido', description: 'A solicitação/membro foi removida do time.' });
      setTick((v) => v + 1);
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message || 'Falha ao remover membro.', variant: 'destructive' });
    }
  };

  const pendingMembers = useMemo(
    () => managedMembers.filter((member) => member.status === 'pending'),
    [managedMembers],
  );
  const approvedMembers = useMemo(
    () => managedMembers.filter((member) => member.status === 'approved'),
    [managedMembers],
  );
  const isCaptain = myMembership?.role === 'captain' && myMembership?.status === 'approved';
  const canContributeEnergy = myMembership?.status === 'approved' && !!myClan;
  const canViewMyTeamMembers = myMembership?.status === 'approved' && !!myClan;

  const openClanMembersDialog = async (clan: ClanData) => {
    const members = await getClanMembers(clan.id);
    setSelectedClanMembers(members.filter((member) => member.status === 'approved'));
    setSelectedClanForView(clan);
    setViewMembersOpen(true);
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
              {user && canContributeEnergy && (
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
              {myMembership?.status === 'pending' && (
                <Badge variant="secondary">Solicitação pendente de aprovação do capitão</Badge>
              )}
              {user && myMembership?.status === 'approved' && (
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  {canViewMyTeamMembers && myClan && (
                    <Button type="button" variant="outline" size="sm" onClick={() => openClanMembersDialog(myClan)}>
                      Membros do Time
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto text-destructive border-destructive/30 hover:bg-destructive/10"
                    onClick={async () => {
                      if (!myClan) return;
                      const msg = isCaptain
                        ? 'Você é o capitão! Se sair, o time ficará sem líder. Deseja continuar?'
                        : 'Tem certeza que deseja sair do time?';
                      if (!window.confirm(msg)) return;
                      try {
                        await leaveClan(user.id, myClan.id);
                        toast({ title: 'Você saiu do time.' });
                        setTick((v) => v + 1);
                      } catch (err: any) {
                        toast({ title: 'Erro', description: err.message, variant: 'destructive' });
                      }
                    }}
                  >
                    Sair do Time
                  </Button>
                </div>
              )}
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">Você ganhou XP pessoal! Entre em um time para ajudar seu time a dominar territórios.</p>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                {clans.length > 0 && (
                  <Button type="button" variant="outline" onClick={() => setJoinDialogOpen(true)} className="w-full sm:w-auto">
                    <LogIn className="h-4 w-4 mr-2" />
                    Entrar em um Time
                  </Button>
                )}
                <Button type="button" onClick={handleCreateMyClan} className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Meu Time
                </Button>
              </div>

              <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
                <DialogContent className="max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Escolha um Time</DialogTitle>
                    <DialogDescription>Selecione o time que deseja participar.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 mt-2">
                    {clans.map((clan) => {
                      const memberCount = allUsers.filter((u) => memberships[u.id] === clan.id).length;
                      return (
                        <div key={clan.id} className="flex items-center justify-between rounded-lg border p-3">
                          <div>
                            <p className="font-semibold">{clan.banner} {clan.name}</p>
                            <p className="text-xs text-muted-foreground">{clan.motto}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <Users className="h-3 w-3" /> {memberCount} membros
                            </p>
                          </div>
                          <Button size="sm" onClick={() => handleJoinClan(clan.id)}>
                            Entrar
                          </Button>
                        </div>
                      );
                    })}
                    {clans.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">Nenhum time criado ainda. Crie o primeiro!</p>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
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
              <button
                key={entry.clan.id}
                type="button"
                className="space-y-1 rounded-lg border p-3 text-left w-full hover:border-primary/40 transition-colors"
                onClick={() => openClanMembersDialog(entry.clan)}
              >
                <div className="flex items-center justify-between text-sm">
                  <p className="font-semibold">#{index + 1} {entry.clan.banner} {entry.clan.name}</p>
                  <p>{entry.energy} energia</p>
                </div>
                <Progress value={(entry.energy / maxEnergy) * 100} className="h-2" />
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="h-3 w-3" /> {entry.members.length} membros • nível médio {entry.avgLevel.toFixed(1)}
                </p>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      {isCaptain && myClan && (
        <Card>
          <CardHeader>
            <CardTitle>Gerenciar Time</CardTitle>
            <CardDescription>Aprove pedidos pendentes e remova membros do seu time.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <p className="text-sm font-semibold">Solicitações pendentes</p>
              {pendingMembers.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma solicitação pendente.</p>
              ) : (
                pendingMembers.map((member) => {
                  const profile = allUsers.find((u) => u.id === member.userId);
                  return (
                    <div key={`pending-${member.userId}`} className="flex items-center justify-between rounded-lg border p-3 gap-3">
                      <div>
                        <p className="font-medium">{profile?.name || 'Atleta'}</p>
                        <p className="text-xs text-muted-foreground">{member.userId}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" onClick={() => handleApproveMember(member.userId)}>
                          Aprovar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleRemoveMember(member.userId)}>
                          Recusar
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold">Membros aprovados</p>
              {approvedMembers.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum membro aprovado ainda.</p>
              ) : (
                approvedMembers.map((member) => {
                  const profile = allUsers.find((u) => u.id === member.userId);
                  const isCurrentUser = member.userId === user?.id;
                  return (
                    <div key={`approved-${member.userId}`} className="flex items-center justify-between rounded-lg border p-3 gap-3">
                      <div>
                        <p className="font-medium">{profile?.name || 'Atleta'} {member.role === 'captain' ? '👑' : ''}</p>
                        <p className="text-xs text-muted-foreground">{member.role}</p>
                      </div>
                      {!isCurrentUser && (
                        <Button size="sm" variant="outline" onClick={() => handleRemoveMember(member.userId)}>
                          Remover
                        </Button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      )}

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

      <Dialog open={viewMembersOpen} onOpenChange={setViewMembersOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedClanForView ? `${selectedClanForView.banner} ${selectedClanForView.name}` : 'Time'} — Membros
            </DialogTitle>
            <DialogDescription>Visualização somente leitura dos membros aprovados.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {selectedClanMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum membro aprovado.</p>
            ) : (
              selectedClanMembers.map((member) => {
                const profile = allUsers.find((u) => u.id === member.userId);
                return (
                  <div key={`view-${member.userId}`} className="rounded-lg border p-3">
                    <p className="font-medium">{profile?.name || 'Atleta'} {member.role === 'captain' ? '👑' : ''}</p>
                    <p className="text-xs text-muted-foreground">{member.role}</p>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Clans;
