import { useState, useEffect, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";

const AUTH_TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";
const USERS_DB_KEY = "users_db";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface StoredUser extends User {
  password: string;
}

async function getStoredUsers(): Promise<StoredUser[]> {
  try {
    const raw = await AsyncStorage.getItem(USERS_DB_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as StoredUser[];
  } catch (error) {
    console.error("Failed to read users DB:", error);
    return [];
  }
}

async function saveStoredUsers(users: StoredUser[]): Promise<void> {
  await AsyncStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
}

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const loadStoredAuth = useCallback(async () => {
    try {
      console.log("Loading stored auth...");
      const [storedToken, storedUser] = await Promise.all([
        AsyncStorage.getItem(AUTH_TOKEN_KEY),
        AsyncStorage.getItem(USER_KEY),
      ]);

      if (storedToken && storedUser) {
        console.log("Found stored auth, restoring session");
        const parsed = JSON.parse(storedUser) as User;
        setUser(parsed);
        setIsAuthenticated(true);
      } else {
        console.log("No stored auth found");
      }
    } catch (error) {
      console.error("Error loading stored auth:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearStoredAuth = async () => {
    await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, USER_KEY]);
    setUser(null);
    setIsAuthenticated(false);
  };

  useEffect(() => {
    loadStoredAuth();
  }, [loadStoredAuth]);

  const register = useCallback(async (firstName: string, lastName: string, email: string, password: string) => {
    try {
      console.log("Registering user:", { firstName, lastName, email });
      const normalizedEmail = email.toLowerCase().trim();

      const existingUsers = await getStoredUsers();
      const duplicate = existingUsers.find(u => u.email === normalizedEmail);
      if (duplicate) {
        return { success: false, error: "An account with this email already exists" };
      }

      const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      const newUser: StoredUser = {
        id: userId,
        email: normalizedEmail,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        password,
      };

      existingUsers.push(newUser);
      await saveStoredUsers(existingUsers);

      const token = `local_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      const sessionUser: User = {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
      };

      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(sessionUser));
      setUser(sessionUser);
      setIsAuthenticated(true);

      console.log("Registration successful:", sessionUser.id);
      return { success: true };
    } catch (error: any) {
      console.error("Registration error:", error);
      return { success: false, error: error.message || "Registration failed" };
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      console.log("Logging in user:", email);
      const normalizedEmail = email.toLowerCase().trim();

      const existingUsers = await getStoredUsers();
      console.log("Found stored users:", existingUsers.length);

      const found = existingUsers.find(u => u.email === normalizedEmail);
      if (!found) {
        console.log("User not found for email:", normalizedEmail);
        return { success: false, error: "Invalid email or password" };
      }

      if (found.password !== password) {
        console.log("Password mismatch for user:", found.id);
        return { success: false, error: "Invalid email or password" };
      }

      const token = `local_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      const sessionUser: User = {
        id: found.id,
        email: found.email,
        firstName: found.firstName,
        lastName: found.lastName,
      };

      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(sessionUser));
      setUser(sessionUser);
      setIsAuthenticated(true);

      console.log("Login successful:", sessionUser.id);
      return { success: true };
    } catch (error: any) {
      console.error("Login error:", error);
      return { success: false, error: error.message || "Login failed" };
    }
  }, []);

  const logout = useCallback(async () => {
    console.log("Logging out user");
    await clearStoredAuth();
  }, []);

  return useMemo(() => ({
    user,
    isLoading,
    isAuthenticated,
    register,
    login,
    logout,
  }), [user, isLoading, isAuthenticated, register, login, logout]);
});
