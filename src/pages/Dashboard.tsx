import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
 codex/implement-daily-wod-competition-system-jgs3cz
import { Trophy, Target, Flame, TrendingUp, Swords, Warehouse, CalendarCheck } from 'lucide-react';
import { equipmentCatalog } from '@/lib/equipmentData';
import { useToast } from '@/hooks/use-toast';
import { useMemo, useState } from 'react';

import { Trophy, Target, Flame, TrendingUp, Swords, Warehouse } from 'lucide-react';
import { equipmentCatalog } from '@/lib/equipmentData';
 main
import type { DailyWod, DailyWodResult } from '@/lib/mockData';

const toTimeValue = (value: string) => {
  const [minutes, seconds] = value.split(':').map(Number);
  if (Number.isNaN(minutes) || Number.isNaN(seconds)) return Number.POSITIVE_INFINITY;
  return minutes * 60 + seconds;
};
 codex/implement-daily-wod-competition-system-jgs3cz

const formatDateKey = (date = new Date()) => date.toISOString().split('T')[0];

 main

const Dashboard = () => {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [refreshTick, setRefreshTick] = useState(0);

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
 codex/implement-daily-wod-competition-system-jgs3cz

  const today = formatDateKey();
  const checkinsData: Record<string, string[]> = JSON.parse(localStorage.getItem('crosscity_checkins') || '{}');
  const myCheckins = user ? checkinsData[user.id] || [] : [];
  const monthPrefix = today.slice(0, 7);

  const hasCheckedInToday = myCheckins.includes(today);
  const monthCheckins = useMemo(() => myCheckins.filter((date) => date.startsWith(monthPrefix)).length, [myCheckins, monthPrefix, refreshTick]);

  const handleCheckIn = () => {
    if (!user || hasCheckedInToday) return;

    const updatedCheckins = {
      ...checkinsData,
      [user.id]: [...myCheckins, today],
    };
    localStorage.setItem('crosscity_checkins', JSON.stringify(updatedCheckins));

    const newXp = (user.xp || 0) + 25;
    const newLevel = Math.floor(newXp / 500) + 1;
    updateUser({ xp: newXp, level: newLevel, checkins: (user.checkins || 0) + 1 });

    const users = JSON.parse(localStorage.getItem('crosscity_users') || '[]');
    const updatedUsers = users.map((item: any) =>
      item.id === user.id ? { ...item, xp: newXp, level: newLevel, checkins: (item.checkins || 0) + 1 } : item
    );
    localStorage.setItem('crosscity_users', JSON.stringify(updatedUsers));

    toast({ title: 'Presença confirmada ✅', description: '+25 XP por check-in de hoje.' });
    setRefreshTick((prev) => prev + 1);
  };

 main

  const stats = [
    { icon: Trophy, label: 'Nível', value: user?.level || 0, color: 'text-primary' },
    { icon: Target, label: 'XP', value: user?.xp || 0, color: 'text-secondary' },
    { icon: Flame, label: 'Sequência', value: `${user?.streak || 0} dias`, color: 'text-primary' },
    { icon: Swords, label: 'Vitórias', value: userWins, color: 'text-secondary' },
    { icon: Warehouse, label: 'Equipamentos', value: `${unlockedCount}/24`, color: 'text-primary' },
    { icon: TrendingUp, label: 'WODs', value: '12', color: 'text-secondary' },
  ];

  const xpToNextLevel = (user?.level || 1) * 500;
  const xpProgress = ((user?.xp || 0) % 500) / 5;

  return (
    <div className="space-y-6">
      <Card className="border-primary/30 bg-primary/10">
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="font-semibold">Check-in de presença</p>
            <p className="text-sm text-muted-foreground">Confirme sua presença diária e ganhe +25 XP.</p>
          </div>
          <Button onClick={handleCheckIn} disabled={hasCheckedInToday}>
            {hasCheckedInToday ? 'Presença confirmada ✓' : 'Confirmar presença hoje'}
          </Button>
        </CardContent>
      </Card>

      <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg border border-primary/20">
        <div className="text-6xl">{user?.avatar}</div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{user?.name}</h1>
          <p className="text-muted-foreground">Thunder Box • Atleta</p>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-sm">
              <span>Nível {user?.level}</span>
              <span>{user?.xp} / {xpToNextLevel} XP</span>
            </div>
            <Progress value={xpProgress} className="h-2" />
          </div>
        </div>
      </div>

 codex/implement-daily-wod-competition-system-jgs3cz
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CalendarCheck className="h-5 w-5 text-primary" /> Presenças no mês</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-primary">{monthCheckins}</p>
          <p className="text-sm text-muted-foreground">Check-ins registrados em {monthPrefix}</p>
        </CardContent>
      </Card>


 main
      {dailyWod && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle>WOD do Dia: {dailyWod.name}</CardTitle>
            <CardDescription>{dailyWod.type} • {dailyWod.date}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{dailyWod.versions.rx.description}</p>
              {myTodayResult ? (
                <p className="mt-2 font-semibold">Você já registrou: {myTodayResult.result} ({myTodayResult.category.toUpperCase()}) • Posição #{myPosition}</p>
              ) : (
                <p className="mt-2 font-semibold">Você ainda não registrou resultado hoje.</p>
              )}
            </div>
            <Link to="/wod">
              <Button>Registrar Resultado</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className="border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
