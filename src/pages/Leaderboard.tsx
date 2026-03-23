import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDays, Trophy, Medal, Award } from 'lucide-react';
import type { DailyWodResult } from '@/lib/mockData';
import { filterEntriesByKnownUsers, getStoredUsers, safeParse } from '@/lib/realUsers';

type Category = 'rx' | 'scaled' | 'beginner';
type Gender = 'male' | 'female';

interface LeaderboardUser {
  id: string;
  name: string;
  avatar: string;
  boxId: string;
  xp: number;
  category: Category;
  gender: Gender;
}

const categoryLabels: Record<Category, string> = {
  rx: 'RX',
  scaled: 'Scaled',
  beginner: 'Iniciante',
};

const genderLabels: Record<Gender, string> = {
  male: 'Masculino',
  female: 'Feminino',
};

const Leaderboard = () => {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [checkins, setCheckins] = useState<Record<string, string[]>>({});
  const [results, setResults] = useState<DailyWodResult[]>([]);
  const [dailyWodId, setDailyWodId] = useState<string | null>(null);

  useEffect(() => {
    const syncData = () => {
      const loadedUsers = getStoredUsers().map((item: any) => ({
        ...item,
        boxId: item.boxId || '',
        xp: Number(item.xp) || 0,
        category: item.category || 'beginner',
        gender: item.gender || 'male',
      }));

      const dailyWod = safeParse(localStorage.getItem('crosscity_daily_wod'), null);
      const filteredResults = filterEntriesByKnownUsers(
        safeParse<DailyWodResult[]>(localStorage.getItem('crosscity_wod_results'), []),
        (item) => [item.userId],
      );
      const rawCheckins = safeParse<Record<string, string[]>>(localStorage.getItem('crosscity_checkins'), {});
      const filteredCheckins = Object.fromEntries(Object.entries(rawCheckins).filter(([userId]) => loadedUsers.some((user) => user.id === userId)));

      setUsers(loadedUsers as LeaderboardUser[]);
      setCheckins(filteredCheckins);
      setResults(filteredResults);
      setDailyWodId(dailyWod?.id || null);
    };

    syncData();
    window.addEventListener('storage', syncData);
    return () => window.removeEventListener('storage', syncData);
  }, []);

  const getMedal = (index: number) => {
    if (index === 0) return <Trophy className="h-5 w-5 text-yellow-400" />;
    if (index === 1) return <Medal className="h-5 w-5 text-slate-300" />;
    if (index === 2) return <Award className="h-5 w-5 text-amber-700" />;
    return <span className="text-xs font-bold text-muted-foreground">#{index + 1}</span>;
  };

  const getResultCategory = (result: DailyWodResult | undefined): Category => result?.category || 'beginner';

  const getUserRankingCategory = (user: LeaderboardUser): Category => {
    const userResults = results.filter((result) => result.userId === user.id);
    const latestForDailyWod = dailyWodId
      ? userResults
          .filter((result) => result.wodId === dailyWodId)
          .sort((a, b) => b.submittedAt - a.submittedAt)[0]
      : undefined;

    if (latestForDailyWod) return getResultCategory(latestForDailyWod);

    const latestResult = [...userResults].sort((a, b) => b.submittedAt - a.submittedAt)[0];
    if (latestResult) return getResultCategory(latestResult);

    return user.category || 'beginner';
  };

  const rankingFor = (category: Category, gender: Gender) => {
    return [...users]
      .filter((user) => getUserRankingCategory(user) === category && user.gender === gender)
      .sort((a, b) => (Number(b.xp) || 0) - (Number(a.xp) || 0));
  };

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
                <CardTitle>{categoryLabels[category]} — Ranking por Gênero</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="male" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="male">🏋️ Masculino</TabsTrigger>
                    <TabsTrigger value="female">🏋️‍♀️ Feminino</TabsTrigger>
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
      </Tabs>
    </div>
  );
};

export default Leaderboard;
