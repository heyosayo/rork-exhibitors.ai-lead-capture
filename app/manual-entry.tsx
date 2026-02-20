import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { X, CheckCircle, User, Calendar, ChevronDown, Plus, Tag } from "lucide-react-native";
import { useCards } from "@/providers/CardProvider";
import { useEvents } from "@/providers/EventProvider";
import { useLeadCategories } from "@/providers/LeadCategoryProvider";
import { BusinessCard } from "@/types/card";
import { SafeAreaView } from "react-native-safe-area-context";

function FormField({ label, value, onChangeText, keyboardType, multiline, autoCapitalize }: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  multiline?: boolean;
  autoCapitalize?: 'none' | 'words' | 'sentences';
}) {
  return (
    <View style={s.inputGroup}>
      <Text style={s.inputLabel}>{label}</Text>
      <TextInput
        style={[s.input, multiline && s.textArea]}
        value={value}
        onChangeText={onChangeText}
        placeholder={`Enter ${label.toLowerCase()}`}
        placeholderTextColor="#9CA3AF"
        keyboardType={keyboardType || 'default'}
        autoCapitalize={autoCapitalize || 'sentences'}
        autoCorrect={keyboardType === 'email-address' ? false : undefined}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        textAlignVertical={multiline ? "top" : "auto"}
      />
    </View>
  );
}

