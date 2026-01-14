import { useState, useEffect, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { trpcClient, setAuthToken } from "@/lib/trpc";

const AUTH_TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
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
        console.log("Found stored auth, validating...");
        setAuthToken(storedToken);
        
        try {
          const response = await trpcClient.auth.getMe.query();
          if (response.user) {
            console.log("Auth validated, user:", response.user);
            setUser(response.user);
            setIsAuthenticated(true);
          } else {
            console.log("Token invalid, clearing stored auth");
            await clearStoredAuth();
          }
        } catch (error) {
          console.error("Error validating token:", error);
          await clearStoredAuth();
        }
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
    setAuthToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  useEffect(() => {
    loadStoredAuth();
  }, [loadStoredAuth]);

  const register = useCallback(async (firstName: string, lastName: string, email: string, password: string) => {
    try {
      console.log("Registering user:", { firstName, lastName, email });
      const response = await trpcClient.auth.register.mutate({
        firstName,
        lastName,
        email,
        password,
      });

      if (response.success && response.user && response.token) {
        console.log("Registration successful");
        setAuthToken(response.token);
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, response.token);
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(response.user));
        setUser(response.user);
        setIsAuthenticated(true);
        return { success: true };
      }
      
      return { success: false, error: "Registration failed" };
    } catch (error: any) {
      console.error("Registration error:", error);
      return { success: false, error: error.message || "Registration failed" };
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      console.log("Logging in user:", email);
      const response = await trpcClient.auth.login.mutate({
        email,
        password,
      });

      if (response.success && response.user && response.token) {
        console.log("Login successful");
        setAuthToken(response.token);
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, response.token);
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(response.user));
        setUser(response.user);
        setIsAuthenticated(true);
        return { success: true };
      }
      
      return { success: false, error: "Login failed" };
    } catch (error: any) {
      console.error("Login error:", error);
      return { success: false, error: error.message || "Login failed" };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      console.log("Logging out user");
      await trpcClient.auth.logout.mutate();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      await clearStoredAuth();
    }
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
