import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Plus, X, Trash2, Edit2, Check } from "lucide-react-native";
import { useLeadCategories } from "@/providers/LeadCategoryProvider";
import { LeadCategory } from "@/types/card";
import { Stack } from "expo-router";

const PRESET_COLORS = [
  "#EF4444", "#F97316", "#F59E0B", "#10B981", "#14B8A6",
  "#3B82F6", "#6366F1", "#8B5CF6", "#EC4899", "#F43F5E",
  "#78716C", "#64748B",
];

export default function LeadCategoriesScreen() {
  const { categories, addCategory, updateCategory, deleteCategory } = useLeadCategories();
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<LeadCategory | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSelectedColor(PRESET_COLORS[0]);
    setEditingCategory(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (category: LeadCategory) => {
    setEditingCategory(category);
    setTitle(category.title);
    setDescription(category.description);
    setSelectedColor(category.color);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a category title.");
      return;
    }

    if (editingCategory) {
      updateCategory(editingCategory.id, {
        title: title.trim(),
        description: description.trim(),
        color: selectedColor,
      });
    } else {
      const newCategory: LeadCategory = {
        id: Date.now().toString(),
        title: title.trim(),
        description: description.trim(),
        color: selectedColor,
      };
      addCategory(newCategory);
    }

    setShowModal(false);
    resetForm();
  };

  const handleDelete = (category: LeadCategory) => {
    Alert.alert(
      "Delete Category",
      `Are you sure you want to delete "${category.title}"? This won't remove categories from existing leads.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteCategory(category.id) },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Stack.Screen options={{ title: "Lead Categories", headerStyle: { backgroundColor: "#f8f9fa" } }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>
          Create categories to organize your leads. You can assign multiple categories to each contact.
        </Text>

        {categories.map((category) => (
          <View key={category.id} style={styles.categoryCard}>
            <View style={styles.categoryLeft}>
              <View style={[styles.colorDot, { backgroundColor: category.color }]} />
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryTitle}>{category.title}</Text>
                {category.description ? (
                  <Text style={styles.categoryDesc} numberOfLines={2}>{category.description}</Text>
                ) : null}
              </View>
            </View>
            <View style={styles.categoryActions}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => openEditModal(category)}>
                <Edit2 size={16} color="#6B7280" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(category)}>
                <Trash2 size={16} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {categories.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No categories yet</Text>
            <Text style={styles.emptyText}>Create your first lead category to start organizing contacts.</Text>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={openCreateModal} activeOpacity={0.8}>
        <Plus size={24} color="#FFFFFF" />
        <Text style={styles.fabText}>New Category</Text>
      </TouchableOpacity>

      <Modal visible={showModal} animationType="slide" transparent statusBarTranslucent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingCategory ? "Edit Category" : "New Category"}</Text>
              <TouchableOpacity onPress={() => { setShowModal(false); resetForm(); }}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Title</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Hot Leads"
              placeholderTextColor="#9CA3AF"
              autoFocus
            />

            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe this category..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
            />

            <Text style={styles.fieldLabel}>Color</Text>
            <View style={styles.colorGrid}>
              {PRESET_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[styles.colorOption, { backgroundColor: color }, selectedColor === color && styles.colorSelected]}
                  onPress={() => setSelectedColor(color)}
                >
                  {selectedColor === color && <Check size={16} color="#FFFFFF" />}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.previewRow}>
              <Text style={styles.fieldLabel}>Preview</Text>
              <View style={[styles.previewBadge, { backgroundColor: selectedColor + "20" }]}>
                <Text style={[styles.previewBadgeText, { color: selectedColor }]}>{title || "Category"}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.8}>
              <Check size={20} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>{editingCategory ? "Save Changes" : "Create Category"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  content: { padding: 16, paddingBottom: 100 },
  subtitle: { fontSize: 14, color: "#6B7280", lineHeight: 20, marginBottom: 20 },
  categoryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  categoryLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  colorDot: { width: 14, height: 14, borderRadius: 7, marginRight: 12 },
  categoryInfo: { flex: 1 },
  categoryTitle: { fontSize: 16, fontWeight: "600" as const, color: "#1F2937", marginBottom: 2 },
  categoryDesc: { fontSize: 13, color: "#6B7280", lineHeight: 18 },
  categoryActions: { flexDirection: "row", gap: 4 },
  actionBtn: { padding: 8, borderRadius: 8, backgroundColor: "#F3F4F6" },
  emptyState: { alignItems: "center", paddingVertical: 48 },
  emptyTitle: { fontSize: 18, fontWeight: "600" as const, color: "#4B5563", marginBottom: 8 },
  emptyText: { fontSize: 14, color: "#9CA3AF", textAlign: "center" },
  fab: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 32 : 20,
    left: 16,
    right: 16,
    backgroundColor: "#4128C5",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 14,
    gap: 8,
    shadowColor: "#4128C5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" as const },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  modalTitle: { fontSize: 20, fontWeight: "700" as const, color: "#1F2937" },
  fieldLabel: { fontSize: 13, fontWeight: "600" as const, color: "#6B7280", textTransform: "uppercase" as const, letterSpacing: 0.5, marginBottom: 8, marginTop: 12 },
  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: "#1F2937",
  },
  textArea: { minHeight: 80, textAlignVertical: "top" as const },
  colorGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  colorSelected: {
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  previewRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 4 },
  previewBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  previewBadgeText: { fontSize: 14, fontWeight: "500" as const },
  saveButton: {
    backgroundColor: "#4128C5",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 24,
  },
  saveButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" as const },
});
