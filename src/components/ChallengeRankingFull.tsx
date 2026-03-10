import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Medal, TrendingUp } from 'lucide-react';
import { getChallengeRanking, getChallengeProgress, getCompletedChallenges } from '@/lib/challenges';
import type { Challenge } from '@/lib/challenges';

interface ChallengeRankingFullProps {
  challenge: Challenge;
  allUserIds: string[];
  allUsers: any[];
}

export const ChallengeRankingFull = ({ challenge, allUserIds, allUsers }: ChallengeRankingFullProps) => {
  const ranking = useMemo(() => getChallengeRanking(challenge.id, allUserIds, allUsers), [challenge.id, allUserIds, allUsers]);

  // Calcular tempo decorrido
  const timeInfo = useMemo(() => {
    const now = new Date();
    const startDate = new Date(challenge.startDate);
    const endDate = new Date(challenge.endDate);
    
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const elapsedDays = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const remainingDays = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    
    return {
      totalDays,
      elapsedDays: Math.max(0, elapsedDays),
      remainingDays,
      progress: Math.min(100, (elapsedDays / totalDays) * 100),
    };
  }, [challenge.startDate, challenge.endDate]);

  // Obter medalhas para posições
  const getMedalIcon = (position: number) => {
    switch (position) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return null;
    }
  };

  // Calcular estatísticas gerais
  const stats = useMemo(() => {
    const participatingUsers = ranking.filter(r => r.progress > 0);
    const completedUsers = ranking.filter(r => r.completed);
    const avgProgress = participatingUsers.length > 0
      ? participatingUsers.reduce((sum, r) => sum + r.progress, 0) / participatingUsers.length
      : 0;

    return {
      participating: participatingUsers.length,
      completed: completedUsers.length,
      avgProgress: Math.round(avgProgress),
      totalParticipants: ranking.length,
    };
  }, [ranking]);

  return (
    <div className="space-y-4 mt-6">
      {/* Informações do Desafio e Tempo */}
      <Card className="border-accent/20 bg-gradient-to-r from-accent/5 to-transparent">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Período</p>
              <p className="text-sm font-semibold">
                {challenge.startDate} até {challenge.endDate}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {timeInfo.elapsedDays} de {timeInfo.totalDays} dias decorridos
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Tempo Restante</p>
              <p className="text-sm font-semibold text-secondary">
                {timeInfo.remainingDays} dias
              </p>
              <Progress value={timeInfo.progress} className="h-1.5 mt-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-primary/20">
          <CardContent className="p-3 text-center">
            <TrendingUp className="h-4 w-4 mx-auto mb-1 text-primary" />
            <p className="text-lg font-bold">{stats.participating}/{stats.totalParticipants}</p>
            <p className="text-[10px] text-muted-foreground">Em Progresso</p>
          </CardContent>
        </Card>
        <Card className="border-secondary/20">
          <CardContent className="p-3 text-center">
            <Medal className="h-4 w-4 mx-auto mb-1 text-secondary" />
            <p className="text-lg font-bold">{stats.completed}</p>
            <p className="text-[10px] text-muted-foreground">Concluído</p>
          </CardContent>
        </Card>
      </div>

      {/* Ranking Completo */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Medal className="h-4 w-4 text-yellow-500" />
            Ranking Completo ({ranking.length} atletas)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 max-h-96 overflow-y-auto">
          {ranking.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              Nenhum participante ainda
            </p>
          ) : (
            ranking.map((user, index) => {
              const progressPercent = (user.progress / challenge.target) * 100;
              const medal = getMedalIcon(index + 1);
              const isCompleted = user.completed;

              return (
                <div
                  key={user.userId}
                  className={`p-3 rounded-lg border transition-all ${
                    isCompleted
                      ? 'bg-green-500/5 border-green-500/20'
                      : 'bg-muted/30 border-muted/50 hover:bg-muted/50'
                  }`}
                >
                  {/* Cabeçalho: Posição, Avatar, Nome */}
                  <div className="flex items-start gap-3 mb-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-xs font-bold text-primary flex-shrink-0">
                      {medal || `#${index + 1}`}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-lg">{user.avatar}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{user.userName}</p>
                          {isCompleted && (
                            <Badge variant="outline" className="text-[10px] mt-0.5 bg-green-500/10 text-green-600 border-green-500/20">
                              ✓ Concluído
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Progresso em números */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-secondary">
                        {user.progress}/{challenge.target}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {Math.round(progressPercent)}%
                      </p>
                    </div>
                  </div>

                  {/* Barra de progresso individual */}
                  <Progress value={Math.min(progressPercent, 100)} className="h-2" />

                  {/* Informações adicionais */}
                  <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                    <span>
                      {user.progress === 0 ? 'Não iniciou' : `${challenge.unit} completadas`}
                    </span>
                    {isCompleted && (
                      <span className="text-green-600 font-semibold">
                        +{challenge.xpReward} XP
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Legenda */}
      <div className="text-xs text-muted-foreground space-y-1 px-2">
        <p>🥇 = 1º lugar | 🥈 = 2º lugar | 🥉 = 3º lugar | #N = Demais posições</p>
        <p>Fundo verde = Desafio concluído | Ordenado por conclusão e progresso</p>
      </div>
    </div>
  );
};
