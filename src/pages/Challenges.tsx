import { useState, useMemo, useRef } from 'react';
import { ChallengeLeaderboard } from '@/components/ChallengeLeaderboard';
import { ChallengeRankingFull } from '@/components/ChallengeRankingFull';
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
import {
  getActiveChallenges, addChallenge, removeChallenge, getChallengeProgress,
  incrementChallengeProgress, getCompletedChallenges, markChallengeComplete,
  uploadChallengeProof, getChallengeProofs,
  type Challenge, type ChallengeType,
} from '@/lib/challenges';
import { useToast } from '@/hooks/use-toast';
import { Flame, Calendar, Trophy, Gift, Plus, Trash2, ChevronUp, Camera, ImageIcon, Loader2 } from 'lucide-react';
import { DominationEnergyButton } from '@/components/DominationEnergyButton';

const ICONS = ['🔥', '💪', '🏃', '🎯', '⚡', '🏋️', '🫀', '⚔️', '👑', '✅', '🔗', '🥇'];

const ChallengeCard = ({ challenge, userId, isCoach, onClaim, onIncrement, onDelete }: {
  challenge: Challenge; userId: string; isCoach: boolean;
  onClaim: (c: Challenge) => void;
  onIncrement: (c: Challenge) => void;
  onDelete: (id: string) => void;
}) => {
  const progress = getChallengeProgress(challenge.id, userId);
  const completed = getCompletedChallenges(userId);
  const isClaimed = completed.includes(challenge.id);
  const isComplete = progress >= challenge.target;
  const pct = Math.min((progress / challenge.target) * 100, 100);

  const [showProofUpload, setShowProofUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const proofs = getChallengeProofs(challenge.id, userId);

  const handleIncrementWithProof = async (file?: File) => {
    if (file && userId) {
      setUploading(true);
      const url = await uploadChallengeProof(challenge.id, userId, file, progress + 1);
      setUploading(false);
      if (url) {
        toast({ title: '📸 Foto enviada!', description: 'Prova registrada com sucesso.' });
      } else {
        toast({ title: '⚠️ Erro no upload', description: 'Progresso registrado, mas a foto falhou.', variant: 'destructive' });
      }
    }
    onIncrement(challenge);
    setShowProofUpload(false);
    setProofPreview(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Arquivo muito grande', description: 'Máximo 5MB.', variant: 'destructive' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setProofPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <Card className={`border-primary/20 transition-all ${isComplete && !isClaimed ? 'ring-2 ring-secondary/50 shadow-lg shadow-secondary/10' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="text-3xl">{challenge.icon}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-sm">{challenge.name}</h3>
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${challenge.type === 'weekly' ? 'bg-primary/20 text-primary border-primary/30' : 'bg-secondary/20 text-secondary border-secondary/30'}`}>
                {challenge.type === 'weekly' ? 'Semanal' : 'Mensal'}
              </Badge>
              {proofs.length > 0 && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-accent/20 text-accent-foreground border-accent/30">
                  <ImageIcon className="h-2.5 w-2.5 mr-0.5" /> {proofs.length} foto{proofs.length > 1 ? 's' : ''}
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
              {isClaimed && (
                <div className="flex-1 text-center text-xs font-semibold text-green-400">✓ Recompensa resgatada</div>
              )}
              {isCoach && (
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => onDelete(challenge.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            {/* Proof Upload Area */}
            {showProofUpload && !isComplete && !isClaimed && (
              <div className="mt-3 rounded-lg border border-primary/20 bg-muted/30 p-3 space-y-3">
                <p className="text-xs text-muted-foreground">Adicione uma foto como prova (opcional):</p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileSelect}
                />

                {proofPreview ? (
                  <div className="relative">
                    <img src={proofPreview} alt="Prova" className="w-full h-32 object-cover rounded-md" />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-1 right-1 h-6 w-6 p-0 bg-background/80"
                      onClick={() => { setProofPreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                    >
                      ✕
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full gap-1.5"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="h-3.5 w-3.5" /> Tirar foto / Escolher
                  </Button>
                )}

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 gap-1.5"
                    disabled={uploading}
                    onClick={() => {
                      const file = fileInputRef.current?.files?.[0];
                      handleIncrementWithProof(file);
                    }}
                  >
                    {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ChevronUp className="h-3.5 w-3.5" />}
                    {proofPreview ? 'Enviar com foto' : 'Registrar sem foto'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setShowProofUpload(false); setProofPreview(null); }}>
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

            {!isCoach && !!userId && (
              <DominationEnergyButton
                userId={userId}
                activityId={challenge.id}
                activityType="challenge"
                energy={15}
                participationValid={isComplete || isClaimed}
                blockedText="Conclua o desafio para gerar energia"
                className="w-full mt-2"
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const CreateChallengeForm = ({ onCreated }: { onCreated: () => void }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('🔥');
  const [type, setType] = useState<ChallengeType>('weekly');
  const [target, setTarget] = useState('5');
  const [unit, setUnit] = useState('vezes');
  const [xpReward, setXpReward] = useState('150');
  const { toast } = useToast();

  const handleSubmit = () => {
    if (!name.trim()) return;

    const now = new Date();
    let startDate: string, endDate: string;
    if (type === 'weekly') {
      const day = now.getDay();
      const monday = new Date(now);
      monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      startDate = monday.toISOString().split('T')[0];
      endDate = sunday.toISOString().split('T')[0];
    } else {
      startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      endDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${lastDay}`;
    }

    addChallenge({
      name: name.trim(), description: description.trim(), icon, type,
      xpReward: Number(xpReward) || 100, target: Number(target) || 1, unit: unit.trim() || 'vezes',
      startDate, endDate,
    });

    toast({ title: '✅ Desafio criado!', description: `"${name}" adicionado com sucesso.` });
    setName(''); setDescription(''); setTarget('5'); setUnit('vezes'); setXpReward('150');
    onCreated();
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Nome do Desafio</Label>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Semana do Cardio" />
      </div>
      <div className="space-y-2">
        <Label>Descrição</Label>
        <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex: Complete 5 treinos de cardio" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Tipo</Label>
          <Select value={type} onValueChange={(v) => setType(v as ChallengeType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Semanal</SelectItem>
              <SelectItem value="monthly">Mensal</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Ícone</Label>
          <Select value={icon} onValueChange={setIcon}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {ICONS.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label>Meta</Label>
          <Input type="number" value={target} onChange={e => setTarget(e.target.value)} min="1" />
        </div>
        <div className="space-y-2">
          <Label>Unidade</Label>
          <Input value={unit} onChange={e => setUnit(e.target.value)} placeholder="vezes" />
        </div>
        <div className="space-y-2">
          <Label>XP</Label>
          <Input type="number" value={xpReward} onChange={e => setXpReward(e.target.value)} min="10" />
        </div>
      </div>
      <DialogClose asChild>
        <Button className="w-full" onClick={handleSubmit} disabled={!name.trim()}>
          <Plus className="h-4 w-4 mr-2" /> Criar Desafio
        </Button>
      </DialogClose>
    </div>
  );
};

const Challenges = () => {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [tick, setTick] = useState(0);
  const isCoach = user?.role === 'coach' || user?.role === 'admin';

  const challenges = useMemo(() => getActiveChallenges(), [tick]);
  const weekly = challenges.filter(c => c.type === 'weekly');
  const monthly = challenges.filter(c => c.type === 'monthly');

  const completedIds = useMemo(() => user ? getCompletedChallenges(user.id) : [], [user, tick]);
  const totalXpEarned = useMemo(() => {
    return challenges.filter(c => completedIds.includes(c.id)).reduce((sum, c) => sum + c.xpReward, 0);
  }, [challenges, completedIds]);

  // Obter todos os usuários para estatísticas coletivas
  const allUsers = useMemo(() => {
    const usersData = localStorage.getItem('crosscity_users') || '[]';
    return JSON.parse(usersData);
  }, [tick]);
  const allUserIds = useMemo(() => allUsers.map((u: any) => u.id), [allUsers]);

  const handleClaim = (challenge: Challenge) => {
    if (!user) return;
    markChallengeComplete(user.id, challenge.id);
    const newXp = (user.xp || 0) + challenge.xpReward;
    const newLevel = Math.floor(newXp / 500) + 1;
    updateUser({ xp: newXp, level: newLevel });

    const users = JSON.parse(localStorage.getItem('crosscity_users') || '[]');
    const updatedUsers = users.map((u: any) => u.id === user.id ? { ...u, xp: newXp, level: newLevel } : u);
    localStorage.setItem('crosscity_users', JSON.stringify(updatedUsers));

    toast({ title: `🎉 Desafio "${challenge.name}" concluído!`, description: `+${challenge.xpReward} XP adicionados.` });
    setTick(t => t + 1);
  };

  const handleIncrement = (challenge: Challenge) => {
    if (!user) return;
    incrementChallengeProgress(challenge.id, user.id);
    setTick(t => t + 1);
  };

  const handleDelete = (id: string) => {
    removeChallenge(id);
    toast({ title: 'Desafio removido' });
    setTick(t => t + 1);
  };

  const canAddWeekly = weekly.length < 4;
  const canAddMonthly = monthly.length < 1;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Flame className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Desafios</h1>
            <p className="text-muted-foreground text-sm">{isCoach ? 'Crie desafios semanais ou mensais' : 'Complete desafios e ganhe XP'}</p>
          </div>
        </div>
        {isCoach && (
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" /> Novo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Desafio</DialogTitle>
              </DialogHeader>
              <CreateChallengeForm onCreated={() => setTick(t => t + 1)} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-primary/20">
          <CardContent className="p-3 text-center">
            <Trophy className="h-5 w-5 mx-auto mb-1 text-secondary" />
            <p className="text-xl font-bold">{completedIds.length}/{challenges.length}</p>
            <p className="text-[10px] text-muted-foreground">Concluídos</p>
          </CardContent>
        </Card>
        <Card className="border-primary/20">
          <CardContent className="p-3 text-center">
            <Gift className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-xl font-bold">{totalXpEarned}</p>
            <p className="text-[10px] text-muted-foreground">XP ganhos</p>
          </CardContent>
        </Card>
        <Card className="border-primary/20">
          <CardContent className="p-3 text-center">
            <Calendar className="h-5 w-5 mx-auto mb-1 text-secondary" />
            <p className="text-xl font-bold">{challenges.length - completedIds.length}</p>
            <p className="text-[10px] text-muted-foreground">Pendentes</p>
          </CardContent>
        </Card>
      </div>

      {challenges.length === 0 ? (
        <Card className="border-dashed border-primary/30">
          <CardContent className="p-8 text-center space-y-3">
            <Flame className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <p className="text-muted-foreground">Nenhum desafio ativo.</p>
            <p className="text-sm text-muted-foreground">O professor pode criar até 4 desafios semanais e 1 mensal.</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="weekly">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="weekly" className="gap-1.5">
              <Flame className="h-3.5 w-3.5" /> Semanais ({weekly.length}/4)
            </TabsTrigger>
            <TabsTrigger value="monthly" className="gap-1.5">
              <Calendar className="h-3.5 w-3.5" /> Mensal ({monthly.length}/1)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="weekly" className="space-y-3 mt-4">
            {weekly.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhum desafio semanal criado.</p>
            ) : weekly.map(c => (
              <div key={c.id} className="space-y-4">
                <ChallengeCard challenge={c} userId={user?.id || ''} isCoach={isCoach} onClaim={handleClaim} onIncrement={handleIncrement} onDelete={handleDelete} />
                <ChallengeLeaderboard challenge={c} allUserIds={allUserIds} allUsers={allUsers} />
                <ChallengeRankingFull challenge={c} allUserIds={allUserIds} allUsers={allUsers} />
              </div>
            ))}
          </TabsContent>

          <TabsContent value="monthly" className="space-y-3 mt-4">
            {monthly.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhum desafio mensal criado.</p>
            ) : monthly.map(c => (
              <div key={c.id} className="space-y-4">
                <ChallengeCard challenge={c} userId={user?.id || ''} isCoach={isCoach} onClaim={handleClaim} onIncrement={handleIncrement} onDelete={handleDelete} />
                <ChallengeLeaderboard challenge={c} allUserIds={allUserIds} allUsers={allUsers} />
                <ChallengeRankingFull challenge={c} allUserIds={allUserIds} allUsers={allUsers} />
              </div>
            ))}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default Challenges;
