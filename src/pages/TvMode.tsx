import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getActiveChallenges } from '@/lib/supabaseData';
import type { ChallengeData } from '@/lib/supabaseData';
import TvLayoutOld from '@/components/tv/TvLayoutOld';
import TvLayoutNew from '@/components/tv/TvLayoutNew';
import type { DailyWod, TvCheckin, TvDuel, TvMonthlyXp } from '@/components/tv/types';
import {
  getTvLayoutModel,
  getTvRightTopBlockMode,
  type TvLayoutModel,
  type TvRightTopBlockMode,
} from '@/lib/tv-layout';

const GYM_TIMEZONE = 'America/Sao_Paulo';
const TABS = ['Warm-up', 'Skill', 'WOD'] as const;
type TabKey = typeof TABS[number];

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

const getCurrentClass = (schedules: any[]): { start: string; end: string } | undefined => {
  const now = getZonedDateParts(new Date());
  const currentMinutes = now.hour * 60 + now.minute;
  
  const formattedSchedules = schedules.map(s => ({
    start: s.start_time.substring(0, 5),
    end: s.end_time.substring(0, 5)
  }));

  return formattedSchedules.find((cls) => {
    const [startH, startM] = cls.start.split(':').map(Number);
    const [endH, endM] = cls.end.split(':').map(Number);
    return currentMinutes >= startH * 60 + startM && currentMinutes < endH * 60 + endM;
  });
};

