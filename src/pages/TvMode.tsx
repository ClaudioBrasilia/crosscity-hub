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

const getTvCheckins = (): TvCheckin[] => {
  const users = safeParse<any[]>(localStorage.getItem('crosscity_users'), []);
  const checkins = safeParse<any[]>(localStorage.getItem('crosscity_checkins'), []);
  const userMap = new Map(
    users.map((u) => [u.id, u.name || u.username || 'Atleta'])
  );
  const currentHour = new Date().getHours();
  return checkins
    .filter((item) => {
      const rawDate = item?.createdAt || item?.created_at || item?.timestamp || item?.date;
      if (!rawDate) return true;
      const d = new Date(rawDate);
      return !Number.isNaN(d.getTime()) && d.getHours() === currentHour;
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
  <section className={`rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-sm ${className}`}>
    <div className="border-b border-white/10 px-6 py-4">
      <h2 className="text-2xl font-bold text-white">{title}</h2>
      {subtitle ? <p className="mt-1 text-sm text-white/50">{subtitle}</p> : null}
    </div>
    <div className="p-6">{children}</div>
  </section>
);

const Empty = ({ text }: { text: string }) => (
  <div className="flex min-h-[120px] items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/20 px-4 text-center text-lg text-white/45">
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

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="relative min-h-screen overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(239,68,68,0.20),transparent_28%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.14),transparent_24%),linear-gradient(180deg,#0b0b10_0%,#111827_100%)]" />

        <div className="relative z-10 mx-auto flex min-h-screen max-w-[1920px] flex-col p-6">
          <header className="mb-6 flex items-center justify-between rounded-3xl border border-white/10 bg-white/5 px-8 py-5 backdrop-blur-md">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-red-400">CrossCity Hub</p>
              <h1 className="mt-2 text-4xl font-black tracking-tight">WOD DO DIA</h1>
              <p className="mt-2 text-base text-white/60">{dateLabel}</p>
            </div>
            <div className="text-right">
              <div className="text-5xl font-black tabular-nums">{timeLabel}</div>
            </div>
          </header>

          <main className="grid flex-1 grid-cols-12 gap-6">
            <div className="col-span-8 flex flex-col gap-6">
              <Panel title="Warm-up" subtitle="Preparação e ativação" className="min-h-[220px]">
                {dailyWod?.warmup ? (
                  <div className="whitespace-pre-line text-2xl leading-relaxed text-white/90">
                    {dailyWod.warmup}
                  </div>
                ) : (
                  <Empty text="Warm-up não definido" />
                )}
              </Panel>

              <Panel title="Skill" subtitle="Técnica e desenvolvimento" className="min-h-[220px]">
                {dailyWod?.skill ? (
                  <div className="whitespace-pre-line text-2xl leading-relaxed text-white/90">
                    {dailyWod.skill}
                  </div>
                ) : (
                  <Empty text="Skill não definido" />
                )}
              </Panel>

              <Panel
                title={dailyWod?.name || 'WOD do Dia'}
                subtitle={dailyWod?.type ? `Formato: ${dailyWod.type}` : 'Treino principal'}
                className="flex-1"
              >
                {dailyWod?.versions?.rx?.description ? (
                  <div className="space-y-6">
                    <div className="rounded-3xl bg-gradient-to-r from-red-500/15 to-orange-400/10 p-6">
                      <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-red-300">RX</p>
                      <div className="whitespace-pre-line text-3xl font-semibold leading-relaxed text-white">
                        {dailyWod.versions.rx.description}
                      </div>
                    </div>
                    {dailyWod.versions.rx.weight ? (
                      <div className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4">
                        <p className="text-sm uppercase tracking-[0.25em] text-white/40">Carga sugerida</p>
                        <p className="mt-2 text-2xl font-bold text-white/90">
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

            <div className="col-span-4 flex flex-col gap-6">
              <Panel title="Check-ins" subtitle="Turma atual" className="min-h-[360px]">
                {checkins.length ? (
                  <div className="space-y-3">
                    {checkins.map((athlete, index) => (
                      <div
                        key={`${athlete.id || athlete.name}-${index}`}
                        className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-red-500/80 to-orange-400/80 text-lg font-bold text-white">
                            {(athlete.name || 'A').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-lg font-semibold text-white">{athlete.name || 'Atleta'}</p>
                            <p className="text-sm text-white/45">Presente na aula</p>
                          </div>
                        </div>
                        <div className="text-sm font-medium text-emerald-300">Check-in</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Empty text="Nenhum check-in nesta aula" />
                )}
              </Panel>

              <Panel title="Duelos" subtitle="Confrontos ativos" className="flex-1">
                {duels.length ? (
                  <div className="space-y-3">
                    {duels.map((duel, index) => (
                      <div
                        key={`${duel.id || index}`}
                        className="rounded-2xl border border-white/10 bg-black/20 p-4"
                      >
                        <p className="text-xs uppercase tracking-[0.25em] text-white/35">Duelo ativo</p>
                        <p className="mt-2 text-xl font-bold text-white">
                          {`${duel.challengerName || 'Atleta 1'} vs ${duel.challengedName || 'Atleta 2'}`}
                        </p>
                        <p className="mt-2 text-sm text-white/50">Status: {duel.status || 'Ativo'}</p>
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
    </div>
  );
}
