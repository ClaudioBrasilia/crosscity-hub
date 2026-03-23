import { useMemo, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarCheck } from 'lucide-react';
import { getMonthlyHistory, getCurrentMonthKey, getMonthlyXpHistory } from '@/lib/checkinHistory';

interface Props {
  /** Array of date strings "YYYY-MM-DD" for the user */
  dates: string[];
  /** User ID to fetch monthly XP data */
  userId?: string;
}

const CheckinMonthlyHistory = ({ dates, userId }: Props) => {
  const history = useMemo(() => getMonthlyHistory(dates), [dates]);
  const [xpHistory, setXpHistory] = useState<Array<{ monthKey: string; label: string; xp: number }>>([]);
  const currentMonth = getCurrentMonthKey();

  useEffect(() => {
    let mounted = true;

    const loadXpHistory = async () => {
      if (!userId) {
        if (mounted) setXpHistory([]);
        return;
      }

      const nextHistory = await getMonthlyXpHistory(userId);
      if (mounted) setXpHistory(nextHistory);
    };

    loadXpHistory();
    return () => {
      mounted = false;
    };
  }, [userId]);

  // Build merged data: checkins + xp per month (excluding current month)
  const mergedMonths = useMemo(() => {
    const xpMap = new Map(xpHistory.map((x) => [x.monthKey, x.xp]));
    const allKeys = new Set([
      ...history.map((h) => h.monthKey),
      ...xpHistory.map((x) => x.monthKey),
    ]);
    allKeys.delete(currentMonth);

    return Array.from(allKeys)
      .sort((a, b) => b.localeCompare(a))
      .map((monthKey) => {
        const checkinEntry = history.find((h) => h.monthKey === monthKey);
        const [year, month] = monthKey.split('-').map(Number);
        const date = new Date(year, month - 1, 1);
        const label = checkinEntry?.label || date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        return {
          monthKey,
          label,
          total: checkinEntry?.total || 0,
          xp: xpMap.get(monthKey) || 0,
        };
      });
  }, [history, xpHistory, currentMonth]);

  if (mergedMonths.length === 0) {
    return null;
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarCheck className="h-5 w-5 text-primary" />
          Histórico Mensal
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {mergedMonths.map((m) => (
            <div
              key={m.monthKey}
              className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
            >
              <span className="font-medium capitalize">{m.label}</span>
              <div className="flex items-center gap-4 text-sm font-bold">
                <span className="text-primary">
                  {m.total} check-in{m.total !== 1 ? 's' : ''}
                </span>
                {m.xp > 0 && (
                  <span className="text-secondary">
                    {m.xp} XP
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CheckinMonthlyHistory;
