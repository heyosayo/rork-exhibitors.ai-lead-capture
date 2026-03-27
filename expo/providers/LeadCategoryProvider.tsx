import { useState, useEffect, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { LeadCategory } from "@/types/card";

const STORAGE_KEY = "lead_categories";

const DEFAULT_CATEGORIES: LeadCategory[] = [
  { id: "hot", title: "Hot Leads", description: "High priority leads ready to close", color: "#EF4444" },
  { id: "warm", title: "Warm Leads", description: "Interested prospects with potential", color: "#F97316" },
  { id: "cold", title: "Cold Leads", description: "Early stage or low interest leads", color: "#3B82F6" },
  { id: "suppliers", title: "Suppliers", description: "Vendor and supplier contacts", color: "#10B981" },
  { id: "partners", title: "Partners", description: "Partnership and collaboration contacts", color: "#8B5CF6" },
];

export const [LeadCategoryProvider, useLeadCategories] = createContextHook(() => {
  const [categories, setCategories] = useState<LeadCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadCategories = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setCategories(JSON.parse(stored));
      } else {
        setCategories(DEFAULT_CATEGORIES);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CATEGORIES));
      }
    } catch (error) {
      console.error("Error loading lead categories:", error);
      setCategories(DEFAULT_CATEGORIES);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveCategories = useCallback(async (newCategories: LeadCategory[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newCategories));
      setCategories(newCategories);
    } catch (error) {
      console.error("Error saving lead categories:", error);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const addCategory = useCallback((category: LeadCategory) => {
    const updated = [...categories, category];
    saveCategories(updated);
  }, [categories, saveCategories]);

  const updateCategory = useCallback((id: string, updates: Partial<LeadCategory>) => {
    const updated = categories.map(c => c.id === id ? { ...c, ...updates } : c);
    saveCategories(updated);
  }, [categories, saveCategories]);

  const deleteCategory = useCallback((id: string) => {
    const updated = categories.filter(c => c.id !== id);
    saveCategories(updated);
  }, [categories, saveCategories]);

  const getCategoryById = useCallback((id: string) => {
    return categories.find(c => c.id === id) ?? null;
  }, [categories]);

  const getCategoriesForCard = useCallback((categoryIds: string[]) => {
    return categories.filter(c => categoryIds.includes(c.id));
  }, [categories]);

  return useMemo(() => ({
    categories,
    isLoading,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
    getCategoriesForCard,
  }), [categories, isLoading, addCategory, updateCategory, deleteCategory, getCategoryById, getCategoriesForCard]);
});
