export type WodCategory = 'rx' | 'scaled' | 'beginner';
export type WodScoreUnit = 'time' | 'rounds';

export interface DailyWodVersion {
  description: string;
  weight: string;
}

export interface DailyWod {
  id: string;
  date: string;
  name: string;
  type: 'For Time' | 'AMRAP' | 'EMOM';
  versions: Record<WodCategory, DailyWodVersion>;
}

export interface DailyWodResult {
  id: string;
  wodId: string;
  userId: string;
  userName: string;
  avatar: string;
  category: WodCategory;
  result: string;
  unit: WodScoreUnit;
  submittedAt: number;
}

export interface Duel {
  id: string;
  wodId: string;
  wodName: string;
  category: WodCategory;
  challengerId: string;
  opponentId: string;
  challengerResult: string | null;
  opponentResult: string | null;
  status: 'pending' | 'active' | 'finished';
  winnerId: string | null;
  betMode: boolean;
  betItems: string[];
  createdAt: number;
}

const buildDateKey = (date = new Date()) => date.toISOString().split('T')[0];

export const mockDailyWods: DailyWod[] = [
  {
    id: 'wod_2026_01',
    date: buildDateKey(),
    name: 'Engine Blast',
    type: 'For Time',
    versions: {
      rx: { description: '5 rounds: 400m run, 15 thrusters, 12 chest-to-bar pull-ups', weight: 'Thruster 43/30kg' },
      scaled: { description: '5 rounds: 400m run, 15 thrusters, 10 pull-ups com banda', weight: 'Thruster 30/20kg' },
      beginner: { description: '4 rounds: 300m run, 12 dumbbell thrusters, 10 ring rows', weight: 'Dumbbell 10/7.5kg' },
    },
  },
  {
    id: 'wod_2026_02',
    date: '2026-03-07',
    name: 'Core Grinder',
    type: 'AMRAP',
    versions: {
      rx: { description: '14 min AMRAP: 12 toes-to-bar, 10 box jumps, 8 power cleans', weight: 'Power clean 70/50kg' },
      scaled: { description: '14 min AMRAP: 12 knee raises, 10 box step-overs, 8 power cleans', weight: 'Power clean 50/35kg' },
      beginner: { description: '12 min AMRAP: 10 sit-ups, 10 step-ups, 8 deadlifts', weight: 'Deadlift 35/25kg' },
    },
  },
  {
    id: 'wod_2026_03',
    date: '2026-03-06',
    name: 'Pace Builder',
    type: 'EMOM',
    versions: {
      rx: { description: 'EMOM 18: min 1) 14/11 cals bike min 2) 12 burpees over bar min 3) 10 front squats', weight: 'Front squat 60/42kg' },
      scaled: { description: 'EMOM 18: min 1) 12/9 cals bike min 2) 10 burpees min 3) 10 front squats', weight: 'Front squat 45/30kg' },
      beginner: { description: 'EMOM 15: min 1) 10/8 cals bike min 2) 8 burpees min 3) 10 goblet squats', weight: 'Goblet 12/8kg' },
    },
  },
];

