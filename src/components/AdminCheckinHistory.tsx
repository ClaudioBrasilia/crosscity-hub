import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarCheck } from 'lucide-react';
import { getAllCheckins, getCurrentMonthKey, type MonthlyCheckinSummary } from '@/lib/checkinHistory';

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
  const currentMonth = getCurrentMonthKey();

  // Collect all unique months across all users
  const allMonths = useMemo(() => {
    const set = new Set<string>();
    Object.values(checkins).forEach((dates) => {
      dates.forEach((d) => {
        if (d && d.length >= 7) set.add(d.slice(0, 7));
      });
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [checkins]);

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);

  const monthLabel = (key: string) => {
    const [year, month] = key.split('-').map(Number);
    const d = new Date(year, month - 1, 1);
    return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  // For selected month, compute per-user totals
  const userTotals = useMemo(() => {
    return users
      .map((u) => {
        const dates = checkins[u.id] || [];
        const count = dates.filter((d) => d.startsWith(selectedMonth)).length;
        return { ...u, count };
      })
      .filter((u) => u.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [users, checkins, selectedMonth]);

  if (allMonths.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarCheck className="h-5 w-5 text-primary" />
          Frequência Mensal de Check-ins
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
            Nenhum check-in neste mês.
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
                <span className="text-sm font-bold text-primary">
                  {u.count} check-in{u.count !== 1 ? 's' : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminCheckinHistory;
