import React from 'react';
import { Trophy, Expand } from 'lucide-react';
import type { DailyWod, TvCheckin, TvDuel } from '@/components/tv/types';

type Props = {
  dailyWod: DailyWod | null;
  checkins: TvCheckin[];
  duels: TvDuel[];
  dateLabel: string;
  timeLabel: string;
  classLabel: string;
  currentClass?: { start: string; end: string };
  activeTab: 'Warm-up' | 'Skill' | 'WOD';
  setActiveTab: (tab: 'Warm-up' | 'Skill' | 'WOD') => void;
  onToggleFullscreen: () => void;
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

const TABS = ['Warm-up', 'Skill', 'WOD'] as const;

export default function TvLayoutOld({
  dailyWod,
  checkins,
  duels,
  dateLabel,
  timeLabel,
  classLabel,
  currentClass,
  activeTab,
  setActiveTab,
  onToggleFullscreen,
}: Props) {
  const renderTabContent = () => {
    switch (activeTab) {
      case 'Warm-up':
        return dailyWod?.warmup ? (
          <div className="whitespace-pre-line text-3xl leading-relaxed text-white/90">{dailyWod.warmup}</div>
        ) : (
          <Empty text="Warm-up não definido" />
        );
      case 'Skill':
        return dailyWod?.skill ? (
          <div className="whitespace-pre-line text-3xl leading-relaxed text-white/90">{dailyWod.skill}</div>
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

      <button
        onClick={onToggleFullscreen}
        className="absolute right-4 top-4 z-20 rounded-lg border border-white/20 bg-black/40 p-2 text-white/80 transition hover:text-white"
        aria-label="Alternar tela cheia"
      >
        <Expand className="h-5 w-5" />
      </button>

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
          <div className="col-span-8 flex min-h-0 flex-col rounded-2xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-sm">
            <div className="flex flex-shrink-0 border-b border-white/10">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-4 text-center text-lg font-bold uppercase tracking-widest transition-colors ${
                    activeTab === tab ? 'border-b-2 border-red-400 text-white' : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-6">{renderTabContent()}</div>
          </div>

          <div className="col-span-4 flex min-h-0 flex-col gap-4">
            <Panel title="Check-ins" subtitle={currentClass ? `${currentClass.start} – ${currentClass.end}` : 'Sem aula'} className="flex min-h-0 flex-1 flex-col [&>div:last-child]:min-h-0 [&>div:last-child]:flex-1 [&>div:last-child]:overflow-y-auto">
              {checkins.length ? (
                <div className="space-y-2">
                  {checkins.map((athlete, index) => (
                    <div key={`${athlete.id || athlete.name}-${index}`} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-3">
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

            <Panel title="Duelos" subtitle="Confrontos da semana" className="flex min-h-0 flex-shrink-0 max-h-[35%] flex-col [&>div:last-child]:min-h-0 [&>div:last-child]:flex-1 [&>div:last-child]:overflow-y-auto">
              {duels.length ? (
                <div className="space-y-2">
                  {duels.map((duel, index) => (
                    <div key={`${duel.id || index}`} className="rounded-xl border border-white/10 bg-black/20 p-3">
                      <p className="text-[10px] uppercase tracking-[0.25em] text-white/35">{duel.isFinished ? 'Duelo encerrado' : 'Duelo ativo'}</p>
                      <p className="mt-1 text-base font-bold text-white">{`${duel.challengerName || 'Atleta 1'} vs ${duel.challengedNames || 'Atleta 2'}`}</p>
                      <p className="mt-1 text-xs text-white/50">Status: {duel.status || 'Ativo'}</p>
                      {duel.winnerName ? (
                        <p className="mt-1 flex items-center gap-1 text-xs text-amber-300">
                          <Trophy className="h-3.5 w-3.5" />
                          Vencedor: {duel.winnerName}
                        </p>
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
