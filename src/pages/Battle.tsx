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
import { equipmentCatalog, getNextEquipment } from '@/lib/equipmentData';
import type { DailyWod, Duel, WodCategory } from '@/lib/mockData';
import { useToast } from '@/hooks/use-toast';

const categoryLabels: Record<WodCategory, string> = {
  rx: 'RX',
  scaled: 'Scaled',
  beginner: 'Iniciante',
};

const toValue = (result: string) => {
  if (result.includes(':')) {
    const [m, s] = result.split(':').map(Number);
    if (Number.isNaN(m) || Number.isNaN(s)) return { kind: 'time' as const, value: Number.POSITIVE_INFINITY };
    return { kind: 'time' as const, value: m * 60 + s };
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
  const [betType, setBetType] = useState<'equipment' | 'xp'>('equipment');
  const [betItem, setBetItem] = useState('');
  const [betXpAmount, setBetXpAmount] = useState(100);
  const [submission, setSubmission] = useState<Record<string, string>>({});

  // Custom WOD creation
  const [createMode, setCreateMode] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customType, setCustomType] = useState<'For Time' | 'AMRAP' | 'EMOM'>('For Time');
  const [customDescription, setCustomDescription] = useState('');
  const [customWeight, setCustomWeight] = useState('');

  useEffect(() => {
    const loadedUsers = JSON.parse(localStorage.getItem('crosscity_users') || '[]');
    const loadedWods = JSON.parse(localStorage.getItem('crosscity_daily_wods') || '[]');
    const loadedDuels = JSON.parse(localStorage.getItem('crosscity_duels') || '[]');
    setUsers(loadedUsers);
    setWods(loadedWods);
    setDuels(loadedDuels);
    if (loadedWods[0]) setWodId(loadedWods[0].id);
  }, []);

  const currentUserInventory: string[] = JSON.parse(localStorage.getItem(`crosscity_inventory_${user?.id}`) || '[]');
  const canBet = (user?.level || 0) >= 10;
  const opponents = users.filter((item) => item.id !== user?.id);

  const saveDuels = (items: Duel[]) => {
    setDuels(items);
    localStorage.setItem('crosscity_duels', JSON.stringify(items));
  };

  const createDuel = () => {
    if (!user || !opponentId) return;

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
      status: 'active',
      winnerId: null,
      betMode,
      betType: betMode ? betType : null,
      betItems: betMode && betType === 'equipment' && betItem ? [betItem] : [],
      betXpAmount: betMode && betType === 'xp' ? betXpAmount : null,
      createdAt: Date.now(),
    };

    saveDuels([duel, ...duels]);
    toast({ title: 'Duelo criado!', description: `WOD: ${selectedWod.name}. Agora os dois atletas podem submeter o resultado real.` });
    setBetMode(false);
    setBetItem('');
    setBetType('equipment');
    setBetXpAmount(100);
    setCreateMode(false);
    setCustomName('');
    setCustomDescription('');
    setCustomWeight('');
  };

  const submitResult = (duel: Duel) => {
    if (!user) return;
    const value = submission[duel.id];
    if (!value) {
      toast({ title: 'Informe o resultado', description: 'Use formato mm:ss ou rounds.', variant: 'destructive' });
      return;
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
      if (winnerId === user.id && user) {
        const currentWins = Number(localStorage.getItem(`crosscity_wins_${user.id}`) || '0') + 1;
        localStorage.setItem(`crosscity_wins_${user.id}`, String(currentWins));

        let inventory = [...currentUserInventory];
        if (changed.betMode && changed.betItems.length > 0) {
          inventory = [...new Set([...inventory, ...changed.betItems])];
        } else {
          const reward = getNextEquipment(currentWins);
          if (reward) inventory = [...new Set([...inventory, reward.id])];
        }
        localStorage.setItem(`crosscity_inventory_${user.id}`, JSON.stringify(inventory));

        const newXp = (user.xp || 0) + 150;
        updateUser({ xp: newXp, level: Math.floor(newXp / 500) + 1 });
        toast({ title: 'Vitória no duelo! 🏆', description: '+150 XP e recompensa adicionada no Meu Box.' });
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
            <div className="space-y-2 p-3 border rounded-lg bg-secondary/10">
              <div className="flex items-center justify-between">
                <Label>Modo aposta (nível 10+)</Label>
                <Switch checked={betMode} onCheckedChange={setBetMode} />
              </div>
              {betMode && (
                <Select value={betItem} onValueChange={setBetItem}>
                  <SelectTrigger><SelectValue placeholder="Escolha equipamento da aposta" /></SelectTrigger>
                  <SelectContent>
                    {currentUserInventory.map((eqId) => {
                      const equipment = equipmentCatalog.find((item) => item.id === eqId);
                      return equipment ? <SelectItem key={equipment.id} value={equipment.id}>{equipment.emoji} {equipment.name}</SelectItem> : null;
                    })}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          <Button className="md:col-span-2" onClick={createDuel} disabled={!opponentId || (!createMode && !wodId) || (createMode && (!customName || !customDescription)) || (betMode && !betItem)}>
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
                      <p className="font-semibold">{duel.wodName} <Badge variant="secondary">{categoryLabels[duel.category]}</Badge></p>
                      <p className="text-sm text-muted-foreground">{getUserName(duel.challengerId)} vs {getUserName(duel.opponentId)}</p>
                    </div>
                    {duel.winnerId && <p className="font-bold text-primary flex items-center gap-1"><Trophy className="h-4 w-4" /> {getUserName(duel.winnerId)}</p>}
                  </div>

                  <div className="text-sm">
                    <p>Desafiante: {duel.challengerResult || 'aguardando'}</p>
                    <p>Oponente: {duel.opponentResult || 'aguardando'}</p>
                  </div>

                  {statusKey === 'active' && mine && (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Seu resultado (mm:ss ou rounds)"
                        value={submission[duel.id] || ''}
                        onChange={(e) => setSubmission((prev) => ({ ...prev, [duel.id]: e.target.value }))}
                      />
                      <Button onClick={() => submitResult(duel)} disabled={!!mySubmitted}>Submeter</Button>
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