export default function ManualEntryScreen() {
  const { addCard } = useCards();
  const { events, addEvent, getNonCategorizedEvent } = useEvents();
  const { categories } = useLeadCategories();
  const [formData, setFormData] = useState<Partial<BusinessCard>>({
    name: "", title: "", company: "", email: "",
    officePhone: "", cellPhone: "", faxPhone: "",
    website: "", linkedinUrl: "", notes: "",
    eventId: null, profilePhotoUrl: null,
  });
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showEventPicker, setShowEventPicker] = useState(false);
  const [showNewEventForm, setShowNewEventForm] = useState(false);
  const [newEventName, setNewEventName] = useState("");
  const [newEventDescription, setNewEventDescription] = useState("");
  const [pendingEventName, setPendingEventName] = useState<string | null>(null);

  const handleSave = () => {
    if (!formData.name?.trim() && !formData.company?.trim()) {
      Alert.alert("Missing Information", "Please add at least a name or company.");
      return;
    }
    const newCard: BusinessCard = {
      ...formData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      name: formData.name?.trim() || null,
      title: formData.title?.trim() || null,
      company: formData.company?.trim() || null,
      email: formData.email?.trim() || null,
      officePhone: formData.officePhone?.trim() || null,
      cellPhone: formData.cellPhone?.trim() || null,
      faxPhone: formData.faxPhone?.trim() || null,
      website: formData.website?.trim() || null,
      linkedinUrl: formData.linkedinUrl?.trim() || null,
      address: null,
      notes: formData.notes?.trim() || null,
      eventId: formData.eventId || null,
      profilePhotoUrl: null,
      phone: null,
      categoryIds: selectedCategoryIds,
    };
    addCard(newCard);
    Alert.alert("Success", "Business card saved successfully!", [
      { text: "OK", onPress: () => router.back() }
    ]);
  };

  const updateField = (field: keyof BusinessCard, value: string | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateNewEvent = () => {
    if (!newEventName.trim()) {
      Alert.alert("Missing Information", "Please enter an event name.");
      return;
    }
    addEvent({ name: newEventName.trim(), description: newEventDescription.trim() || null, color: "#4128C5" });
    setPendingEventName(newEventName.trim());
    setShowNewEventForm(false);
    setNewEventName("");
    setNewEventDescription("");
  };

  useEffect(() => {
    if (pendingEventName) {
      const newEvent = events.find(e => e.name === pendingEventName);
      if (newEvent) {
        setFormData(prev => ({ ...prev, eventId: newEvent.id }));
        setPendingEventName(null);
      }
    }
  }, [events, pendingEventName]);

  const getSelectedEventName = () => {
    if (!formData.eventId) return getNonCategorizedEvent()?.name || "Non-Categorized";
    return events.find(e => e.id === formData.eventId)?.name || "Select Event";
  };

  return (
    <SafeAreaView style={s.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={s.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.closeBtn}>
            <X size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Add Contact Manually</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          <View style={s.iconContainer}>
            <View style={s.iconCircle}>
              <User size={32} color="#4128C5" />
            </View>
            <Text style={s.subtitle}>Enter contact information manually</Text>
          </View>

          <View style={s.formContainer}>
            <FormField label="Name *" value={formData.name || ""} onChangeText={(t) => updateField("name", t)} autoCapitalize="words" />
            <FormField label="Job Title" value={formData.title || ""} onChangeText={(t) => updateField("title", t)} autoCapitalize="words" />
            <FormField label="Company *" value={formData.company || ""} onChangeText={(t) => updateField("company", t)} autoCapitalize="words" />
            <FormField label="Email" value={formData.email || ""} onChangeText={(t) => updateField("email", t)} keyboardType="email-address" autoCapitalize="none" />
            <FormField label="Office Phone" value={formData.officePhone || ""} onChangeText={(t) => updateField("officePhone", t)} keyboardType="phone-pad" />
            <FormField label="Cell Phone" value={formData.cellPhone || ""} onChangeText={(t) => updateField("cellPhone", t)} keyboardType="phone-pad" />
            <FormField label="Fax" value={formData.faxPhone || ""} onChangeText={(t) => updateField("faxPhone", t)} keyboardType="phone-pad" />
            <FormField label="Website" value={formData.website || ""} onChangeText={(t) => updateField("website", t)} autoCapitalize="none" />
            <FormField label="LinkedIn Profile" value={formData.linkedinUrl || ""} onChangeText={(t) => updateField("linkedinUrl", t)} autoCapitalize="none" />

            <View style={s.inputGroup}>
              <Text style={s.inputLabel}>Event</Text>
              <TouchableOpacity style={s.eventSelector} onPress={() => setShowEventPicker(!showEventPicker)}>
                <Calendar size={20} color="#6B7280" />
                <Text style={s.eventSelectorText}>{getSelectedEventName()}</Text>
                <ChevronDown size={20} color="#6B7280" />
              </TouchableOpacity>
              {showEventPicker && (
                <View style={s.eventPicker}>
                  <TouchableOpacity style={s.eventOption} onPress={() => { updateField("eventId", null); setShowEventPicker(false); }}>
                    <Text style={[s.eventOptionText, !formData.eventId && s.selectedEventText]}>
                      {getNonCategorizedEvent()?.name || "Non-Categorized"}
                    </Text>
                  </TouchableOpacity>
                  {events.filter(e => e.id !== "non-categorized").map(event => (
                    <TouchableOpacity key={event.id} style={s.eventOption} onPress={() => { updateField("eventId", event.id); setShowEventPicker(false); }}>
                      <Text style={[s.eventOptionText, formData.eventId === event.id && s.selectedEventText]}>{event.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={s.inputGroup}>
              <Text style={s.inputLabel}>Lead Categories</Text>
              <TouchableOpacity style={s.eventSelector} onPress={() => setShowCategoryPicker(!showCategoryPicker)}>
                <Tag size={20} color="#6B7280" />
                <Text style={[s.eventSelectorText, selectedCategoryIds.length === 0 && { color: '#9CA3AF' }]}>
                  {selectedCategoryIds.length === 0
                    ? "Select categories"
                    : categories.filter(c => selectedCategoryIds.includes(c.id)).map(c => c.title).join(", ")}
                </Text>
                <ChevronDown size={20} color="#6B7280" />
              </TouchableOpacity>
              {selectedCategoryIds.length > 0 && (
                <View style={s.selectedCategoriesRow}>
                  {categories.filter(c => selectedCategoryIds.includes(c.id)).map(cat => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[s.categoryChip, { backgroundColor: cat.color + '18', borderColor: cat.color }]}
                      onPress={() => setSelectedCategoryIds(prev => prev.filter(id => id !== cat.id))}
                    >
                      <View style={[s.categoryDot, { backgroundColor: cat.color }]} />
                      <Text style={[s.categoryChipText, { color: cat.color }]}>{cat.title}</Text>
                      <X size={14} color={cat.color} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {showCategoryPicker && (
                <View style={s.eventPicker}>
                  {categories.length === 0 ? (
                    <View style={s.eventOption}>
                      <Text style={[s.eventOptionText, { color: '#9CA3AF', fontStyle: 'italic' as const }]}>No categories created yet</Text>
                    </View>
                  ) : (
                    categories.map(cat => {
                      const isSelected = selectedCategoryIds.includes(cat.id);
                      return (
                        <TouchableOpacity
                          key={cat.id}
                          style={[s.eventOption, isSelected && { backgroundColor: cat.color + '0D' }]}
                          onPress={() => {
                            setSelectedCategoryIds(prev =>
                              isSelected ? prev.filter(id => id !== cat.id) : [...prev, cat.id]
                            );
                          }}
                        >
                          <View style={s.categoryOptionRow}>
                            <View style={[s.categoryDot, { backgroundColor: cat.color }]} />
                            <Text style={[s.eventOptionText, isSelected && { color: cat.color, fontWeight: '600' as const }]}>{cat.title}</Text>
                          </View>
                          {isSelected && <CheckCircle size={18} color={cat.color} />}
                        </TouchableOpacity>
                      );
                    })
                  )}
                </View>
              )}
            </View>

            <FormField label="Notes" value={formData.notes || ""} onChangeText={(t) => updateField("notes", t)} multiline />

            {showNewEventForm && (
              <View style={s.newEventForm}>
                <Text style={s.newEventTitle}>Create New Event</Text>
                <FormField label="Event Name" value={newEventName} onChangeText={setNewEventName} />
                <FormField label="Description (Optional)" value={newEventDescription} onChangeText={setNewEventDescription} multiline />
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                  <TouchableOpacity style={[s.saveBtn, { flex: 1 }]} onPress={handleCreateNewEvent}>
                    <Text style={s.saveBtnText}>Create</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.cancelBtn, { flex: 1 }]} onPress={() => { setShowNewEventForm(false); setNewEventName(""); setNewEventDescription(""); }}>
                    <Text style={s.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <Text style={s.requiredNote}>* Required: At least name or company</Text>

            <TouchableOpacity style={s.saveBtn} onPress={handleSave}>
              <CheckCircle size={20} color="#FFFFFF" />
              <Text style={s.saveBtnText}>Save Contact</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F6FAFE" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
  closeBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#1F2937" },
  content: { flexGrow: 1, padding: 16 },
  iconContainer: { alignItems: "center", marginBottom: 32 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#FFFFFF", justifyContent: "center", alignItems: "center", marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  subtitle: { fontSize: 16, color: "#6B7280", textAlign: "center" },
  formContainer: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: "600", color: "#4B5563", marginBottom: 8 },
  input: { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, padding: 16, fontSize: 16, color: "#1F2937", backgroundColor: "#F9FAFB" },
  textArea: { minHeight: 80, textAlignVertical: "top" },
  requiredNote: { fontSize: 12, color: "#9CA3AF", fontStyle: "italic", marginBottom: 24, textAlign: "center" },
  saveBtn: { backgroundColor: "#4128C5", flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 16, borderRadius: 12, gap: 8 },
  saveBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  cancelBtn: { backgroundColor: "#F3F4F6", padding: 16, borderRadius: 12, alignItems: "center" },
  cancelBtnText: { color: "#6B7280", fontSize: 16, fontWeight: "600" },
  eventSelector: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, padding: 16, backgroundColor: "#F9FAFB", gap: 12 },
  eventSelectorText: { flex: 1, fontSize: 16, color: "#1F2937" },
  eventPicker: { marginTop: 8, backgroundColor: "#FFFFFF", borderRadius: 8, borderWidth: 1, borderColor: "#E5E7EB", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  eventOption: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  eventOptionText: { fontSize: 16, color: "#374151" },
  selectedEventText: { color: "#4128C5", fontWeight: "600" },
  newEventForm: { backgroundColor: "#F8F9FF", borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: "#E0E7FF" },
  newEventTitle: { fontSize: 16, fontWeight: "600", color: "#1F2937", marginBottom: 16 },
  selectedCategoriesRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  categoryChip: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, gap: 6 },
  categoryChipText: { fontSize: 13, fontWeight: "500" },
  categoryDot: { width: 8, height: 8, borderRadius: 4 },
  categoryOptionRow: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
});
