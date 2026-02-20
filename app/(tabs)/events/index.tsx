import React, { useState, useMemo, useCallback, memo } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Platform,
  TextInput,
  Modal,
  KeyboardAvoidingView,
} from "react-native";
import { router } from "expo-router";
import {
  Plus,
  Calendar,
  Users,
  Trash2,
  Edit3,
  X,
  Check,
  FileSpreadsheet,
} from "lucide-react-native";
import { useEvents } from "@/providers/EventProvider";
import { useCards } from "@/providers/CardProvider";
import { Event } from "@/types/card";
import { SafeAreaView } from "react-native-safe-area-context";


type EventWithCount = Event & { cardCount: number };

type CreateEventModalProps = {
  visible: boolean;
  onClose: () => void;
  editingEvent: Event | null;
  eventName: string;
  setEventName: (t: string) => void;
  eventDescription: string;
  setEventDescription: (t: string) => void;
  onConfirm: () => void;
};

const CreateEventModal = memo(function CreateEventModal({
  visible,
  onClose,
  editingEvent,
  eventName,
  setEventName,
  eventDescription,
  setEventDescription,
  onConfirm,
}: CreateEventModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="none"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      transparent={false}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} testID="closeCreateEventModal" accessibilityLabel="Close create event">
            <X size={24} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.modalTitle} testID="createEventTitle">
            {editingEvent ? "Edit Event" : "Create Event"}
          </Text>
          <TouchableOpacity onPress={onConfirm} testID="confirmCreateEventModal" accessibilityLabel="Save event">
            <Check size={24} color="#4F46E5" />
          </TouchableOpacity>
        </View>
        <KeyboardAvoidingView
          style={styles.modalContent}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Event Name</Text>
            <TextInput
              style={styles.textInput}
              value={eventName}
              onChangeText={setEventName}
              placeholder="Enter event name"
              placeholderTextColor="#9CA3AF"
              autoFocus
              testID="eventNameInput"
              returnKeyType="done"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description (Optional)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={eventDescription}
              onChangeText={setEventDescription}
              placeholder="Enter event description"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              testID="eventDescriptionInput"
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
});

