import { useState, useMemo, useEffect, useCallback } from "react";
import { Dimensions, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";

type LayoutMode = "mobile" | "desktop";

const LAYOUT_MODE_KEY = "layout_mode";

export const [LayoutProvider, useLayout] = createContextHook(() => {
  const [mode, setMode] = useState<LayoutMode>("mobile");
  const [windowWidth, setWindowWidth] = useState(Dimensions.get("window").width);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const loadMode = async () => {
      try {
        const stored = await AsyncStorage.getItem(LAYOUT_MODE_KEY);
        if (stored === "desktop" || stored === "mobile") {
          setMode(stored);
        } else if (Platform.OS === "web" && Dimensions.get("window").width >= 768) {
          setMode("desktop");
        }
      } catch (e) {
        console.log("Error loading layout mode:", e);
      } finally {
        setIsReady(true);
      }
    };
    loadMode();
  }, []);

  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setWindowWidth(window.width);
    });
    return () => subscription.remove();
  }, []);

  const toggleMode = useCallback(async () => {
    const next = mode === "mobile" ? "desktop" : "mobile";
    setMode(next);
    try {
      await AsyncStorage.setItem(LAYOUT_MODE_KEY, next);
    } catch (e) {
      console.log("Error saving layout mode:", e);
    }
  }, [mode]);

  const setLayoutMode = useCallback(async (newMode: LayoutMode) => {
    setMode(newMode);
    try {
      await AsyncStorage.setItem(LAYOUT_MODE_KEY, newMode);
    } catch (e) {
      console.log("Error saving layout mode:", e);
    }
  }, []);

  const isDesktop = mode === "desktop";
  const isWeb = Platform.OS === "web";
  const showDesktopLayout = isDesktop && isWeb;

  return useMemo(() => ({
    mode,
    isDesktop,
    isWeb,
    showDesktopLayout,
    windowWidth,
    isReady,
    toggleMode,
    setLayoutMode,
  }), [mode, isDesktop, isWeb, showDesktopLayout, windowWidth, isReady, toggleMode, setLayoutMode]);
});
