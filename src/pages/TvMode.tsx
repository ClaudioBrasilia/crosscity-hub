import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { normalizeDuel } from '@/lib/duelLogic';
import { getStoredUsers, safeParse } from '@/lib/realUsers';
import type { DailyWod, Duel } from '@/lib/mockData';

interface TvSnapshot {
  dailyWod: DailyWod | null;
  checkIns: Array<{ id: string; name: string; avatar?: string }>;
  duels: Duel[];
}

const REFRESH_INTERVAL_MS = 5000;
const SIDEBAR_ITEM_LIMIT = 6;

const todayKey = () => new Date().toISOString().split('T')[0];

const readLocalStorageSafe = <T,>(key: string, fallback: T): T => {
  if (typeof window === 'undefined' || !window.localStorage) return fallback;

  try {
    return safeParse<T>(window.localStorage.getItem(key), fallback);
  } catch {
    return fallback;
  }
};

const loadTvSnapshot = (): TvSnapshot => {
  const users = getStoredUsers();
  const usersMap = new Map(users.map((user) => [user.id, user]));
  const dailyWod = readLocalStorageSafe<DailyWod | null>('crosscity_daily_wod', null);
  const checkins = readLocalStorageSafe<Record<string, string[]>>('crosscity_checkins', {});
  const duels = readLocalStorageSafe<unknown[]>('crosscity_duels', [])
    .map((item) => normalizeDuel(item))
    .filter((duel) => duel.status === 'active');

  const currentClassCheckIns = Object.entries(checkins)
    .filter(([, dates]) => Array.isArray(dates) && dates.includes(todayKey()))
    .map(([userId]) => {
      const user = usersMap.get(userId);
      return user
        ? { id: user.id, name: user.name || 'Aluno', avatar: user.avatar }
        : null;
    })
    .filter((entry): entry is { id: string; name: string; avatar?: string } => entry !== null)
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

  return {
    dailyWod,
    checkIns: currentClassCheckIns,
    duels,
  };
};

const TvMode = () => {
  const [snapshot, setSnapshot] = useState<TvSnapshot>(() => loadTvSnapshot());

  useEffect(() => {
    const syncSnapshot = () => {
      setSnapshot(loadTvSnapshot());
    };

    syncSnapshot();

    const intervalId = window.setInterval(syncSnapshot, REFRESH_INTERVAL_MS);
    window.addEventListener('storage', syncSnapshot);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('storage', syncSnapshot);
    };
  }, []);

  const warmup = snapshot.dailyWod?.warmup?.trim() || 'Warm-up não definido';
  const skill = snapshot.dailyWod?.skill?.trim() || 'Skill não definido';
  const wodDescription = snapshot.dailyWod?.versions?.rx?.description?.trim() || 'WOD não definido';

  const duelItems = useMemo(() => {
    const usersMap = new Map(getStoredUsers().map((user) => [user.id, user]));

    return snapshot.duels.map((duel) => {
      const challenger = usersMap.get(duel.challengerId)?.name || 'Atleta';
      const opponents = duel.opponentIds
        .map((id) => usersMap.get(id)?.name || 'Atleta')
        .join(' x ');

      return {
        id: duel.id,
        label: `${challenger} x ${opponents}`,
        subtitle: duel.wodName,
      };
    });
  }, [snapshot.duels]);

  return (
    <main className="h-screen overflow-hidden bg-[#0f0f0f] text-white">
      <div className="mx-auto grid h-full max-w-[1920px] grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)] gap-6 overflow-hidden p-6 lg:gap-8 lg:p-8">
        <section className="grid min-h-0 grid-rows-[minmax(140px,0.72fr)_minmax(140px,0.72fr)_minmax(0,1.56fr)] gap-6 overflow-hidden lg:gap-8">
          <Panel title="Warm-up" bodyClassName="overflow-hidden">
            <ContentText className="max-h-full overflow-hidden">{warmup}</ContentText>
          </Panel>

          <Panel title="Skill" bodyClassName="overflow-hidden">
            <ContentText className="max-h-full overflow-hidden">{skill}</ContentText>
          </Panel>

          <Panel title="WOD" className="min-h-0" bodyClassName="min-h-0 overflow-hidden">
            <div className="flex h-full min-h-0 flex-col gap-4">
              {snapshot.dailyWod?.name ? (
                <div className="flex shrink-0 flex-wrap items-center gap-3 text-xl text-white/70 lg:text-2xl">
                  <span>{snapshot.dailyWod.name}</span>
                  <span className="rounded-full border border-white/15 px-3 py-1 text-lg lg:text-xl">
                    RX
                  </span>
                </div>
              ) : null}

              <div className="min-h-0 flex-1 overflow-y-auto pr-2">
                <p className="text-[2rem] font-semibold leading-tight tracking-tight text-white lg:text-[3.25rem]">
                  {wodDescription}
                </p>
              </div>
            </div>
          </Panel>
        </section>

        <aside className="grid min-h-0 grid-rows-2 gap-6 overflow-hidden lg:gap-8">
          <Panel title="Check-ins" className="min-h-0" bodyClassName="min-h-0 overflow-hidden">
            <ListContainer
              items={snapshot.checkIns.map((entry) => ({
                key: entry.id,
                title: `${entry.avatar || '👤'} ${entry.name}`,
              }))}
              emptyLabel="Nenhum check-in"
            />
          </Panel>

          <Panel title="Duelos" className="min-h-0" bodyClassName="min-h-0 overflow-hidden">
            <ListContainer
              items={duelItems.map((entry) => ({
                key: entry.id,
                title: entry.label,
                subtitle: entry.subtitle,
              }))}
              emptyLabel="Nenhum duelo ativo"
            />
          </Panel>
        </aside>
      </div>
    </main>
  );
};

const Panel = ({
  title,
  children,
  className = '',
  bodyClassName = '',
}: {
  title: string;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) => (
  <section className={`flex min-h-0 flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/20 ${className}`}>
    <h2 className="mb-5 shrink-0 text-2xl font-bold uppercase tracking-[0.18em] text-white/75 lg:text-3xl">{title}</h2>
    <div className={`min-h-0 flex-1 ${bodyClassName}`}>{children}</div>
  </section>
);

const ContentText = ({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) => (
  <p className={`whitespace-pre-line text-2xl leading-relaxed text-white lg:text-[2rem] ${className}`}>{children}</p>
);

const ListContainer = ({
  items,
  emptyLabel,
}: {
  items: Array<{ key: string; title: string; subtitle?: string }>;
  emptyLabel: string;
}) => {
  if (items.length === 0) {
    return <p className="text-2xl text-white/70 lg:text-[2rem]">{emptyLabel}</p>;
  }

  return (
    <div className="grid h-full auto-rows-fr gap-4 overflow-hidden">
      {items.slice(0, SIDEBAR_ITEM_LIMIT).map((item) => (
        <article key={item.key} className="flex min-h-0 flex-col justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/20 px-5 py-4">
          <p className="truncate text-2xl font-semibold leading-tight lg:text-[2rem]">{item.title}</p>
          {item.subtitle ? <p className="mt-2 truncate text-lg text-white/65 lg:text-2xl">{item.subtitle}</p> : null}
        </article>
      ))}
    </div>
  );
};

export default TvMode;
