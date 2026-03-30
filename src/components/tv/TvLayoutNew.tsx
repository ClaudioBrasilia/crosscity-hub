import { ChevronLeft, ChevronRight, Expand, Trophy } from 'lucide-react';
import type { DailyWod, TvCheckin, TvDuel, TvMonthlyXp } from '@/components/tv/types';
import type { TvRightTopBlockMode } from '@/lib/tv-layout';

type Props = {
  dailyWod: DailyWod | null;
  checkins: TvCheckin[];
  duels: TvDuel[];
  monthlyXpRanking: TvMonthlyXp[];
  dateLabel: string;
  timeLabel: string;
  classLabel: string;
  activeTab: 'Warm-up' | 'Skill' | 'WOD';
  onPrevTab: () => void;
  onNextTab: () => void;
  onToggleFullscreen: () => void;
  rightTopBlockMode: TvRightTopBlockMode;
};

const Empty = ({ text }: { text: string }) => (
  <div className="flex min-h-[72px] items-center justify-center rounded-xl border border-dashed border-white/15 bg-black/25 px-3 text-center text-sm text-white/55">
    {text}
  </div>
);

export default function TvLayoutNew({
  dailyWod,
  checkins,
  duels,
  monthlyXpRanking,
  dateLabel,
  timeLabel,
  classLabel,
  activeTab,
  onPrevTab,
  onNextTab,
  onToggleFullscreen,
  rightTopBlockMode,
}: Props) {
  const tabContent =
    activeTab === 'Warm-up'
      ? dailyWod?.warmup || ''
      : activeTab === 'Skill'
        ? dailyWod?.skill || ''
        : dailyWod?.versions?.rx?.description || '';

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#06070b] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(59,130,246,0.2),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(239,68,68,0.2),transparent_30%),linear-gradient(180deg,#090c16_0%,#03040a_100%)]" />

      <button
        onClick={onToggleFullscreen}
        className="absolute right-4 top-4 z-30 rounded-lg border border-white/20 bg-black/50 p-2 text-white/80 transition hover:text-white"
        aria-label="Alternar tela cheia"
      >
        <Expand className="h-5 w-5" />
      </button>

      <div className="relative z-10 flex h-full flex-col p-4">
        <header className="mb-4 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-6 py-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-sky-300">BOX LINK • NOVO MODELO</p>
            <h1 className="text-3xl font-black">TV MODE</h1>
            <p className="text-sm text-white/65">{dateLabel}</p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-black tabular-nums">{timeLabel}</p>
            <p className="text-sm text-white/60">{classLabel}</p>
          </div>
        </header>

        <main className="grid min-h-0 flex-1 grid-cols-12 gap-4">
          <section className="col-span-8 flex min-h-0 flex-col rounded-2xl border border-white/10 bg-white/5">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <button onClick={onPrevTab} className="rounded-lg border border-white/20 bg-black/30 p-2 hover:bg-black/50" aria-label="Seção anterior">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h2 className="text-xl font-bold uppercase tracking-[0.2em] text-sky-200">{activeTab}</h2>
              <button onClick={onNextTab} className="rounded-lg border border-white/20 bg-black/30 p-2 hover:bg-black/50" aria-label="Próxima seção">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-6">
              {tabContent ? (
                <div className="whitespace-pre-line text-3xl leading-relaxed text-white/95">{tabContent}</div>
              ) : (
                <Empty text={`${activeTab} não definido`} />
              )}
            </div>
          </section>

          <section className="col-span-4 flex min-h-0 flex-col gap-4">
            <div className="min-h-0 flex-1 rounded-2xl border border-white/10 bg-white/5 p-4">
              {rightTopBlockMode === 'avatar' ? (
                <>
                  <h3 className="mb-3 text-lg font-bold">Avatar</h3>
                  <Empty text="Área de avatar (em desenvolvimento)" />
                </>
              ) : (
                <>
                  <h3 className="mb-3 text-lg font-bold">Check-in (aula atual)</h3>
                  <div className="space-y-2 overflow-y-auto pr-1 max-h-[45vh]">
                    {checkins.length ? checkins.map((athlete, idx) => (
                      <div key={`${athlete.id || idx}`} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/25 px-3 py-2">
                        <div className="flex items-center gap-2">
                          {athlete.avatarUrl ? (
                            <img src={athlete.avatarUrl} alt={athlete.name || 'Atleta'} className="h-9 w-9 rounded-full object-cover border border-white/20" />
                          ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-lg">{athlete.avatar || '👤'}</div>
                          )}
                          <p className="text-sm font-semibold">{athlete.name || 'Atleta'}</p>
                        </div>
                        <span className="text-emerald-300">✓</span>
                      </div>
                    )) : <Empty text="Nenhum check-in nesta aula" />}
                  </div>
                </>
              )}
            </div>

            <div className="min-h-0 flex-1 rounded-2xl border border-white/10 bg-white/5 p-4">
              <h3 className="mb-3 text-lg font-bold">Ranking XP mensal</h3>
              <div className="space-y-2 overflow-y-auto pr-1 max-h-[32vh]">
                {monthlyXpRanking.length ? monthlyXpRanking.map((item, index) => (
                  <div key={item.userId} className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/25 p-2">
                    <span className="w-5 text-xs font-bold text-amber-300">#{index + 1}</span>
                    {item.avatarUrl ? (
                      <img src={item.avatarUrl} alt={item.name} className="h-8 w-8 rounded-full object-cover border border-white/20" />
                    ) : (
                      <span className="text-lg">{item.avatar || '👤'}</span>
                    )}
                    <p className="flex-1 truncate text-sm font-semibold">{item.name}</p>
                    <p className="text-xs font-bold text-sky-200">{item.xp} XP</p>
                  </div>
                )) : <Empty text="Sem XP mensal no momento" />}
              </div>
            </div>
          </section>
        </main>

        <footer className="mt-4 rounded-xl border border-white/10 bg-black/35 px-4 py-2">
          <div className="relative overflow-hidden whitespace-nowrap">
            <div className="inline-flex min-w-full animate-[marquee_30s_linear_infinite] gap-10">
              {duels.length ? duels.map((duel) => (
                <span key={duel.id} className="inline-flex items-center gap-1 text-sm text-white/90">
                  <Trophy className="h-4 w-4 text-amber-300" />
                  {duel.challengerName || 'Atleta 1'} vs {duel.challengedNames || 'Atleta 2'}
                  <span className="text-white/50">({duel.status || 'ativo'})</span>
                </span>
              )) : <span className="text-sm text-white/60">Sem duelos ativos/finalizados nesta semana</span>}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
