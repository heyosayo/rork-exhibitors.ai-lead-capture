import { useState, useEffect, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { Event } from "@/types/card";

const EVENTS_STORAGE_KEY = "events";

const DEFAULT_COLORS = [
  "#4F46E5", // Indigo
  "#059669", // Emerald
  "#DC2626", // Red
  "#D97706", // Amber
  "#7C3AED", // Violet
  "#0891B2", // Cyan
  "#C2410C", // Orange
  "#BE185D", // Pink
];

export const [EventProvider, useEvents] = createContextHook(() => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadEvents = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(EVENTS_STORAGE_KEY);
      if (stored) {
        setEvents(JSON.parse(stored));
      } else {
        // Create default "Non-Categorized" event
        const defaultEvent: Event = {
          id: "non-categorized",
          name: "Non-Categorized",
          description: "Cards without a specific event",
          createdAt: new Date().toISOString(),
          color: "#6B7280",
        };
        const initialEvents = [defaultEvent];
        await AsyncStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(initialEvents));
        setEvents(initialEvents);
      }
    } catch (error) {
      console.error("Error loading events:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveEvents = useCallback(async (newEvents: Event[]) => {
    try {
      await AsyncStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(newEvents));
      setEvents(newEvents);
    } catch (error) {
      console.error("Error saving events:", error);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const addEvent = useCallback((event: Omit<Event, "id" | "createdAt">) => {
    const newEvent: Event = {
      ...event,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      color: event.color || DEFAULT_COLORS[events.length % DEFAULT_COLORS.length],
    };
    const newEvents = [...events, newEvent];
    saveEvents(newEvents);
  }, [events, saveEvents]);

  const updateEvent = useCallback((id: string, updates: Partial<Event>) => {
    const newEvents = events.map(event => 
      event.id === id ? { ...event, ...updates } : event
    );
    saveEvents(newEvents);
  }, [events, saveEvents]);

  const deleteEvent = useCallback((id: string) => {
    if (id === "non-categorized") {
      console.warn("Cannot delete the Non-Categorized event");
      return;
    }
    const newEvents = events.filter(event => event.id !== id);
    saveEvents(newEvents);
  }, [events, saveEvents]);

  const getEventById = useCallback((id: string | null) => {
    if (!id) return events.find(e => e.id === "non-categorized") || null;
    return events.find(event => event.id === id) || null;
  }, [events]);

  const getNonCategorizedEvent = useCallback(() => {
    return events.find(e => e.id === "non-categorized") || null;
  }, [events]);

  return useMemo(() => ({
    events,
    isLoading,
    addEvent,
    updateEvent,
    deleteEvent,
    getEventById,
    getNonCategorizedEvent,
    refetch: loadEvents,
  }), [
    events,
    isLoading,
    addEvent,
    updateEvent,
    deleteEvent,
    getEventById,
    getNonCategorizedEvent,
    loadEvents,
  ]);
});