import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Linking,
  Image,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Edit2, Save, X, Mail, Phone, Globe, Building, User, Calendar, ChevronDown, Clock, Search } from "lucide-react-native";
import { useCards } from "@/providers/CardProvider";
import { useEvents } from "@/providers/EventProvider";
import { BusinessCard } from "@/types/card";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CardDetailScreen() {
  const { id } = useLocalSearchParams();
  const { cards, updateCard, searchMissingContactInfo } = useCards();
  const { events, getEventById, getNonCategorizedEvent } = useEvents();
  const card = cards.find(c => c.id === id);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedCard, setEditedCard] = useState<Partial<BusinessCard>>(card || {});
  const [showEventPicker, setShowEventPicker] = useState(false);
  const [isSearchingInfo, setIsSearchingInfo] = useState(false);

  if (!card) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Card not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleSave = () => {
    updateCard(id as string, editedCard);
    setIsEditing(false);
    Alert.alert("Success", "Contact updated successfully!");
  };

  const handleCancel = () => {
    setEditedCard(card);
    setIsEditing(false);
  };

  const handleSearchMissingInfo = async () => {
    if (!card) return;
    
    setIsSearchingInfo(true);
    try {
      const foundInfo = await searchMissingContactInfo(card);
      
      if (foundInfo.email || foundInfo.officePhone || foundInfo.cellPhone || foundInfo.faxPhone) {
        const updates: Partial<BusinessCard> = {};
        if (foundInfo.email) updates.email = foundInfo.email;
        if (foundInfo.officePhone) updates.officePhone = foundInfo.officePhone;
        if (foundInfo.cellPhone) updates.cellPhone = foundInfo.cellPhone;
        if (foundInfo.faxPhone) updates.faxPhone = foundInfo.faxPhone;
        
        updateCard(id as string, updates);
        
        const foundItems: string[] = [];
        if (foundInfo.email) foundItems.push('email');
        if (foundInfo.officePhone) foundItems.push('office phone');
        if (foundInfo.cellPhone) foundItems.push('cell phone');
        if (foundInfo.faxPhone) foundItems.push('fax');
        
        Alert.alert(
          "Information Found!", 
          `Found missing ${foundItems.join(', ')} for this contact.`
        );
      } else {
        Alert.alert(
          "No Additional Info Found", 
          "Could not find additional contact information for this person."
        );
      }
    } catch (error) {
      console.error('Error searching for missing info:', error);
      Alert.alert(
        "Search Failed", 
        "There was an error searching for contact information. Please try again."
      );
    } finally {
      setIsSearchingInfo(false);
    }
  };

  const handleLinkedInPress = async (linkedinUrl: string) => {
    try {
      console.log('Attempting to open LinkedIn URL:', linkedinUrl);
      
      // Validate URL format
      if (!linkedinUrl || (!linkedinUrl.startsWith('http://') && !linkedinUrl.startsWith('https://'))) {
        console.error('Invalid LinkedIn URL format:', linkedinUrl);
        Alert.alert('Error', 'Invalid LinkedIn URL format');
        return;
      }
      
      // For web platform, always use web browser
      if (Platform.OS === 'web') {
        try {
          window.open(linkedinUrl, '_blank');
          return;
        } catch (webError) {
          console.error('Error opening LinkedIn on web:', webError);
          Alert.alert('Error', 'Unable to open LinkedIn profile');
          return;
        }
      }
      
      // For mobile platforms, try to open directly in browser first
      // LinkedIn app deep linking can be unreliable
      try {
        console.log('Opening LinkedIn URL in browser:', linkedinUrl);
        const supported = await Linking.canOpenURL(linkedinUrl);
        
        if (supported) {
          await Linking.openURL(linkedinUrl);
        } else {
          throw new Error('URL not supported');
        }
      } catch (error) {
        console.error('Error opening LinkedIn URL:', error);
        Alert.alert(
          'Error Opening LinkedIn', 
          'Unable to open LinkedIn profile. Please check your internet connection and try again.'
        );
      }
    } catch (error) {
      console.error('Error in handleLinkedInPress:', error);
      Alert.alert(
        'Error', 
        'Unable to open LinkedIn profile. Please try again later.'
      );
    }
  };

  const updateField = (field: keyof BusinessCard, value: string | null) => {
    setEditedCard(prev => ({ ...prev, [field]: value || null }));
  };

  const handleEventSelect = (eventId: string | null) => {
    setEditedCard(prev => ({ ...prev, eventId }));
    setShowEventPicker(false);
  };

  const getSelectedEventName = () => {
    const eventId = isEditing ? editedCard.eventId : card.eventId;
    if (!eventId) {
      const nonCategorized = getNonCategorizedEvent();
      return nonCategorized?.name || "Non-Categorized";
    }
    const event = getEventById(eventId);
    return event?.name || "Unknown Event";
  };

  const getCurrentEvent = () => {
    const eventId = card.eventId;
    return getEventById(eventId);
  };

  const DetailRow = ({ 
    icon, 
    label, 
    value, 
    field 
  }: { 
    icon: React.ReactNode; 
    label: string; 
    value?: string | null;
    field: keyof BusinessCard;
  }) => (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>{icon}</View>
      <View style={styles.detailContent}>
        <Text style={styles.detailLabel}>{label}</Text>
        {isEditing ? (
          <TextInput
            style={styles.detailInput}
            value={editedCard[field] as string || ""}
            onChangeText={(text) => updateField(field, text)}
            placeholder={`Enter ${label.toLowerCase()}`}
            placeholderTextColor="#9CA3AF"
            multiline={field === "notes"}
            numberOfLines={field === "notes" ? 2 : 1}
          />
        ) : (
          <Text style={styles.detailValue}>
            {value || `No ${label.toLowerCase()}`}
          </Text>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.headerCard}>
            <View style={styles.avatar}>
              {card.profilePhotoUrl ? (
                <Image 
                  source={{ uri: card.profilePhotoUrl }}
                  style={styles.avatarImage}
                  defaultSource={require('@/assets/images/icon.png')}
                />
              ) : (
                <User size={48} color="#6B7280" />
              )}
            </View>
            {isEditing ? (
              <TextInput
                style={styles.nameInput}
                value={editedCard.name || ""}
                onChangeText={(text) => updateField("name", text)}
                placeholder="Enter name"
                placeholderTextColor="#9CA3AF"
              />
            ) : (
              <Text style={styles.name}>{card.name || "No Name"}</Text>
            )}
            {isEditing ? (
              <TextInput
                style={styles.titleInput}
                value={editedCard.title || ""}
                onChangeText={(text) => updateField("title", text)}
                placeholder="Enter title"
                placeholderTextColor="#9CA3AF"
              />
            ) : (
              card.title && <Text style={styles.title}>{card.title}</Text>
            )}
          </View>

          <View style={styles.detailsCard}>
            <DetailRow
              icon={<Building size={20} color="#6B7280" />}
              label="Company"
              value={card.company}
              field="company"
            />
            <DetailRow
              icon={<Mail size={20} color="#6B7280" />}
              label="Email"
              value={card.email}
              field="email"
            />
            <DetailRow
              icon={<Phone size={20} color="#6B7280" />}
              label="Office Phone"
              value={card.officePhone}
              field="officePhone"
            />
            <DetailRow
              icon={<Phone size={20} color="#6B7280" />}
              label="Cell Phone"
              value={card.cellPhone}
              field="cellPhone"
            />
            <DetailRow
              icon={<Phone size={20} color="#6B7280" />}
              label="Fax"
              value={card.faxPhone}
              field="faxPhone"
            />
            <DetailRow
              icon={<Globe size={20} color="#6B7280" />}
              label="Website"
              value={card.website}
              field="website"
            />
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <View style={styles.linkedinIconDetail}>
                  <Text style={styles.linkedinIconText}>in</Text>
                </View>
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>LinkedIn</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.detailInput}
                    value={editedCard.linkedinUrl as string || ""}
                    onChangeText={(text) => updateField("linkedinUrl", text)}
                    placeholder="Enter LinkedIn URL"
                    placeholderTextColor="#9CA3AF"
                  />
                ) : (
                  <View style={styles.linkedinContainer}>
                    {card.linkedinUrl ? (
                      <TouchableOpacity 
                        onPress={() => handleLinkedInPress(card.linkedinUrl!)}
                        style={styles.linkedinLink}
                      >
                        <Text style={styles.linkedinLinkText}>View LinkedIn Profile</Text>
                      </TouchableOpacity>
                    ) : (
                      <Text style={styles.detailValue}>No LinkedIn profile</Text>
                    )}
                  </View>
                )}
              </View>
            </View>
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Clock size={20} color="#6B7280" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Added</Text>
                <Text style={styles.detailValue}>
                  {new Date(card.createdAt).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.eventCard}>
            <View style={styles.eventHeader}>
              <Calendar size={20} color="#6B7280" />
              <Text style={styles.eventTitle}>Event</Text>
            </View>
            {isEditing ? (
              <View style={styles.eventSelector}>
                <TouchableOpacity 
                  style={styles.eventSelectorButton}
                  onPress={() => setShowEventPicker(!showEventPicker)}
                >
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
                        !editedCard.eventId && styles.selectedEventText
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
                          editedCard.eventId === event.id && styles.selectedEventText
                        ]}>
                          {event.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.eventDisplay}>
                <View style={[
                  styles.eventBadge, 
                  { backgroundColor: getCurrentEvent()?.color + '20' || '#6B728020' }
                ]}>
                  <Text style={[
                    styles.eventBadgeText,
                    { color: getCurrentEvent()?.color || '#6B7280' }
                  ]}>
                    {getSelectedEventName()}
                  </Text>
                </View>
              </View>
            )}
          </View>

          <View style={styles.notesCard}>
            <Text style={styles.notesTitle}>Notes</Text>
            {isEditing ? (
              <TextInput
                style={styles.notesInput}
                value={editedCard.notes || ""}
                onChangeText={(text) => updateField("notes", text)}
                placeholder="Add notes..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
              />
            ) : (
              <Text style={styles.notesText}>{card.notes || "No notes"}</Text>
            )}
          </View>

          <View style={styles.actionButtons}>
            {isEditing ? (
              <>
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                  <Save size={20} color="#FFFFFF" />
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                  <X size={20} color="#6B7280" />
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
                  <Edit2 size={20} color="#FFFFFF" />
                  <Text style={styles.editButtonText}>Edit Contact</Text>
                </TouchableOpacity>
                {(!card.email || (!card.officePhone && !card.cellPhone && !card.faxPhone)) && (
                  <TouchableOpacity 
                    style={[styles.searchButton, isSearchingInfo && styles.searchButtonDisabled]} 
                    onPress={handleSearchMissingInfo}
                    disabled={isSearchingInfo}
                  >
                    <Search size={20} color={isSearchingInfo ? "#9CA3AF" : "#4F46E5"} />
                    <Text style={[styles.searchButtonText, isSearchingInfo && styles.searchButtonTextDisabled]}>
                      {isSearchingInfo ? "Searching..." : "Find Missing Info"}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  content: {
    padding: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 18,
    color: "#6B7280",
  },
  headerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    overflow: "hidden",
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  name: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  nameInput: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1F2937",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingVertical: 4,
    marginBottom: 8,
    textAlign: "center",
    minWidth: 200,
  },
  title: {
    fontSize: 16,
    color: "#6B7280",
  },
  titleInput: {
    fontSize: 16,
    color: "#6B7280",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingVertical: 4,
    textAlign: "center",
    minWidth: 200,
  },
  detailsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 20,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 16,
    color: "#1F2937",
  },
  detailInput: {
    fontSize: 16,
    color: "#1F2937",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingVertical: 4,
  },
  notesCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  notesText: {
    fontSize: 16,
    color: "#1F2937",
    lineHeight: 22,
  },
  notesInput: {
    fontSize: 16,
    color: "#1F2937",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    textAlignVertical: "top",
  },
  actionButtons: {
    gap: 12,
    marginTop: 8,
  },
  editButton: {
    backgroundColor: "#4F46E5",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  editButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: "#10B981",
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
  cancelButton: {
    backgroundColor: "#F3F4F6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  cancelButtonText: {
    color: "#6B7280",
    fontSize: 16,
    fontWeight: "600",
  },
  eventCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  eventHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  eventSelector: {
    position: "relative",
  },
  eventSelectorButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
  },
  eventSelectorText: {
    fontSize: 16,
    color: "#1F2937",
  },
  eventPicker: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    marginTop: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
    maxHeight: 200,
  },
  eventOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  eventOptionText: {
    fontSize: 16,
    color: "#1F2937",
  },
  selectedEventText: {
    color: "#4F46E5",
    fontWeight: "600",
  },
  eventDisplay: {
    alignItems: "flex-start",
  },
  eventBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "transparent",
  },
  eventBadgeText: {
    fontSize: 14,
    fontWeight: "500",
  },
  linkedinIconDetail: {
    width: 20,
    height: 20,
    borderRadius: 3,
    backgroundColor: "#0077B5",
    justifyContent: "center",
    alignItems: "center",
  },
  linkedinIconText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  linkedinContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  linkedinLink: {
    paddingVertical: 4,
  },
  linkedinLinkText: {
    fontSize: 16,
    color: "#0077B5",
    textDecorationLine: "underline",
  },
  searchButton: {
    backgroundColor: "#F8FAFC",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  searchButtonDisabled: {
    backgroundColor: "#F1F5F9",
    borderColor: "#E2E8F0",
  },
  searchButtonText: {
    color: "#4F46E5",
    fontSize: 16,
    fontWeight: "600",
  },
  searchButtonTextDisabled: {
    color: "#9CA3AF",
  },
});