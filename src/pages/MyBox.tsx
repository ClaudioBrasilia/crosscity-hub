import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { equipmentCatalog, getTierLabel, getTierColor } from '@/lib/equipmentData';
import { Warehouse, Lock } from 'lucide-react';

const MyBox = () => {
  const { user } = useAuth();
  const userWins = Number(localStorage.getItem(`crosscity_wins_${user?.id}`) || '0');
  const userInventory: string[] = JSON.parse(localStorage.getItem(`crosscity_inventory_${user?.id}`) || '[]');

  const unlockedCount = equipmentCatalog.filter(eq => userWins >= eq.winsRequired || userInventory.includes(eq.id)).length;
  const progressPercent = (unlockedCount / equipmentCatalog.length) * 100;

  const tiers = [1, 2, 3, 4];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Warehouse className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Meu Box</h1>
          <p className="text-muted-foreground">Sua garagem virtual — conquiste equipamentos vencendo batalhas!</p>
        </div>
      </div>

      <Card className="border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progresso Geral</span>
            <span className="text-sm font-bold text-primary">{unlockedCount}/{equipmentCatalog.length}</span>
          </div>
          <Progress value={progressPercent} className="h-3" />
          <p className="text-xs text-muted-foreground mt-2">
            {userWins} vitória{userWins !== 1 ? 's' : ''} em batalha
          </p>
        </CardContent>
      </Card>

      {tiers.map(tier => {
        const tierItems = equipmentCatalog.filter(eq => eq.tier === tier);
        return (
          <Card key={tier} className="border-primary/20">
            <CardHeader>
              <CardTitle className={`text-lg flex items-center gap-2 ${getTierColor(tier)}`}>
                {tier === 4 ? '💎' : tier === 3 ? '🥇' : tier === 2 ? '🥈' : '🥉'}{' '}
                Tier {tier} — {getTierLabel(tier)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {tierItems.map(eq => {
                  const unlocked = userWins >= eq.winsRequired || userInventory.includes(eq.id);
                  const fromBet = userInventory.includes(eq.id) && userWins < eq.winsRequired;
                  return (
                    <div
                      key={eq.id}
                      className={`relative p-4 rounded-lg text-center transition-all ${
                        unlocked
                          ? 'bg-primary/10 border border-primary/30'
                          : 'bg-muted/30 border border-muted opacity-50'
                      }`}
                    >
                      <div className="text-4xl mb-2">{unlocked ? eq.emoji : '🔒'}</div>
                      <p className={`font-semibold text-sm ${unlocked ? '' : 'text-muted-foreground'}`}>
                        {eq.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {unlocked ? eq.description : `${eq.winsRequired} vitórias`}
                      </p>
                      {fromBet && (
                        <span className="absolute top-1 right-1 text-xs">🎰</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default MyBox;
