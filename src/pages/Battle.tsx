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

const pickWinner = (a: string, b: string, aId: string, bId: string) => {
  const av = toValue(a);
  const bv = toValue(b);
  if (av.kind === 'time' && bv.kind === 'time') return av.value <= bv.value ? aId : bId;
  return av.value >= bv.value ? aId : bId;
};

const getVisibleResult = (duel: Duel, role: 'challenger' | 'opponent') => {
  if (duel.status === 'finished') {
    return role === 'challenger' ? duel.challengerResult || 'aguardando' : duel.opponentResult || 'aguardando';
  }

  const challengerSubmitted = Boolean(duel.challengerResult);
  const opponentSubmitted = Boolean(duel.opponentResult);
  const bothSubmitted = challengerSubmitted && opponentSubmitted;

  if (bothSubmitted) {
    return role === 'challenger' ? duel.challengerResult || 'aguardando' : duel.opponentResult || 'aguardando';
  }

  if (role === 'challenger') return challengerSubmitted ? '✓ Enviado' : 'aguardando';
  return opponentSubmitted ? '✓ Enviado' : 'aguardando';
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

const normalizeDuel = (item: any): Duel => ({
  ...item,
  status: item?.status === 'pending' || item?.status === 'active' || item?.status === 'finished' ? item.status : 'active',
  winnerId: item?.winnerId ?? null,
  betMode: Boolean(item?.betMode),
  betType: item?.betType === 'xp' || item?.betType === 'equipment' ? item.betType : null,
  betItems: Array.isArray(item?.betItems) ? item.betItems : [],
  betXpAmount: typeof item?.betXpAmount === 'number' ? item.betXpAmount : null,
  betAccepted: Boolean(item?.betAccepted),
  betReserved: Boolean(item?.betReserved),
  betReservedAt: typeof item?.betReservedAt === 'number' ? item.betReservedAt : null,
  betSettledAt: typeof item?.betSettledAt === 'number' ? item.betSettledAt : null,
  betCanceledAt: typeof item?.betCanceledAt === 'number' ? item.betCanceledAt : null,
});

const Battle = () => {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [wods, setWods] = useState<DailyWod[]>([]);
  const [duels, setDuels] = useState<Duel[]>([]);

  const [opponentId, setOpponentId] = useState('');
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

  const canBet = (user?.level || 0) >= 10;
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
    if (!user || !opponentId) return;

    if (betMode && betType === 'xp' && betXpAmount > (user.xp || 0)) {
      toast({ title: 'XP insuficiente', description: 'Você não pode apostar mais XP do que possui.', variant: 'destructive' });
      return;
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

    const duel: Duel = {
      id: `duel_${Date.now()}`,
      wodId: selectedWod.id,
      wodName: selectedWod.name,
      category,
      challengerId: user.id,
      opponentId,
      challengerResult: null,
      opponentResult: null,
      status: 'pending',
      winnerId: null,
      betMode,
      betType: betMode && betType === 'xp' ? 'xp' : null,
      betItems: [],
      betXpAmount: betMode && betType === 'xp' ? betXpAmount : null,
      betAccepted: false,
      betReserved: false,
      betReservedAt: null,
      betSettledAt: null,
      betCanceledAt: null,
      createdAt: Date.now(),
    };

    saveDuels([duel, ...duels]);
    toast({ title: 'Duelo criado!', description: `WOD: ${selectedWod.name}. O oponente precisa aceitar o duelo.` });
    setBetMode(false);
    setBetType('none');
    setBetXpAmount(100);
    setCreateMode(false);
    setCustomName('');
    setCustomDescription('');
    setCustomWeight('');
  };

  const acceptDuel = (duelId: string) => {
    if (!user) return;

    const storedDuels: Duel[] = JSON.parse(localStorage.getItem('crosscity_duels') || '[]');
    const target = storedDuels.find((item) => item.id === duelId);
    if (!target || target.status !== 'pending' || target.opponentId !== user.id) return;

    let storedUsers = JSON.parse(localStorage.getItem('crosscity_users') || '[]');
    const challenger = storedUsers.find((item: any) => item.id === target.challengerId);
    const opponent = storedUsers.find((item: any) => item.id === target.opponentId);

    if (target.betMode && target.betType === 'xp' && target.betXpAmount) {
      const amount = target.betXpAmount;
      if (!challenger || !opponent || challenger.xp < amount || opponent.xp < amount) {
        toast({ title: 'XP insuficiente', description: 'Um dos atletas não possui XP suficiente para confirmar a aposta.', variant: 'destructive' });
        return;
      }

      storedUsers = storedUsers.map((item: any) => {
        if (item.id === challenger.id || item.id === opponent.id) {
          return { ...item, xp: item.xp - amount, level: Math.floor((item.xp - amount) / 500) + 1 };
        }
        return item;
      });
      syncUsers(storedUsers);
    }

    const nextDuels = storedDuels.map((item) => (
      item.id === duelId
        ? {
          ...item,
          status: 'active',
          betAccepted: true,
          betReserved: Boolean(item.betMode && item.betType === 'xp' && item.betXpAmount),
          betReservedAt: item.betMode && item.betType === 'xp' && item.betXpAmount ? Date.now() : null,
        }
        : item
    ));

    saveDuels(nextDuels);
    toast({ title: 'Duelo aceito', description: 'Duelo confirmado e pronto para envio de resultados.' });
  };

  const cancelDuel = (duelId: string) => {
    if (!user) return;
    const storedDuels: Duel[] = JSON.parse(localStorage.getItem('crosscity_duels') || '[]');
    const target = storedDuels.find((item) => item.id === duelId);
    if (!target || target.status === 'finished') return;
    if (target.challengerId !== user.id && target.opponentId !== user.id) return;

    if (target.betMode && target.betType === 'xp' && target.betXpAmount && target.betReserved && !target.betSettledAt) {
      const amount = target.betXpAmount;
      const storedUsers = JSON.parse(localStorage.getItem('crosscity_users') || '[]');
      const nextUsers = storedUsers.map((item: any) => {
        if (item.id === target.challengerId || item.id === target.opponentId) {
          return { ...item, xp: item.xp + amount, level: Math.floor((item.xp + amount) / 500) + 1 };
        }
        return item;
      });
      syncUsers(nextUsers);
    }

    const nextDuels = storedDuels.map((item) => (
      item.id === duelId
        ? { ...item, status: 'finished', winnerId: null, betCanceledAt: Date.now() }
        : item
    ));
    saveDuels(nextDuels);
    toast({ title: 'Duelo cancelado', description: 'A aposta foi desfeita com segurança.' });
  };

  const submitResult = (duel: Duel) => {
    if (!user) return;
    const value = submission[duel.id];
    if (!value) {
      toast({ title: 'Informe o resultado', description: 'Use formato mm:ss ou rounds.', variant: 'destructive' });
      return;
    }

    if (isTimeScoreDuel(duel)) {
      const timeError = getDurationValidationError(value);
      if (timeError) {
        toast({ title: 'Tempo inválido', description: timeError, variant: 'destructive' });
        return;
      }
    }

    let updated = duels.map((item) => {
      if (item.id !== duel.id) return item;
      if (item.challengerId === user.id) return { ...item, challengerResult: value };
      if (item.opponentId === user.id) return { ...item, opponentResult: value };
      return item;
    });

    const changed = updated.find((item) => item.id === duel.id);
    if (changed?.challengerResult && changed.opponentResult && changed.status !== 'finished') {
      const winnerId = pickWinner(changed.challengerResult, changed.opponentResult, changed.challengerId, changed.opponentId);
      updated = updated.map((item) =>
        item.id === duel.id ? { ...item, status: 'finished', winnerId } : item
      );

      const winner = users.find((item) => item.id === winnerId);
      const loserId = winnerId === changed.challengerId ? changed.opponentId : changed.challengerId;

      if (changed.betMode && changed.betType === 'xp' && changed.betXpAmount) {
        const storedDuels: Duel[] = JSON.parse(localStorage.getItem('crosscity_duels') || '[]');
        const latest = storedDuels.find((item) => item.id === changed.id);
        if (latest?.betSettledAt) {
          saveDuels(updated);
          setSubmission((prev) => ({ ...prev, [duel.id]: '' }));
          return;
        }

        const amount = changed.betXpAmount;
        const storedUsers = JSON.parse(localStorage.getItem('crosscity_users') || '[]');
        const nextUsers = storedUsers.map((item: any) => {
          if (changed.betReserved) {
            if (item.id === winnerId) {
              const xp = item.xp + amount * 2;
              return { ...item, xp, level: Math.floor(xp / 500) + 1 };
            }
            return item;
          }

          if (item.id === winnerId) {
            const xp = item.xp + amount;
            return { ...item, xp, level: Math.floor(xp / 500) + 1 };
          }
          if (item.id === loserId) {
            const xp = Math.max(0, item.xp - amount);
            return { ...item, xp, level: Math.floor(xp / 500) + 1 };
          }
          return item;
        });
        syncUsers(nextUsers);
        updated = updated.map((item) => item.id === changed.id ? { ...item, betSettledAt: Date.now() } : item);
      }

      if (winnerId === user.id && user) {
        const currentWins = Number(localStorage.getItem(`crosscity_wins_${user.id}`) || '0') + 1;
        localStorage.setItem(`crosscity_wins_${user.id}`, String(currentWins));

        let inventory = [...currentUserInventory];
        if (changed.betMode && changed.betType === 'equipment' && changed.betItems.length > 0) {
          inventory = [...new Set([...inventory, ...changed.betItems])];
          const loserInv: string[] = JSON.parse(localStorage.getItem(`crosscity_inventory_${loserId}`) || '[]');
          const updatedLoserInv = loserInv.filter((i) => !changed.betItems.includes(i));
          localStorage.setItem(`crosscity_inventory_${loserId}`, JSON.stringify(updatedLoserInv));
        } else if (!changed.betMode) {
          const reward = getNextEquipment(currentWins);
          if (reward) inventory = [...new Set([...inventory, reward.id])];
        }
        localStorage.setItem(`crosscity_inventory_${user.id}`, JSON.stringify(inventory));

        const xpGain = 150;
        const newXp = (user.xp || 0) + xpGain;
        updateUser({ xp: newXp, level: Math.floor(newXp / 500) + 1 });
        toast({ title: 'Vitória no duelo! 🏆', description: `+${xpGain} XP${changed.betType === 'equipment' ? ' e equipamento ganho' : ''}.` });
      } else {
        toast({ title: 'Duelo finalizado', description: `${winner?.name || 'Outro atleta'} venceu.` });
      }

      const feed = JSON.parse(localStorage.getItem('crosscity_feed') || '[]');
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
    }

    saveDuels(updated);
    setSubmission((prev) => ({ ...prev, [duel.id]: '' }));
  };

  const duelGroups = useMemo(() => ({
    pending: duels.filter((duel) => duel.status === 'pending'),
    active: duels.filter((duel) => duel.status === 'active'),
    finished: duels.filter((duel) => duel.status === 'finished'),
  }), [duels]);

  const getUserName = (id: string) => users.find((item) => item.id === id)?.name || id;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Duelos Diretos</h1>

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Swords className="h-5 w-5" /> Criar duelo 1v1</CardTitle>
          <CardDescription>Escolha colega, WOD e categoria. Cada atleta envia o resultado real após completar o treino.</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Colega</Label>
            <Select value={opponentId} onValueChange={setOpponentId}>
              <SelectTrigger><SelectValue placeholder="Selecionar colega" /></SelectTrigger>
              <SelectContent>
                {opponents.map((item) => (
                  <SelectItem key={item.id} value={item.id}>{item.avatar} {item.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <Label>WOD</Label>
              <Button variant="ghost" size="sm" onClick={() => setCreateMode(!createMode)} className="text-xs gap-1">
                <Plus className="h-3 w-3" />
                {createMode ? 'Selecionar existente' : 'Criar WOD'}
              </Button>
            </div>

            {createMode ? (
              <div className="grid md:grid-cols-2 gap-3 p-3 border rounded-lg bg-secondary/10">
                <div>
                  <Label className="text-xs">Nome do WOD</Label>
                  <Input placeholder="Ex: Death by Thrusters" value={customName} onChange={(e) => setCustomName(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Tipo</Label>
                  <Select value={customType} onValueChange={(v) => setCustomType(v as 'For Time' | 'AMRAP' | 'EMOM')}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="For Time">For Time</SelectItem>
                      <SelectItem value="AMRAP">AMRAP</SelectItem>
                      <SelectItem value="EMOM">EMOM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs">Descrição / Movimentos</Label>
                  <Textarea placeholder="Ex: 21-15-9 Thrusters e Pull-ups" value={customDescription} onChange={(e) => setCustomDescription(e.target.value)} rows={3} />
                </div>
                <div>
                  <Label className="text-xs">Carga RX (kg, opcional)</Label>
                  <Input placeholder="Ex: 43" value={customWeight} onChange={(e) => setCustomWeight(e.target.value)} />
                </div>
              </div>
            ) : (
              <Select value={wodId} onValueChange={setWodId}>
                <SelectTrigger><SelectValue placeholder="Selecionar WOD" /></SelectTrigger>
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

          {canBet && (
            <div className="space-y-3 p-3 border rounded-lg bg-secondary/10 md:col-span-2">
              <div className="flex items-center justify-between">
                <Label>Modo aposta (nível 10+)</Label>
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
                      <Label className="text-xs">Quantidade de XP (mín. 50, máx. {user?.xp || 0})</Label>
                      <Input
                        type="number"
                        min={50}
                        max={user?.xp || 0}
                        value={betXpAmount}
                        onChange={(e) => setBetXpAmount(Math.max(50, Math.min(user?.xp || 0, Number(e.target.value))))}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <Button className="md:col-span-2" onClick={createDuel} disabled={!opponentId || (!createMode && !wodId) || (createMode && (!customName || !customDescription)) || (betMode && betType === 'xp' && betXpAmount < 50)}>
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
              const mine = duel.challengerId === user?.id || duel.opponentId === user?.id;
              const mySubmitted = duel.challengerId === user?.id ? duel.challengerResult : duel.opponentId === user?.id ? duel.opponentResult : null;
              return (
                <div key={duel.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">
                        {duel.wodName} <Badge variant="secondary">{categoryLabels[duel.category]}</Badge>
                        {duel.betMode && duel.betType === 'xp' && <Badge variant="outline" className="ml-1">⚡ {duel.betXpAmount} XP</Badge>}
                        {duel.betMode && duel.betType === 'equipment' && <Badge variant="outline" className="ml-1">🎰 Equipamento</Badge>}
                        {duel.betCanceledAt && <Badge variant="outline" className="ml-1">Cancelado</Badge>}
                      </p>
                      <p className="text-sm text-muted-foreground">{getUserName(duel.challengerId)} vs {getUserName(duel.opponentId)}</p>
                    </div>
                    {duel.winnerId && <p className="font-bold text-primary flex items-center gap-1"><Trophy className="h-4 w-4" /> {getUserName(duel.winnerId)}</p>}
                  </div>

                  <div className="text-sm">
                    <p>Desafiante: {getVisibleResult(duel, 'challenger')}</p>
                    <p>Oponente: {getVisibleResult(duel, 'opponent')}</p>
                    {statusKey === 'active' && (
                      <p className="italic text-muted-foreground text-xs mt-1">Os resultados serão revelados quando ambos enviarem.</p>
                    )}
                  </div>

                  {statusKey === 'active' && mine && (
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
                      <Button onClick={() => submitResult(duel)} disabled={!!mySubmitted}>Submeter</Button>
                    </div>
                  )}

                  {statusKey === 'pending' && mine && (
                    <div className="flex gap-2">
                      {duel.opponentId === user?.id && (
                        <Button onClick={() => acceptDuel(duel.id)}>Aceitar</Button>
                      )}
                      <Button variant="outline" onClick={() => cancelDuel(duel.id)}>Cancelar</Button>
                    </div>
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
