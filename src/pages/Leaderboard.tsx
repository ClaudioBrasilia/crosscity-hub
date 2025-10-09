import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Medal, Award } from 'lucide-react';

interface LeaderboardUser {
  id: string;
  name: string;
  avatar: string;
  xp: number;
  level: number;
  boxId: string;
}

const Leaderboard = () => {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);

  useEffect(() => {
    const usersData = localStorage.getItem('crosscity_users');
    if (usersData) {
      const allUsers = JSON.parse(usersData);
      const sorted = allUsers
        .map(({ password, ...user }: any) => user)
        .sort((a: LeaderboardUser, b: LeaderboardUser) => b.xp - a.xp);
      setUsers(sorted);
    }
  }, []);

  const getMedalIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-6 w-6 text-secondary" />;
    if (index === 1) return <Medal className="h-6 w-6 text-muted-foreground" />;
    if (index === 2) return <Award className="h-6 w-6 text-primary/60" />;
    return <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Ranking</h1>

      <Tabs defaultValue="global" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="global">Global</TabsTrigger>
          <TabsTrigger value="box">Meu Box</TabsTrigger>
        </TabsList>

        <TabsContent value="global" className="space-y-3 mt-6">
          {users.map((user, index) => (
            <Card 
              key={user.id} 
              className={`border-primary/20 ${index < 3 ? 'bg-gradient-to-r from-primary/5 to-transparent' : ''}`}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 flex justify-center">
                    {getMedalIcon(index)}
                  </div>
                  <div className="text-4xl">{user.avatar}</div>
                  <div className="flex-1">
                    <p className="font-bold text-lg">{user.name}</p>
                    <p className="text-sm text-muted-foreground">Nível {user.level}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{user.xp.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">XP</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="box" className="space-y-3 mt-6">
          {users.filter(u => u.boxId === 'box_1').map((user, index) => (
            <Card 
              key={user.id} 
              className={`border-primary/20 ${index < 3 ? 'bg-gradient-to-r from-primary/5 to-transparent' : ''}`}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 flex justify-center">
                    {getMedalIcon(index)}
                  </div>
                  <div className="text-4xl">{user.avatar}</div>
                  <div className="flex-1">
                    <p className="font-bold text-lg">{user.name}</p>
                    <p className="text-sm text-muted-foreground">Thunder Box</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{user.xp.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">XP</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Leaderboard;
