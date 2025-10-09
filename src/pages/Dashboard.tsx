import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Trophy, Target, Flame, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();

  const stats = [
    { icon: Trophy, label: 'Nível', value: user?.level || 0, color: 'text-primary' },
    { icon: Target, label: 'XP', value: user?.xp || 0, color: 'text-secondary' },
    { icon: Flame, label: 'Sequência', value: `${user?.streak || 0} dias`, color: 'text-primary' },
    { icon: TrendingUp, label: 'WODs', value: '12', color: 'text-secondary' },
  ];

  const xpToNextLevel = (user?.level || 1) * 500;
  const xpProgress = ((user?.xp || 0) % 500) / 5;

  return (
    <div className="space-y-6">
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { wod: 'Fran', time: '3:45', date: 'Hoje', pr: true },
            { wod: 'Cindy', rounds: '20', date: 'Ontem' },
            { wod: 'Helen', time: '8:32', date: '2 dias atrás' },
          ].map((activity, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="font-semibold flex items-center gap-2">
                  {activity.wod}
                  {activity.pr && <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">PR!</span>}
                </p>
                <p className="text-sm text-muted-foreground">{activity.date}</p>
              </div>
              <p className="text-lg font-bold text-primary">
                {activity.time || `${activity.rounds} rounds`}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
