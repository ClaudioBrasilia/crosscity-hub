import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Trophy, Flame, Users } from 'lucide-react';
import { getChallengeRanking, getRecentParticipants, getChallengeCommunityStats } from '@/lib/challenges';
import type { Challenge } from '@/lib/challenges';

interface ChallengeLeaderboardProps {
  challenge: Challenge;
  allUserIds: string[];
  allUsers: any[];
}

export const ChallengeLeaderboard = ({ challenge, allUserIds, allUsers }: ChallengeLeaderboardProps) => {
  const ranking = useMemo(() => getChallengeRanking(challenge.id, allUserIds, allUsers), [challenge.id, allUserIds, allUsers]);
  const recentParticipants = useMemo(() => getRecentParticipants(challenge.id, allUserIds, allUsers, 5), [challenge.id, allUserIds, allUsers]);
  const stats = useMemo(() => getChallengeCommunityStats(challenge.id, allUserIds), [challenge.id, allUserIds]);

  // Calcular a média de progresso geral
  const avgProgress = useMemo(() => {
    if (allUserIds.length === 0) return 0;
    const total = Object.values(stats.progressData).reduce((sum, p) => sum + p, 0);
    return (total / allUserIds.length / challenge.target) * 100;
  }, [stats, allUserIds.length, challenge.target]);

  return (
    <div className="space-y-4 mt-4">
      {/* Barra de Progresso Coletiva */}
      <Card className="border-primary/20 bg-card/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              Progresso da Comunidade
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {stats.completedCount.completed}/{stats.completedCount.total} concluído
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Média de Progresso</span>
            <span className="font-semibold text-primary">{Math.round(avgProgress)}%</span>
          </div>
          <Progress value={Math.min(avgProgress, 100)} className="h-2.5" />
          <p className="text-xs text-muted-foreground mt-2">
            {recentParticipants.length > 0 ? `${recentParticipants.length} atleta(s) em progresso` : 'Ninguém iniciou ainda'}
          </p>
        </CardContent>
      </Card>

      {/* Ranking dos Top 3 */}
      {ranking.length > 0 && (
        <Card className="border-secondary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              Top Atletas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {ranking.slice(0, 3).map((user, index) => (
              <div key={user.userId} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                {/* Posição */}
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-xs font-bold text-primary">
                  {index + 1}
                </div>

                {/* Avatar e Nome */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{user.avatar}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">{user.userName}</p>
                      {user.completed && (
                        <p className="text-[10px] text-green-400">✓ Concluído</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Progresso */}
                <div className="text-right">
                  <p className="text-xs font-bold text-secondary">
                    {user.progress}/{challenge.target}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Indicador de Participantes Recentes */}
      {recentParticipants.length > 0 && (
        <Card className="border-accent/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-accent" />
              Participantes Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {recentParticipants.map(user => (
                <div
                  key={user.userId}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-accent/10 border border-accent/20 hover:bg-accent/20 transition-colors"
                  title={user.userName}
                >
                  <span className="text-sm">{user.avatar}</span>
                  <span className="text-xs font-medium truncate max-w-[80px]">{user.userName.split(' ')[0]}</span>
                  <span className="text-[10px] font-bold text-accent ml-1">+{user.progress}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
