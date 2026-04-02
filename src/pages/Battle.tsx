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

import { Swords, Trophy, Plus, ChevronDown, Dumbbell } from 'lucide-react';
import type { DailyWod, Duel, WodCategory } from '@/lib/mockData';
import { useToast } from '@/hooks/use-toast';
import { formatDurationInput, getDurationValidationError, toDurationSeconds } from '@/lib/timeScore';
import { normalizeDuel, checkAllResultsSubmitted } from '@/lib/duelLogic';
import { grantConfiguredAvatarReward } from '@/lib/avatar-economy';
import {
  getDuels,
  createDuel as createDuelApi,
  updateDuel as updateDuelApi,
  getAllWods,
  saveWod,
  createFeedPost,
  type DuelData,
} from '@/lib/supabaseData';
import { supabase } from '@/integrations/supabase/client';

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
      if (value.value < winnerValue.value) { winnerId = id; winnerValue = value; }
    } else if (winnerValue.kind === 'rounds' && value.kind === 'rounds') {
      if (value.value > winnerValue.value) { winnerId = id; winnerValue = value; }
    }
  }
  return winnerId;
};

const getVisibleResult = (duel: DuelData, userId: string) => {
  if (duel.status === 'finished') return duel.results[userId] || 'aguardando';
  const allSubmitted = duel.opponentIds.concat(duel.challengerId).every((id) => duel.results[id]);
  const userSubmitted = Boolean(duel.results[userId]);
  if (allSubmitted) return duel.results[userId] || 'aguardando';
  return userSubmitted ? '✓ Enviado' : 'aguardando';
};

