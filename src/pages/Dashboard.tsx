import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Trophy, Target, Flame, TrendingUp, Swords, Warehouse, CalendarCheck, Award, BarChart3 } from 'lucide-react';
import { equipmentCatalog } from '@/lib/equipmentData';
import { useToast } from '@/hooks/use-toast';
import { useMemo, useState, useEffect, useRef } from 'react';
import type { DailyWod, DailyWodResult } from '@/lib/mockData';
import { getUserBadges, categoryLabels, categoryIcons } from '@/lib/badges';
import { benchmarkExercises } from '@/lib/battleSimulator';
import { getActiveChallenges, getChallengeProgress, getCompletedChallenges } from '@/lib/challenges';
import { ensureClanData } from '@/lib/clanSystem';
import { DominationEnergyButton } from '@/components/DominationEnergyButton';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';

const useAnimatedCounter = (end: number, duration = 800) => {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number>();
  useEffect(() => {
    const start = 0;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setCount(Math.floor(start + (end - start) * progress));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [end, duration]);
  return count;
};

const objectiveLabels: Record<string, string> = {
  strength: '💪 Ganhar Força',
  weight: '🏃 Perder Peso',
  conditioning: '❤️‍🔥 Condicionamento',
  compete: '🏆 Competir',
};
const frequencyLabels: Record<string, string> = {
  '3x': '3x/semana', '4x': '4x/semana', '5x': '5x/semana', '6x': '6x+/semana',
};
const levelLabels: Record<string, string> = {
  beginner: 'Iniciante', intermediate: 'Intermediário', advanced: 'Avançado',
};

const toTimeValue = (value: string) => {
  const [minutes, seconds] = value.split(':').map(Number);
  if (Number.isNaN(minutes) || Number.isNaN(seconds)) return Number.POSITIVE_INFINITY;
  return minutes * 60 + seconds;
};

const formatDateKey = (date = new Date()) => date.toISOString().split('T')[0];

const Dashboard = () => {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    const users = JSON.parse(localStorage.getItem('crosscity_users') || '[]');
    ensureClanData(users);
  }, []);

  const userWins = Number(localStorage.getItem(`crosscity_wins_${user?.id}`) || '0');
  const userInventory: string[] = JSON.parse(localStorage.getItem(`crosscity_inventory_${user?.id}`) || '[]');
  const unlockedCount = equipmentCatalog.filter((eq) => userWins >= eq.winsRequired || userInventory.includes(eq.id)).length;

  const dailyWod: DailyWod | null = JSON.parse(localStorage.getItem('crosscity_daily_wod') || 'null');
  const dailyResults: DailyWodResult[] = JSON.parse(localStorage.getItem('crosscity_wod_results') || '[]');
  const myTodayResult = dailyResults.find((item) => item.wodId === dailyWod?.id && item.userId === user?.id);

  const todayRanking = myTodayResult
    ? dailyResults
        .filter((item) => item.wodId === dailyWod?.id && item.category === myTodayResult.category)
        .sort((a, b) => {
          if (a.unit === 'time' && b.unit === 'time') return toTimeValue(a.result) - toTimeValue(b.result);
          return Number(b.result) - Number(a.result);
        })
    : [];

  const myPosition = myTodayResult ? todayRanking.findIndex((item) => item.id === myTodayResult.id) + 1 : null;

  const today = formatDateKey();
  const checkinsData: Record<string, string[]> = JSON.parse(localStorage.getItem('crosscity_checkins') || '{}');
  const myCheckins = user ? checkinsData[user.id] || [] : [];
  const monthPrefix = today.slice(0, 7);
  const hasCheckedInToday = myCheckins.includes(today);
  const monthCheckins = useMemo(() => myCheckins.filter((date) => date.startsWith(monthPrefix)).length, [myCheckins, monthPrefix, refreshTick]);

  // Badges
  const badgeResults = useMemo(() => user ? getUserBadges(user.id) : [], [user, refreshTick]);
  const unlockedBadges = badgeResults.filter(b => b.unlocked);
  const recentBadges = unlockedBadges.slice(-4);

  // PR chart data
  const prChartData = useMemo(() => {
    if (!user) return [];
    const stored = JSON.parse(localStorage.getItem('crosscity_benchmarks') || '{}');
    const userBm = stored[user.id] || {};
    return benchmarkExercises
      .filter(ex => userBm[ex.id])
      .map(ex => ({
        name: ex.name.length > 8 ? ex.name.slice(0, 8) + '…' : ex.name,
        value: userBm[ex.id],
      }));
  }, [user]);

  // Community feed (recent activities)
  const communityFeed = useMemo(() => {
    const feed = JSON.parse(localStorage.getItem('crosscity_feed') || '[]');
    return feed.slice(0, 3);
  }, []);

  const handleCheckIn = () => {
    if (!user || hasCheckedInToday) return;
    const updatedCheckins = { ...checkinsData, [user.id]: [...myCheckins, today] };
    localStorage.setItem('crosscity_checkins', JSON.stringify(updatedCheckins));
    const newXp = (user.xp || 0) + 25;
    const newLevel = Math.floor(newXp / 500) + 1;
    updateUser({ xp: newXp, level: newLevel, checkins: (user.checkins || 0) + 1 });
    const users = JSON.parse(localStorage.getItem('crosscity_users') || '[]');
    const updatedUsers = users.map((item: any) =>
      item.id === user.id ? { ...item, xp: newXp, level: newLevel, checkins: (item.checkins || 0) + 1 } : item
    );
    localStorage.setItem('crosscity_users', JSON.stringify(updatedUsers));
    toast({ title: 'Presença confirmada ✅', description: '+25 XP por check-in.' });
    setRefreshTick((prev) => prev + 1);
  };

  const xpToNextLevel = (user?.level || 1) * 500;
  const xpProgress = ((user?.xp || 0) % 500) / 5;
  const [xpAnimated, setXpAnimated] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setXpAnimated(xpProgress), 300);
    return () => clearTimeout(t);
  }, [xpProgress]);

  // Goals
  const userGoals = useMemo(() => {
    if (!user) return null;
    const raw = localStorage.getItem(`crosscity_goals_${user.id}`);
    return raw ? JSON.parse(raw) : null;
  }, [user]);

  return (
    <div className="space-y-6">
      {/* Hero + Check-in */}
      <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/15 via-card to-secondary/10 p-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <div className="text-6xl">{user?.avatar}</div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Olá, {user?.name?.split(' ')[0]}! 👋</h1>
            <p className="text-muted-foreground">CrossUberlandia • Nível {user?.level}</p>
            <div className="mt-2 space-y-1 max-w-sm">
              <div className="flex justify-between text-sm">
                <span>Nível {user?.level}</span>
                <span>{user?.xp} / {xpToNextLevel} XP</span>
              </div>
              <Progress value={xpAnimated} className="h-2 transition-all duration-1000" />
            </div>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <Button onClick={handleCheckIn} disabled={hasCheckedInToday} size="lg" className="w-full sm:w-auto">
            <CalendarCheck className="h-4 w-4 mr-2" />
            {hasCheckedInToday ? 'Presença confirmada ✓' : 'Confirmar presença hoje (+25 XP)'}
          </Button>
          {user && (
            <DominationEnergyButton
              userId={user.id}
              activityId={`checkin:${today}`}
              activityType="checkin"
              energy={20}
              participationValid={hasCheckedInToday}
              blockedText="Faça check-in para gerar energia"
              className="w-full sm:w-auto"
            />
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3" style={{ animationDelay: '0.1s' }}>
        {[
          { icon: Trophy, label: 'Nível', value: user?.level || 0, color: 'text-primary' },
          { icon: Target, label: 'XP', value: user?.xp || 0, color: 'text-secondary' },
          { icon: Flame, label: 'Sequência', value: `${user?.streak || 0}d`, color: 'text-primary' },
          { icon: CalendarCheck, label: 'Mês', value: monthCheckins, color: 'text-secondary' },
          { icon: Swords, label: 'Vitórias', value: userWins, color: 'text-primary' },
          { icon: Warehouse, label: 'Equip.', value: `${unlockedCount}/24`, color: 'text-secondary' },
        ].map((stat, i) => (
          <Card key={i} className="border-primary/20 animate-fade-in" style={{ animationDelay: `${0.05 * i}s`, animationFillMode: 'backwards' }}>
            <CardContent className="p-3 text-center">
              <stat.icon className={`h-4 w-4 mx-auto mb-1 ${stat.color}`} />
              <p className="text-xl font-bold">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Goals Summary */}
      {userGoals && (
        <Card className="border-primary/20 animate-fade-in" style={{ animationDelay: '0.2s', animationFillMode: 'backwards' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-secondary" />
              Minhas Metas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {userGoals.objective && (
                <span className="px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-xs font-medium">
                  {objectiveLabels[userGoals.objective] || userGoals.objective}
                </span>
              )}
              {userGoals.frequency && (
                <span className="px-3 py-1.5 rounded-full bg-secondary/10 border border-secondary/30 text-xs font-medium">
                  {frequencyLabels[userGoals.frequency] || userGoals.frequency}
                </span>
              )}
              {userGoals.level && (
                <span className="px-3 py-1.5 rounded-full bg-muted border border-border text-xs font-medium">
                  {levelLabels[userGoals.level] || userGoals.level}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* WOD do Dia */}
      {dailyWod && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              WOD do Dia: {dailyWod.name}
            </CardTitle>
            <CardDescription>{dailyWod.type} • {dailyWod.date}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">{dailyWod.versions.rx.description}</p>
              {myTodayResult ? (
                <p className="mt-1 text-sm font-semibold text-primary">✓ {myTodayResult.result} ({myTodayResult.category.toUpperCase()}) • #{myPosition}</p>
              ) : (
                <p className="mt-1 text-sm font-semibold text-muted-foreground">Ainda sem resultado hoje</p>
              )}
            </div>
            <Link to="/wod">
              <Button size="sm">Registrar</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Badges Recentes */}
        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="h-5 w-5 text-secondary" />
              Conquistas ({unlockedBadges.length}/{badgeResults.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {unlockedBadges.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma conquista ainda. Continue treinando!</p>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {recentBadges.map(({ badge }) => (
                  <div key={badge.id} className="flex flex-col items-center p-2 rounded-lg bg-primary/10 border border-primary/20 text-center">
                    <span className="text-2xl">{badge.icon}</span>
                    <span className="text-[10px] font-semibold mt-1 leading-tight">{badge.name}</span>
                  </div>
                ))}
              </div>
            )}
            <Link to="/profile" className="block mt-3">
              <Button variant="ghost" size="sm" className="w-full text-xs">Ver todas as conquistas →</Button>
            </Link>
          </CardContent>
        </Card>

        {/* Mini PR Chart */}
        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Meus PRs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {prChartData.length === 0 ? (
              <p className="text-sm text-muted-foreground">Registre PRs em Benchmarks para ver o gráfico.</p>
            ) : (
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={prChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 20%)" />
                    <XAxis dataKey="name" tick={{ fill: 'hsl(0 0% 60%)', fontSize: 10 }} />
                    <YAxis tick={{ fill: 'hsl(0 0% 60%)', fontSize: 10 }} width={35} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(0 0% 8%)', border: '1px solid hsl(0 0% 20%)', borderRadius: '8px', color: 'hsl(0 0% 95%)' }} />
                    <Bar dataKey="value" fill="hsl(199 89% 48%)" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            <Link to="/benchmarks" className="block mt-2">
              <Button variant="ghost" size="sm" className="w-full text-xs">Ver Benchmarks →</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Active Challenges */}
      <Card className="border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Flame className="h-5 w-5 text-primary" />
            Desafios Ativos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {getActiveChallenges().slice(0, 3).map(c => {
            const progress = user ? getChallengeProgress(c.id, user.id) : 0;
            const completed = user ? getCompletedChallenges(user.id) : [];
            const isClaimed = completed.includes(c.id);
            const pct = Math.min((progress / c.target) * 100, 100);
            return (
              <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <span className="text-2xl">{c.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{c.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Progress value={pct} className="h-1.5 flex-1" />
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {isClaimed ? '✓' : `${progress}/${c.target}`}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-semibold text-secondary">+{c.xpReward}</span>
              </div>
            );
          })}
          <Link to="/challenges">
            <Button variant="ghost" size="sm" className="w-full text-xs">Ver todos os desafios →</Button>
          </Link>
        </CardContent>
      </Card>


      <Card className="border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Swords className="h-5 w-5 text-primary" />
            Guerra de Clãs
          </CardTitle>
          <CardDescription>Seu check-in fortalece o domínio territorial do seu clã.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link to="/clans">
            <Button variant="outline" size="sm" className="w-full">Ver Clãs & Territórios →</Button>
          </Link>
        </CardContent>
      </Card>

      {/* Community Feed */}
      {communityFeed.length > 0 && (
        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Atividade da Comunidade</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {communityFeed.map((post: any) => (
              <div key={post.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <span className="text-2xl">{post.userAvatar}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{post.userName}</p>
                  <p className="text-xs text-muted-foreground truncate">{post.content}</p>
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap">
                  🔥 {post.reactions?.fire || 0}
                </div>
              </div>
            ))}
            <Link to="/feed">
              <Button variant="ghost" size="sm" className="w-full text-xs">Ver Feed completo →</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
