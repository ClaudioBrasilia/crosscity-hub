import { useEffect, useMemo, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Trophy, Medal, Award, Dumbbell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import * as db from '@/lib/supabaseData';
import { toDurationSeconds } from '@/lib/timeScore';

type Category = 'rx' | 'scaled' | 'beginner';
type Gender = 'male' | 'female';

const categoryLabels: Record<Category, string> = { rx: 'RX', scaled: 'Scaled', beginner: 'Iniciante' };
const genderLabels: Record<Gender, string> = { male: 'Masculino', female: 'Feminino' };

type LeaderboardUser = {
  id: string;
  name: string;
  avatar: string;
  xp: number;
  gender: Gender;
  category: Category;
};

const Leaderboard = () => {
  const { getAllUsers } = useAuth();
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [latestWod, setLatestWod] = useState<db.WodData | null>(null);
  const [wodResults, setWodResults] = useState<db.WodResult[]>([]);

  const loadData = useCallback(async () => {
    const [allUsers, wod] = await Promise.all([
      getAllUsers(),
      db.getLatestWod(),
    ]);

    setUsers(allUsers as LeaderboardUser[]);
    setLatestWod(wod);

    if (wod) {
      const allWodResults = await db.getWodResults(wod.id);
      setWodResults(allWodResults);
    } else {
      setWodResults([]);
    }
  }, [getAllUsers]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getMedal = (index: number) => {
    if (index === 0) return <Trophy className="h-5 w-5 text-yellow-400" />;
    if (index === 1) return <Medal className="h-5 w-5 text-slate-300" />;
    if (index === 2) return <Award className="h-5 w-5 text-amber-700" />;
    return <span className="text-xs font-bold text-muted-foreground">#{index + 1}</span>;
  };

  const xpRanking = useMemo(() => {
    return [...users].sort((a, b) => (Number(b.xp) || 0) - (Number(a.xp) || 0));
  }, [users]);

  const genderByUserId = useMemo(() => {
    const map = new Map<string, Gender>();
    users.forEach((user) => {
      map.set(user.id, (user.gender as Gender) || 'male');
    });
    return map;
  }, [users]);

  const compareWodResults = useCallback((a: db.WodResult, b: db.WodResult) => {
    const isTimeA = a.unit === 'time';
    const isTimeB = b.unit === 'time';

    if (isTimeA && isTimeB) {
      return toDurationSeconds(a.result) - toDurationSeconds(b.result);
    }

    if (!isTimeA && !isTimeB) {
      return (Number(b.result) || 0) - (Number(a.result) || 0);
    }

    return isTimeA ? -1 : 1;
  }, []);

  const wodRankingFor = useCallback((category: Category, gender: Gender) => {
    return [...wodResults]
      .filter((result) => result.category === category && (genderByUserId.get(result.userId) || 'male') === gender)
      .sort(compareWodResults);
  }, [wodResults, genderByUserId, compareWodResults]);

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <h1 className="text-3xl font-bold">Ranking</h1>

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>Ranking Geral de XP</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {xpRanking.length === 0 && <p className="text-sm text-muted-foreground">Sem atletas cadastrados.</p>}
          {xpRanking.map((user, index) => (
            <Card key={user.id} className={`border-primary/20 ${index < 3 ? 'bg-primary/10' : ''}`}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="w-6 flex justify-center">{getMedal(index)}</div>
                <span className="text-2xl">{user.avatar}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(categoryLabels[user.category as Category] || 'Iniciante')} • {(genderLabels[user.gender as Gender] || 'Masculino')}
                  </p>
                </div>
                <p className="font-bold text-primary">{Number(user.xp) || 0} XP</p>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="wod-ranking" className="border rounded-lg px-4 border-primary/20">
          <AccordionTrigger className="text-base font-semibold hover:no-underline">
            <span className="flex items-center gap-2">
              <Dumbbell className="h-4 w-4 text-primary" />
              Ver ranking do WOD
            </span>
          </AccordionTrigger>
          <AccordionContent className="space-y-5 pb-4">
            <p className="text-sm text-muted-foreground">
              {latestWod
                ? `WOD: ${latestWod.name} • ${new Date(latestWod.date).toLocaleDateString('pt-BR')}`
                : 'Sem WOD cadastrado para exibir ranking.'}
            </p>

            {latestWod && (['rx', 'scaled', 'beginner'] as Category[]).map((category) => (
              <Card key={category} className="border-primary/20">
                <CardHeader>
                  <CardTitle>{categoryLabels[category]}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(['male', 'female'] as Gender[]).map((gender) => {
                    const data = wodRankingFor(category, gender);
                    return (
                      <div key={gender} className="space-y-2">
                        <p className="text-sm font-semibold">{genderLabels[gender]}</p>
                        {data.length === 0 && (
                          <p className="text-sm text-muted-foreground">Sem resultados neste filtro.</p>
                        )}
                        {data.map((result, index) => (
                          <Card key={result.id} className={`border-primary/20 ${index < 3 ? 'bg-primary/10' : ''}`}>
                            <CardContent className="p-3 flex items-center gap-3">
                              <div className="w-6 flex justify-center">{getMedal(index)}</div>
                              <span className="text-2xl">{result.avatar}</span>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold truncate">{result.userName}</p>
                                <p className="text-xs text-muted-foreground">{result.unit === 'time' ? 'Tempo' : 'Rounds/Reps'}</p>
                              </div>
                              <p className="font-bold text-primary">{result.result}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ))}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default Leaderboard;
