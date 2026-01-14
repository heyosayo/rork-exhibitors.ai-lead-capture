const DB_ENDPOINT = process.env.EXPO_PUBLIC_RORK_DB_ENDPOINT;
const DB_NAMESPACE = process.env.EXPO_PUBLIC_RORK_DB_NAMESPACE;
const DB_TOKEN = process.env.EXPO_PUBLIC_RORK_DB_TOKEN;

interface DbResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function dbRequest<T>(
  method: string,
  key: string,
  body?: any
): Promise<DbResponse<T>> {
  if (!DB_ENDPOINT || !DB_NAMESPACE || !DB_TOKEN) {
    console.error("Database configuration missing");
    return { success: false, error: "Database configuration missing" };
  }

  const url = `${DB_ENDPOINT}/${DB_NAMESPACE}/${key}`;
  
  try {
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DB_TOKEN}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { success: true, data: undefined };
      }
      const errorText = await response.text();
      console.error(`DB request failed: ${response.status} - ${errorText}`);
      return { success: false, error: errorText };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("DB request error:", error);
    return { success: false, error: String(error) };
  }
}

export async function dbGet<T>(key: string): Promise<T | null> {
  const result = await dbRequest<T>("GET", key);
  return result.success && result.data ? result.data : null;
}

export async function dbSet<T>(key: string, value: T): Promise<boolean> {
  const result = await dbRequest<T>("PUT", key, value);
  return result.success;
}

export async function dbDelete(key: string): Promise<boolean> {
  const result = await dbRequest("DELETE", key);
  return result.success;
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
  console.log("getUserById - looking up key:", key);
  return dbGet<StoredUser>(key);
}

export async function getUserByEmail(email: string): Promise<StoredUser | null> {
  const emailKey = email.toLowerCase().trim();
  console.log("getUserByEmail - looking up email:", emailKey);
  const index = await getUsersIndex();
  console.log("getUserByEmail - index emailToId keys:", Object.keys(index.emailToId));
  const userId = index.emailToId[emailKey];
  console.log("getUserByEmail - found userId:", userId);
  if (!userId) return null;
  return getUserById(userId);
}

export async function saveUser(user: StoredUser): Promise<boolean> {
  const key = user.id.startsWith('user_') ? user.id : `user_${user.id}`;
  console.log("saveUser - saving with key:", key);
  const saved = await dbSet(key, user);
  if (!saved) {
    console.error("saveUser - failed to save user data");
    return false;
  }
  
  const index = await getUsersIndex();
  console.log("saveUser - current index:", JSON.stringify(index));
  if (!index.userIds.includes(user.id)) {
    index.userIds.push(user.id);
  }
  const emailKey = user.email.toLowerCase().trim();
  index.emailToId[emailKey] = user.id;
  
  const indexSaved = await saveUsersIndex(index);
  console.log("saveUser - index saved:", indexSaved, "emailKey:", emailKey);
  return indexSaved;
}

export async function getAllUsers(): Promise<StoredUser[]> {
  const index = await getUsersIndex();
  console.log("getAllUsers - index userIds:", index.userIds);
  const users: StoredUser[] = [];
  
  for (const userId of index.userIds) {
    const user = await getUserById(userId);
    if (user) {
      users.push(user);
    }
  }
  
  console.log("getAllUsers - found users:", users.length);
  return users;
}

export async function getSession(token: string): Promise<StoredSession | null> {
  return dbGet<StoredSession>(`session_${token}`);
}

export async function saveSession(token: string, session: StoredSession): Promise<boolean> {
  return dbSet(`session_${token}`, session);
}

export async function deleteSession(token: string): Promise<boolean> {
  return dbDelete(`session_${token}`);
}
