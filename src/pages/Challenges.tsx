import { useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { activeChallenges, getChallengeProgress, getCompletedChallenges, markChallengeComplete, type Challenge } from '@/lib/challenges';
import { useToast } from '@/hooks/use-toast';
import { Flame, Calendar, Trophy, Gift } from 'lucide-react';

const categoryColors: Record<string, string> = {
  cardio: 'bg-red-500/20 text-red-400 border-red-500/30',
  strength: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  consistency: 'bg-green-500/20 text-green-400 border-green-500/30',
  social: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  mixed: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
};

const categoryLabels: Record<string, string> = {
  cardio: 'Cardio', strength: 'Força', consistency: 'Consistência', social: 'Social', mixed: 'Misto',
};

const ChallengeCard = ({ challenge, userId, onClaim }: { challenge: Challenge; userId: string; onClaim: (c: Challenge) => void }) => {
  const progress = getChallengeProgress(challenge, userId);
  const completed = getCompletedChallenges(userId);
  const isClaimed = completed.includes(challenge.id);
  const isComplete = progress >= challenge.target;
  const pct = Math.min((progress / challenge.target) * 100, 100);

  return (
    <Card className={`border-primary/20 transition-all ${isComplete && !isClaimed ? 'ring-2 ring-secondary/50 shadow-lg shadow-secondary/10' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="text-3xl">{challenge.icon}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-sm">{challenge.name}</h3>
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${categoryColors[challenge.category]}`}>
                {categoryLabels[challenge.category]}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{challenge.description}</p>

            <div className="mt-3 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span>{progress}/{challenge.target} {challenge.unit}</span>
                <span className="font-semibold text-secondary">+{challenge.xpReward} XP</span>
              </div>
              <Progress value={pct} className="h-2" />
            </div>

            {isComplete && !isClaimed && (
              <Button size="sm" className="mt-3 w-full gap-2" onClick={() => onClaim(challenge)}>
                <Gift className="h-3.5 w-3.5" /> Resgatar Recompensa
              </Button>
            )}
            {isClaimed && (
              <div className="mt-3 text-center text-xs font-semibold text-green-400">✓ Recompensa resgatada</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const Challenges = () => {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [tick, setTick] = useState(0);

  const weekly = activeChallenges.filter(c => c.type === 'weekly');
  const monthly = activeChallenges.filter(c => c.type === 'monthly');

  const completedIds = useMemo(() => user ? getCompletedChallenges(user.id) : [], [user, tick]);
  const totalXpEarned = useMemo(() => {
    return activeChallenges.filter(c => completedIds.includes(c.id)).reduce((sum, c) => sum + c.xpReward, 0);
  }, [completedIds]);

  const handleClaim = (challenge: Challenge) => {
    if (!user) return;
    markChallengeComplete(user.id, challenge.id);

    const newXp = (user.xp || 0) + challenge.xpReward;
    const newLevel = Math.floor(newXp / 500) + 1;
    updateUser({ xp: newXp, level: newLevel });

    const users = JSON.parse(localStorage.getItem('crosscity_users') || '[]');
    const updatedUsers = users.map((u: any) =>
      u.id === user.id ? { ...u, xp: newXp, level: newLevel } : u
    );
    localStorage.setItem('crosscity_users', JSON.stringify(updatedUsers));

    toast({ title: `🎉 Desafio "${challenge.name}" concluído!`, description: `+${challenge.xpReward} XP adicionados ao seu perfil.` });
    setTick(t => t + 1);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Flame className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Desafios</h1>
          <p className="text-muted-foreground">Complete metas e ganhe XP extra</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-primary/20">
          <CardContent className="p-3 text-center">
            <Trophy className="h-5 w-5 mx-auto mb-1 text-secondary" />
            <p className="text-xl font-bold">{completedIds.length}/{activeChallenges.length}</p>
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
            <p className="text-xl font-bold">{activeChallenges.length - completedIds.length}</p>
            <p className="text-[10px] text-muted-foreground">Pendentes</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="weekly">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="weekly" className="gap-1.5">
            <Flame className="h-3.5 w-3.5" /> Semanais
          </TabsTrigger>
          <TabsTrigger value="monthly" className="gap-1.5">
            <Calendar className="h-3.5 w-3.5" /> Mensais
          </TabsTrigger>
        </TabsList>

        <TabsContent value="weekly" className="space-y-3 mt-4">
          {weekly.map(c => (
            <ChallengeCard key={c.id} challenge={c} userId={user?.id || ''} onClaim={handleClaim} />
          ))}
        </TabsContent>

        <TabsContent value="monthly" className="space-y-3 mt-4">
          {monthly.map(c => (
            <ChallengeCard key={c.id} challenge={c} userId={user?.id || ''} onClaim={handleClaim} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Challenges;
