import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trophy, Medal, Award } from 'lucide-react';
import type { DailyWodResult, WodCategory } from '@/lib/mockData';

interface LeaderboardUser {
  id: string;
  name: string;
  avatar: string;
  boxId: string;
}

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
  rx: 'RX',
  scaled: 'Scaled',
  beginner: 'Iniciante',
};

const toTimeValue = (value: string) => {
  const [m, s] = value.split(':').map(Number);
  if (Number.isNaN(m) || Number.isNaN(s)) return Number.POSITIVE_INFINITY;
  return m * 60 + s;
};

const Leaderboard = () => {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
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
    if (index === 0) return <Trophy className="h-5 w-5 text-yellow-400" />;
    if (index === 1) return <Medal className="h-5 w-5 text-slate-300" />;
    if (index === 2) return <Award className="h-5 w-5 text-amber-700" />;
    return <span className="text-xs font-bold text-muted-foreground">#{index + 1}</span>;
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
      </Tabs>
    </div>
  );
};

export default Leaderboard;
