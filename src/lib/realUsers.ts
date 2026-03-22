export interface StoredUserIdentity {
  id: string;
  name?: string;
  avatar?: string;
  avatarUrl?: string | null;
  [key: string]: unknown;
}

export const safeParse = <T,>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

export const getStoredUsers = (): StoredUserIdentity[] => {
  if (typeof window === 'undefined' || !window.localStorage) return [];

  const users = safeParse<Array<Record<string, unknown>>>(window.localStorage.getItem('crosscity_users'), []);
  return users
    .filter((item): item is Record<string, unknown> & { id: string } => typeof item?.id === 'string' && item.id.trim().length > 0)
    .map((item) => ({
      ...item,
      id: item.id,
      name: typeof item.name === 'string' ? item.name : undefined,
      avatar: typeof item.avatar === 'string' ? item.avatar : undefined,
      avatarUrl: typeof item.avatarUrl === 'string' ? item.avatarUrl : null,
    }));
};

export const getStoredUsersMap = () => new Map(getStoredUsers().map((user) => [user.id, user]));

export const filterEntriesByKnownUsers = <T,>(
  entries: T[],
  getUserIds: (entry: T) => Array<string | null | undefined>,
) => {
  const usersMap = getStoredUsersMap();

  return entries.filter((entry) => {
    const userIds = getUserIds(entry)
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0);

    return userIds.length > 0 && userIds.every((userId) => usersMap.has(userId));
  });
};

export const hydrateUserSnapshot = <T extends { userId: string; userName?: string; avatar?: string }>(entry: T): T => {
  const user = getStoredUsersMap().get(entry.userId);
  if (!user) return entry;

  return {
    ...entry,
    userName: user.name || entry.userName,
    avatar: user.avatar || entry.avatar,
  };
};