const Battle = () => {
  const { user, updateUser, getAllUsers } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [wods, setWods] = useState<DailyWod[]>([]);
  const [duels, setDuels] = useState<DuelData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedOpponents, setSelectedOpponents] = useState<string[]>([]);
  const [opponentSearch, setOpponentSearch] = useState('');
  const [wodId, setWodId] = useState('');
  const [category, setCategory] = useState<WodCategory>('rx');
  const [betMode, setBetMode] = useState(false);
  const [betType, setBetType] = useState<'none' | 'xp'>('none');
  const [betXpAmount, setBetXpAmount] = useState(100);
  const [submission, setSubmission] = useState<Record<string, string>>({});
  const [expandedDuelId, setExpandedDuelId] = useState<string | null>(null);

  const [createMode, setCreateMode] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customType, setCustomType] = useState<'For Time' | 'AMRAP' | 'EMOM'>('For Time');
  const [customDescription, setCustomDescription] = useState('');
  const [customWeight, setCustomWeight] = useState('');

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [loadedUsers, loadedWods, loadedDuels] = await Promise.all([
          getAllUsers(),
          getAllWods(),
          getDuels(),
        ]);
        setUsers(loadedUsers);
        setWods(loadedWods as any);
        setDuels(loadedDuels.filter((duel) => String(duel.status).toLowerCase() !== 'canceled'));
        if (loadedWods[0]) setWodId(loadedWods[0].id);
      } catch (err) {
        console.error('Error loading battle data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [getAllUsers]);

  const opponents = users.filter((item) => item.id !== user?.id);

  const isTimeScoreDuel = (duel: DuelData) => {
    const duelWod = wods.find((item) => item.id === duel.wodId);
    return (duelWod as any)?.type === 'For Time';
  };

  const handleCreateDuel = async () => {
    if (!user || selectedOpponents.length === 0) {
      toast({ title: 'Erro', description: 'Selecione pelo menos um oponente.', variant: 'destructive' });
      return;
    }

    if (betMode && betType === 'xp' && betXpAmount > (user.xp || 0)) {
      toast({ title: 'XP insuficiente', description: 'Você não pode apostar mais XP do que possui.', variant: 'destructive' });
      return;
    }

    if (betMode && betType === 'xp' && betXpAmount) {
      for (const opponentId of selectedOpponents) {
        const opponent = users.find((u) => u.id === opponentId);
        if (!opponent || (opponent.xp || 0) < betXpAmount) {
          toast({ title: 'XP insuficiente', description: `${opponent?.name || 'Um oponente'} não possui XP suficiente.`, variant: 'destructive' });
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
      try {
        await saveWod(newWod, user.id);
        setWods((prev) => [newWod, ...prev]);
      } catch {
        toast({ title: 'Erro', description: 'Falha ao salvar WOD personalizado.', variant: 'destructive' });
        return;
      }
      selectedWod = newWod;
    } else {
      const found = wods.find((item) => item.id === wodId);
      if (!found) return;
      selectedWod = found as any;
    }

    const allParticipants = [user.id, ...selectedOpponents];
    const results: Record<string, string | null> = {};
    allParticipants.forEach((id) => { results[id] = null; });

    const duel: DuelData = {
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

    try {
      await createDuelApi(duel);
      setDuels((prev) => [duel, ...prev]);
      toast({ title: 'Duelo criado!', description: `WOD: ${selectedWod.name}. Os oponentes precisam aceitar o duelo.` });
      setBetMode(false);
      setBetType('none');
      setBetXpAmount(100);
      setCreateMode(false);
      setCustomName('');
      setCustomDescription('');
      setCustomWeight('');
      setSelectedOpponents([]);
    } catch {
      toast({ title: 'Erro', description: 'Falha ao criar duelo no servidor.', variant: 'destructive' });
    }
  };

  const acceptDuel = async (duelId: string) => {
    if (!user) return;
    const target = duels.find((item) => item.id === duelId);
    if (!target || target.status === 'finished' || !target.opponentIds.includes(user.id)) return;

    const newAcceptedBy = [...target.acceptedBy, user.id];
    const allAccepted = newAcceptedBy.length === target.opponentIds.length;

    const updates: Record<string, any> = {
      acceptedBy: newAcceptedBy,
      status: allAccepted ? 'active' : 'pending',
    };

    // Reserve XP when duel becomes active
    if (allAccepted && !target.betReserved && target.betMode && target.betType === 'xp' && target.betXpAmount) {
      const amount = target.betXpAmount;
      const allParticipants = [target.challengerId, ...target.opponentIds];

      // Deduct XP from all participants via profiles
      for (const pid of allParticipants) {
        const p = users.find((u) => u.id === pid);
        if (p) {
          const newXp = Math.max(0, (p.xp || 0) - amount);
          await supabase.from('profiles').update({ xp: newXp, level: Math.floor(newXp / 500) + 1 }).eq('id', pid);
          if (pid === user.id) updateUser({ xp: newXp, level: Math.floor(newXp / 500) + 1 });
        }
      }
      updates.betReserved = true;
      updates.betReservedAt = Date.now();
    }

    try {
      await updateDuelApi(duelId, updates);
      setDuels((prev) => prev.map((d) => d.id === duelId ? { ...d, ...updates } : d));
      toast({ title: 'Duelo aceito', description: 'Você aceitou o duelo.' });
    } catch {
      toast({ title: 'Erro', description: 'Falha ao aceitar duelo.', variant: 'destructive' });
    }
  };

  const cancelDuel = async (duelId: string) => {
    if (!user) return;
    const target = duels.find((item) => item.id === duelId);
    if (!target || target.status === 'finished') return;
    if (target.challengerId !== user.id && !target.opponentIds.includes(user.id)) return;

    // Refund XP if bet was reserved
    if (target.betMode && target.betType === 'xp' && target.betXpAmount && target.betReserved && !target.betSettledAt) {
      const amount = target.betXpAmount;
      const allParticipants = [target.challengerId, ...target.opponentIds];
      for (const pid of allParticipants) {
        const p = users.find((u) => u.id === pid);
        if (p) {
          const newXp = (p.xp || 0) + amount;
          await supabase.from('profiles').update({ xp: newXp, level: Math.floor(newXp / 500) + 1 }).eq('id', pid);
          if (pid === user.id) updateUser({ xp: newXp, level: Math.floor(newXp / 500) + 1 });
        }
      }
    }

    const updates = { status: 'finished' as const, winnerId: null, betCanceledAt: Date.now() };
    try {
      await updateDuelApi(duelId, updates);
      setDuels((prev) => prev.map((d) => d.id === duelId ? { ...d, ...updates } : d));
      toast({ title: 'Duelo cancelado', description: 'O duelo foi removido e as apostas devolvidas (se houver).' });
    } catch {
      toast({ title: 'Erro', description: 'Falha ao cancelar duelo.', variant: 'destructive' });
    }
  };

  const submitResult = async (duel: DuelData) => {
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

    const newResults = { ...duel.results, [user.id]: result };
    const allParticipants = [duel.challengerId, ...duel.opponentIds];
    const allSubmitted = allParticipants.every((id) => newResults[id]);

    if (allSubmitted && duel.status !== 'finished') {
      const winnerId = pickWinner(newResults as Record<string, string>, allParticipants);

      if (winnerId) {
        const updates: Partial<DuelData> & Record<string, any> = {
          results: newResults,
          status: 'finished' as const,
          winnerId,
        };

        // Settle bet: refund all, then award winner
        if (duel.betMode && duel.betType === 'xp' && duel.betXpAmount && duel.betReserved && !duel.betSettledAt) {
          const amount = duel.betXpAmount;
          const losers = allParticipants.filter((id) => id !== winnerId);
          const winnings = amount * losers.length;

          // Refund all participants, then give winner the extra
          for (const pid of allParticipants) {
            const p = users.find((u) => u.id === pid);
            if (p) {
              let newXp = (p.xp || 0) + amount; // refund
              if (pid === winnerId) newXp += winnings; // winner bonus
              await supabase.from('profiles').update({ xp: newXp, level: Math.floor(newXp / 500) + 1 }).eq('id', pid);
              if (pid === user.id) updateUser({ xp: newXp, level: Math.floor(newXp / 500) + 1 });
            }
          }
          updates.betSettledAt = Date.now();
        }

        // Update winner stats
        const winner = users.find((u) => u.id === winnerId);
        if (winner) {
          const newWins = (winner.wins || 0) + 1;
          await supabase.from('profiles').update({ wins: newWins }).eq('id', winnerId);
          if (winnerId === user.id) updateUser({ wins: newWins });
        }

        // Update battles count for all
        for (const pid of allParticipants) {
          const p = users.find((u) => u.id === pid);
          if (p) {
            const newBattles = (p.battles || 0) + 1;
            await supabase.from('profiles').update({ battles: newBattles }).eq('id', pid);
            if (pid === user.id) updateUser({ battles: newBattles });
          }
        }

        // Victory XP for winner (non-bet bonus)
        if (winnerId === user.id) {
          const xpGain = 150;
          const currentXp = users.find((u) => u.id === user.id)?.xp || user.xp || 0;
          const betRefund = (duel.betMode && duel.betType === 'xp' && duel.betXpAmount) ? duel.betXpAmount : 0;
          const losers = allParticipants.filter((id) => id !== winnerId);
          const winnings = betRefund * losers.length;
          const newXp = currentXp + betRefund + winnings + xpGain;
          await supabase.from('profiles').update({ xp: newXp, level: Math.floor(newXp / 500) + 1 }).eq('id', user.id);
          updateUser({ xp: newXp, level: Math.floor(newXp / 500) + 1 });
          toast({ title: 'Vitória no duelo! 🏆', description: `+${xpGain} XP.` });
        } else {
          toast({ title: 'Duelo finalizado', description: `${winner?.name || 'Outro atleta'} venceu.` });
        }

        for (const participantId of allParticipants) {
          await grantConfiguredAvatarReward(participantId, 'coins_per_duel_participation', 'duel_participation', duel.id);
        }
        await grantConfiguredAvatarReward(winnerId, 'coins_per_duel_win', 'duel_win', duel.id);

        // Feed post
        try {
          await createFeedPost({
            id: `post_${Date.now()}`,
            userId: winnerId,
            content: `Venceu duelo em ${duel.wodName} (${categoryLabels[duel.category as WodCategory]}).`,
            wodName: 'Duelos',
            timeDisplay: 'Vitória',
          });
        } catch { /* non-critical */ }

        try {
          await updateDuelApi(duel.id, updates);
          setDuels((prev) => prev.map((d) => d.id === duel.id ? { ...d, ...updates } : d));
        } catch {
          toast({ title: 'Erro', description: 'Falha ao finalizar duelo.', variant: 'destructive' });
        }
      }
    } else {
      // Just save the partial result
      try {
        await updateDuelApi(duel.id, { results: newResults });
        setDuels((prev) => prev.map((d) => d.id === duel.id ? { ...d, results: newResults } : d));
      } catch {
        toast({ title: 'Erro', description: 'Falha ao submeter resultado.', variant: 'destructive' });
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
            onClick={handleCreateDuel} 
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
                  <div
                    className="flex items-center justify-between cursor-pointer group"
                    onClick={() => setExpandedDuelId(expandedDuelId === duel.id ? null : duel.id)}
                  >
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">{duel.wodName}</span>
                        <Badge variant="secondary">{categoryLabels[duel.category as WodCategory]}</Badge>
                        {duel.betMode && duel.betType === 'xp' && <Badge variant="outline">⚡ {duel.betXpAmount} XP</Badge>}
                        {duel.betCanceledAt && <Badge variant="outline">Cancelado</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {getUserName(duel.challengerId)} vs {duel.opponentIds.map((id) => getUserName(id)).join(', ')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {duel.winnerId && <p className="font-bold text-primary flex items-center gap-1"><Trophy className="h-4 w-4" /> {getUserName(duel.winnerId)}</p>}
                      <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${expandedDuelId === duel.id ? 'rotate-180' : ''}`} />
                    </div>
                  </div>

                  {expandedDuelId === duel.id && (() => {
                    const duelWod = wods.find((w) => w.id === duel.wodId);
                    if (!duelWod) return <p className="text-sm text-muted-foreground">WOD não encontrado.</p>;
                    const version = (duelWod as any).versions?.[duel.category];
                    return (
                      <div className="rounded-md bg-muted/50 p-3 space-y-1 border border-border/50">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Dumbbell className="h-4 w-4 text-primary" />
                          <span>{(duelWod as any).type}</span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{version?.description || 'Sem descrição'}</p>
                        {version?.weight && (
                          <p className="text-xs text-muted-foreground">Peso: {version.weight}</p>
                        )}
                      </div>
                    );
                  })()}

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
