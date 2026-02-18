const store = new Map<string, string>();

console.log("DB: Using in-memory store");

export async function dbGet<T>(key: string): Promise<T | null> {
  const raw = store.get(key);
  if (!raw) {
    console.log(`DB GET ${key} -> null`);
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as T;
    console.log(`DB GET ${key} -> found`);
    return parsed;
  } catch {
    console.error(`DB GET ${key} -> parse error`);
    return null;
  }
}

export async function dbSet<T>(key: string, value: T): Promise<boolean> {
  try {
    store.set(key, JSON.stringify(value));
    console.log(`DB SET ${key} -> ok`);
    return true;
  } catch (error) {
    console.error(`DB SET ${key} -> error:`, error);
    return false;
  }
}

export async function dbDelete(key: string): Promise<boolean> {
  store.delete(key);
  console.log(`DB DEL ${key}`);
  return true;
}

export interface StoredUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  createdAt: string;
}

export interface StoredSession {
  userId: string;
  createdAt: string;
}

export interface UsersIndex {
  userIds: string[];
  emailToId: Record<string, string>;
}

const USERS_INDEX_KEY = "users_index";

export async function getUsersIndex(): Promise<UsersIndex> {
  const index = await dbGet<UsersIndex>(USERS_INDEX_KEY);
  return index || { userIds: [], emailToId: {} };
}

export async function saveUsersIndex(index: UsersIndex): Promise<boolean> {
  return dbSet(USERS_INDEX_KEY, index);
}

export async function getUserById(userId: string): Promise<StoredUser | null> {
  const key = userId.startsWith('user_') ? userId : `user_${userId}`;
  return dbGet<StoredUser>(key);
}

export async function getUserByEmail(email: string): Promise<StoredUser | null> {
  const emailKey = email.toLowerCase().trim();
  console.log("getUserByEmail:", emailKey);
  const index = await getUsersIndex();
  
  let userId = index.emailToId[emailKey];
  if (!userId) {
    for (const key of Object.keys(index.emailToId)) {
      if (key.toLowerCase().trim() === emailKey) {
        userId = index.emailToId[key];
        break;
      }
    }
  }
  
  if (!userId) {
    console.log("getUserByEmail: not found");
    return null;
  }
  console.log("getUserByEmail: found userId", userId);
  return getUserById(userId);
}

export async function saveUser(user: StoredUser): Promise<boolean> {
  const key = user.id.startsWith('user_') ? user.id : `user_${user.id}`;
  console.log("saveUser:", key, user.email);
  
  const saved = await dbSet(key, user);
  if (!saved) {
    console.error("saveUser: failed to save user data");
    return false;
  }
  
  const index = await getUsersIndex();
  if (!index.userIds.includes(user.id)) {
    index.userIds.push(user.id);
  }
  const emailKey = user.email.toLowerCase().trim();
  index.emailToId[emailKey] = user.id;
  
  const indexSaved = await saveUsersIndex(index);
  console.log("saveUser: index saved:", indexSaved);
  return indexSaved;
}

export async function getAllUsers(): Promise<StoredUser[]> {
  const index = await getUsersIndex();
  const users: StoredUser[] = [];
  
  for (const userId of index.userIds) {
    const user = await getUserById(userId);
    if (user) {
      users.push(user);
    }
  }
  
  console.log("getAllUsers: found", users.length);
  return users;
}

export async function getSession(token: string): Promise<StoredSession | null> {
  const key = `session_${token.substring(0, 50)}`;
  return dbGet<StoredSession>(key);
}

export async function saveSession(token: string, session: StoredSession): Promise<boolean> {
  const key = `session_${token.substring(0, 50)}`;
  return dbSet(key, session);
}

export async function deleteSession(token: string): Promise<boolean> {
  const key = `session_${token.substring(0, 50)}`;
  return dbDelete(key);
}
