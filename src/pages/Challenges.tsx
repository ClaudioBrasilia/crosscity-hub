import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Flame, Calendar, Trophy, Gift, Plus, Trash2, ChevronUp, Camera, ImageIcon, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import * as dbService from '@/lib/supabaseData';
import { getAvatarEconomySettings, grantAvatarReward } from '@/lib/avatar-economy';

const ICONS = ['🔥', '💪', '🏃', '🎯', '⚡', '🏋️', '🫀', '⚔️', '👑', '✅', '🔗', '🥇'];

const ChallengeCard = ({ challenge, userId, isCoach, onClaim, onIncrement, onDelete, progress: initialProgress, isClaimed: initialClaimed }: {
  challenge: dbService.ChallengeData; userId: string; isCoach: boolean;
  progress: number; isClaimed: boolean;
  onClaim: (c: dbService.ChallengeData) => void;
  onIncrement: (c: dbService.ChallengeData) => void;
  onDelete: (id: string) => void;
}) => {
  const progress = initialProgress;
  const isClaimed = initialClaimed;
  const isComplete = progress >= challenge.target;
  const pct = Math.min((progress / challenge.target) * 100, 100);
  const [showProofUpload, setShowProofUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [proofCount, setProofCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    dbService.getChallengeProofs(challenge.id, userId).then(p => setProofCount(p.length));
  }, [challenge.id, userId, progress]);

  const handleIncrementWithProof = async (file?: File) => {
    if (file && userId) {
      setUploading(true);
      try {
        const ext = file.name.split('.').pop() || 'jpg';
        const path = `${userId}/${challenge.id}/${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from('challenge-proofs').upload(path, file, { upsert: false });
        if (!error) {
          const { data: urlData } = supabase.storage.from('challenge-proofs').getPublicUrl(path);
          await dbService.saveChallengeProof(challenge.id, userId, urlData.publicUrl, progress + 1);
          toast({ title: '📸 Foto enviada!' });
        }
      } catch { /* silent */ }
      setUploading(false);
    }
    onIncrement(challenge);
    setShowProofUpload(false);
    setProofPreview(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast({ title: 'Arquivo muito grande', variant: 'destructive' }); return; }
    const reader = new FileReader();
    reader.onload = () => setProofPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <Card className={`border-primary/20 transition-all ${isComplete && !isClaimed ? 'ring-2 ring-secondary/50' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="text-3xl">{challenge.icon}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-sm">{challenge.name}</h3>
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${challenge.type === 'weekly' ? 'bg-primary/20 text-primary border-primary/30' : 'bg-secondary/20 text-secondary border-secondary/30'}`}>
                {challenge.type === 'weekly' ? 'Semanal' : 'Mensal'}
              </Badge>
              {proofCount > 0 && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-accent/20 text-accent-foreground border-accent/30">
                  <ImageIcon className="h-2.5 w-2.5 mr-0.5" /> {proofCount} foto{proofCount > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{challenge.description}</p>
            <div className="mt-3 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span>{progress}/{challenge.target} {challenge.unit}</span>
                <span className="font-semibold text-secondary">+{challenge.xpReward} XP</span>
              </div>
              <Progress value={pct} className="h-2" />
            </div>
            <div className="flex gap-2 mt-3">
              {!isComplete && !isClaimed && !showProofUpload && (
                <Button size="sm" variant="outline" className="gap-1.5 flex-1" onClick={() => setShowProofUpload(true)}>
                  <ChevronUp className="h-3.5 w-3.5" /> +1 Progresso
                </Button>
              )}
              {isComplete && !isClaimed && (
                <Button size="sm" className="gap-2 flex-1" onClick={() => onClaim(challenge)}>
                  <Gift className="h-3.5 w-3.5" /> Resgatar Recompensa
                </Button>
              )}
              {isClaimed && <div className="flex-1 text-center text-xs font-semibold text-green-400">✓ Recompensa resgatada</div>}
              {isCoach && (
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => onDelete(challenge.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            {showProofUpload && !isComplete && !isClaimed && (
              <div className="mt-3 rounded-lg border border-primary/20 bg-muted/30 p-3 space-y-3">
                <p className="text-xs text-muted-foreground">Adicione uma foto como prova (opcional):</p>
                <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelect} />
                {proofPreview ? (
                  <div className="relative">
                    <img src={proofPreview} alt="Prova" className="w-full h-32 object-cover rounded-md" />
                    <Button size="sm" variant="ghost" className="absolute top-1 right-1 h-6 w-6 p-0 bg-background/80" onClick={() => { setProofPreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}>✕</Button>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" className="w-full gap-1.5" onClick={() => fileInputRef.current?.click()}>
                    <Camera className="h-3.5 w-3.5" /> Tirar foto / Escolher
                  </Button>
                )}
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1 gap-1.5" disabled={uploading} onClick={() => handleIncrementWithProof(fileInputRef.current?.files?.[0])}>
                    {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ChevronUp className="h-3.5 w-3.5" />}
                    {proofPreview ? 'Enviar com foto' : 'Registrar sem foto'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setShowProofUpload(false); setProofPreview(null); }}>Cancelar</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const CreateChallengeForm = ({ onCreated, userId }: { onCreated: () => void; userId?: string }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('🔥');
  const [type, setType] = useState<'weekly' | 'monthly'>('weekly');
  const [target, setTarget] = useState('5');
  const [unit, setUnit] = useState('vezes');
  const [xpReward, setXpReward] = useState('150');
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!name.trim()) return;
    const now = new Date();
    let startDate: string, endDate: string;
    if (type === 'weekly') {
      const day = now.getDay();
      const monday = new Date(now); monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
      const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
      startDate = monday.toISOString().split('T')[0];
      endDate = sunday.toISOString().split('T')[0];
    } else {
      startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      endDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${lastDay}`;
    }
    try {
      await dbService.addChallenge({
        name: name.trim(), description: description.trim(), icon, type,
        xpReward: Number(xpReward) || 100, target: Number(target) || 1, unit: unit.trim() || 'vezes',
        startDate, endDate,
      }, userId);
      toast({ title: '✅ Desafio criado!' });
      onCreated();
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2"><Label>Nome</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Semana do Cardio" /></div>
      <div className="space-y-2"><Label>Descrição</Label><Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex: Complete 5 treinos" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2"><Label>Tipo</Label><Select value={type} onValueChange={v => setType(v as any)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="weekly">Semanal</SelectItem><SelectItem value="monthly">Mensal</SelectItem></SelectContent></Select></div>
        <div className="space-y-2"><Label>Ícone</Label><Select value={icon} onValueChange={setIcon}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ICONS.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent></Select></div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2"><Label>Meta</Label><Input type="number" value={target} onChange={e => setTarget(e.target.value)} min="1" /></div>
        <div className="space-y-2"><Label>Unidade</Label><Input value={unit} onChange={e => setUnit(e.target.value)} /></div>
        <div className="space-y-2"><Label>XP</Label><Input type="number" value={xpReward} onChange={e => setXpReward(e.target.value)} min="10" /></div>
      </div>
      <DialogClose asChild><Button className="w-full" onClick={handleSubmit} disabled={!name.trim()}><Plus className="h-4 w-4 mr-2" /> Criar Desafio</Button></DialogClose>
    </div>
  );
};

const Challenges = () => {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [tick, setTick] = useState(0);
  const isCoach = user?.role === 'coach' || user?.role === 'admin';

  const [challenges, setChallenges] = useState<dbService.ChallengeData[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [doneToday, setDoneToday] = useState<Record<string, boolean>>({});

  const loadData = useCallback(async () => {
    if (!user) return;
    const [challs, completed] = await Promise.all([
      dbService.getActiveChallenges(),
      dbService.getCompletedChallenges(user.id),
    ]);
    setChallenges(challs);
    setCompletedIds(completed);

    const pm: Record<string, number> = {};
    const dt: Record<string, boolean> = {};
    const today = new Date().toDateString();
    for (const c of challs) {
      pm[c.id] = await dbService.getChallengeProgress(c.id, user.id);
      const updatedAt = await dbService.getChallengeProgressUpdatedAt(c.id, user.id);
      dt[c.id] = updatedAt ? new Date(updatedAt).toDateString() === today : false;
    }
    setProgressMap(pm);
    setDoneToday(dt);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData, tick]);

  const weekly = challenges.filter(c => c.type === 'weekly');
  const monthly = challenges.filter(c => c.type === 'monthly');
  const totalXpEarned = challenges.filter(c => completedIds.includes(c.id)).reduce((sum, c) => sum + c.xpReward, 0);

  const handleClaim = async (challenge: dbService.ChallengeData) => {
    if (!user) return;
    try {
      const wasNewCompletion = await dbService.markChallengeComplete(user.id, challenge.id);
      let grantedCoins = false;
      let challengeCoins = 0;
      if (wasNewCompletion) {
        const economy = await getAvatarEconomySettings();
        challengeCoins = economy?.coins_per_challenge_completion_enabled ? economy?.coins_per_challenge_completion || 0 : 0;
        grantedCoins = challengeCoins > 0
          ? await grantAvatarReward(user.id, 'challenge_completion', challenge.id, challengeCoins)
          : false;
      }

      if (wasNewCompletion) {
        const newXp = (user.xp || 0) + challenge.xpReward;
        await updateUser({ xp: newXp, level: Math.floor(newXp / 500) + 1 });
      }

      toast({
        title: `🎉 Desafio "${challenge.name}" concluído!`,
        description: !wasNewCompletion
          ? 'Recompensa já resgatada anteriormente.'
          : grantedCoins
          ? `+${challenge.xpReward} XP e +${challengeCoins} BrazaCoin no avatar.`
          : `+${challenge.xpReward} XP.`,
      });
      setTick(t => t + 1);
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  const handleIncrement = async (challenge: dbService.ChallengeData) => {
    if (!user) return;
    try {
      await dbService.incrementChallengeProgress(challenge.id, user.id);
      setTick(t => t + 1);
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await dbService.removeChallenge(id);
      toast({ title: 'Desafio removido' });
      setTick(t => t + 1);
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Flame className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Desafios</h1>
            <p className="text-muted-foreground text-sm">{isCoach ? 'Crie desafios' : 'Complete e ganhe XP'}</p>
          </div>
        </div>
        {isCoach && (
          <Dialog>
            <DialogTrigger asChild><Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> Novo</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Criar Desafio</DialogTitle></DialogHeader>
              <CreateChallengeForm onCreated={() => setTick(t => t + 1)} userId={user?.id} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="border-primary/20"><CardContent className="p-3 text-center"><Trophy className="h-5 w-5 mx-auto mb-1 text-secondary" /><p className="text-xl font-bold">{completedIds.length}/{challenges.length}</p><p className="text-[10px] text-muted-foreground">Concluídos</p></CardContent></Card>
        <Card className="border-primary/20"><CardContent className="p-3 text-center"><Gift className="h-5 w-5 mx-auto mb-1 text-primary" /><p className="text-xl font-bold">{totalXpEarned}</p><p className="text-[10px] text-muted-foreground">XP ganhos</p></CardContent></Card>
        <Card className="border-primary/20"><CardContent className="p-3 text-center"><Calendar className="h-5 w-5 mx-auto mb-1 text-secondary" /><p className="text-xl font-bold">{challenges.length - completedIds.length}</p><p className="text-[10px] text-muted-foreground">Pendentes</p></CardContent></Card>
      </div>

      {challenges.length === 0 ? (
        <Card className="border-dashed border-primary/30">
          <CardContent className="p-8 text-center space-y-3">
            <Flame className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <p className="text-muted-foreground">Nenhum desafio ativo.</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="weekly">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="weekly" className="gap-1.5"><Flame className="h-3.5 w-3.5" /> Semanais ({weekly.length})</TabsTrigger>
            <TabsTrigger value="monthly" className="gap-1.5"><Calendar className="h-3.5 w-3.5" /> Mensal ({monthly.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="weekly" className="space-y-3 mt-4">
            {weekly.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">Nenhum desafio semanal.</p> : weekly.map(c => (
              <ChallengeCard key={c.id} challenge={c} userId={user?.id || ''} isCoach={isCoach} progress={progressMap[c.id] || 0} isClaimed={completedIds.includes(c.id)} onClaim={handleClaim} onIncrement={handleIncrement} onDelete={handleDelete} />
            ))}
          </TabsContent>
          <TabsContent value="monthly" className="space-y-3 mt-4">
            {monthly.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">Nenhum desafio mensal.</p> : monthly.map(c => (
              <ChallengeCard key={c.id} challenge={c} userId={user?.id || ''} isCoach={isCoach} progress={progressMap[c.id] || 0} isClaimed={completedIds.includes(c.id)} onClaim={handleClaim} onIncrement={handleIncrement} onDelete={handleDelete} />
            ))}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default Challenges;