export default function EventsScreen() {
  const { events, deleteEvent, addEvent, updateEvent, refetch } = useEvents();
  const { cards } = useCards();

  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [eventName, setEventName] = useState<string>("");
  const [eventDescription, setEventDescription] = useState<string>("");

  const isModalVisible = showCreateModal || editingEvent !== null;

  const eventsWithCounts = useMemo<EventWithCount[]>(() => {
    return events.map((event) => ({
      ...event,
      cardCount: cards.filter(
        (card) => card.eventId === event.id || (card.eventId === null && event.id === "non-categorized")
      ).length,
    }));
  }, [events, cards]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const handleDelete = useCallback(
    (event: Event) => {
      if (event.id === "non-categorized") {
        Alert.alert("Cannot Delete", "The Non-Categorized event cannot be deleted.");
        return;
      }
      Alert.alert(
        "Delete Event",
        `Are you sure you want to delete "${event.name}"? All cards in this event will be moved to Non-Categorized.`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: () => deleteEvent(event.id) },
        ]
      );
    },
    [deleteEvent]
  );

  const closeModal = useCallback(() => {
    setEventName("");
    setEventDescription("");
    setShowCreateModal(false);
    setEditingEvent(null);
  }, []);

  const handleCreateEvent = useCallback(() => {
    if (!eventName.trim()) {
      Alert.alert("Error", "Please enter an event name.");
      return;
    }
    addEvent({ name: eventName.trim(), description: eventDescription.trim() || null, color: "#4F46E5" });
    closeModal();
  }, [addEvent, closeModal, eventDescription, eventName]);

  const handleUpdateEvent = useCallback(() => {
    if (!editingEvent || !eventName.trim()) {
      Alert.alert("Error", "Please enter an event name.");
      return;
    }
    updateEvent(editingEvent.id, { name: eventName.trim(), description: eventDescription.trim() || null });
    closeModal();
  }, [closeModal, editingEvent, eventDescription, eventName, updateEvent]);

  const openEditModal = useCallback((event: Event) => {
    if (event.id === "non-categorized") {
      Alert.alert("Cannot Edit", "The Non-Categorized event cannot be edited.");
      return;
    }
    setEventName(event.name);
    setEventDescription(event.description ?? "");
    setEditingEvent(event);
  }, []);

  const handleEventPress = useCallback((event: Event) => {
    router.push({ pathname: '/event-details' as any, params: { eventId: event.id } });
  }, []);

  const renderEvent = useCallback(
    ({ item }: { item: EventWithCount }) => (
      <TouchableOpacity
        style={[styles.eventCard, { borderLeftColor: item.color }]}
        onPress={() => handleEventPress(item)}
        activeOpacity={0.7}
        testID={`eventCard-${item.id}`}
      >
        <View style={styles.eventContent}>
          <View style={styles.eventHeader}>
            <View style={[styles.eventIcon, { backgroundColor: item.color + "20" }]}>
              <Calendar size={24} color={item.color} />
            </View>
            <View style={styles.eventInfo}>
              <Text style={styles.eventName}>{item.name}</Text>
              {item.description ? (
                <Text style={styles.eventDescription} numberOfLines={2}>{item.description}</Text>
              ) : null}
              <View style={styles.eventStats}>
                <Users size={14} color="#9CA3AF" />
                <Text style={styles.eventCount}>
                  {item.cardCount} {item.cardCount === 1 ? "contact" : "contacts"}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.eventActions}>
            {item.id !== "non-categorized" ? (
              <>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => openEditModal(item)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  testID={`editEvent-${item.id}`}
                >
                  <Edit3 size={18} color="#6B7280" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDelete(item)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  testID={`deleteEvent-${item.id}`}
                >
                  <Trash2 size={18} color="#EF4444" />
                </TouchableOpacity>
              </>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    ),
    [handleDelete, handleEventPress, openEditModal]
  );

  const keyExtractor = useCallback((item: EventWithCount) => item.id, []);

  const EmptyState = memo(function EmptyState() {
    return (
      <View style={styles.emptyState}>
        <Calendar size={64} color="#D1D5DB" />
        <Text style={styles.emptyTitle}>No events yet</Text>
        <Text style={styles.emptyText}>Create your first event to organize your business cards</Text>
      </View>
    );
  });

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <FlatList
        data={eventsWithCounts}
        renderItem={renderEvent}
        keyExtractor={keyExtractor}
        contentContainerStyle={[
          styles.listContent,
          eventsWithCounts.length === 0 ? styles.emptyListContent : null,
        ]}
        ListHeaderComponent={
          <TouchableOpacity
              style={styles.exportButton}
              onPress={() => router.push('/export' as any)}
              activeOpacity={0.7}
              testID="exportDataButton"
            >
              <View style={styles.exportIcon}>
                <FileSpreadsheet size={20} color="#4128C5" />
              </View>
              <Text style={styles.exportText}>Export Your Data</Text>
            </TouchableOpacity>
        }
        ListEmptyComponent={<EmptyState />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#4128C5" />}
        keyboardShouldPersistTaps="handled"
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowCreateModal(true)}
        activeOpacity={0.8}
        testID="openCreateEventModal"
      >
        <Plus size={28} color="#FFFFFF" />
      </TouchableOpacity>

      <CreateEventModal
        visible={isModalVisible}
        onClose={closeModal}
        editingEvent={editingEvent}
        eventName={eventName}
        setEventName={setEventName}
        eventDescription={eventDescription}
        setEventDescription={setEventDescription}
        onConfirm={editingEvent ? handleUpdateEvent : handleCreateEvent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6FAFE",
  },

  listContent: {
    padding: 16,
  },

  emptyListContent: {
    flex: 1,
  },

  eventCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },

  eventContent: {
    padding: 16,
  },
  eventHeader: {
    flexDirection: "row",
    marginBottom: 12,
  },
  eventIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  eventInfo: {
    flex: 1,
  },
  eventName: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#1F2937",
    marginBottom: 4,
  },
  eventDescription: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
  },
  eventStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  eventCount: {
    fontSize: 13,
    color: "#9CA3AF",
  },
  eventActions: {
    position: "absolute",
    top: 16,
    right: 16,
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: "#4B5563",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: "#9CA3AF",
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 24 : 16,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#4128C5",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#1F2937",
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "500" as const,
    color: "#374151",
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1F2937",
    backgroundColor: "#FFFFFF",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  exportButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  exportIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  exportText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#1F2937",
  },
});