const formatDatePartsToIso = ({ year, month, day }: { year: number; month: number; day: number }) =>
  `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

const getTodayISO = () => formatDatePartsToIso(getZonedDateParts(new Date()));

const normalizeWodDateToGymIso = (value: string) => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value.slice(0, 10);

  return formatDatePartsToIso(getZonedDateParts(parsed));
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
    const todayIso = getTodayISO();

    const { data, error } = await supabase
      .from('wods')
      .select('id, date, name, type, warmup, skill, versions')
      .eq('date', todayIso)
      .limit(1)
      .maybeSingle();

    let wodRow = !error && data ? data : null;

    if (!wodRow) {
      const { data: fallbackRows, error: fallbackError } = await supabase
        .from('wods')
        .select('id, date, name, type, warmup, skill, versions')
        .order('date', { ascending: false })
        .limit(30);

      if (!fallbackError && fallbackRows?.length) {
        wodRow = fallbackRows.find((row) => normalizeWodDateToGymIso(row.date) === todayIso) ?? null;
      }
    }

    if (!wodRow) return null;

    const versions = (wodRow.versions || {}) as any;
    if (!versions.rx?.description) return null;

    return {
      id: wodRow.id,
      date: wodRow.date,
      name: wodRow.name,
      type: wodRow.type as DailyWod['type'],
      warmup: wodRow.warmup ?? undefined,
      skill: wodRow.skill ?? undefined,
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

const fetchTvCheckins = async (schedules: any[]): Promise<TvCheckin[]> => {
  const currentClass = getCurrentClass(schedules);
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
      .select('id, name, avatar, avatar_url')
      .in('id', userIds);
    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

    return filtered.slice(0, 12).map((item) => ({
      id: item.user_id,
      name: profileMap.get(item.user_id)?.name || 'Atleta',
      avatar: profileMap.get(item.user_id)?.avatar || '👤',
      avatarUrl: profileMap.get(item.user_id)?.avatar_url || undefined,
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
      .select('id, challenger_id, opponent_ids, status, winner_id, bet_settled_at, bet_canceled_at, created_at')
      .in('status', ['pending', 'active', 'finished'])
      .neq('status', 'canceled')
      .order('created_at', { ascending: false })
      .limit(20);
    if (error || !data || data.length === 0) return [];

    const filteredDuels = data.filter((duel) => {
      if (duel.status === 'canceled') return false;
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

    return filteredDuels.map((duel) => ({
      id: duel.id,
      challengerName: nameMap.get(duel.challenger_id) || 'Atleta 1',
      challengedNames:
        duel.opponent_ids && duel.opponent_ids.length > 0
          ? duel.opponent_ids.map((opponentId: string) => nameMap.get(opponentId) || 'Atleta').join(', ')
          : 'Atleta 2',
      status: duel.status || 'Ativo',
      winnerName: duel.winner_id ? nameMap.get(duel.winner_id) || 'Atleta' : undefined,
      isFinished: duel.status === 'finished',
    }));
  } catch {
    return [];
  }
};

const fetchMonthlyXpRanking = async (): Promise<TvMonthlyXp[]> => {
  try {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const { data, error } = await supabase
      .from('monthly_xp')
      .select('user_id, xp')
      .eq('month_key', monthKey)
      .order('xp', { ascending: false })
      .limit(10);

    if (error || !data || data.length === 0) return [];

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, avatar, avatar_url')
      .in('id', data.map((item) => item.user_id));
    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

    return data.map((item) => ({
      userId: item.user_id,
      name: profileMap.get(item.user_id)?.name || 'Atleta',
      avatar: profileMap.get(item.user_id)?.avatar || '👤',
      avatarUrl: profileMap.get(item.user_id)?.avatar_url || undefined,
      xp: item.xp || 0,
    }));
  } catch {
    return [];
  }
};

export default function TvMode() {
  const [dailyWod, setDailyWod] = useState<DailyWod | null>(null);
  const [checkins, setCheckins] = useState<TvCheckin[]>([]);
  const [duels, setDuels] = useState<TvDuel[]>([]);
  const [monthlyXpRanking, setMonthlyXpRanking] = useState<TvMonthlyXp[]>([]);
  const [, setActiveChallenges] = useState<ChallengeData[]>([]);
  const [now, setNow] = useState(new Date());
  const [activeTab, setActiveTab] = useState<TabKey>('WOD');
  const [layoutModel, setLayoutModel] = useState<TvLayoutModel>('old');
  const [rightTopBlockMode, setRightTopBlockMode] = useState<TvRightTopBlockMode>('checkins');
  const [schedules, setSchedules] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: scheds } = await supabase.from('class_schedules').select('*').eq('is_active', true);
        const currentScheds = scheds || [];
        setSchedules(currentScheds);

        const [wod, ci, du, activeChallenges, ranking, model, blockMode] = await Promise.all([
          fetchDailyWod(),
          fetchTvCheckins(currentScheds),
          fetchTvDuels(),
          getActiveChallenges(),
          fetchMonthlyXpRanking(),
          getTvLayoutModel(),
          getTvRightTopBlockMode(),
        ]);
        setDailyWod(wod);
        setCheckins(ci);
        setDuels(du);
        setActiveChallenges(activeChallenges);
        setMonthlyXpRanking(ranking);
        setLayoutModel(model);
        setRightTopBlockMode(blockMode);
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

  const currentClass = getCurrentClass(schedules);
  const classLabel = currentClass
    ? `Aula atual: ${currentClass.start} – ${currentClass.end}`
    : 'Sem aula no momento';

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
      return;
    }
    document.exitFullscreen?.();
  };

  const goTab = (direction: -1 | 1) => {
    const currentIndex = TABS.indexOf(activeTab);
    const nextIndex = (currentIndex + direction + TABS.length) % TABS.length;
    setActiveTab(TABS[nextIndex]);
  };

  if (layoutModel === 'new') {
    return (
      <TvLayoutNew
        dailyWod={dailyWod}
        checkins={checkins}
        duels={duels}
        monthlyXpRanking={monthlyXpRanking}
        dateLabel={dateLabel}
        timeLabel={timeLabel}
        classLabel={classLabel}
        activeTab={activeTab}
        onPrevTab={() => goTab(-1)}
        onNextTab={() => goTab(1)}
        onToggleFullscreen={toggleFullscreen}
        rightTopBlockMode={rightTopBlockMode}
      />
    );
  }

  return (
    <TvLayoutOld
      dailyWod={dailyWod}
      checkins={checkins}
      duels={duels}
      dateLabel={dateLabel}
      timeLabel={timeLabel}
      classLabel={classLabel}
      currentClass={currentClass}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onToggleFullscreen={toggleFullscreen}
    />
  );
}
