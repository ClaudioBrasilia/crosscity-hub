import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarCheck } from 'lucide-react';
import { getMonthlyXpHistory } from '@/lib/supabaseData';

interface Props {
  dates: string[];
  userId?: string;
}

const getCurrentMonthKey = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const CheckinMonthlyHistory = ({ dates, userId }: Props) => {
  const [xpHistory, setXpHistory] = useState<Array<{ monthKey: string; label: string; xp: number }>>([]);

  useEffect(() => {
    if (userId) {
      getMonthlyXpHistory(userId).then(setXpHistory);
    }
  }, [userId]);

  const history = useMemo(() => {
    const map = new Map<string, number>();
    for (const dateStr of dates) {
      if (!dateStr || dateStr.length < 7) continue;
      const monthKey = dateStr.slice(0, 7);
      map.set(monthKey, (map.get(monthKey) || 0) + 1);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([monthKey, total]) => {
        const [year, month] = monthKey.split('-').map(Number);
        const date = new Date(year, month - 1, 1);
        const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        return { monthKey, label, total };
      });
  }, [dates]);

  const currentMonth = getCurrentMonthKey();

  const mergedMonths = useMemo(() => {
    const xpMap = new Map(xpHistory.map(x => [x.monthKey, x.xp]));
    const allKeys = new Set([...history.map(h => h.monthKey), ...xpHistory.map(x => x.monthKey)]);
    allKeys.delete(currentMonth);

    return Array.from(allKeys)
      .sort((a, b) => b.localeCompare(a))
      .map(monthKey => {
        const checkinEntry = history.find(h => h.monthKey === monthKey);
        const [year, month] = monthKey.split('-').map(Number);
        const date = new Date(year, month - 1, 1);
        const label = checkinEntry?.label || date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        return { monthKey, label, total: checkinEntry?.total || 0, xp: xpMap.get(monthKey) || 0 };
      });
  }, [history, xpHistory, currentMonth]);

  if (mergedMonths.length === 0) return null;

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarCheck className="h-5 w-5 text-primary" /> Histórico Mensal
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {mergedMonths.map(m => (
            <div key={m.monthKey} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
              <span className="font-medium capitalize">{m.label}</span>
              <div className="flex items-center gap-4 text-sm font-bold">
                <span className="text-primary">{m.total} check-in{m.total !== 1 ? 's' : ''}</span>
                {m.xp > 0 && <span className="text-secondary">{m.xp} XP</span>}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CheckinMonthlyHistory;
