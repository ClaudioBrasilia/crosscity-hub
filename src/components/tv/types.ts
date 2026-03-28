export type WodVersion = {
  description: string;
  weight?: string;
};

export type DailyWod = {
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

export type TvCheckin = {
  id?: string;
  name?: string;
  avatar?: string;
  avatarUrl?: string;
  time?: string;
};

export type TvDuel = {
  id?: string;
  challengerName?: string;
  challengedNames?: string;
  status?: string;
  winnerName?: string;
  isFinished?: boolean;
};

export type TvMonthlyXp = {
  userId: string;
  name: string;
  avatar?: string;
  avatarUrl?: string;
  xp: number;
};
