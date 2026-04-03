import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  Bolt,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Expand,
  Swords,
  Target,
  Timer,
  Trophy,
  UserRound,
  Zap,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import * as db from '@/lib/supabaseData';

type TvTab = 'Warm-up' | 'Skill' | 'WOD';
type WodCategory = 'rx' | 'scaled' | 'beginner';

type ClassSchedule = {
  id: string;
  start_time: string;
  end_time: string;
  label: string | null;
  is_active: boolean;
};

type TvCheckin = {
  id: string;
  userId: string;
  checkDate: string;
  createdAt: string;
  name: string;
  avatar: string;
  avatarUrl: string | null;
};

type TvDuel = {
  id: string;
  challengerId: string;
  opponentIds: string[];
  status: string;
  winnerId: string | null;
  createdAt: number | null;
};

type TvChallenge = {
  id: string;
  name: string;
  target: number;
  unit: string;
  xpReward: number;
  type: 'weekly' | 'monthly';
};

type BoxConfig = {
  name: string;
  logoUrl: string | null;
  tvRightTopBlockMode: 'checkins' | 'avatar';
};

type AthleteBoardItem = {
  userId: string;
  name: string;
  avatar: string;
  avatarUrl: string | null;
  result: string | null;
  unit: 'time' | 'rounds' | null;
  progressPct: number;
  isCheckedIn: boolean;
};

const TV_TIMEZONE = 'America/Sao_Paulo';
const TAB_ORDER: TvTab[] = ['Warm-up', 'Skill', 'WOD'];
const CATEGORY_ORDER: WodCategory[] = ['rx', 'scaled', 'beginner'];

const toTwo = (value: number) => String(value).padStart(2, '0');

