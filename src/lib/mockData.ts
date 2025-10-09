export const initializeMockData = () => {
  if (!localStorage.getItem('crosscity_users')) {
    const mockUsers = [
      {
        id: 'user_1',
        name: 'Alex Thunder',
        email: 'alex@crosscity.com',
        password: 'demo123',
        avatar: '💪',
        boxId: 'box_1',
        xp: 2450,
        level: 12,
        streak: 15,
      },
      {
        id: 'user_2',
        name: 'Sarah Storm',
        email: 'sarah@crosscity.com',
        password: 'demo123',
        avatar: '🔥',
        boxId: 'box_1',
        xp: 3200,
        level: 15,
        streak: 22,
      },
      {
        id: 'user_3',
        name: 'Mike Iron',
        email: 'mike@crosscity.com',
        password: 'demo123',
        avatar: '⚡',
        boxId: 'box_2',
        xp: 1800,
        level: 9,
        streak: 8,
      },
      {
        id: 'user_4',
        name: 'Luna Force',
        email: 'luna@crosscity.com',
        password: 'demo123',
        avatar: '🌟',
        boxId: 'box_1',
        xp: 2900,
        level: 14,
        streak: 19,
      },
      {
        id: 'user_5',
        name: 'Jake Titan',
        email: 'jake@crosscity.com',
        password: 'demo123',
        avatar: '💥',
        boxId: 'box_2',
        xp: 2100,
        level: 11,
        streak: 12,
      },
    ];
    localStorage.setItem('crosscity_users', JSON.stringify(mockUsers));
  }

  if (!localStorage.getItem('crosscity_boxes')) {
    const mockBoxes = [
      {
        id: 'box_1',
        name: 'Thunder Box',
        code: 'THUNDER2024',
        points: 8550,
        members: 45,
      },
      {
        id: 'box_2',
        name: 'Iron Warriors',
        code: 'IRON2024',
        points: 6200,
        members: 32,
      },
    ];
    localStorage.setItem('crosscity_boxes', JSON.stringify(mockBoxes));
  }

  if (!localStorage.getItem('crosscity_feed')) {
    const mockPosts = [
      {
        id: 'post_1',
        userId: 'user_2',
        userName: 'Sarah Storm',
        userAvatar: '🔥',
        content: 'Just crushed Fran in 3:45! New PR! 💪',
        wodName: 'Fran',
        time: '3:45',
        reactions: { fire: 12, clap: 8, muscle: 15 },
        comments: 5,
        timestamp: Date.now() - 3600000,
      },
      {
        id: 'post_2',
        userId: 'user_4',
        userName: 'Luna Force',
        userAvatar: '🌟',
        content: '100 burpees for time. Legs are dead but feeling alive! 🔥',
        wodName: 'Death by Burpees',
        time: '12:30',
        reactions: { fire: 8, clap: 10, muscle: 6 },
        comments: 3,
        timestamp: Date.now() - 7200000,
      },
      {
        id: 'post_3',
        userId: 'user_1',
        userName: 'Alex Thunder',
        userAvatar: '💪',
        content: 'Morning grind complete! Who else is training today?',
        wodName: 'Cindy',
        time: '20:00',
        reactions: { fire: 15, clap: 12, muscle: 18 },
        comments: 8,
        timestamp: Date.now() - 10800000,
      },
    ];
    localStorage.setItem('crosscity_feed', JSON.stringify(mockPosts));
  }
};

export const avatarEmojis = ['💪', '🔥', '⚡', '🌟', '💥', '🏋️', '⚔️', '🎯', '🚀', '👊'];

export const wodTemplates = [
  {
    name: 'Fran',
    description: '21-15-9 reps for time of: Thrusters (95/65 lb), Pull-ups',
    type: 'For Time',
    difficulty: 'Advanced',
  },
  {
    name: 'Cindy',
    description: '20 min AMRAP: 5 Pull-ups, 10 Push-ups, 15 Air Squats',
    type: 'AMRAP',
    difficulty: 'Beginner',
  },
  {
    name: 'Murph',
    description: '1 mile run, 100 pull-ups, 200 push-ups, 300 air squats, 1 mile run',
    type: 'For Time',
    difficulty: 'Hero',
  },
  {
    name: 'Helen',
    description: '3 rounds for time: 400m run, 21 KB swings (53/35), 12 Pull-ups',
    type: 'For Time',
    difficulty: 'Intermediate',
  },
  {
    name: 'Annie',
    description: '50-40-30-20-10 reps for time: Double-unders, Sit-ups',
    type: 'For Time',
    difficulty: 'Intermediate',
  },
];
