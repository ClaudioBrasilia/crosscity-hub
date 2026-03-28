import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getActiveChallenges } from '@/lib/supabaseData';
import type { ChallengeData } from '@/lib/supabaseData';

type WodVersion = {
  description: string;
  weight?: string;
};

type DailyWod = {
  id: string;
  date: string;
  name: string;
  type: 'For Time' | 'AMRAP' | 'EMOM' | 'Chipper' | 'Hero WOD';
  warmup?: string;
  skill?: string;
  versions: {
    rx: WodVersion;
    scaled: WodVersion;
    beginner: WodVersion;
  };
};

type TvCheckin = {
  id?: string;
  name?: string;
  time?: string;
};

type TvDuel = {
  id?: string;
  challengerName?: string;
  challengedNames?: string;
  status?: string;
  winnerName?: string;
  winnerBudget?: number | null;
  isFinished?: boolean;
};

const CLASS_SCHEDULE = [
  { start: '06:00', end: '07:00' },
  { start: '07:00', end: '08:00' },
  { start: '12:00', end: '13:00' },
  { start: '18:00', end: '19:00' },
  { start: '19:00', end: '20:00' },
];

const GYM_TIMEZONE = 'America/Sao_Paulo';

const getZonedDateParts = (date: Date) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: GYM_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
  };
};

const getCurrentClass = (): { start: string; end: string } | undefined => {
  const now = getZonedDateParts(new Date());
  const currentMinutes = now.hour * 60 + now.minute;
  return CLASS_SCHEDULE.find((cls) => {
    const [startH, startM] = cls.start.split(':').map(Number);
    const [endH, endM] = cls.end.split(':').map(Number);
    return currentMinutes >= startH * 60 + startM && currentMinutes < endH * 60 + endM;
  });
};

