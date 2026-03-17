import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

import { Swords, Trophy, Plus } from 'lucide-react';
import { getNextEquipment } from '@/lib/equipmentData';
import type { DailyWod, Duel, WodCategory } from '@/lib/mockData';
import { useToast } from '@/hooks/use-toast';
import { formatDurationInput, getDurationValidationError, toDurationSeconds } from '@/lib/timeScore';
import { normalizeDuel, calculateWinner, reserveXp, refundXp, settleBet, checkAllResultsSubmitted } from '@/lib/duelLogic';

const categoryLabels: Record<WodCategory, string> = {
  rx: 'RX',
  scaled: 'Scaled',
  beginner: 'Iniciante',
};

const toValue = (result: string) => {
  if (result.includes(':')) {
    return { kind: 'time' as const, value: toDurationSeconds(result) };
  }

  const rounds = Number(result);
  return { kind: 'rounds' as const, value: Number.isNaN(rounds) ? 0 : rounds };
};

const pickWinner = (results: Record<string, string>, participantIds: string[]) => {
  const validResults = participantIds.filter((id) => results[id]);
  if (validResults.length === 0) return null;

  let winnerId = validResults[0];
  let winnerValue = toValue(results[winnerId]);

  for (let i = 1; i < validResults.length; i++) {
    const id = validResults[i];
    const value = toValue(results[id]);

    if (winnerValue.kind === 'time' && value.kind === 'time') {
      if (value.value < winnerValue.value) {
        winnerId = id;
        winnerValue = value;
      }
    } else if (winnerValue.kind === 'rounds' && value.kind === 'rounds') {
      if (value.value > winnerValue.value) {
        winnerId = id;
        winnerValue = value;
      }
    }
  }

  return winnerId;
};

const getVisibleResult = (duel: Duel, userId: string) => {
  if (duel.status === 'finished') {
    return duel.results[userId] || 'aguardando';
  }

  const allSubmitted = duel.opponentIds.concat(duel.challengerId).every((id) => duel.results[id]);
  const userSubmitted = Boolean(duel.results[userId]);

  if (allSubmitted) {
    return duel.results[userId] || 'aguardando';
  }

  return userSubmitted ? '✓ Enviado' : 'aguardando';
};

