import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import * as db from '@/lib/supabaseData';

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

type CheckinRow = {
  id: string;
  user_id: string;
  created_at: string;
};

type ProfileNameRow = {
  id: string;
  name: string;
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

const getClassRange = (cls: { start: string; end: string }) => {
  const today = new Date();
  const start = new Date(today);
  const end = new Date(today);
  const [startH, startM] = cls.start.split(':').map(Number);
  const [endH, endM] = cls.end.split(':').map(Number);
  start.setHours(startH, startM, 0, 0);
  end.setHours(endH, endM, 0, 0);
  return { start, end };
};

const getTvCheckins = async (): Promise<TvCheckin[]> => {
  const currentClass = getCurrentClass();
  if (!currentClass) return [];

  const { start, end } = getClassRange(currentClass);
  const { data, error } = await supabase
    .from('checkins')
    .select('id, user_id, created_at')
    .gte('created_at', start.toISOString())
    .lt('created_at', end.toISOString())
    .order('created_at', { ascending: false })
    .limit(12);

  if (error) {
    console.error('Error fetching TV check-ins:', error);
    return [];
  }

  const checkinRows = (data || []) as CheckinRow[];
  const userIds = Array.from(new Set(checkinRows.map((item) => item.user_id).filter(Boolean)));
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, name')
    .in('id', userIds.length ? userIds : ['__none__']);

  if (profilesError) {
    console.error('Error fetching TV check-in profiles:', profilesError);
  }

  const nameMap = new Map(((profiles || []) as ProfileNameRow[]).map((profile) => [profile.id, profile.name || 'Atleta']));

  return checkinRows.map((item) => ({
    id: item.id,
    name: nameMap.get(item.user_id) || 'Atleta',
    time: item.created_at,
  }));
};

const getTvDuels = async (): Promise<TvDuel[]> => {
  const duels = await db.getDuels();
  const visibleDuels = duels
    .filter((duel) => {
      const status = String(duel?.status || '').toLowerCase();
      return !status || status === 'active' || status === 'pending';
    })
    .slice(0, 8);

  if (!visibleDuels.length) return [];

  const participantIds = Array.from(
    new Set(
      visibleDuels.flatMap((duel) => [duel.challengerId, ...duel.opponentIds]).filter(Boolean)
    )
  );

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, name')
    .in('id', participantIds);

  if (error) {
    console.error('Error fetching TV duel participants:', error);
  }

  const nameMap = new Map(((profiles || []) as ProfileNameRow[]).map((profile) => [profile.id, profile.name || 'Atleta']));

  return visibleDuels.map((duel) => ({
    id: duel.id,
    challengerName: nameMap.get(duel.challengerId) || 'Atleta 1',
    challengedName: duel.opponentIds.map((id) => nameMap.get(id) || 'Atleta').join(', ') || 'Atleta 2',
    status: duel.status || 'Ativo',
  }));
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
    let isMounted = true;

    const load = async () => {
      const [wod, nextCheckins, nextDuels] = await Promise.all([
        db.getLatestWod(),
        getTvCheckins(),
        getTvDuels(),
      ]);

      if (!isMounted) return;
      setDailyWod((wod as DailyWod | null) || null);
      setCheckins(nextCheckins);
      setDuels(nextDuels);
      setNow(new Date());
    };

    load();
    const interval = window.setInterval(load, 10000);
    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
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
            <p className="text-xs uppercase tracking-[0.35em] text-red-400">BOX LINK</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight">WOD DO DIA</h1>
            <p className="mt-1 text-sm text-white/60">{dateLabel}</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-black tabular-nums">{timeLabel}</div>
            <p className="mt-1 text-sm text-white/50">{classLabel}</p>
          </div>
        </header>

        {/* Main grid: fills remaining height */}
        <main className="grid min-h-0 flex-1 grid-cols-12 gap-4">
          {/* Left column: single scrollable area for Warm-up + Skill + WOD */}
          <div className="col-span-8 min-h-0 overflow-y-auto rounded-2xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-sm">
            <div className="space-y-6 p-5">
              {/* Warm-up */}
              <div>
                <div className="mb-2 border-b border-white/10 pb-2">
                  <h2 className="text-xl font-bold text-white">Warm-up</h2>
                  <p className="mt-0.5 text-xs text-white/50">Preparação e ativação</p>
                </div>
                {dailyWod?.warmup ? (
                  <div className="whitespace-pre-line text-lg leading-relaxed text-white/90">
                    {dailyWod.warmup}
                  </div>
                ) : (
                  <Empty text="Warm-up não definido" />
                )}
              </div>

              {/* Skill */}
              <div>
                <div className="mb-2 border-b border-white/10 pb-2">
                  <h2 className="text-xl font-bold text-white">Skill</h2>
                  <p className="mt-0.5 text-xs text-white/50">Técnica e desenvolvimento</p>
                </div>
                {dailyWod?.skill ? (
                  <div className="whitespace-pre-line text-lg leading-relaxed text-white/90">
                    {dailyWod.skill}
                  </div>
                ) : (
                  <Empty text="Skill não definido" />
                )}
              </div>

              {/* WOD */}
              <div>
                <div className="mb-2 border-b border-white/10 pb-2">
                  <h2 className="text-xl font-bold text-white">{dailyWod?.name || 'WOD do Dia'}</h2>
                  <p className="mt-0.5 text-xs text-white/50">
                    {dailyWod?.type ? `Formato: ${dailyWod.type}` : 'Treino principal'}
                  </p>
                </div>
                {dailyWod?.versions?.rx?.description ? (
                  <div className="space-y-4">
                    <div className="rounded-2xl bg-gradient-to-r from-red-500/15 to-orange-400/10 p-5">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-red-300">RX</p>
                      <div className="whitespace-pre-line text-2xl font-semibold leading-relaxed text-white">
                        {dailyWod.versions.rx.description}
                      </div>
                      {dailyWod.versions.rx.weight ? (
                        <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 mt-4">
                          <p className="text-xs uppercase tracking-[0.25em] text-white/40">Carga sugerida</p>
                          <p className="mt-1 text-xl font-bold text-white/90">
                            {dailyWod.versions.rx.weight}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <Empty text="WOD não cadastrado" />
                )}
              </div>
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
