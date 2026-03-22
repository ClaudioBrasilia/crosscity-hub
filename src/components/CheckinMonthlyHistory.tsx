import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarCheck } from 'lucide-react';
import { getMonthlyHistory, getCurrentMonthKey, type MonthlyCheckinSummary } from '@/lib/checkinHistory';

interface Props {
  /** Array of date strings "YYYY-MM-DD" for the user */
  dates: string[];
}

const CheckinMonthlyHistory = ({ dates }: Props) => {
  const history = useMemo(() => getMonthlyHistory(dates), [dates]);
  const currentMonth = getCurrentMonthKey();

  // Only show past months (current month is already shown in the calendar)
  const pastMonths = history.filter((m) => m.monthKey !== currentMonth);

  if (pastMonths.length === 0) {
    return null;
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarCheck className="h-5 w-5 text-primary" />
          Histórico Mensal de Check-ins
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {pastMonths.map((m) => (
            <div
              key={m.monthKey}
              className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
            >
              <span className="font-medium capitalize">{m.label}</span>
              <span className="text-sm font-bold text-primary">
                {m.total} check-in{m.total !== 1 ? 's' : ''}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CheckinMonthlyHistory;