const getSaoPauloParts = () => {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TV_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(now);

  const read = (type: string) => parts.find((p) => p.type === type)?.value || '00';
  const year = read('year');
  const month = read('month');
  const day = read('day');
  const hour = read('hour');
  const minute = read('minute');
  const second = read('second');

  return {
    dateKey: `${year}-${month}-${day}`,
    dateLabel: new Intl.DateTimeFormat('pt-BR', {
      timeZone: TV_TIMEZONE,
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(now),
    timeLabel: `${hour}:${minute}:${second}`,
    secondsNow: Number(hour) * 3600 + Number(minute) * 60 + Number(second),
  };
};

const toSeconds = (timeValue?: string | null) => {
  if (!timeValue) return 0;
  const [h = '0', m = '0', s = '0'] = timeValue.split(':');
  return Number(h) * 3600 + Number(m) * 60 + Number(s);
};

const formatSeconds = (value: number) => {
  const safe = Math.max(0, value);
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  return h > 0 ? `${toTwo(h)}:${toTwo(m)}:${toTwo(s)}` : `${toTwo(m)}:${toTwo(s)}`;
};

const toDurationSeconds = (raw: string) => {
  const [m, s] = raw.split(':').map(Number);
  if (Number.isNaN(m) || Number.isNaN(s)) return Number.POSITIVE_INFINITY;
  return m * 60 + s;
};

const getCurrentClass = (schedules: ClassSchedule[], secondsNow: number) => {
  return schedules.find((item) => {
    const start = toSeconds(item.start_time);
    const end = toSeconds(item.end_time);
    return secondsNow >= start && secondsNow < end;
  }) || null;
};

const getProgressMap = (results: db.WodResult[]) => {
  if (!results.length) return new Map<string, number>();

  const isTimeCategory = results.every((item) => item.unit === 'time');
  const values = results.map((item) => (isTimeCategory ? toDurationSeconds(item.result) : Number(item.result) || 0));
  const min = Math.min(...values);
  const max = Math.max(...values);

  return new Map(
    results.map((item) => {
      const value = isTimeCategory ? toDurationSeconds(item.result) : Number(item.result) || 0;
      if (max === min) return [item.userId, 100];
      const pct = isTimeCategory
        ? ((max - value) / (max - min)) * 100
        : ((value - min) / (max - min)) * 100;
      return [item.userId, Math.max(0, Math.min(100, Math.round(pct)))];
    }),
  );
};

export default function TvMode() {
  const [clockTick, setClockTick] = useState(0);
  const [loading, setLoading] = useState(true);

  const [boxConfig, setBoxConfig] = useState<BoxConfig>({
    name: 'BoxLink',
    logoUrl: null,
    tvRightTopBlockMode: 'checkins',
  });
  const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
  const [dailyWod, setDailyWod] = useState<db.WodData | null>(null);
  const [allResults, setAllResults] = useState<db.WodResult[]>([]);
  const [todayCheckins, setTodayCheckins] = useState<TvCheckin[]>([]);
  const [duels, setDuels] = useState<TvDuel[]>([]);
  const [challenges, setChallenges] = useState<TvChallenge[]>([]);
  const [monthlyXpRanking, setMonthlyXpRanking] = useState<Array<{ userId: string; name: string; avatar: string; avatarUrl: string | null; xp: number }>>([]);
  const [frequencyRanking, setFrequencyRanking] = useState<Array<{ userId: string; name: string; checkins: number }>>([]);

  const [activeTab, setActiveTab] = useState<TvTab>('Warm-up');
  const [selectedCategory, setSelectedCategory] = useState<WodCategory>('rx');
  const [showHistory, setShowHistory] = useState(false);
  const refreshTimersRef = useRef<Record<string, number | undefined>>({});

  const timeParts = useMemo(() => getSaoPauloParts(), [clockTick]);

  const loadHeaderAndWorkout = useCallback(async () => {
    const [{ data: location }, { data: scheduleRows }, wod] = await Promise.all([
      (supabase as any)
        .from('training_locations')
        .select('name, logo_url, tv_right_top_block_mode')
        .eq('is_active', true)
        .limit(1)
        .maybeSingle(),
      (supabase as any)
        .from('class_schedules')
        .select('id, start_time, end_time, label, is_active')
        .eq('is_active', true)
        .order('start_time', { ascending: true }),
      db.getDailyWod(),
    ]);

    if (location) {
      setBoxConfig({
        name: location.name || 'BoxLink',
        logoUrl: location.logo_url || null,
        tvRightTopBlockMode:
          location.tv_right_top_block_mode === 'avatar' || location.tv_right_top_block_mode === 'avatars' ? 'avatar' : 'checkins',
      });
    }

    setSchedules((scheduleRows || []) as ClassSchedule[]);
    setDailyWod(wod);
    return wod;
  }, []);

  const loadChallenges = useCallback(async () => {
    const activeChallenges = await db.getActiveChallenges();
    setChallenges((activeChallenges || []).slice(0, 8).map((item) => ({
      id: item.id,
      name: item.name,
      target: item.target,
      unit: item.unit,
      xpReward: item.xpReward,
      type: item.type,
    })));
  }, []);

  const loadCheckins = useCallback(async (today = getSaoPauloParts().dateKey) => {
    const { data: checkinsRows } = await (supabase as any)
      .from('checkins')
      .select('id, user_id, check_date, created_at, profiles(name, avatar, avatar_url)')
      .eq('check_date', today)
      .order('created_at', { ascending: false });

    const checkinsMapped: TvCheckin[] = (checkinsRows || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      checkDate: row.check_date,
      createdAt: row.created_at,
      name: row.profiles?.name || 'Atleta',
      avatar: row.profiles?.avatar || '👤',
      avatarUrl: row.profiles?.avatar_url || null,
    }));
    setTodayCheckins(checkinsMapped);
  }, []);

  const loadMonthlyAndFrequency = useCallback(async (today = getSaoPauloParts().dateKey) => {
    const [{ data: monthlyXpRows }, { data: profilesRows }] = await Promise.all([
      (supabase as any)
        .from('monthly_xp')
        .select('user_id, xp')
        .eq('month_key', today.slice(0, 7))
        .order('xp', { ascending: false })
        .limit(20),
      (supabase as any)
        .from('profiles')
        .select('id, name, avatar, avatar_url, checkins, xp')
        .order('checkins', { ascending: false })
        .limit(20),
    ]);

    const monthlyRows = (monthlyXpRows || []) as Array<{ user_id: string; xp: number }>;
    const monthlyIds = monthlyRows.map((item) => item.user_id);
    const profileMap = new Map<string, any>();

    if (monthlyIds.length) {
      const { data: rankingProfiles } = await (supabase as any)
        .from('profiles')
        .select('id, name, avatar, avatar_url')
        .in('id', monthlyIds);
      (rankingProfiles || []).forEach((item: any) => profileMap.set(item.id, item));
    }

    setMonthlyXpRanking(
      monthlyRows.slice(0, 10).map((item) => ({
        userId: item.user_id,
        name: profileMap.get(item.user_id)?.name || 'Atleta',
        avatar: profileMap.get(item.user_id)?.avatar || '👤',
        avatarUrl: profileMap.get(item.user_id)?.avatar_url || null,
        xp: item.xp || 0,
      })),
    );

    setFrequencyRanking(
      (profilesRows || []).slice(0, 10).map((item: any) => ({
        userId: item.id,
        name: item.name || 'Atleta',
        checkins: Number(item.checkins) || 0,
      })),
    );
  }, []);

  const loadDuels = useCallback(async () => {
    const { data: duelsRows } = await (supabase as any)
      .from('app_duels')
      .select('id, challenger_id, opponent_ids, status, winner_id, created_at')
      .order('created_at', { ascending: false })
      .limit(20);

    setDuels(
      ((duelsRows || []) as any[])
        .filter((row) => String(row.status).toLowerCase() !== 'canceled')
        .map((row) => ({
          id: row.id,
          challengerId: row.challenger_id,
          opponentIds: row.opponent_ids || [],
          status: row.status || 'active',
          winnerId: row.winner_id || null,
          createdAt: row.created_at ? new Date(row.created_at).getTime() : null,
        }))
        .slice(0, 15),
    );
  }, []);

  const loadResults = useCallback(async (wodId?: string | null) => {
    if (!wodId) {
      setAllResults([]);
      return;
    }
    const results = await db.getWodResults(wodId);
    setAllResults(results);
  }, []);

  const loadTvData = useCallback(async () => {
    try {
      const today = getSaoPauloParts().dateKey;
      const [wod] = await Promise.all([
        loadHeaderAndWorkout(),
        loadChallenges(),
        loadCheckins(today),
        loadMonthlyAndFrequency(today),
        loadDuels(),
      ]);
      await loadResults(wod?.id);
    } finally {
      setLoading(false);
    }
  }, [loadHeaderAndWorkout, loadChallenges, loadCheckins, loadMonthlyAndFrequency, loadDuels, loadResults]);

  const scheduleRefresh = useCallback((key: string, fn: () => void, delay = 500) => {
    const existing = refreshTimersRef.current[key];
    if (existing) {
      window.clearTimeout(existing);
    }
    refreshTimersRef.current[key] = window.setTimeout(() => {
      fn();
      refreshTimersRef.current[key] = undefined;
    }, delay);
  }, []);

  useEffect(() => {
    loadTvData();
  }, [loadTvData]);

  useEffect(() => {
    const timer = window.setInterval(() => setClockTick((prev) => prev + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const rotateTabs = window.setInterval(() => {
      setActiveTab((prev) => TAB_ORDER[(TAB_ORDER.indexOf(prev) + 1) % TAB_ORDER.length]);
      setSelectedCategory((prev) => CATEGORY_ORDER[(CATEGORY_ORDER.indexOf(prev) + 1) % CATEGORY_ORDER.length]);
    }, 12000);
    return () => window.clearInterval(rotateTabs);
  }, []);

  useEffect(() => {
    const poll = window.setInterval(() => {
      loadTvData();
    }, 30000);

    const refreshTodayScoped = () => {
      const today = getSaoPauloParts().dateKey;
      loadCheckins(today);
      loadMonthlyAndFrequency(today);
    };

    const channel = supabase
      .channel('tv-mode-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'checkins' }, () => {
        scheduleRefresh('checkins', refreshTodayScoped, 450);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wod_results' }, () => {
        scheduleRefresh('results', () => loadResults(dailyWod?.id), 450);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_duels' }, () => {
        scheduleRefresh('duels', loadDuels, 500);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'monthly_xp' }, () => {
        scheduleRefresh('monthly', () => loadMonthlyAndFrequency(getSaoPauloParts().dateKey), 600);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'challenges' }, () => {
        scheduleRefresh('challenges', loadChallenges, 650);
      })
      .subscribe();

    return () => {
      window.clearInterval(poll);
      supabase.removeChannel(channel);
      Object.values(refreshTimersRef.current).forEach((timerId) => {
        if (timerId) window.clearTimeout(timerId);
      });
    };
  }, [dailyWod?.id, loadChallenges, loadCheckins, loadDuels, loadMonthlyAndFrequency, loadResults, loadTvData, scheduleRefresh]);

  const currentClass = useMemo(() => getCurrentClass(schedules, timeParts.secondsNow), [schedules, timeParts.secondsNow]);
  const classLabel = currentClass
    ? `${currentClass.label || 'Aula atual'} • ${currentClass.start_time.slice(0, 5)}-${currentClass.end_time.slice(0, 5)}`
    : 'Sem aula em andamento';

  const activeCompetition = Boolean(currentClass && dailyWod);
  const elapsedSeconds = currentClass ? Math.max(0, timeParts.secondsNow - toSeconds(currentClass.start_time)) : 0;

  const activeCategoryResults = useMemo(
    () => allResults.filter((item) => item.category === selectedCategory),
    [allResults, selectedCategory],
  );

  const progressMap = useMemo(() => getProgressMap(activeCategoryResults), [activeCategoryResults]);

  const checkinByUser = useMemo(() => {
    const map = new Map<string, TvCheckin>();
    todayCheckins.forEach((item) => {
      if (!map.has(item.userId)) map.set(item.userId, item);
    });
    return map;
  }, [todayCheckins]);

  const athleteBoard = useMemo<AthleteBoardItem[]>(() => {
    const rows = new Map<string, AthleteBoardItem>();

    todayCheckins.forEach((checkin) => {
      rows.set(checkin.userId, {
        userId: checkin.userId,
        name: checkin.name,
        avatar: checkin.avatar,
        avatarUrl: checkin.avatarUrl,
        result: null,
        unit: null,
        progressPct: 0,
        isCheckedIn: true,
      });
    });

    activeCategoryResults.forEach((result) => {
      const existing = rows.get(result.userId);
      rows.set(result.userId, {
        userId: result.userId,
        name: result.userName || existing?.name || 'Atleta',
        avatar: result.avatar || existing?.avatar || '👤',
        avatarUrl: existing?.avatarUrl || null,
        result: result.result,
        unit: (result.unit === 'time' ? 'time' : 'rounds') as 'time' | 'rounds',
        progressPct: progressMap.get(result.userId) || 0,
        isCheckedIn: existing?.isCheckedIn || checkinByUser.has(result.userId),
      });
    });

    return [...rows.values()].sort((a, b) => b.progressPct - a.progressPct || a.name.localeCompare(b.name));
  }, [todayCheckins, activeCategoryResults, progressMap, checkinByUser]);

  const currentClassCheckins = useMemo(() => {
    if (!currentClass) return todayCheckins;
    const start = toSeconds(currentClass.start_time);
    const end = toSeconds(currentClass.end_time);
    const inClass = todayCheckins.filter((item) => {
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: TV_TIMEZONE,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).formatToParts(new Date(item.createdAt));
      const h = Number(parts.find((p) => p.type === 'hour')?.value || '0');
      const m = Number(parts.find((p) => p.type === 'minute')?.value || '0');
      const s = Number(parts.find((p) => p.type === 'second')?.value || '0');
      const seconds = h * 3600 + m * 60 + s;
      return seconds >= start && seconds < end;
    });
    return inClass.length ? inClass : todayCheckins;
  }, [todayCheckins, currentClass]);

  const tabContent =
    activeTab === 'Warm-up'
      ? dailyWod?.warmup || ''
      : activeTab === 'Skill'
        ? dailyWod?.skill || ''
        : dailyWod?.versions?.[selectedCategory]?.description || '';

  const tickerItems = useMemo(() => {
    const lines: string[] = [];

    if (duels.length) {
      const activeDuels = duels.filter((item) => String(item.status).toLowerCase() !== 'finished').length;
      lines.push(`Duelos ativos: ${activeDuels}`);
    }

    if (challenges.length) {
      lines.push(`Desafios ativos: ${challenges.length}`);
      lines.push(...challenges.slice(0, 2).map((item) => `${item.name} (+${item.xpReward} XP)`));
    }

    if (monthlyXpRanking[0]) {
      lines.push(`XP mensal líder: ${monthlyXpRanking[0].name} (${monthlyXpRanking[0].xp} XP)`);
    }

    if (frequencyRanking[0]) {
      lines.push(`Frequência líder: ${frequencyRanking[0].name} (${frequencyRanking[0].checkins} check-ins)`);
    }

    return lines.length ? lines : ['Sem atualizações em tempo real no momento'];
  }, [duels, challenges, monthlyXpRanking, frequencyRanking]);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-[#06070b] text-white flex items-center justify-center">Carregando TV...</div>;
  }

  return (
    <div className="min-h-screen w-full overflow-hidden bg-[#06070b] text-white selection:bg-[#cafd00] selection:text-[#0e0e0e]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(59,130,246,0.22),transparent_30%),radial-gradient(circle_at_85%_0%,rgba(239,68,68,0.18),transparent_30%),linear-gradient(180deg,#090c16_0%,#03040a_100%)]" />

      <button
        onClick={toggleFullscreen}
        className="fixed right-4 top-4 z-50 rounded-lg border border-white/20 bg-black/50 p-2 text-white/80 transition hover:text-white"
        aria-label="Alternar tela cheia"
      >
        <Expand className="h-5 w-5" />
      </button>

      <header className="relative z-20 mx-4 mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-6 py-4 backdrop-blur">
        <div className="flex items-center gap-4">
          <div className="bg-[#cafd00] p-2 rounded-xl rotate-3 shadow-[0_0_15px_rgba(202,253,0,0.3)]">
            <Zap className="w-6 h-6 text-[#0e0e0e] fill-current" />
          </div>
          {boxConfig.logoUrl ? (
            <img src={boxConfig.logoUrl} alt={boxConfig.name} className="h-10 w-10 rounded-md object-contain bg-black/30 p-1" />
          ) : null}
          <div>
            <h1 className="text-3xl font-black tracking-tight uppercase">
              {boxConfig.name} <span className="text-sky-300">TV</span>
            </h1>
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">CrossCity • Broadcast Mode</p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-4xl font-black tabular-nums">{activeCompetition ? formatSeconds(elapsedSeconds) : timeParts.timeLabel}</p>
          <p className="text-sm text-white/65">{timeParts.dateLabel}</p>
          <p className="text-sm text-sky-200">{classLabel}</p>
        </div>
      </header>

      <main className="relative z-10 grid h-[calc(100vh-150px)] grid-cols-12 gap-4 p-4">
        <section className="col-span-8 flex min-h-0 flex-col gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/5">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <button onClick={() => setActiveTab(TAB_ORDER[(TAB_ORDER.indexOf(activeTab) + TAB_ORDER.length - 1) % TAB_ORDER.length])} className="rounded-lg border border-white/20 bg-black/30 p-2 hover:bg-black/50">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="text-center">
                <h2 className="text-xl font-bold uppercase tracking-[0.25em] text-sky-200">{activeTab}</h2>
                {activeTab === 'WOD' ? (
                  <p className="text-xs text-white/50 uppercase">Categoria: {selectedCategory.toUpperCase()}</p>
                ) : null}
              </div>
              <button onClick={() => setActiveTab(TAB_ORDER[(TAB_ORDER.indexOf(activeTab) + 1) % TAB_ORDER.length])} className="rounded-lg border border-white/20 bg-black/30 p-2 hover:bg-black/50">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[36vh] overflow-y-auto p-6">
              {tabContent ? (
                <div className="whitespace-pre-line text-3xl leading-relaxed text-white/95">{tabContent}</div>
              ) : (
                <div className="flex min-h-[120px] items-center justify-center rounded-xl border border-dashed border-white/15 bg-black/25 px-3 text-center text-sm text-white/55">
                  Conteúdo não definido para {activeTab}
                </div>
              )}
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-bold uppercase tracking-[0.2em] text-white">Ranking dinâmico</h3>
              <div className="flex gap-2">
                {CATEGORY_ORDER.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${selectedCategory === category ? 'bg-[#cafd00] text-[#253200]' : 'bg-black/30 text-white/70'}`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto pr-1 space-y-2">
              {athleteBoard.length ? athleteBoard.map((athlete, index) => (
                <div key={athlete.userId} className="rounded-xl border border-white/10 bg-black/25 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-7 text-xs font-black text-amber-300">#{index + 1}</span>
                      {athlete.avatarUrl ? (
                        <img src={athlete.avatarUrl} alt={athlete.name} className="h-9 w-9 rounded-full object-cover border border-white/20" />
                      ) : (
                        <span className="text-xl">{athlete.avatar}</span>
                      )}
                      <div>
                        <p className="text-sm font-semibold">{athlete.name}</p>
                        <p className="text-[11px] text-white/55">
                          {athlete.result ? `${athlete.result}${athlete.unit === 'rounds' ? ' rounds' : ''}` : 'Sem score enviado'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-white/60">{athlete.isCheckedIn ? 'check-in ✓' : 'sem check-in'}</p>
                      <p className="text-sm font-bold text-[#cafd00]">{athlete.progressPct}%</p>
                    </div>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className={`h-full rounded-full ${index === 0 ? 'bg-[#cafd00]' : 'bg-sky-400/80'}`}
                      style={{ width: `${athlete.progressPct}%` }}
                    />
                  </div>
                </div>
              )) : (
                <div className="flex min-h-[100px] items-center justify-center rounded-xl border border-dashed border-white/15 bg-black/25 px-3 text-center text-sm text-white/55">
                  Sem atletas com check-in/resultado na categoria atual
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="col-span-4 flex min-h-0 flex-col gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 min-h-0 flex-1">
            {boxConfig.tvRightTopBlockMode === 'avatar' ? (
              <>
                <h3 className="mb-3 text-lg font-bold">Avatar / Presença</h3>
                <p className="rounded-xl border border-dashed border-white/15 bg-black/25 p-3 text-sm text-white/70">
                  Modo avatar habilitado para este box. Check-ins reais do bloco atual: {currentClassCheckins.length}.
                </p>
              </>
            ) : (
              <>
                <h3 className="mb-3 text-lg font-bold flex items-center gap-2"><UserRound className="h-4 w-4" /> Check-ins da aula</h3>
                <div className="space-y-2 overflow-y-auto pr-1 max-h-[30vh]">
                  {currentClassCheckins.length ? currentClassCheckins.map((athlete) => (
                    <div key={athlete.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/25 px-3 py-2">
                      <div className="flex items-center gap-2">
                        {athlete.avatarUrl ? (
                          <img src={athlete.avatarUrl} alt={athlete.name} className="h-8 w-8 rounded-full object-cover border border-white/20" />
                        ) : (
                          <span>{athlete.avatar}</span>
                        )}
                        <p className="text-sm font-semibold">{athlete.name}</p>
                      </div>
                      <span className="text-emerald-300">✓</span>
                    </div>
                  )) : <p className="text-sm text-white/60">Nenhum check-in registrado.</p>}
                </div>
              </>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 min-h-0 flex-1">
            <h3 className="mb-3 text-lg font-bold flex items-center gap-2"><Trophy className="h-4 w-4 text-amber-300" /> XP mensal</h3>
            <div className="space-y-2 overflow-y-auto pr-1 max-h-[20vh]">
              {monthlyXpRanking.length ? monthlyXpRanking.map((item, idx) => (
                <div key={item.userId} className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/25 p-2">
                  <span className="w-6 text-xs font-bold text-amber-300">#{idx + 1}</span>
                  <span className="text-lg">{item.avatar}</span>
                  <p className="flex-1 truncate text-sm font-semibold">{item.name}</p>
                  <p className="text-xs font-bold text-sky-200">{item.xp} XP</p>
                </div>
              )) : <p className="text-sm text-white/60">Sem dados de XP mensal.</p>}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 min-h-0">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-widest text-white/80">Duelos & Desafios</h3>
              <button onClick={() => setShowHistory((prev) => !prev)} className="text-xs text-sky-300 hover:underline">{showHistory ? 'Fechar histórico' : 'Abrir histórico'}</button>
            </div>
            <p className="text-xs text-white/60">Duelos: {duels.length} • Desafios ativos: {challenges.length}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {challenges.slice(0, 3).map((challenge) => (
                <span key={challenge.id} className="rounded-full border border-white/15 bg-black/30 px-2 py-1 text-[11px]">
                  <Target className="inline h-3 w-3 mr-1" />{challenge.name}
                </span>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-20 mx-4 mb-4 rounded-xl border border-white/10 bg-black/40 px-4 py-2">
        <div className="overflow-hidden whitespace-nowrap">
          <div className="inline-flex min-w-full animate-[marquee_28s_linear_infinite] items-center gap-8 text-sm text-white/90">
            {tickerItems.map((item, index) => (
              <span key={`${item}-${index}`} className="inline-flex items-center gap-1">
                <Swords className="h-4 w-4 text-amber-300" />
                {item}
              </span>
            ))}
            {tickerItems.map((item, index) => (
              <span key={`repeat-${item}-${index}`} className="inline-flex items-center gap-1">
                <Activity className="h-4 w-4 text-sky-300" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </footer>

      {showHistory ? (
        <div className="fixed inset-0 z-[80] bg-black/80 p-6 backdrop-blur">
          <div className="mx-auto max-w-5xl rounded-2xl border border-white/10 bg-[#0f1018] p-6 h-full overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-3xl font-black uppercase tracking-tight">Histórico real de resultados</h2>
              <button onClick={() => setShowHistory(false)} className="rounded-lg border border-white/20 bg-black/40 px-3 py-1 text-sm">Fechar</button>
            </div>

            <div className="space-y-3">
              {allResults.length ? allResults.map((result, index) => (
                <div key={result.id} className="rounded-xl border border-white/10 bg-black/30 p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">#{index + 1} {result.userName}</p>
                    <p className="text-sm text-sky-200">{result.result}{result.unit === 'rounds' ? ' rounds' : ''}</p>
                  </div>
                  <p className="text-xs text-white/55">Categoria: {String(result.category).toUpperCase()} • {new Date(result.submittedAt).toLocaleString('pt-BR', { timeZone: TV_TIMEZONE })}</p>
                </div>
              )) : (
                <p className="text-white/60">Sem resultados cadastrados para o WOD atual.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <aside className="fixed left-4 top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-2 rounded-xl border border-white/10 bg-black/35 p-2 xl:flex">
        <button onClick={() => setActiveTab('Warm-up')} className={`rounded-lg p-2 ${activeTab === 'Warm-up' ? 'bg-[#cafd00] text-[#0f1116]' : 'text-white/70'}`}><Dumbbell className="h-4 w-4" /></button>
        <button onClick={() => setActiveTab('Skill')} className={`rounded-lg p-2 ${activeTab === 'Skill' ? 'bg-[#cafd00] text-[#0f1116]' : 'text-white/70'}`}><Bolt className="h-4 w-4" /></button>
        <button onClick={() => setActiveTab('WOD')} className={`rounded-lg p-2 ${activeTab === 'WOD' ? 'bg-[#cafd00] text-[#0f1116]' : 'text-white/70'}`}><Timer className="h-4 w-4" /></button>
        <button onClick={() => setShowHistory((prev) => !prev)} className={`rounded-lg p-2 ${showHistory ? 'bg-[#cafd00] text-[#0f1116]' : 'text-white/70'}`}><Activity className="h-4 w-4" /></button>
      </aside>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
