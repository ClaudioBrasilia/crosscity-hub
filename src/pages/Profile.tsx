import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { avatarEmojis } from '@/lib/mockData';
import { CalendarCheck, ChevronLeft, ChevronRight } from 'lucide-react';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const checkins: Record<string, string[]> = JSON.parse(localStorage.getItem('crosscity_checkins') || '{}');
  const myCheckins = user ? new Set(checkins[user.id] || []) : new Set<string>();

  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date().toISOString().split('T')[0];

    const days: { day: number; dateKey: string; isPresent: boolean; isToday: boolean; isPast: boolean }[] = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        day: d,
        dateKey,
        isPresent: myCheckins.has(dateKey),
        isToday: dateKey === today,
        isPast: dateKey < today,
      });
    }

    return { days, firstDay, daysInMonth };
  }, [calendarMonth, myCheckins]);

  const monthLabel = calendarMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const monthCheckinCount = calendarDays.days.filter((d) => d.isPresent).length;

  const handleSaveAvatar = () => {
    if (selectedAvatar) updateUser({ avatar: selectedAvatar });
  };

  const prevMonth = () => setCalendarMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  const nextMonth = () => setCalendarMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Perfil</h1>

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>Informações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Nome</p>
            <p className="text-xl font-semibold">{user?.name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="text-xl font-semibold">{user?.email}</p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Nível</p>
              <p className="text-2xl font-bold text-primary">{user?.level}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">XP Total</p>
              <p className="text-2xl font-bold text-secondary">{user?.xp}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sequência</p>
              <p className="text-2xl font-bold text-primary">{user?.streak} dias</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendário de Presenças */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-primary" />
            Presenças — {monthCheckinCount} check-ins
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <span className="font-semibold capitalize">{monthLabel}</span>
            <Button variant="ghost" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-2">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
              <div key={d} className="font-medium py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: calendarDays.firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {calendarDays.days.map((d) => (
              <div
                key={d.dateKey}
                className={`aspect-square flex items-center justify-center rounded-md text-sm font-medium transition-colors ${
                  d.isPresent
                    ? 'bg-green-500/20 text-green-400 border border-green-500/40'
                    : d.isPast
                      ? 'bg-muted/30 text-muted-foreground'
                      : 'text-foreground/60'
                } ${d.isToday ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : ''}`}
              >
                {d.day}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-green-500/20 border border-green-500/40" />
              Presente
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-muted/30" />
              Ausente
            </div>
          </div>

          {/* Badges de Frequência */}
          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-sm font-semibold mb-3">Badges de Frequência</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Bronze', min: 10, emoji: '🥉', color: 'border-amber-700/60 bg-amber-900/20' },
                { label: 'Prata', min: 20, emoji: '🥈', color: 'border-slate-400/60 bg-slate-500/20' },
                { label: 'Ouro', min: 25, emoji: '🥇', color: 'border-yellow-500/60 bg-yellow-500/20' },
              ].map((badge) => {
                const achieved = monthCheckinCount >= badge.min;
                return (
                  <div
                    key={badge.label}
                    className={`flex flex-col items-center p-3 rounded-lg border text-center transition-all ${
                      achieved ? badge.color : 'border-border opacity-40'
                    }`}
                  >
                    <span className="text-3xl">{badge.emoji}</span>
                    <span className="text-xs font-semibold mt-1">{badge.label}</span>
                    <span className="text-[10px] text-muted-foreground">{badge.min}+ check-ins</span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>Personalizar Avatar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4 mb-6">
            {avatarEmojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => setSelectedAvatar(emoji)}
                className={`text-6xl p-4 rounded-lg border-2 transition-all hover:scale-110 ${
                  selectedAvatar === emoji
                    ? 'border-primary bg-primary/10'
                    : 'border-border'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
          <Button onClick={handleSaveAvatar} className="w-full">
            Salvar Avatar
          </Button>
        </CardContent>
      </Card>

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>Conquistas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: '🔥', label: 'Primeira Semana', achieved: true },
              { icon: '💪', label: 'PR Hunter', achieved: true },
              { icon: '⚡', label: 'Velocista', achieved: false },
              { icon: '🏆', label: 'Campeão', achieved: false },
            ].map((achievement, i) => (
              <div
                key={i}
                className={`p-4 rounded-lg border text-center ${
                  achievement.achieved
                    ? 'border-primary bg-primary/10'
                    : 'border-border opacity-50'
                }`}
              >
                <div className="text-4xl mb-2">{achievement.icon}</div>
                <p className="text-sm font-semibold">{achievement.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
