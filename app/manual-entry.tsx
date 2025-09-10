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
import { X, CheckCircle, User, Calendar, ChevronDown, Plus } from "lucide-react-native";
import { useCards } from "@/providers/CardProvider";
import { useEvents } from "@/providers/EventProvider";
import { BusinessCard } from "@/types/card";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ManualEntryScreen() {
  const { addCard } = useCards();
  const { events, addEvent, getNonCategorizedEvent } = useEvents();
  const [formData, setFormData] = useState<Partial<BusinessCard>>({
    name: "",
    title: "",
    company: "",
    email: "",
    officePhone: "",
    cellPhone: "",
    faxPhone: "",
    website: "",
    linkedinUrl: "",
    notes: "",
    eventId: null,
    profilePhotoUrl: null,
  });
  const [showEventPicker, setShowEventPicker] = useState(false);
  const [showEventSelection, setShowEventSelection] = useState(false);
  const [showNewEventForm, setShowNewEventForm] = useState(false);
  const [newEventName, setNewEventName] = useState("");
  const [newEventDescription, setNewEventDescription] = useState("");
  const [pendingEventName, setPendingEventName] = useState<string | null>(null);

  const handleContinueToEventSelection = () => {
    if (!formData.name?.trim() && !formData.company?.trim()) {
      Alert.alert("Missing Information", "Please add at least a name or company.");
      return;
    }
    setShowEventSelection(true);
  };

  const handleEventSelectionComplete = () => {
    setShowEventSelection(false);
    handleSave();
  };

  const handleSave = () => {
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
    };

    addCard(newCard);

    Alert.alert("Success", "Business card saved successfully!", [
      { text: "OK", onPress: () => router.back() }
    ]);
  };

  const updateField = (field: keyof BusinessCard, value: string | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEventSelect = (eventId: string | null) => {
    setFormData(prev => ({ ...prev, eventId }));
    setShowEventPicker(false);
  };

  const handleCreateNewEvent = () => {
    if (!newEventName.trim()) {
      Alert.alert("Missing Information", "Please enter an event name.");
      return;
    }

    addEvent({
      name: newEventName.trim(),
      description: newEventDescription.trim() || null,
      color: "#4128C5", // Default color
    });

    setPendingEventName(newEventName.trim());
    setShowNewEventForm(false);
    setNewEventName("");
    setNewEventDescription("");
  };

  // Auto-select newly created event
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
    if (!formData.eventId) {
      const nonCategorized = getNonCategorizedEvent();
      return nonCategorized?.name || "Non-Categorized";
    }
    const event = events.find(e => e.id === formData.eventId);
    return event?.name || "Select Event";
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <X size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Contact Manually</Text>
          <View style={styles.headerRightSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {!showEventSelection ? (
            <>
              <View style={styles.iconContainer}>
                <View style={styles.iconCircle}>
                  <User size={32} color="#4128C5" />
                </View>
                <Text style={styles.subtitle}>Enter contact information manually</Text>
              </View>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.name || ""}
                onChangeText={(text) => updateField("name", text)}
                placeholder="Enter full name"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Job Title</Text>
              <TextInput
                style={styles.input}
                value={formData.title || ""}
                onChangeText={(text) => updateField("title", text)}
                placeholder="Enter job title"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Company *</Text>
              <TextInput
                style={styles.input}
                value={formData.company || ""}
                onChangeText={(text) => updateField("company", text)}
                placeholder="Enter company name"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                value={formData.email || ""}
                onChangeText={(text) => updateField("email", text)}
                placeholder="Enter email address"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Office Phone</Text>
              <TextInput
                style={styles.input}
                value={formData.officePhone || ""}
                onChangeText={(text) => updateField("officePhone", text)}
                placeholder="Enter office phone number"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Cell Phone</Text>
              <TextInput
                style={styles.input}
                value={formData.cellPhone || ""}
                onChangeText={(text) => updateField("cellPhone", text)}
                placeholder="Enter cell phone number"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Fax</Text>
              <TextInput
                style={styles.input}
                value={formData.faxPhone || ""}
                onChangeText={(text) => updateField("faxPhone", text)}
                placeholder="Enter fax number"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Website</Text>
              <TextInput
                style={styles.input}
                value={formData.website || ""}
                onChangeText={(text) => updateField("website", text)}
                placeholder="Enter website URL"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>LinkedIn Profile</Text>
              <TextInput
                style={styles.input}
                value={formData.linkedinUrl || ""}
                onChangeText={(text) => updateField("linkedinUrl", text)}
                placeholder="Enter LinkedIn profile URL"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Event</Text>
              <TouchableOpacity 
                style={styles.eventSelector}
                onPress={() => setShowEventPicker(!showEventPicker)}
              >
                <Calendar size={20} color="#6B7280" />
                <Text style={styles.eventSelectorText}>{getSelectedEventName()}</Text>
                <ChevronDown size={20} color="#6B7280" />
              </TouchableOpacity>
              
              {showEventPicker && (
                <View style={styles.eventPicker}>
                  <TouchableOpacity 
                    style={styles.eventOption}
                    onPress={() => handleEventSelect(null)}
                  >
                    <Text style={[
                      styles.eventOptionText,
                      !formData.eventId && styles.selectedEventText
                    ]}>
                      {getNonCategorizedEvent()?.name || "Non-Categorized"}
                    </Text>
                  </TouchableOpacity>
                  {events.filter(e => e.id !== "non-categorized").map(event => (
                    <TouchableOpacity 
                      key={event.id}
                      style={styles.eventOption}
                      onPress={() => handleEventSelect(event.id)}
                    >
                      <Text style={[
                        styles.eventOptionText,
                        formData.eventId === event.id && styles.selectedEventText
                      ]}>
                        {event.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.notes || ""}
                onChangeText={(text) => updateField("notes", text)}
                placeholder="Add any additional notes..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <Text style={styles.requiredNote}>* Required: At least name or company</Text>

            <TouchableOpacity 
              style={styles.saveButton}
              onPress={handleContinueToEventSelection}
            >
              <CheckCircle size={20} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
            </>
          ) : (
            <View style={styles.eventSelectionContainer}>
              <Text style={styles.eventSelectionTitle}>Select Event for this Contact</Text>
              <Text style={styles.eventSelectionSubtitle}>Choose which event this contact belongs to</Text>
              
              <View style={styles.eventSelectionList}>
                <TouchableOpacity 
                  style={[
                    styles.eventSelectionOption,
                    !formData.eventId && styles.selectedEventOption
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, eventId: null }))}
                >
                  <View style={[
                    styles.eventColorDot,
                    { backgroundColor: getNonCategorizedEvent()?.color || "#6B7280" }
                  ]} />
                  <View style={styles.eventSelectionInfo}>
                    <Text style={[
                      styles.eventSelectionName,
                      !formData.eventId && styles.selectedEventName
                    ]}>
                      {getNonCategorizedEvent()?.name || "Non-Categorized"}
                    </Text>
                    <Text style={styles.eventSelectionDescription}>
                      {getNonCategorizedEvent()?.description || "Cards without a specific event"}
                    </Text>
                  </View>
                  {!formData.eventId && (
                    <CheckCircle size={20} color="#4128C5" />
                  )}
                </TouchableOpacity>
                
                {events.filter(e => e.id !== "non-categorized").map(event => (
                  <TouchableOpacity 
                    key={event.id}
                    style={[
                      styles.eventSelectionOption,
                      formData.eventId === event.id && styles.selectedEventOption
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, eventId: event.id }))}
                  >
                    <View style={[
                      styles.eventColorDot,
                      { backgroundColor: event.color }
                    ]} />
                    <View style={styles.eventSelectionInfo}>
                      <Text style={[
                        styles.eventSelectionName,
                        formData.eventId === event.id && styles.selectedEventName
                      ]}>
                        {event.name}
                      </Text>
                      {event.description && (
                        <Text style={styles.eventSelectionDescription}>
                          {event.description}
                        </Text>
                      )}
                    </View>
                    {formData.eventId === event.id && (
                      <CheckCircle size={20} color="#4128C5" />
                    )}
                  </TouchableOpacity>
                ))}
                
                <TouchableOpacity 
                  style={styles.createNewEventOption}
                  onPress={() => setShowNewEventForm(true)}
                >
                  <View style={styles.createNewEventIcon}>
                    <Plus size={16} color="#4128C5" />
                  </View>
                  <Text style={styles.createNewEventText}>Create New Event</Text>
                </TouchableOpacity>
              </View>
              
              {showNewEventForm && (
                <View style={styles.newEventForm}>
                  <Text style={styles.newEventTitle}>Create New Event</Text>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Event Name</Text>
                    <TextInput
                      style={styles.input}
                      value={newEventName}
                      onChangeText={setNewEventName}
                      placeholder="Enter event name"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Description (Optional)</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={newEventDescription}
                      onChangeText={setNewEventDescription}
                      placeholder="Enter event description..."
                      placeholderTextColor="#9CA3AF"
                      multiline
                      numberOfLines={2}
                    />
                  </View>
                  <View style={styles.newEventButtons}>
                    <TouchableOpacity 
                      style={styles.createButton}
                      onPress={handleCreateNewEvent}
                    >
                      <Text style={styles.createButtonText}>Create Event</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.cancelNewEventButton}
                      onPress={() => {
                        setShowNewEventForm(false);
                        setNewEventName("");
                        setNewEventDescription("");
                      }}
                    >
                      <Text style={styles.cancelNewEventText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              
              <View style={styles.eventSelectionButtons}>
                <TouchableOpacity 
                  style={styles.continueButton}
                  onPress={handleEventSelectionComplete}
                >
                  <Text style={styles.continueButtonText}>Save Contact</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.backButton}
                  onPress={() => setShowEventSelection(false)}
                >
                  <Text style={styles.backButtonText}>Back to Edit</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6FAFE",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
  },
  headerRightSpacer: { width: 40 },
  content: {
    flexGrow: 1,
    padding: 16,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
  },
  formContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4B5563",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#1F2937",
    backgroundColor: "#F9FAFB",
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  requiredNote: {
    fontSize: 12,
    color: "#9CA3AF",
    fontStyle: "italic",
    marginBottom: 24,
    textAlign: "center",
  },
  saveButton: {
    backgroundColor: "#4128C5",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  eventSelector: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#F9FAFB",
    gap: 12,
  },
  eventSelectorText: {
    flex: 1,
    fontSize: 16,
    color: "#1F2937",
  },
  eventPicker: {
    marginTop: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  eventOptionText: {
    fontSize: 16,
    color: "#374151",
  },
  selectedEventText: {
    color: "#4128C5",
    fontWeight: "600",
  },
  eventSelectionContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    marginTop: 20,
  },
  eventSelectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 8,
  },
  eventSelectionSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
  },
  eventSelectionList: {
    marginBottom: 24,
  },
  eventSelectionOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: "#F9FAFB",
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedEventOption: {
    backgroundColor: "#F0F9FF",
    borderColor: "#4128C5",
  },
  eventColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  eventSelectionInfo: {
    flex: 1,
  },
  eventSelectionName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 2,
  },
  selectedEventName: {
    color: "#4128C5",
  },
  eventSelectionDescription: {
    fontSize: 14,
    color: "#6B7280",
  },
  createNewEventOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#F8F9FF",
    borderWidth: 2,
    borderColor: "#E0E7FF",
    borderStyle: "dashed",
  },
  createNewEventIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  createNewEventText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4128C5",
  },
  newEventForm: {
    backgroundColor: "#F8F9FF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E0E7FF",
  },
  newEventTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 16,
  },
  newEventButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  createButton: {
    flex: 1,
    backgroundColor: "#4128C5",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  cancelNewEventButton: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelNewEventText: {
    color: "#6B7280",
    fontSize: 14,
    fontWeight: "600",
  },
  eventSelectionButtons: {
    gap: 12,
  },
  continueButton: {
    backgroundColor: "#4128C5",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  backButton: {
    backgroundColor: "#F3F4F6",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  backButtonText: {
    color: "#6B7280",
    fontSize: 16,
    fontWeight: "600",
  },
});