export const initializeMockData = () => {
  if (!localStorage.getItem('crosscity_benchmarks')) {
    const mockBenchmarks: Record<string, Record<string, number>> = {
      user_1: { back_squat: 120, deadlift: 150, clean_jerk: 90, snatch: 70, thruster: 80, max_pullups: 25, max_burpees_1min: 18, max_dubs_1min: 50 },
      user_2: { back_squat: 100, deadlift: 130, clean_jerk: 75, snatch: 60, thruster: 70, max_pullups: 30, max_burpees_1min: 22, max_dubs_1min: 65 },
      user_3: { back_squat: 90, deadlift: 110, clean_jerk: 60, snatch: 50, thruster: 60, max_pullups: 15, max_burpees_1min: 14, max_dubs_1min: 30 },
      user_4: { back_squat: 110, deadlift: 140, clean_jerk: 85, snatch: 65, thruster: 75, max_pullups: 28, max_burpees_1min: 20, max_dubs_1min: 55 },
      user_5: { back_squat: 105, deadlift: 125, clean_jerk: 70, snatch: 55, thruster: 65, max_pullups: 20, max_burpees_1min: 16, max_dubs_1min: 40 },
    };
    localStorage.setItem('crosscity_benchmarks', JSON.stringify(mockBenchmarks));
  }

  if (!localStorage.getItem('crosscity_users')) {
    const mockUsers = [
      { id: 'user_1', name: 'Alex Thunder', email: 'alex@crosscity.com', password: 'demo123', avatar: '💪', boxId: 'box_1', xp: 2450, level: 12, streak: 15, category: 'rx', gender: 'male', role: 'coach' },
      { id: 'user_2', name: 'Sarah Storm', email: 'sarah@crosscity.com', password: 'demo123', avatar: '🔥', boxId: 'box_1', xp: 3200, level: 15, streak: 22, category: 'rx', gender: 'female', role: 'athlete' },
      { id: 'user_3', name: 'Mike Iron', email: 'mike@crosscity.com', password: 'demo123', avatar: '⚡', boxId: 'box_2', xp: 1800, level: 9, streak: 8, category: 'beginner', gender: 'male', role: 'athlete' },
      { id: 'user_4', name: 'Luna Force', email: 'luna@crosscity.com', password: 'demo123', avatar: '🌟', boxId: 'box_1', xp: 2900, level: 14, streak: 19, category: 'scaled', gender: 'female' },
      { id: 'user_5', name: 'Jake Titan', email: 'jake@crosscity.com', password: 'demo123', avatar: '💥', boxId: 'box_2', xp: 2100, level: 11, streak: 12, category: 'scaled', gender: 'male' },
    ];
    localStorage.setItem('crosscity_users', JSON.stringify(mockUsers));
  }

  if (!localStorage.getItem('crosscity_boxes')) {
    const mockBoxes = [
      { id: 'box_1', name: 'Thunder Box', code: 'THUNDER2024', points: 8550, members: 45 },
      { id: 'box_2', name: 'Iron Warriors', code: 'IRON2024', points: 6200, members: 32 },
    ];
    localStorage.setItem('crosscity_boxes', JSON.stringify(mockBoxes));
  }

  if (!localStorage.getItem('crosscity_feed')) {
    const mockPosts = [
      { id: 'post_1', userId: 'user_2', userName: 'Sarah Storm', userAvatar: '🔥', content: 'Acabei de mandar o RX no WOD do dia! 🏁', wodName: 'Engine Blast', time: '11:42', reactions: { fire: 12, clap: 8, muscle: 15 }, comments: 5, timestamp: Date.now() - 3600000 },
      { id: 'post_2', userId: 'user_4', userName: 'Luna Force', userAvatar: '🌟', content: 'Ganhei meu duelo direto hoje. Bora próxima! ⚔️', wodName: 'Duelos', time: 'Vitória', reactions: { fire: 8, clap: 10, muscle: 6 }, comments: 3, timestamp: Date.now() - 7200000 },
    ];
    localStorage.setItem('crosscity_feed', JSON.stringify(mockPosts));
  }

  if (!localStorage.getItem('crosscity_daily_wods')) {
    localStorage.setItem('crosscity_daily_wods', JSON.stringify(mockDailyWods));
  }

  if (!localStorage.getItem('crosscity_daily_wod')) {
    localStorage.setItem('crosscity_daily_wod', JSON.stringify(mockDailyWods[0]));
  }

  if (!localStorage.getItem('crosscity_wod_results')) {
    const mockResults: DailyWodResult[] = [
      { id: 'res_1', wodId: mockDailyWods[0].id, userId: 'user_2', userName: 'Sarah Storm', avatar: '🔥', category: 'rx', result: '11:42', unit: 'time', submittedAt: Date.now() - 5400000 },
      { id: 'res_2', wodId: mockDailyWods[0].id, userId: 'user_1', userName: 'Alex Thunder', avatar: '💪', category: 'rx', result: '12:01', unit: 'time', submittedAt: Date.now() - 5100000 },
      { id: 'res_3', wodId: mockDailyWods[0].id, userId: 'user_4', userName: 'Luna Force', avatar: '🌟', category: 'scaled', result: '12:30', unit: 'time', submittedAt: Date.now() - 3600000 },
      { id: 'res_4', wodId: mockDailyWods[0].id, userId: 'user_5', userName: 'Jake Titan', avatar: '💥', category: 'scaled', result: '12:58', unit: 'time', submittedAt: Date.now() - 3400000 },
      { id: 'res_5', wodId: mockDailyWods[0].id, userId: 'user_3', userName: 'Mike Iron', avatar: '⚡', category: 'beginner', result: '10:08', unit: 'time', submittedAt: Date.now() - 1800000 },
      { id: 'res_6', wodId: mockDailyWods[1].id, userId: 'user_2', userName: 'Sarah Storm', avatar: '🔥', category: 'rx', result: '7', unit: 'rounds', submittedAt: Date.now() - 86400000 },
      { id: 'res_7', wodId: mockDailyWods[1].id, userId: 'user_1', userName: 'Alex Thunder', avatar: '💪', category: 'rx', result: '6', unit: 'rounds', submittedAt: Date.now() - 86400000 + 300000 },
      { id: 'res_8', wodId: mockDailyWods[1].id, userId: 'user_4', userName: 'Luna Force', avatar: '🌟', category: 'scaled', result: '6', unit: 'rounds', submittedAt: Date.now() - 86400000 + 500000 },
      { id: 'res_9', wodId: mockDailyWods[2].id, userId: 'user_3', userName: 'Mike Iron', avatar: '⚡', category: 'beginner', result: '5', unit: 'rounds', submittedAt: Date.now() - 172800000 },
    ];
    localStorage.setItem('crosscity_wod_results', JSON.stringify(mockResults));
  }

  if (!localStorage.getItem('crosscity_checkins')) {
    const mockCheckins: Record<string, string[]> = {
      user_1: ['2026-03-01','2026-03-02','2026-03-03','2026-03-04','2026-03-05','2026-03-06','2026-03-07','2026-03-08','2026-03-09','2026-03-10','2026-03-11','2026-03-12','2026-03-13','2026-03-14','2026-03-15','2026-03-16','2026-03-17','2026-03-18','2026-03-19','2026-03-20','2026-03-21'],
      user_2: ['2026-03-01', '2026-03-02', '2026-03-04', '2026-03-06', '2026-03-08', '2026-03-10'],
      user_3: ['2026-03-02', '2026-03-05', '2026-03-09'],
      user_4: ['2026-03-01', '2026-03-03', '2026-03-04', '2026-03-07'],
      user_5: ['2026-03-02', '2026-03-06', '2026-03-08', '2026-03-10'],
    };
    localStorage.setItem('crosscity_checkins', JSON.stringify(mockCheckins));
  }

  if (!localStorage.getItem('crosscity_duels')) {
    const mockDuels: Duel[] = [
      {
        id: 'duel_1',
        wodId: mockDailyWods[0].id,
        wodName: mockDailyWods[0].name,
        category: 'rx',
        challengerId: 'user_1',
        opponentId: 'user_2',
        challengerResult: null,
        opponentResult: null,
        status: 'active',
        winnerId: null,
        betMode: false,
        betItems: [],
        createdAt: Date.now() - 1200000,
      },
    ];
    localStorage.setItem('crosscity_duels', JSON.stringify(mockDuels));
  }
};

export const avatarEmojis = ['💪', '🔥', '⚡', '🌟', '💥', '🏋️', '⚔️', '🎯', '🚀', '👊'];
