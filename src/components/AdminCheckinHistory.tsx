import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarCheck } from 'lucide-react';
import { getAllCheckins, getCurrentMonthKey, getAllMonthlyXp } from '@/lib/checkinHistory';

interface UserInfo {
  id: string;
  name: string;
  avatar: string;
}

interface Props {
  users: UserInfo[];
}

const AdminCheckinHistory = ({ users }: Props) => {
  const checkins = useMemo(() => getAllCheckins(), []);
  const [monthlyXp, setMonthlyXp] = useState<Record<string, Record<string, number>>>({});
  const currentMonth = getCurrentMonthKey();

  useEffect(() => {
    let mounted = true;

    const loadMonthlyXp = async () => {
      const nextMonthlyXp = await getAllMonthlyXp();
      if (mounted) setMonthlyXp(nextMonthlyXp);
    };

    loadMonthlyXp();
    return () => {
      mounted = false;
    };
  }, []);

  // Collect all unique months across all users (checkins + xp)
  const allMonths = useMemo(() => {
    const set = new Set<string>();
    Object.values(checkins).forEach((dates) => {
      dates.forEach((d) => {
        if (d && d.length >= 7) set.add(d.slice(0, 7));
      });
    });
    Object.values(monthlyXp).forEach((months) => {
      Object.keys(months).forEach((k) => set.add(k));
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [checkins, monthlyXp]);

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);

  const monthLabel = (key: string) => {
    const [year, month] = key.split('-').map(Number);
    const d = new Date(year, month - 1, 1);
    return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  // For selected month, compute per-user totals (checkins + xp)
  const userTotals = useMemo(() => {
    return users
      .map((u) => {
        const dates = checkins[u.id] || [];
        const count = dates.filter((d) => d.startsWith(selectedMonth)).length;
        const xp = monthlyXp[u.id]?.[selectedMonth] || 0;
        return { ...u, count, xp };
      })
      .filter((u) => u.count > 0 || u.xp > 0)
      .sort((a, b) => b.xp - a.xp || b.count - a.count);
  }, [users, checkins, monthlyXp, selectedMonth]);

  if (allMonths.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarCheck className="h-5 w-5 text-primary" />
          Frequência e XP Mensal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-[220px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {allMonths.map((m) => (
              <SelectItem key={m} value={m}>
                <span className="capitalize">{monthLabel(m)}</span>
                {m === currentMonth ? ' (atual)' : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {userTotals.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Nenhum dado neste mês.
          </p>
        ) : (
          <div className="space-y-2">
            {userTotals.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{u.avatar || '👤'}</span>
                  <span className="font-medium">{u.name}</span>
                </div>
                <div className="flex items-center gap-4 text-sm font-bold">
                  <span className="text-primary">
                    {u.count} check-in{u.count !== 1 ? 's' : ''}
                  </span>
                  {u.xp > 0 && (
                    <span className="text-secondary">
                      {u.xp} XP
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminCheckinHistory;
