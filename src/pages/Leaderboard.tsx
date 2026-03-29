import { useEffect, useMemo, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Trophy, Medal, Award, Dumbbell, CalendarDays } from 'lucide-react';
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
};

const Leaderboard = () => {
  const { getAllUsers } = useAuth();
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [latestWod, setLatestWod] = useState<db.WodData | null>(null);
  const [wodResults, setWodResults] = useState<db.WodResult[]>([]);
  const [checkins, setCheckins] = useState<Record<string, string[]>>({});
  const [showAllXp, setShowAllXp] = useState(false);
  const [showAllFrequency, setShowAllFrequency] = useState(false);
  const [expandedWodGroups, setExpandedWodGroups] = useState<Record<string, boolean>>({});

  const loadData = useCallback(async () => {
    const [allUsers, wod, allCheckins] = await Promise.all([
      getAllUsers(),
      db.getLatestWod(),
      db.getAllCheckins(),
    ]);

    setUsers(allUsers as LeaderboardUser[]);
    setLatestWod(wod);
    setCheckins(allCheckins);

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

  const frequencyRanking = useMemo(() => {
    const now = new Date();
    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return users
      .map((user) => ({
        ...user,
        monthlyCheckins: (checkins[user.id] || []).filter((date) => date.startsWith(currentMonthPrefix)).length,
      }))
      .sort((a, b) => {
        if (b.monthlyCheckins !== a.monthlyCheckins) {
          return b.monthlyCheckins - a.monthlyCheckins;
        }
        return (Number(b.xp) || 0) - (Number(a.xp) || 0);
      });
  }, [users, checkins]);


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

  const xpVisibleRanking = showAllXp ? xpRanking : xpRanking.slice(0, 3);
  const frequencyVisibleRanking = showAllFrequency ? frequencyRanking : frequencyRanking.slice(0, 3);

  const toggleWodGroup = (key: string) => {
    setExpandedWodGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-28 md:pb-8">
      <h1 className="text-3xl font-bold">Ranking</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        <Card className="border-primary/40 shadow-sm bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Ranking Geral de XP
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {xpRanking.length === 0 && <p className="text-sm text-muted-foreground">Sem atletas cadastrados.</p>}
            {xpVisibleRanking.map((user, index) => (
              <Card key={user.id} className={`border-primary/30 ${index < 3 ? 'bg-primary/10' : 'bg-background'}`}>
                <CardContent className="p-2.5 flex items-center gap-2.5">
                  <div className="w-5 flex justify-center">{getMedal(index)}</div>
                  <span className="text-xl leading-none">{user.avatar}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate leading-tight">{user.name}</p>
                  </div>
                  <p className="font-bold text-primary whitespace-nowrap">{Number(user.xp) || 0} XP</p>
                </CardContent>
              </Card>
            ))}
            {xpRanking.length > 3 && (
              <button
                type="button"
                className="text-sm font-medium text-primary hover:underline"
                onClick={() => setShowAllXp((prev) => !prev)}
              >
                {showAllXp ? 'Recolher ranking' : 'Mostrar mais'}
              </button>
            )}
          </CardContent>
        </Card>


        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              Frequência do mês
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {frequencyRanking.length === 0 && <p className="text-sm text-muted-foreground">Sem atletas cadastrados.</p>}
            {frequencyVisibleRanking.map((user, index) => (
              <Card key={user.id} className={`border-border/70 ${index < 3 ? 'bg-muted/40' : 'bg-background'}`}>
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="w-6 flex justify-center">{getMedal(index)}</div>
                  <span className="text-2xl">{user.avatar}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{user.name}</p>
                  </div>
                  <p className="font-semibold text-foreground whitespace-nowrap">{user.monthlyCheckins} check-ins</p>
                </CardContent>
              </Card>
            ))}
            {frequencyRanking.length > 3 && (
              <button
                type="button"
                className="text-sm font-medium text-primary hover:underline"
                onClick={() => setShowAllFrequency((prev) => !prev)}
              >
                {showAllFrequency ? 'Recolher ranking' : 'Mostrar mais'}
              </button>
            )}
          </CardContent>
        </Card>
      </div>

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
                    const groupKey = `${category}-${gender}`;
                    const showAllGroup = expandedWodGroups[groupKey] || false;
                    const visibleData = showAllGroup ? data : data.slice(0, 3);
                    return (
                      <div key={gender} className="space-y-2">
                        <p className="text-sm font-semibold">{genderLabels[gender]}</p>
                        {data.length === 0 && (
                          <p className="text-sm text-muted-foreground">Sem resultados neste filtro.</p>
                        )}
                        {visibleData.map((result, index) => (
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
                        {data.length > 3 && (
                          <button
                            type="button"
                            className="text-sm font-medium text-primary hover:underline"
                            onClick={() => toggleWodGroup(groupKey)}
                          >
                            {showAllGroup ? 'Recolher ranking' : 'Mostrar mais'}
                          </button>
                        )}
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
