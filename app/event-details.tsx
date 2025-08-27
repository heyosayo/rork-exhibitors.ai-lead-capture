import React, { useState, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  TextInput,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { 
  Search, 
  User, 
  Building, 
  Mail, 
  Phone, 
  Trash2,
  ArrowLeft,
} from "lucide-react-native";
import { useEvents } from "@/providers/EventProvider";
import { useCards } from "@/providers/CardProvider";
import { BusinessCard } from "@/types/card";
import { SafeAreaView } from "react-native-safe-area-context";

export default function EventDetailsScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const { getEventById } = useEvents();
  const { cards, deleteCard, refetch } = useCards();
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const event = getEventById(eventId);

  const eventCards = useMemo(() => {
    const filtered = cards.filter(card => 
      card.eventId === eventId || 
      (card.eventId === null && eventId === "non-categorized")
    );

    if (!searchQuery.trim()) return filtered;
    
    const query = searchQuery.toLowerCase();
    return filtered.filter(card => 
      card.name?.toLowerCase().includes(query) ||
      card.company?.toLowerCase().includes(query) ||
      card.email?.toLowerCase().includes(query) ||
      card.phone?.toLowerCase().includes(query)
    );
  }, [cards, eventId, searchQuery]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleDelete = (card: BusinessCard) => {
    Alert.alert(
      "Delete Card",
      `Are you sure you want to delete ${card.name || 'this card'}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => deleteCard(card.id)
        }
      ]
    );
  };

  const renderCard = ({ item }: { item: BusinessCard }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => router.push(`/card/${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            <User size={24} color="#6B7280" />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardName}>{item.name || "No Name"}</Text>
            {item.title && <Text style={styles.cardTitle}>{item.title}</Text>}
            {item.company && (
              <View style={styles.infoRow}>
                <Building size={14} color="#9CA3AF" />
                <Text style={styles.cardCompany}>{item.company}</Text>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.cardDetails}>
          {item.email && (
            <View style={styles.detailRow}>
              <Mail size={14} color="#9CA3AF" />
              <Text style={styles.detailText} numberOfLines={1}>{item.email}</Text>
            </View>
          )}
          {item.phone && (
            <View style={styles.detailRow}>
              <Phone size={14} color="#9CA3AF" />
              <Text style={styles.detailText}>{item.phone}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => handleDelete(item)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Trash2 size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <User size={64} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>No contacts in this event</Text>
      <Text style={styles.emptyText}>
        Add contacts to this event from the Cards tab
      </Text>
    </View>
  );

  if (!event) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorState}>
          <Text style={styles.errorText}>Event not found</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={[styles.header, { backgroundColor: event.color }]}>
        <TouchableOpacity 
          style={styles.headerBackButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{event.name}</Text>
          {event.description && (
            <Text style={styles.headerDescription}>{event.description}</Text>
          )}
          <Text style={styles.headerCount}>
            {eventCards.length} {eventCards.length === 1 ? 'contact' : 'contacts'}
          </Text>
        </View>
      </View>
      
      <View style={styles.searchContainer}>
        <Search size={20} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search contacts..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <FlatList
        data={eventCards}
        renderItem={renderCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          eventCards.length === 0 && styles.emptyListContent
        ]}
        ListEmptyComponent={<EmptyState />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#4128C5"
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6FAFE",
  },
  header: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  headerBackButton: {
    marginRight: 16,
    padding: 4,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  headerDescription: {
    fontSize: 16,
    color: "#FFFFFF",
    opacity: 0.9,
    marginBottom: 4,
  },
  headerCount: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.8,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    margin: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: "#1F2937",
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  emptyListContent: {
    flex: 1,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 2,
  },
  cardTitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cardCompany: {
    fontSize: 14,
    color: "#4B5563",
  },
  cardDetails: {
    gap: 6,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: "#6B7280",
    flex: 1,
  },
  deleteButton: {
    position: "absolute",
    top: 16,
    right: 16,
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
    fontWeight: "600",
    color: "#4B5563",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: "#9CA3AF",
    textAlign: "center",
  },
  errorState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 18,
    color: "#EF4444",
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: "#4128C5",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
});