export interface BenchmarkExercise {
  id: string;
  name: string;
  unit: string; // 'kg' or 'reps'
  category: string;
}

export const benchmarkExercises: BenchmarkExercise[] = [
  { id: 'back_squat', name: 'Back Squat', unit: 'kg', category: 'Força' },
  { id: 'deadlift', name: 'Deadlift', unit: 'kg', category: 'Força' },
  { id: 'clean_jerk', name: 'Clean & Jerk', unit: 'kg', category: 'Olímpico' },
  { id: 'snatch', name: 'Snatch', unit: 'kg', category: 'Olímpico' },
  { id: 'thruster', name: 'Thruster', unit: 'kg', category: 'Força' },
  { id: 'max_pullups', name: 'Max Pull-ups', unit: 'reps', category: 'Ginástica' },
  { id: 'max_burpees_1min', name: 'Max Burpees (1min)', unit: 'reps', category: 'Cardio' },
  { id: 'max_dubs_1min', name: 'Max Double-unders (1min)', unit: 'reps', category: 'Cardio' },
];

// Mapping WODs to relevant benchmarks with weights
const wodBenchmarkMap: Record<string, { benchmarkId: string; weight: number }[]> = {
  'Fran': [
    { benchmarkId: 'thruster', weight: 0.5 },
    { benchmarkId: 'max_pullups', weight: 0.5 },
  ],
  'Cindy': [
    { benchmarkId: 'max_pullups', weight: 0.4 },
    { benchmarkId: 'max_burpees_1min', weight: 0.3 },
    { benchmarkId: 'back_squat', weight: 0.3 },
  ],
  'Murph': [
    { benchmarkId: 'max_pullups', weight: 0.3 },
    { benchmarkId: 'max_burpees_1min', weight: 0.3 },
    { benchmarkId: 'back_squat', weight: 0.2 },
    { benchmarkId: 'deadlift', weight: 0.2 },
  ],
  'Helen': [
    { benchmarkId: 'max_pullups', weight: 0.3 },
    { benchmarkId: 'deadlift', weight: 0.3 },
    { benchmarkId: 'max_burpees_1min', weight: 0.4 },
  ],
  'Annie': [
    { benchmarkId: 'max_dubs_1min', weight: 0.5 },
    { benchmarkId: 'max_burpees_1min', weight: 0.5 },
  ],
};

export interface Participant {
  id: string;
  name: string;
  avatar: string;
  xp: number;
  level: number;
  benchmarks: Record<string, number>;
}

export interface BattleResult {
  participantId: string;
  name: string;
  avatar: string;
  score: number;
  simulatedTime: string; // "3:45" or "18 rounds"
  position: number;
}

const calculatePerformanceScore = (
  participant: Participant,
  wodName: string
): number => {
  const mapping = wodBenchmarkMap[wodName] || wodBenchmarkMap['Fran'];
  
  let benchmarkScore = 0;
  for (const { benchmarkId, weight } of mapping) {
    const value = participant.benchmarks[benchmarkId] || 50;
    benchmarkScore += value * weight;
  }

  const score = benchmarkScore + (participant.xp * 0.1) + (participant.level * 50);
  const randomFactor = 0.9 + Math.random() * 0.2; // ±10%
  return score * randomFactor;
};

const scoreToTime = (score: number, wodName: string): string => {
  // Higher score = faster (lower time)
  const baseTime = 600; // 10 min in seconds
  const timeSeconds = Math.max(120, baseTime - score * 0.8);
  const mins = Math.floor(timeSeconds / 60);
  const secs = Math.floor(timeSeconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const scoreToRounds = (score: number): string => {
  const rounds = Math.floor(8 + score * 0.03);
  return `${Math.min(rounds, 30)} rounds`;
};

export const simulateBattle = (
  wodName: string,
  wodType: string,
  participants: Participant[]
): BattleResult[] => {
  const results = participants.map(p => {
    const score = calculatePerformanceScore(p, wodName);
    return {
      participantId: p.id,
      name: p.name,
      avatar: p.avatar,
      score,
      simulatedTime: wodType === 'AMRAP' ? scoreToRounds(score) : scoreToTime(score, wodName),
      position: 0,
    };
  });

  // For Time: higher score = faster = better (position 1)
  // AMRAP: higher score = more rounds = better (position 1)
  results.sort((a, b) => b.score - a.score);
  results.forEach((r, i) => (r.position = i + 1));

  return results;
};