const getTodayISO = () => {
  const d = getZonedDateParts(new Date());
  return `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
};

const getCurrentWeekBounds = () => {
  const now = new Date();
  const start = new Date(now);
  const day = start.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diffToMonday);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { startMs: start.getTime(), endMs: end.getTime() };
};

const isInCurrentWeek = (timestamp?: number | null) => {
  if (!timestamp || Number.isNaN(timestamp)) return false;
  const { startMs, endMs } = getCurrentWeekBounds();
  return timestamp >= startMs && timestamp <= endMs;
};

const fetchDailyWod = async (): Promise<DailyWod | null> => {
  try {
    const { data, error } = await supabase
      .from('wods')
      .select('id, date, name, type, warmup, skill, versions')
      .eq('date', getTodayISO())
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    const versions = (data.versions || {}) as any;
    if (!versions.rx?.description) return null;
    return {
      id: data.id,
      date: data.date,
      name: data.name,
      type: data.type as DailyWod['type'],
      warmup: data.warmup ?? undefined,
      skill: data.skill ?? undefined,
      versions: {
        rx: versions.rx || { description: '' },
        scaled: versions.scaled || { description: '' },
        beginner: versions.beginner || { description: '' },
      },
    };
  } catch {
    return null;
  }
};

const fetchTvCheckins = async (): Promise<TvCheckin[]> => {
  const currentClass = getCurrentClass();
  if (!currentClass) return [];

  try {
    const today = getTodayISO();
    const { data, error } = await supabase
      .from('checkins')
      .select('id, user_id, created_at')
      .eq('check_date', today);
    if (error || !data || data.length === 0) return [];

    const [startH, startM] = currentClass.start.split(':').map(Number);
    const [endH, endM] = currentClass.end.split(':').map(Number);
    const classStartMin = startH * 60 + startM;
    const classEndMin = endH * 60 + endM;

    const filtered = data.filter((item) => {
      if (!item.created_at) return false;
      const d = new Date(item.created_at);
      if (Number.isNaN(d.getTime())) return false;
      const zoned = getZonedDateParts(d);
      const checkinMin = zoned.hour * 60 + zoned.minute;
      return checkinMin >= classStartMin && checkinMin < classEndMin;
    });

    if (filtered.length === 0) return [];

    const userIds = [...new Set(filtered.map((c) => c.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name')
      .in('id', userIds);
    const nameMap = new Map((profiles || []).map((p) => [p.id, p.name]));

    return filtered.slice(0, 12).map((item) => ({
      id: item.user_id,
      name: nameMap.get(item.user_id) || 'Atleta',
      time: item.created_at || '',
    }));
  } catch {
    return [];
  }
};

const fetchTvDuels = async (): Promise<TvDuel[]> => {
  try {
    const { data, error } = await supabase
      .from('app_duels')
      .select('id, challenger_id, opponent_ids, status, winner_id, bet_type, bet_xp_amount, bet_settled_at, bet_canceled_at, created_at')
      .in('status', ['pending', 'active', 'finished'])
      .order('created_at', { ascending: false })
      .limit(20);
    if (error || !data || data.length === 0) return [];

    const filteredDuels = data.filter((duel) => {
      if (duel.status === 'pending' || duel.status === 'active') return true;
      if (duel.status !== 'finished') return false;
      const finishedAt = duel.bet_settled_at ?? duel.bet_canceled_at ?? duel.created_at;
      return isInCurrentWeek(finishedAt);
    }).slice(0, 8);

    if (filteredDuels.length === 0) return [];

    const allUserIds = new Set<string>();
    filteredDuels.forEach((d) => {
      allUserIds.add(d.challenger_id);
      (d.opponent_ids || []).forEach((id: string) => allUserIds.add(id));
      if (d.winner_id) allUserIds.add(d.winner_id);
    });

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name')
      .in('id', [...allUserIds]);
    const nameMap = new Map((profiles || []).map((p) => [p.id, p.name]));

    return filteredDuels.map((duel) => {
      const participantsCount = 1 + (duel.opponent_ids?.length || 0);
      const winnerBudget =
        duel.winner_id && duel.bet_type === 'xp' && duel.bet_xp_amount
          ? duel.bet_xp_amount * Math.max(participantsCount - 1, 1)
          : null;

      return {
      id: duel.id,
      challengerName: nameMap.get(duel.challenger_id) || 'Atleta 1',
      challengedNames:
        duel.opponent_ids && duel.opponent_ids.length > 0
          ? duel.opponent_ids.map((opponentId: string) => nameMap.get(opponentId) || 'Atleta').join(', ')
          : 'Atleta 2',
      status: duel.status || 'Ativo',
      winnerName: duel.winner_id ? nameMap.get(duel.winner_id) || 'Atleta' : undefined,
      winnerBudget,
      isFinished: duel.status === 'finished',
    };
    });
  } catch {
    return [];
  }
};

const Panel = ({
  title,
  subtitle,
  children,
  className = '',
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <section className={`rounded-2xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-sm ${className}`}>
    <div className="border-b border-white/10 px-5 py-3">
      <h2 className="text-xl font-bold text-white">{title}</h2>
      {subtitle ? <p className="mt-0.5 text-xs text-white/50">{subtitle}</p> : null}
    </div>
    <div className="p-5">{children}</div>
  </section>
);

const Empty = ({ text }: { text: string }) => (
  <div className="flex min-h-[80px] items-center justify-center rounded-xl border border-dashed border-white/10 bg-black/20 px-4 text-center text-base text-white/45">
    {text}
  </div>
);

export default function TvMode() {
  const [dailyWod, setDailyWod] = useState<DailyWod | null>(null);
  const [checkins, setCheckins] = useState<TvCheckin[]>([]);
  const [duels, setDuels] = useState<TvDuel[]>([]);
  const [, setActiveChallenges] = useState<ChallengeData[]>([]);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const load = async () => {
      try {
        const [wod, ci, du, activeChallenges] = await Promise.all([
          fetchDailyWod(),
          fetchTvCheckins(),
          fetchTvDuels(),
          getActiveChallenges(),
        ]);
        setDailyWod(wod);
        setCheckins(ci);
        setDuels(du);
        setActiveChallenges(activeChallenges);
      } catch {
        // silently ignore network errors to keep TV stable
      }
      setNow(new Date());
    };
    load();
    const interval = window.setInterval(load, 10000);
    return () => window.clearInterval(interval);
  }, []);

  const dateLabel = useMemo(
    () =>
      now.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
      }),
    [now]
  );

  const timeLabel = useMemo(
    () =>
      now.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    [now]
  );

  const TABS = ['Warm-up', 'Skill', 'WOD'] as const;
  type TabKey = typeof TABS[number];
  const [activeTab, setActiveTab] = useState<TabKey>('WOD');


  const currentClass = getCurrentClass();
  const classLabel = currentClass
    ? `Aula atual: ${currentClass.start} – ${currentClass.end}`
    : 'Sem aula no momento';

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Warm-up':
        return dailyWod?.warmup ? (
          <div className="whitespace-pre-line text-3xl leading-relaxed text-white/90">
            {dailyWod.warmup}
          </div>
        ) : (
          <Empty text="Warm-up não definido" />
        );
      case 'Skill':
        return dailyWod?.skill ? (
          <div className="whitespace-pre-line text-3xl leading-relaxed text-white/90">
            {dailyWod.skill}
          </div>
        ) : (
          <Empty text="Skill não definido" />
        );
      case 'WOD':
        return dailyWod?.versions?.rx?.description ? (
          <div className="space-y-5">
            <div className="rounded-2xl bg-gradient-to-r from-red-500/15 to-orange-400/10 p-6">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-red-300">RX</p>
              <div className="whitespace-pre-line text-3xl font-semibold leading-relaxed text-white">
                {dailyWod.versions.rx.description}
              </div>
            </div>
            {dailyWod.versions.rx.weight ? (
              <div className="rounded-xl border border-white/10 bg-black/20 px-5 py-4">
                <p className="text-sm uppercase tracking-[0.25em] text-white/40">Carga sugerida</p>
                <p className="mt-1 text-2xl font-bold text-white/90">{dailyWod.versions.rx.weight}</p>
              </div>
            ) : null}
          </div>
        ) : (
          <Empty text="WOD não cadastrado" />
        );
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#0a0a0f] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(239,68,68,0.20),transparent_28%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.14),transparent_24%),linear-gradient(180deg,#0b0b10_0%,#111827_100%)]" />

      <div className="relative z-10 flex h-full flex-col p-4">
        <header className="mb-4 flex flex-shrink-0 items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-6 py-3 backdrop-blur-md">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-red-400">BOX LINK</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight">WOD DO DIA</h1>
            <p className="mt-1 text-sm text-white/60">{dateLabel}</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-black tabular-nums">{timeLabel}</div>
            <p className="mt-1 text-sm text-white/50">{classLabel}</p>
          </div>
        </header>

        <main className="grid min-h-0 flex-1 grid-cols-12 gap-4">
          {/* Left: tabbed content */}
          <div className="col-span-8 flex min-h-0 flex-col rounded-2xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-sm">
            {/* Tab bar */}
            <div className="flex flex-shrink-0 border-b border-white/10">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-4 text-center text-lg font-bold uppercase tracking-widest transition-colors ${
                    activeTab === tab
                      ? 'border-b-2 border-red-400 text-white'
                      : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            {/* Tab content */}
            <div className="min-h-0 flex-1 overflow-y-auto p-6">
              {renderTabContent()}
            </div>
          </div>

          {/* Right column: Check-ins + Duels, each with independent scroll */}
          <div className="col-span-4 flex min-h-0 flex-col gap-4">
            {/* Check-ins */}
            <Panel title="Check-ins" subtitle={currentClass ? `${currentClass.start} – ${currentClass.end}` : 'Sem aula'} className="flex min-h-0 flex-1 flex-col [&>div:last-child]:min-h-0 [&>div:last-child]:flex-1 [&>div:last-child]:overflow-y-auto">
              {checkins.length ? (
                <div className="space-y-2">
                  {checkins.map((athlete, index) => (
                    <div
                      key={`${athlete.id || athlete.name}-${index}`}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-3"
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-red-500/80 to-orange-400/80 text-sm font-bold text-white">
                          {(athlete.name || 'A').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-base font-semibold text-white">{athlete.name || 'Atleta'}</p>
                          <p className="text-xs text-white/45">Presente</p>
                        </div>
                      </div>
                      <div className="text-xs font-medium text-emerald-300">✓</div>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty text="Nenhum check-in nesta aula" />
              )}
            </Panel>

            {/* Duels */}
            <Panel title="Duelos" subtitle="Confrontos da semana" className="flex min-h-0 flex-shrink-0 max-h-[35%] flex-col [&>div:last-child]:min-h-0 [&>div:last-child]:flex-1 [&>div:last-child]:overflow-y-auto">
              {duels.length ? (
                <div className="space-y-2">
                  {duels.map((duel, index) => (
                    <div
                      key={`${duel.id || index}`}
                      className="rounded-xl border border-white/10 bg-black/20 p-3"
                    >
                      <p className="text-[10px] uppercase tracking-[0.25em] text-white/35">
                        {duel.isFinished ? 'Duelo encerrado' : 'Duelo ativo'}
                      </p>
                      <p className="mt-1 text-base font-bold text-white">
                        {`${duel.challengerName || 'Atleta 1'} vs ${duel.challengedNames || 'Atleta 2'}`}
                      </p>
                      <p className="mt-1 text-xs text-white/50">Status: {duel.status || 'Ativo'}</p>
                      {duel.winnerName ? (
                        <p className="mt-1 text-xs text-emerald-300">Vencedor: {duel.winnerName}</p>
                      ) : null}
                      {duel.winnerBudget ? (
                        <p className="text-xs text-white/65">Budget do vencedor: {duel.winnerBudget} XP</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <Empty text="Nenhum duelo nesta semana" />
              )}
            </Panel>
          </div>
        </main>
      </div>
    </div>
  );
}
