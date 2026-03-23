import React, { useEffect, useMemo, useState } from 'react';

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
  challengedName?: string;
  status?: string;
};

const safeParse = <T,>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const getStoredDailyWod = (): DailyWod | null => {
  try {
    const raw = localStorage.getItem('crosscity_daily_wod');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DailyWod | null;
    if (!parsed || !parsed.name || !parsed.versions?.rx?.description) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

const CLASS_SCHEDULE = [
  { start: '06:00', end: '07:00' },
  { start: '07:00', end: '08:00' },
  { start: '12:00', end: '13:00' },
  { start: '18:00', end: '19:00' },
  { start: '19:00', end: '20:00' },
];

const getCurrentClass = (): { start: string; end: string } | undefined => {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  return CLASS_SCHEDULE.find((cls) => {
    const [startH, startM] = cls.start.split(':').map(Number);
    const [endH, endM] = cls.end.split(':').map(Number);
    return currentMinutes >= startH * 60 + startM && currentMinutes < endH * 60 + endM;
  });
};

const getTvCheckins = (): TvCheckin[] => {
  const currentClass = getCurrentClass();
  if (!currentClass) return [];

  const [startH, startM] = currentClass.start.split(':').map(Number);
  const [endH, endM] = currentClass.end.split(':').map(Number);
  const classStartMin = startH * 60 + startM;
  const classEndMin = endH * 60 + endM;

  const users = safeParse<any[]>(localStorage.getItem('crosscity_users'), []);
  const checkins = safeParse<any[]>(localStorage.getItem('crosscity_checkins'), []);
  const userMap = new Map(
    users.map((u) => [u.id, u.name || u.username || 'Atleta'])
  );
  return checkins
    .filter((item) => {
      const rawDate = item?.createdAt || item?.created_at || item?.timestamp || item?.date;
      if (!rawDate) return false;
      const d = new Date(rawDate);
      if (Number.isNaN(d.getTime())) return false;
      const checkinMin = d.getHours() * 60 + d.getMinutes();
      return checkinMin >= classStartMin && checkinMin < classEndMin;
    })
    .map((item) => ({
      id: item.userId || item.user_id || item.id,
      name: userMap.get(item.userId || item.user_id) || item.userName || 'Atleta',
      time: item.createdAt || item.created_at || item.timestamp || '',
    }))
    .slice(0, 12);
};

const getTvDuels = (): TvDuel[] => {
  const duels = safeParse<any[]>(localStorage.getItem('crosscity_duels'), []);
  return duels
    .filter((duel) => {
      const status = String(duel?.status || '').toLowerCase();
      return !status || status === 'active' || status === 'pending';
    })
    .map((duel) => ({
      id: duel.id,
      challengerName: duel.challengerName || duel.challenger_name,
      challengedName: duel.challengedName || duel.challenged_name,
      status: duel.status || 'Ativo',
    }))
    .slice(0, 8);
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
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const load = () => {
      setDailyWod(getStoredDailyWod());
      setCheckins(getTvCheckins());
      setDuels(getTvDuels());
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

  const currentClass = getCurrentClass();
  const classLabel = currentClass
    ? `Aula atual: ${currentClass.start} – ${currentClass.end}`
    : 'Sem aula no momento';

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#0a0a0f] text-white">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(239,68,68,0.20),transparent_28%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.14),transparent_24%),linear-gradient(180deg,#0b0b10_0%,#111827_100%)]" />

      {/* Full layout: fixed to viewport */}
      <div className="relative z-10 flex h-full flex-col p-4">
        {/* Header */}
        <header className="mb-4 flex flex-shrink-0 items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-6 py-3 backdrop-blur-md">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-red-400">CrossCity Hub</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight">WOD DO DIA</h1>
            <p className="mt-1 text-sm text-white/60">{dateLabel}</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-black tabular-nums">{timeLabel}</div>
            <p className="mt-1 text-sm text-white/50">{classLabel}</p>
          </div>
            <div className="text-4xl font-black tabular-nums">{timeLabel}</div>
          </div>
        </header>

        {/* Main grid: fills remaining height */}
        <main className="grid min-h-0 flex-1 grid-cols-12 gap-4">
          {/* Left column: Warm-up, Skill, WOD */}
          <div className="col-span-8 flex min-h-0 flex-col gap-4">
            {/* Warm-up: fixed max height */}
            <Panel title="Warm-up" subtitle="Preparação e ativação" className="flex-shrink-0">
              <div className="max-h-[12vh] overflow-hidden">
                {dailyWod?.warmup ? (
                  <div className="whitespace-pre-line text-lg leading-relaxed text-white/90">
                    {dailyWod.warmup}
                  </div>
                ) : (
                  <Empty text="Warm-up não definido" />
                )}
              </div>
            </Panel>

            {/* Skill: fixed max height */}
            <Panel title="Skill" subtitle="Técnica e desenvolvimento" className="flex-shrink-0">
              <div className="max-h-[12vh] overflow-hidden">
                {dailyWod?.skill ? (
                  <div className="whitespace-pre-line text-lg leading-relaxed text-white/90">
                    {dailyWod.skill}
                  </div>
                ) : (
                  <Empty text="Skill não definido" />
                )}
              </div>
            </Panel>

            {/* WOD: takes remaining space, scrollable internally */}
            <Panel
              title={dailyWod?.name || 'WOD do Dia'}
              subtitle={dailyWod?.type ? `Formato: ${dailyWod.type}` : 'Treino principal'}
              className="flex min-h-0 flex-1 flex-col [&>div:last-child]:min-h-0 [&>div:last-child]:flex-1 [&>div:last-child]:overflow-y-auto"
            >
              {dailyWod?.versions?.rx?.description ? (
                <div className="space-y-4">
                  <div className="rounded-2xl bg-gradient-to-r from-red-500/15 to-orange-400/10 p-5">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-red-300">RX</p>
                    <div className="whitespace-pre-line text-2xl font-semibold leading-relaxed text-white">
                      {dailyWod.versions.rx.description}
                    </div>
                  </div>
                  {dailyWod.versions.rx.weight ? (
                    <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.25em] text-white/40">Carga sugerida</p>
                      <p className="mt-1 text-xl font-bold text-white/90">
                        {dailyWod.versions.rx.weight}
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : (
                <Empty text="WOD não cadastrado" />
              )}
            </Panel>
          </div>

          {/* Right column: Check-ins + Duels, always visible */}
          <div className="col-span-4 flex min-h-0 flex-col gap-4">
            {/* Check-ins: scrollable if many */}
            <Panel title="Check-ins" subtitle="Turma atual" className="flex min-h-0 flex-1 flex-col [&>div:last-child]:min-h-0 [&>div:last-child]:flex-1 [&>div:last-child]:overflow-y-auto">
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

            {/* Duels: scrollable if many */}
            <Panel title="Duelos" subtitle="Confrontos ativos" className="flex min-h-0 flex-shrink-0 max-h-[35%] flex-col [&>div:last-child]:min-h-0 [&>div:last-child]:flex-1 [&>div:last-child]:overflow-y-auto">
              {duels.length ? (
                <div className="space-y-2">
                  {duels.map((duel, index) => (
                    <div
                      key={`${duel.id || index}`}
                      className="rounded-xl border border-white/10 bg-black/20 p-3"
                    >
                      <p className="text-[10px] uppercase tracking-[0.25em] text-white/35">Duelo ativo</p>
                      <p className="mt-1 text-base font-bold text-white">
                        {`${duel.challengerName || 'Atleta 1'} vs ${duel.challengedName || 'Atleta 2'}`}
                      </p>
                      <p className="mt-1 text-xs text-white/50">Status: {duel.status || 'Ativo'}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty text="Nenhum duelo ativo" />
              )}
            </Panel>
          </div>
        </main>
      </div>
    </div>
  );
}