const parseStorage = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const Battle = () => {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [wods, setWods] = useState<DailyWod[]>([]);
  const [duels, setDuels] = useState<Duel[]>([]);

  const [selectedOpponents, setSelectedOpponents] = useState<string[]>([]);
  const [opponentSearch, setOpponentSearch] = useState('');
  const [wodId, setWodId] = useState('');
  const [category, setCategory] = useState<WodCategory>('rx');
  const [betMode, setBetMode] = useState(false);
  const [betType, setBetType] = useState<'none' | 'xp'>('none');
  const [betXpAmount, setBetXpAmount] = useState(100);
  const [submission, setSubmission] = useState<Record<string, string>>({});

  // Custom WOD creation
  const [createMode, setCreateMode] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customType, setCustomType] = useState<'For Time' | 'AMRAP' | 'EMOM'>('For Time');
  const [customDescription, setCustomDescription] = useState('');
  const [customWeight, setCustomWeight] = useState('');

  useEffect(() => {
    const loadedUsers = parseStorage<any[]>('crosscity_users', []);
    const loadedWods = parseStorage<DailyWod[]>('crosscity_daily_wods', []);
    const loadedDuels = parseStorage<any[]>('crosscity_duels', []).map(normalizeDuel);
    setUsers(loadedUsers);
    setWods(loadedWods);
    setDuels(loadedDuels);
    if (loadedWods[0]) setWodId(loadedWods[0].id);
  }, []);

  const userLevel = user?.level ?? Math.floor((user?.xp || 0) / 500) + 1;
  const canBet = true;
  const currentUserInventory = parseStorage<string[]>(`crosscity_inventory_${user?.id}`, []);
  const opponents = users.filter((item) => item.id !== user?.id);

  const isTimeScoreDuel = (duel: Duel) => {
    const duelWod = wods.find((item) => item.id === duel.wodId);
    return duelWod?.type === 'For Time';
  };

  const saveDuels = (items: Duel[]) => {
    const normalized = items.map(normalizeDuel);
    setDuels(normalized);
    localStorage.setItem('crosscity_duels', JSON.stringify(normalized));
  };

  const syncUsers = (nextUsers: any[]) => {
    localStorage.setItem('crosscity_users', JSON.stringify(nextUsers));
    setUsers(nextUsers);
    if (user) {
      const me = nextUsers.find((item) => item.id === user.id);
      if (me) {
        updateUser({ xp: me.xp, level: Math.floor((me.xp || 0) / 500) + 1 });
      }
    }
  };

  const createDuel = () => {
    if (!user || selectedOpponents.length === 0) {
      toast({ title: 'Erro', description: 'Selecione pelo menos um oponente.', variant: 'destructive' });
      return;
    }

    if (betMode && betType === 'xp' && betXpAmount > (user.xp || 0)) {
      toast({ title: 'XP insuficiente', description: 'Você não pode apostar mais XP do que possui.', variant: 'destructive' });
      return;
    }

    // Verificar se todos os oponentes têm XP suficiente para a aposta
    if (betMode && betType === 'xp' && betXpAmount) {
      const storedUsers = parseStorage<any[]>('crosscity_users', []);
      for (const opponentId of selectedOpponents) {
        const opponent = storedUsers.find((u) => u.id === opponentId);
        if (!opponent || opponent.xp < betXpAmount) {
          toast({ title: 'XP insuficiente', description: `${opponent?.name || 'Um oponente'} não possui XP suficiente para esta aposta.`, variant: 'destructive' });
          return;
        }
      }
    }

    let selectedWod: DailyWod;

    if (createMode) {
      if (!customName || !customDescription) {
        toast({ title: 'Preencha os campos', description: 'Nome e descrição do WOD são obrigatórios.', variant: 'destructive' });
        return;
      }
      const newWod: DailyWod = {
        id: `wod_custom_${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        name: customName,
        type: customType,
        versions: {
          rx: { description: customDescription, weight: customWeight || 'Rx' },
          scaled: { description: customDescription, weight: customWeight ? `${Math.round(Number(customWeight) * 0.7)}` : 'Scaled' },
          beginner: { description: customDescription, weight: customWeight ? `${Math.round(Number(customWeight) * 0.5)}` : 'Iniciante' },
        },
      };
      const updatedWods = [newWod, ...wods];
      setWods(updatedWods);
      localStorage.setItem('crosscity_daily_wods', JSON.stringify(updatedWods));
      selectedWod = newWod;
    } else {
      const found = wods.find((item) => item.id === wodId);
      if (!found) return;
      selectedWod = found;
    }

    const allParticipants = [user.id, ...selectedOpponents];
    const results: Record<string, string | null> = {};
    allParticipants.forEach((id) => {
      results[id] = null;
    });

    const duel: Duel = {
      id: `duel_${Date.now()}`,
      wodId: selectedWod.id,
      wodName: selectedWod.name,
      category,
      challengerId: user.id,
      opponentIds: selectedOpponents,
      results,
      status: 'pending',
      winnerId: null,
      betMode,
      betType: betMode && betType === 'xp' ? 'xp' : null,
      betItems: [],
      betXpAmount: betMode && betType === 'xp' ? betXpAmount : null,
      acceptedBy: [],
      betReserved: false,
      betReservedAt: null,
      betSettledAt: null,
      betCanceledAt: null,
      createdAt: Date.now(),
    };

    saveDuels([duel, ...duels]);
    toast({ title: 'Duelo criado!', description: `WOD: ${selectedWod.name}. Os oponentes precisam aceitar o duelo.` });
    setBetMode(false);
    setBetType('none');
    setBetXpAmount(100);
    setCreateMode(false);
    setCustomName('');
    setCustomDescription('');
    setCustomWeight('');
    setSelectedOpponents([]);
  };

  const acceptDuel = (duelId: string) => {
    if (!user) return;

    const storedDuels = parseStorage<any[]>('crosscity_duels', []).map(normalizeDuel);
    const target = storedDuels.find((item) => item.id === duelId);
    if (!target || target.status === 'finished' || !target.opponentIds.includes(user.id)) return;

    let storedUsers = parseStorage<any[]>('crosscity_users', []);

    const nextDuels = storedDuels.map((item) => {
      if (item.id !== duelId) return item;
      
      const newAcceptedBy = [...item.acceptedBy, user.id];
      const allAccepted = newAcceptedBy.length === item.opponentIds.length;

      // Reservar XP apenas quando o duelo passa de pending para active
      if (allAccepted && !item.betReserved && item.betMode && item.betType === 'xp' && item.betXpAmount) {
        const { updatedUsers: nextUsers, updatedDuel } = reserveXp(item, storedUsers);
        storedUsers = nextUsers;
        syncUsers(nextUsers);
        return {
          ...updatedDuel,
          acceptedBy: newAcceptedBy,
          status: 'active' as Duel['status'],
        };
      }

      return {
        ...item,
        acceptedBy: newAcceptedBy,
        status: allAccepted ? ('active' as const) : ('pending' as const),
      };
    });

    saveDuels(nextDuels);
    toast({ title: 'Duelo aceito', description: 'Você aceitou o duelo.' });
  };

  const cancelDuel = (duelId: string) => {
    if (!user) return;
    const storedDuels = parseStorage<any[]>('crosscity_duels', []).map(normalizeDuel);
    const target = storedDuels.find((item) => item.id === duelId);
    if (!target || target.status === 'finished') return;
    if (target.challengerId !== user.id && !target.opponentIds.includes(user.id)) return;

    // Se houver aposta de XP reservada, devolver o XP
    let storedUsers = parseStorage<any[]>('crosscity_users', []);
    if (target.betMode && target.betType === 'xp' && target.betXpAmount && target.betReserved && !target.betSettledAt) {
      const nextUsers = refundXp(target, storedUsers);
      syncUsers(nextUsers);
      storedUsers = nextUsers;
    }

    const nextDuels = storedDuels.map((item) => (
      item.id === duelId
        ? { ...item, status: 'finished' as Duel['status'], winnerId: null, betCanceledAt: Date.now() }
        : item
    ));
    saveDuels(nextDuels);
    toast({ title: 'Duelo cancelado', description: 'O duelo foi removido e as apostas devolvidas (se houver).' });
  };

  const submitResult = (duel: Duel) => {
    if (!user) return;
    const result = submission[duel.id];
    if (!result) return;

    if (isTimeScoreDuel(duel)) {
      const error = getDurationValidationError(result);
      if (error) {
        toast({ title: 'Formato inválido', description: error, variant: 'destructive' });
        return;
      }
    }

    const nextDuels = duels.map((item) => {
      if (item.id !== duel.id) return item;
      return { ...item, results: { ...item.results, [user.id]: result } };
    });

    const changed = nextDuels.find((item) => item.id === duel.id);
    if (changed) {
      const allParticipants = [changed.challengerId, ...changed.opponentIds];
      const allSubmitted = checkAllResultsSubmitted(changed);

      if (allSubmitted && changed.status !== 'finished') {
        const winnerId = pickWinner(changed.results, allParticipants);

        if (winnerId) {
          // Liquidar a aposta
          let storedUsers = parseStorage<any[]>('crosscity_users', []);
          const { updatedUsers, updatedDuel } = settleBet(changed, winnerId, storedUsers);
          
          const finalNextDuels = nextDuels.map((item) =>
            item.id === changed.id ? updatedDuel : item
          );

          const winner = updatedUsers.find((item) => item.id === winnerId);
          const loserIds = allParticipants.filter((id) => id !== winnerId);

          syncUsers(updatedUsers);

          if (winnerId === user.id && user) {
            const currentWins = Number(localStorage.getItem(`crosscity_wins_${user.id}`) || '0') + 1;
            localStorage.setItem(`crosscity_wins_${user.id}`, String(currentWins));

            let inventory = [...currentUserInventory];
            if (changed.betMode && changed.betType === 'equipment' && changed.betItems.length > 0) {
              inventory = [...new Set([...inventory, ...changed.betItems])];
              for (const loserId of loserIds) {
                const loserInv = parseStorage<string[]>(`crosscity_inventory_${loserId}`, []);
                const updatedLoserInv = loserInv.filter((i) => !changed.betItems.includes(i));
                localStorage.setItem(`crosscity_inventory_${loserId}`, JSON.stringify(updatedLoserInv));
              }
            } else if (!changed.betMode) {
              const reward = getNextEquipment(currentWins);
              if (reward) inventory = [...new Set([...inventory, reward.id])];
            }
            localStorage.setItem(`crosscity_inventory_${user.id}`, JSON.stringify(inventory));

            const xpGain = 150;
            const newXp = (updatedUsers.find((u) => u.id === user.id)?.xp || 0) + xpGain;
            updateUser({ xp: newXp, level: Math.floor(newXp / 500) + 1 });
            toast({ title: 'Vitória no duelo! 🏆', description: `+${xpGain} XP${changed.betType === 'equipment' ? ' e equipamento ganho' : ''}.` });
          } else {
            toast({ title: 'Duelo finalizado', description: `${winner?.name || 'Outro atleta'} venceu.` });
          }

          // Adicionar ao feed
          const feed = parseStorage<any[]>('crosscity_feed', []);
          feed.unshift({
            id: `post_${Date.now()}`,
            userId: winnerId,
            userName: winner?.name || 'Atleta',
            userAvatar: winner?.avatar || '🏆',
            content: `Venceu duelo em ${changed.wodName} (${categoryLabels[changed.category]}).`,
            wodName: 'Duelos',
            time: 'Vitória',
            reactions: { fire: 0, clap: 0, muscle: 0 },
            comments: 0,
            timestamp: Date.now(),
          });
          localStorage.setItem('crosscity_feed', JSON.stringify(feed));

          saveDuels(finalNextDuels);
        }
      } else {
        saveDuels(nextDuels);
      }
    }

    setSubmission((prev) => ({ ...prev, [duel.id]: '' }));
  };

  const getUserName = (id: string) => users.find((u) => u.id === id)?.name || 'Atleta';

  const duelGroups = useMemo(() => ({
    pending: duels.filter((d) => d.status === 'pending'),
    active: duels.filter((d) => d.status === 'active'),
    finished: duels.filter((d) => d.status === 'finished'),
  }), [duels]);

  return (
    <div className="container max-w-4xl py-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Arena de Duelos</h1>
          <p className="text-muted-foreground">Desafie outros atletas e prove sua força.</p>
        </div>
        <Swords className="h-10 w-10 text-primary" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" /> Novo Desafio
          </CardTitle>
          <CardDescription>Escolha um ou mais oponentes e um WOD para duelar.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label>Oponentes (selecione pelo menos um)</Label>
            <div className="space-y-2">
              <Input
                placeholder="Buscar oponente pelo nome..."
                value={opponentSearch}
                onChange={(e) => setOpponentSearch(e.target.value)}
              />
              {opponentSearch && (
                <div className="border rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto bg-secondary/5">
                  {opponents
                    .filter((opponent) => opponent.name.toLowerCase().includes(opponentSearch.toLowerCase()))
                    .length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum oponente encontrado.</p>
                  ) : (
                    opponents
                      .filter((opponent) => opponent.name.toLowerCase().includes(opponentSearch.toLowerCase()))
                      .map((opponent) => (
                        <div
                          key={opponent.id}
                          className="p-2 rounded cursor-pointer hover:bg-secondary/20 transition-colors"
                          onClick={() => {
                            if (!selectedOpponents.includes(opponent.id)) {
                              setSelectedOpponents([...selectedOpponents, opponent.id]);
                              setOpponentSearch('');
                            }
                          }}
                        >
                          <p className="font-medium">{opponent.name}</p>
                          <p className="text-xs text-muted-foreground">Lvl {opponent.level || 1}</p>
                        </div>
                      ))
                  )}
                </div>
              )}
              {selectedOpponents.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {selectedOpponents.map((opponentId) => {
                    const opponent = users.find((u) => u.id === opponentId);
                    return (
                      <Badge key={opponentId} variant="secondary" className="pl-3">
                        {opponent?.name}
                        <button
                          className="ml-2 hover:text-destructive"
                          onClick={() => setSelectedOpponents(selectedOpponents.filter((id) => id !== opponentId))}
                        >
                          ✕
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>WOD</Label>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setCreateMode(!createMode)}>
                {createMode ? 'Selecionar existente' : 'Criar personalizado'}
              </Button>
            </div>
            {createMode ? (
              <div className="space-y-2">
                <Input placeholder="Nome do WOD" value={customName} onChange={(e) => setCustomName(e.target.value)} />
                <Select value={customType} onValueChange={(v: any) => setCustomType(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="For Time">For Time</SelectItem>
                    <SelectItem value="AMRAP">AMRAP</SelectItem>
                    <SelectItem value="EMOM">EMOM</SelectItem>
                  </SelectContent>
                </Select>
                <Textarea placeholder="Descrição/Movimentos" value={customDescription} onChange={(e) => setCustomDescription(e.target.value)} />
                <Input placeholder="Peso sugerido (opcional)" value={customWeight} onChange={(e) => setCustomWeight(e.target.value)} />
              </div>
            ) : (
              <Select value={wodId} onValueChange={setWodId}>
                <SelectTrigger><SelectValue placeholder="Selecione um WOD" /></SelectTrigger>
                <SelectContent>
                  {wods.map((item) => (
                    <SelectItem key={item.id} value={item.id}>{item.name} • {item.date}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div>
            <Label>Categoria</Label>
            <Select value={category} onValueChange={(value) => setCategory(value as WodCategory)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="rx">RX</SelectItem>
                <SelectItem value="scaled">Scaled</SelectItem>
                <SelectItem value="beginner">Iniciante</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3 p-3 border rounded-lg bg-secondary/10 md:col-span-2">
              <div className="flex items-center justify-between">
                <Label>Modo aposta</Label>
                <Switch checked={betMode} onCheckedChange={setBetMode} />
              </div>
              {betMode && (
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Tipo de aposta</Label>
                    <Select value={betType} onValueChange={(v) => setBetType(v as 'none' | 'xp')}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem aposta</SelectItem>
                        <SelectItem value="xp">⚡ XP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {betType === 'xp' && (
                    <div>
                      <Label className="text-xs">Quantidade de XP por participante (mín. 50, máx. {user?.xp || 0})</Label>
                      <Input
                        type="number"
                        min={50}
                        max={user?.xp || 0}
                        value={betXpAmount}
                        onChange={(e) => setBetXpAmount(Math.max(50, Math.min(user?.xp || 0, Number(e.target.value))))}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Total em risco: {betXpAmount * (selectedOpponents.length + 1)} XP (você + {selectedOpponents.length} oponente{selectedOpponents.length !== 1 ? 's' : ''})
                      </p>
                    </div>
                  )}
                </div>
              )}
          </div>

          <Button 
            className="md:col-span-2" 
            onClick={createDuel} 
            disabled={
              selectedOpponents.length === 0 || 
              (!createMode && !wodId) || 
              (createMode && (!customName || !customDescription)) || 
              (betMode && betType === 'xp' && betXpAmount < 50)
            }
          >
            Criar duelo
          </Button>
        </CardContent>
      </Card>

      {(['pending', 'active', 'finished'] as const).map((statusKey) => (
        <Card key={statusKey}>
          <CardHeader>
            <CardTitle>
              {statusKey === 'pending' && 'Pendentes'}
              {statusKey === 'active' && 'Ativos'}
              {statusKey === 'finished' && 'Finalizados'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {duelGroups[statusKey].length === 0 && <p className="text-sm text-muted-foreground">Nenhum duelo nesta seção.</p>}
            {duelGroups[statusKey].map((duel) => {
              const allParticipants = [duel.challengerId, ...duel.opponentIds];
              const mine = allParticipants.includes(user?.id || '');
              const mySubmitted = duel.results[user?.id || ''];
              const isChallenger = duel.challengerId === user?.id;
              const isOpponent = duel.opponentIds.includes(user?.id || '');
              const needsMyAcceptance = statusKey === 'pending' && isOpponent && !duel.acceptedBy.includes(user?.id || '');

              return (
                <div key={duel.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">{duel.wodName}</span>
                        <Badge variant="secondary">{categoryLabels[duel.category]}</Badge>
                        {duel.betMode && duel.betType === 'xp' && <Badge variant="outline">⚡ {duel.betXpAmount} XP</Badge>}
                        {duel.betMode && duel.betType === 'equipment' && <Badge variant="outline">🎰 Equipamento</Badge>}
                        {duel.betCanceledAt && <Badge variant="outline">Cancelado</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {getUserName(duel.challengerId)} vs {duel.opponentIds.map((id) => getUserName(id)).join(', ')}
                      </p>
                    </div>
                    {duel.winnerId && <p className="font-bold text-primary flex items-center gap-1"><Trophy className="h-4 w-4" /> {getUserName(duel.winnerId)}</p>}
                  </div>

                  <div className="text-sm space-y-1">
                    {allParticipants.map((participantId) => (
                      <p key={participantId}>
                        {getUserName(participantId)}: {getVisibleResult(duel, participantId)}
                      </p>
                    ))}
                    {statusKey === 'active' && (
                      <p className="italic text-muted-foreground text-xs mt-1">Os resultados serão revelados quando todos enviarem.</p>
                    )}
                  </div>

                  {statusKey === 'pending' && needsMyAcceptance && (
                    <div className="flex gap-2">
                      <Button onClick={() => acceptDuel(duel.id)}>Aceitar</Button>
                      <Button variant="outline" onClick={() => cancelDuel(duel.id)}>Recusar</Button>
                    </div>
                  )}

                  {statusKey === 'pending' && isChallenger && (
                    <div className="flex gap-2">
                      <p className="text-sm text-muted-foreground">
                        Aguardando: {duel.opponentIds.filter((id) => !duel.acceptedBy.includes(id)).map((id) => getUserName(id)).join(', ')}
                      </p>
                      <Button variant="outline" size="sm" onClick={() => cancelDuel(duel.id)}>Cancelar</Button>
                    </div>
                  )}

                  {statusKey === 'active' && mine && !mySubmitted && (
                    <div className="flex gap-2">
                      <Input
                        placeholder={isTimeScoreDuel(duel) ? 'Seu resultado (mm:ss)' : 'Seu resultado (rounds)'}
                        value={submission[duel.id] || ''}
                        inputMode={isTimeScoreDuel(duel) ? 'numeric' : 'text'}
                        onChange={(e) => {
                          const value = e.target.value;
                          const nextValue = isTimeScoreDuel(duel) ? formatDurationInput(value) : value;
                          setSubmission((prev) => ({ ...prev, [duel.id]: nextValue }));
                        }}
                      />
                      <Button onClick={() => submitResult(duel)}>Submeter</Button>
                    </div>
                  )}

                  {statusKey === 'active' && mine && mySubmitted && (
                    <p className="text-sm text-muted-foreground">✓ Você já enviou seu resultado</p>
                  )}

                  {statusKey === 'active' && mine && (
                    <div>
                      <Button variant="outline" size="sm" onClick={() => cancelDuel(duel.id)}>Cancelar duelo</Button>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default Battle;
