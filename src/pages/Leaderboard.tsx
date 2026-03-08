import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 codex/implement-daily-wod-competition-system-jgs3cz
import { CalendarDays, Trophy, Medal, Award } from 'lucide-react';

type Category = 'rx' | 'scaled' | 'beginner';
type Gender = 'male' | 'female';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trophy, Medal, Award } from 'lucide-react';
import type { DailyWodResult, WodCategory } from '@/lib/mockData';
 main

interface LeaderboardUser {
  id: string;
  name: string;
  avatar: string;
  boxId: string;
  xp: number;
  category: Category;
  gender: Gender;
}

 codex/implement-daily-wod-competition-system-jgs3cz
const categoryLabels: Record<Category, string> = {

interface Box {
  id: string;
  name: string;
}

interface RankingEntry {
  userId: string;
  userName: string;
  avatar: string;
  boxId: string;
  score: number;
  submissions: number;
}

const categoryLabels: Record<WodCategory, string> = {
 main
  rx: 'RX',
  scaled: 'Scaled',
  beginner: 'Iniciante',
};

 codex/implement-daily-wod-competition-system-jgs3cz
const genderLabels: Record<Gender, string> = {
  male: 'Masculino',
  female: 'Feminino',

const toTimeValue = (value: string) => {
  const [m, s] = value.split(':').map(Number);
  if (Number.isNaN(m) || Number.isNaN(s)) return Number.POSITIVE_INFINITY;
  return m * 60 + s;
 main
};

const Leaderboard = () => {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
 codex/implement-daily-wod-competition-system-jgs3cz
  const [checkins, setCheckins] = useState<Record<string, string[]>>({});

  useEffect(() => {
    const loadedUsers = JSON.parse(localStorage.getItem('crosscity_users') || '[]').map(({ password, ...item }: any) => ({
      ...item,
      category: item.category || 'beginner',
      gender: item.gender || 'male',
    }));
    setUsers(loadedUsers);
    setCheckins(JSON.parse(localStorage.getItem('crosscity_checkins') || '{}'));
  }, []);

  const getMedal = (index: number) => {

  const [boxes, setBoxes] = useState<Box[]>([]);
  const [results, setResults] = useState<DailyWodResult[]>([]);
  const [boxFilter, setBoxFilter] = useState('all');

  useEffect(() => {
    setUsers((JSON.parse(localStorage.getItem('crosscity_users') || '[]') as any[]).map(({ password, ...item }) => item));
    setBoxes(JSON.parse(localStorage.getItem('crosscity_boxes') || '[]'));
    setResults(JSON.parse(localStorage.getItem('crosscity_wod_results') || '[]'));
  }, []);

  const rankingByCategory = useMemo(() => {
    const categories: WodCategory[] = ['rx', 'scaled', 'beginner'];

    return categories.reduce((acc, category) => {
      const categoryResults = results.filter((item) => item.category === category);
      const wodIds = [...new Set(categoryResults.map((item) => item.wodId))];
      const pointsByUser: Record<string, RankingEntry> = {};

      wodIds.forEach((wodId) => {
        const wodResults = categoryResults.filter((item) => item.wodId === wodId);
        const sorted = [...wodResults].sort((a, b) => {
          if (a.unit === 'time' && b.unit === 'time') return toTimeValue(a.result) - toTimeValue(b.result);
          if (a.unit === 'rounds' && b.unit === 'rounds') return Number(b.result) - Number(a.result);
          return a.submittedAt - b.submittedAt;
        });

        sorted.forEach((entry, index) => {
          const user = users.find((item) => item.id === entry.userId);
          if (!user) return;
          const basePoints = Math.max(100 - index * 15, 30);

          if (!pointsByUser[entry.userId]) {
            pointsByUser[entry.userId] = {
              userId: entry.userId,
              userName: entry.userName,
              avatar: entry.avatar,
              boxId: user.boxId,
              score: 0,
              submissions: 0,
            };
          }

          pointsByUser[entry.userId].score += basePoints;
          pointsByUser[entry.userId].submissions += 1;
        });
      });

      acc[category] = Object.values(pointsByUser)
        .filter((item) => (boxFilter === 'all' ? true : item.boxId === boxFilter))
        .sort((a, b) => b.score - a.score);

      return acc;
    }, {} as Record<WodCategory, RankingEntry[]>);
  }, [results, users, boxFilter]);

  const getMedalIcon = (index: number) => {
 main
    if (index === 0) return <Trophy className="h-5 w-5 text-yellow-400" />;
    if (index === 1) return <Medal className="h-5 w-5 text-slate-300" />;
    if (index === 2) return <Award className="h-5 w-5 text-amber-700" />;
    return <span className="text-xs font-bold text-muted-foreground">#{index + 1}</span>;
 codex/implement-daily-wod-competition-system-jgs3cz
  };

  const rankingFor = (category: Category, gender: Gender) =>
    users
      .filter((user) => user.category === category && user.gender === gender)
      .sort((a, b) => b.xp - a.xp);

  const frequencyRanking = useMemo(() => {
    const now = new Date();
    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    return users
      .map((user) => ({
        ...user,
        monthlyCheckins: (checkins[user.id] || []).filter((date) => date.startsWith(currentMonthPrefix)).length,
      }))
      .sort((a, b) => b.monthlyCheckins - a.monthlyCheckins);
  }, [users, checkins]);

  const renderGenderRanking = (category: Category, gender: Gender) => {
    const data = rankingFor(category, gender);

    return (
      <div className="space-y-2 mt-4">
        {data.length === 0 && <p className="text-sm text-muted-foreground">Sem atletas neste filtro.</p>}
        {data.map((user, index) => (
          <Card key={user.id} className={`border-primary/20 ${index < 3 ? 'bg-primary/10' : ''}`}>
            <CardContent className="p-3 flex items-center gap-3">
              <div className="w-6 flex justify-center">{getMedal(index)}</div>
              <span className="text-2xl">{user.avatar}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground">{genderLabels[user.gender]}</p>
              </div>
              <p className="font-bold text-primary">{user.xp} XP</p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <h1 className="text-3xl font-bold">Ranking</h1>

      <Tabs defaultValue="rx" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="rx">RX</TabsTrigger>
          <TabsTrigger value="scaled">Scaled</TabsTrigger>
          <TabsTrigger value="beginner">Iniciante</TabsTrigger>
          <TabsTrigger value="frequency">Frequência</TabsTrigger>
        </TabsList>

        {(['rx', 'scaled', 'beginner'] as Category[]).map((category) => (
          <TabsContent key={category} value={category}>
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle>{categoryLabels[category]} • Ranking por Gênero</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="male" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="male">Masculino</TabsTrigger>
                    <TabsTrigger value="female">Feminino</TabsTrigger>
                  </TabsList>
                  <TabsContent value="male">{renderGenderRanking(category, 'male')}</TabsContent>
                  <TabsContent value="female">{renderGenderRanking(category, 'female')}</TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>
        ))}

        <TabsContent value="frequency">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                Ranking de Frequência (mês atual)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {frequencyRanking.map((user, index) => (
                <Card key={user.id} className={`border-primary/20 ${index < 3 ? 'bg-primary/10' : ''}`}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="w-6 flex justify-center">{getMedal(index)}</div>
                    <span className="text-2xl">{user.avatar}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{categoryLabels[user.category]} • {genderLabels[user.gender]}</p>
                    </div>
                    <p className="font-bold text-primary">{user.monthlyCheckins} check-ins</p>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
=======
  };

  const renderCategory = (category: WodCategory) => {
    const data = rankingByCategory[category] || [];

    return (
      <div className="space-y-2 mt-4">
        {data.length === 0 && <p className="text-sm text-muted-foreground">Sem resultados nesta categoria.</p>}
        {data.map((entry, index) => (
          <Card key={entry.userId} className={`border-primary/20 ${index < 3 ? 'bg-primary/10' : ''}`}>
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="w-6 flex justify-center">{getMedalIcon(index)}</div>
                <div className="text-2xl">{entry.avatar}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{entry.userName}</p>
                  <p className="text-xs text-muted-foreground">{boxes.find((b) => b.id === entry.boxId)?.name || entry.boxId}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">{entry.score}</p>
                  <p className="text-[11px] text-muted-foreground">{entry.submissions} WODs</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-3xl font-bold">Ranking por Categoria</h1>
        <Select value={boxFilter} onValueChange={setBoxFilter}>
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="Filtrar por box" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os boxes</SelectItem>
            {boxes.map((box) => (
              <SelectItem key={box.id} value={box.id}>{box.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="rx" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          {(['rx', 'scaled', 'beginner'] as WodCategory[]).map((category) => (
            <TabsTrigger key={category} value={category}>{categoryLabels[category]}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="rx">{renderCategory('rx')}</TabsContent>
        <TabsContent value="scaled">{renderCategory('scaled')}</TabsContent>
        <TabsContent value="beginner">{renderCategory('beginner')}</TabsContent>
 main
      </Tabs>
    </div>
  );
};

export default Leaderboard;
