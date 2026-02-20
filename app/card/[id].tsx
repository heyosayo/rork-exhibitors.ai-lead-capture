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
import { Edit2, Save, X, Mail, Phone, Globe, Building, User, Calendar, ChevronDown, Clock, Search, Tag, Plus } from "lucide-react-native";
import { useCards } from "@/providers/CardProvider";
import { useEvents } from "@/providers/EventProvider";
import { useLeadCategories } from "@/providers/LeadCategoryProvider";
import { BusinessCard } from "@/types/card";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CardDetailScreen() {
  const { id } = useLocalSearchParams();
  const { cards, updateCard, searchMissingContactInfo } = useCards();
  const { events, getEventById, getNonCategorizedEvent } = useEvents();
  const { categories, getCategoriesForCard } = useLeadCategories();
  const card = cards.find(c => c.id === id);
  const [isEditing, setIsEditing] = useState(false);
  const [editedCard, setEditedCard] = useState<Partial<BusinessCard>>(card || {});
  const [showEventPicker, setShowEventPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [isSearchingInfo, setIsSearchingInfo] = useState(false);

  if (!card) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.errorContainer}><Text style={s.errorText}>Card not found</Text></View>
      </SafeAreaView>
    );
  }

  const handleSave = () => {
    updateCard(id as string, editedCard);
    setIsEditing(false);
    Alert.alert("Success", "Contact updated successfully!");
  };

  const handleCancel = () => { setEditedCard(card); setIsEditing(false); };

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
        const items: string[] = [];
        if (foundInfo.email) items.push('email');
        if (foundInfo.officePhone) items.push('office phone');
        if (foundInfo.cellPhone) items.push('cell phone');
        if (foundInfo.faxPhone) items.push('fax');
        Alert.alert("Information Found!", `Found missing ${items.join(', ')}.`);
      } else {
        Alert.alert("No Additional Info Found", "Could not find additional contact information.");
      }
    } catch (error) {
      console.error('Error searching for missing info:', error);
      Alert.alert("Search Failed", "There was an error searching for contact information.");
    } finally {
      setIsSearchingInfo(false);
    }
  };

  const handleLinkedInPress = async (linkedinUrl: string) => {
    try {
      if (!linkedinUrl || (!linkedinUrl.startsWith('http://') && !linkedinUrl.startsWith('https://'))) {
        Alert.alert('Error', 'Invalid LinkedIn URL format');
        return;
      }
      if (Platform.OS === 'web') {
        try { window.open(linkedinUrl, '_blank'); } catch { Alert.alert('Error', 'Unable to open LinkedIn profile'); }
        return;
      }
      const supported = await Linking.canOpenURL(linkedinUrl);
      if (supported) { await Linking.openURL(linkedinUrl); }
      else { Alert.alert('Error Opening LinkedIn', 'Unable to open LinkedIn profile.'); }
    } catch (error) {
      console.error('Error in handleLinkedInPress:', error);
      Alert.alert('Error', 'Unable to open LinkedIn profile.');
    }
  };

  const updateField = (field: keyof BusinessCard, value: string | null) => {
    setEditedCard(prev => ({ ...prev, [field]: value || null }));
  };

  const handleEventSelect = (eventId: string | null) => {
    setEditedCard(prev => ({ ...prev, eventId }));
    setShowEventPicker(false);
  };

  const toggleCategory = (categoryId: string) => {
    const currentIds = editedCard.categoryIds || card?.categoryIds || [];
    const newIds = currentIds.includes(categoryId)
      ? currentIds.filter((id: string) => id !== categoryId)
      : [...currentIds, categoryId];
    setEditedCard(prev => ({ ...prev, categoryIds: newIds }));
  };

  const toggleCategoryDirect = (categoryId: string) => {
    if (!card) return;
    const currentIds = card.categoryIds || [];
    const newIds = currentIds.includes(categoryId)
      ? currentIds.filter((cid: string) => cid !== categoryId)
      : [...currentIds, categoryId];
    updateCard(id as string, { categoryIds: newIds });
  };

  const cardCategories = getCategoriesForCard(card?.categoryIds || []);

  const getSelectedEventName = () => {
    const eventId = isEditing ? editedCard.eventId : card.eventId;
    if (!eventId) return getNonCategorizedEvent()?.name || "Non-Categorized";
    return getEventById(eventId)?.name || "Unknown Event";
  };

  const getCurrentEvent = () => getEventById(card.eventId);

  return (
    <SafeAreaView style={s.container} edges={['bottom']}>
      <KeyboardAvoidingView style={s.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          <View style={s.headerCard}>
            <View style={s.avatar}>
              {card.profilePhotoUrl ? (
                <Image source={{ uri: card.profilePhotoUrl }} style={s.avatarImage} defaultSource={require('@/assets/images/icon.png')} />
              ) : (
                <User size={48} color="#6B7280" />
              )}
            </View>
            {isEditing ? (
              <TextInput style={s.nameInput} value={editedCard.name || ""} onChangeText={(t) => updateField("name", t)} placeholder="Enter name" placeholderTextColor="#9CA3AF" />
            ) : (
              <Text style={s.name}>{card.name || "No Name"}</Text>
            )}
            {isEditing ? (
              <TextInput style={s.titleInput} value={editedCard.title || ""} onChangeText={(t) => updateField("title", t)} placeholder="Enter title" placeholderTextColor="#9CA3AF" />
            ) : (
              card.title ? <Text style={s.title}>{card.title}</Text> : null
            )}
          </View>

          <View style={s.detailsCard}>
            <DetailRow icon={<Building size={20} color="#6B7280" />} label="Company" value={card.company} field="company" isEditing={isEditing} editedCard={editedCard} updateField={updateField} />
            <DetailRow icon={<Mail size={20} color="#6B7280" />} label="Email" value={card.email} field="email" isEditing={isEditing} editedCard={editedCard} updateField={updateField} />
            <DetailRow icon={<Phone size={20} color="#6B7280" />} label="Office Phone" value={card.officePhone} field="officePhone" isEditing={isEditing} editedCard={editedCard} updateField={updateField} />
            <DetailRow icon={<Phone size={20} color="#6B7280" />} label="Cell Phone" value={card.cellPhone} field="cellPhone" isEditing={isEditing} editedCard={editedCard} updateField={updateField} />
            <DetailRow icon={<Phone size={20} color="#6B7280" />} label="Fax" value={card.faxPhone} field="faxPhone" isEditing={isEditing} editedCard={editedCard} updateField={updateField} />
            <DetailRow icon={<Globe size={20} color="#6B7280" />} label="Website" value={card.website} field="website" isEditing={isEditing} editedCard={editedCard} updateField={updateField} />
            <View style={s.detailRow}>
              <View style={s.detailIcon}>
                <View style={s.linkedinBadge}><Text style={s.linkedinBadgeText}>in</Text></View>
              </View>
              <View style={s.detailContent}>
                <Text style={s.detailLabel}>LinkedIn</Text>
                {isEditing ? (
                  <TextInput style={s.detailInput} value={editedCard.linkedinUrl as string || ""} onChangeText={(t) => updateField("linkedinUrl", t)} placeholder="Enter LinkedIn URL" placeholderTextColor="#9CA3AF" />
                ) : card.linkedinUrl ? (
                  <TouchableOpacity onPress={() => handleLinkedInPress(card.linkedinUrl!)}><Text style={s.linkedinLink}>View LinkedIn Profile</Text></TouchableOpacity>
                ) : (
                  <Text style={s.detailValue}>No LinkedIn profile</Text>
                )}
              </View>
            </View>
            <View style={s.detailRow}>
              <View style={s.detailIcon}><Clock size={20} color="#6B7280" /></View>
              <View style={s.detailContent}>
                <Text style={s.detailLabel}>Added</Text>
                <Text style={s.detailValue}>
                  {new Date(card.createdAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>
          </View>

          <View style={s.eventCard}>
            <View style={s.eventHeader}><Calendar size={20} color="#6B7280" /><Text style={s.eventTitle}>Event</Text></View>
            {isEditing ? (
              <View>
                <TouchableOpacity style={s.eventSelectorBtn} onPress={() => setShowEventPicker(!showEventPicker)}>
                  <Text style={s.eventSelectorText}>{getSelectedEventName()}</Text>
                  <ChevronDown size={20} color="#6B7280" />
                </TouchableOpacity>
                {showEventPicker && (
                  <View style={s.eventPicker}>
                    <TouchableOpacity style={s.eventOption} onPress={() => handleEventSelect(null)}>
                      <Text style={[s.eventOptionText, !editedCard.eventId && s.selectedEvText]}>{getNonCategorizedEvent()?.name || "Non-Categorized"}</Text>
                    </TouchableOpacity>
                    {events.filter(e => e.id !== "non-categorized").map(event => (
                      <TouchableOpacity key={event.id} style={s.eventOption} onPress={() => handleEventSelect(event.id)}>
                        <Text style={[s.eventOptionText, editedCard.eventId === event.id && s.selectedEvText]}>{event.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            ) : (
              <View style={{ alignItems: "flex-start" }}>
                <View style={[s.eventBadge, { backgroundColor: (getCurrentEvent()?.color || '#6B7280') + '20' }]}>
                  <Text style={[s.eventBadgeText, { color: getCurrentEvent()?.color || '#6B7280' }]}>{getSelectedEventName()}</Text>
                </View>
              </View>
            )}
          </View>

          <View style={s.eventCard}>
            <View style={s.eventHeader}><Tag size={20} color="#6B7280" /><Text style={s.eventTitle}>Lead Categories</Text></View>
            <View style={s.categoryBadgesWrap}>
              {(isEditing ? getCategoriesForCard(editedCard.categoryIds || card?.categoryIds || []) : cardCategories).map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[s.catBadge, { backgroundColor: cat.color + '20' }]}
                  onPress={() => isEditing ? toggleCategory(cat.id) : toggleCategoryDirect(cat.id)}
                  activeOpacity={0.7}
                >
                  <View style={[s.catBadgeDot, { backgroundColor: cat.color }]} />
                  <Text style={[s.catBadgeText, { color: cat.color }]}>{cat.title}</Text>
                  {isEditing && <X size={12} color={cat.color} />}
                </TouchableOpacity>
              ))}
              {(isEditing || cardCategories.length === 0) && (
                <TouchableOpacity
                  style={s.addCatBtn}
                  onPress={() => setShowCategoryPicker(!showCategoryPicker)}
                  activeOpacity={0.7}
                >
                  <Plus size={14} color="#6B7280" />
                  <Text style={s.addCatBtnText}>Add</Text>
                </TouchableOpacity>
              )}
              {!isEditing && cardCategories.length === 0 && (
                <Text style={{ fontSize: 14, color: '#9CA3AF' }}>No categories assigned</Text>
              )}
            </View>
            {showCategoryPicker && (
              <View style={s.catPickerWrap}>
                {categories.filter(c => {
                  const ids = isEditing ? (editedCard.categoryIds || card?.categoryIds || []) : (card?.categoryIds || []);
                  return !ids.includes(c.id);
                }).map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    style={s.catPickerItem}
                    onPress={() => {
                      if (isEditing) {
                        toggleCategory(cat.id);
                      } else {
                        toggleCategoryDirect(cat.id);
                      }
                      setShowCategoryPicker(false);
                    }}
                  >
                    <View style={[s.catBadgeDot, { backgroundColor: cat.color }]} />
                    <Text style={s.catPickerText}>{cat.title}</Text>
                  </TouchableOpacity>
                ))}
                {categories.filter(c => {
                  const ids = isEditing ? (editedCard.categoryIds || card?.categoryIds || []) : (card?.categoryIds || []);
                  return !ids.includes(c.id);
                }).length === 0 && (
                  <Text style={{ fontSize: 14, color: '#9CA3AF', padding: 12 }}>All categories assigned</Text>
                )}
              </View>
            )}
          </View>

          <View style={s.notesCard}>
            <Text style={s.notesTitle}>Notes</Text>
            {isEditing ? (
              <TextInput style={s.notesInput} value={editedCard.notes || ""} onChangeText={(t) => updateField("notes", t)} placeholder="Add notes..." placeholderTextColor="#9CA3AF" multiline numberOfLines={4} />
            ) : (
              <Text style={s.notesText}>{card.notes || "No notes"}</Text>
            )}
          </View>

          <View style={{ gap: 12, marginTop: 8 }}>
            {isEditing ? (
              <>
                <TouchableOpacity style={s.saveBtn} onPress={handleSave}>
                  <Save size={20} color="#FFFFFF" /><Text style={s.saveBtnText}>Save Changes</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.cancelBtn} onPress={handleCancel}>
                  <X size={20} color="#6B7280" /><Text style={s.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity style={s.editBtn} onPress={() => setIsEditing(true)}>
                  <Edit2 size={20} color="#FFFFFF" /><Text style={s.editBtnText}>Edit Contact</Text>
                </TouchableOpacity>
                {(!card.email || (!card.officePhone && !card.cellPhone && !card.faxPhone)) && (
                  <TouchableOpacity style={[s.searchBtn, isSearchingInfo && { backgroundColor: '#F1F5F9' }]} onPress={handleSearchMissingInfo} disabled={isSearchingInfo}>
                    <Search size={20} color={isSearchingInfo ? "#9CA3AF" : "#4F46E5"} />
                    <Text style={[s.searchBtnText, isSearchingInfo && { color: '#9CA3AF' }]}>{isSearchingInfo ? "Searching..." : "Find Missing Info"}</Text>
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

function DetailRow({ icon, label, value, field, isEditing, editedCard, updateField }: {
  icon: React.ReactNode; label: string; value?: string | null; field: keyof BusinessCard;
  isEditing: boolean; editedCard: Partial<BusinessCard>; updateField: (f: keyof BusinessCard, v: string | null) => void;
}) {
  return (
    <View style={s.detailRow}>
      <View style={s.detailIcon}>{icon}</View>
      <View style={s.detailContent}>
        <Text style={s.detailLabel}>{label}</Text>
        {isEditing ? (
          <TextInput style={s.detailInput} value={editedCard[field] as string || ""} onChangeText={(t) => updateField(field, t)} placeholder={`Enter ${label.toLowerCase()}`} placeholderTextColor="#9CA3AF" multiline={field === "notes"} numberOfLines={field === "notes" ? 2 : 1} />
        ) : (
          <Text style={s.detailValue}>{value || `No ${label.toLowerCase()}`}</Text>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  content: { padding: 16 },
  errorContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { fontSize: 18, color: "#6B7280" },
  headerCard: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 24, alignItems: "center", marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3 },
  avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: "#F3F4F6", justifyContent: "center", alignItems: "center", marginBottom: 16, overflow: "hidden" },
  avatarImage: { width: 96, height: 96, borderRadius: 48 },
  name: { fontSize: 24, fontWeight: "600", color: "#1F2937", marginBottom: 4 },
  nameInput: { fontSize: 24, fontWeight: "600", color: "#1F2937", borderBottomWidth: 1, borderBottomColor: "#E5E7EB", paddingVertical: 4, marginBottom: 8, textAlign: "center", minWidth: 200 },
  title: { fontSize: 16, color: "#6B7280" },
  titleInput: { fontSize: 16, color: "#6B7280", borderBottomWidth: 1, borderBottomColor: "#E5E7EB", paddingVertical: 4, textAlign: "center", minWidth: 200 },
  detailsCard: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3 },
  detailRow: { flexDirection: "row", marginBottom: 20 },
  detailIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#F3F4F6", justifyContent: "center", alignItems: "center", marginRight: 16 },
  detailContent: { flex: 1 },
  detailLabel: { fontSize: 12, color: "#9CA3AF", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 },
  detailValue: { fontSize: 16, color: "#1F2937" },
  detailInput: { fontSize: 16, color: "#1F2937", borderBottomWidth: 1, borderBottomColor: "#E5E7EB", paddingVertical: 4 },
  linkedinBadge: { width: 20, height: 20, borderRadius: 3, backgroundColor: "#0077B5", justifyContent: "center", alignItems: "center" },
  linkedinBadgeText: { color: "#FFFFFF", fontSize: 10, fontWeight: "bold" },
  linkedinLink: { fontSize: 16, color: "#0077B5", textDecorationLine: "underline" },
  eventCard: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3 },
  eventHeader: { flexDirection: "row", alignItems: "center", marginBottom: 16, gap: 8 },
  eventTitle: { fontSize: 14, fontWeight: "600", color: "#6B7280", textTransform: "uppercase", letterSpacing: 0.5 },
  eventSelectorBtn: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 12, borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 8, backgroundColor: "#FFFFFF" },
  eventSelectorText: { fontSize: 16, color: "#1F2937" },
  eventPicker: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 8, marginTop: 4, maxHeight: 200, zIndex: 1000 },
  eventOption: { padding: 12, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  eventOptionText: { fontSize: 16, color: "#1F2937" },
  selectedEvText: { color: "#4F46E5", fontWeight: "600" },
  eventBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  eventBadgeText: { fontSize: 14, fontWeight: "500" },
  notesCard: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3 },
  notesTitle: { fontSize: 14, fontWeight: "600", color: "#6B7280", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 },
  notesText: { fontSize: 16, color: "#1F2937", lineHeight: 22 },
  notesInput: { fontSize: 16, color: "#1F2937", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 8, padding: 12, minHeight: 100, textAlignVertical: "top" },
  editBtn: { backgroundColor: "#4F46E5", flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 16, borderRadius: 12, gap: 8 },
  editBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  saveBtn: { backgroundColor: "#10B981", flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 16, borderRadius: 12, gap: 8 },
  saveBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  cancelBtn: { backgroundColor: "#F3F4F6", flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 16, borderRadius: 12, gap: 8 },
  cancelBtnText: { color: "#6B7280", fontSize: 16, fontWeight: "600" },
  searchBtn: { backgroundColor: "#F8FAFC", flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 16, borderRadius: 12, gap: 8, borderWidth: 1, borderColor: "#E2E8F0" },
  searchBtnText: { color: "#4F46E5", fontSize: 16, fontWeight: "600" },
  categoryBadgesWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" },
  catBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, gap: 6 },
  catBadgeDot: { width: 8, height: 8, borderRadius: 4 },
  catBadgeText: { fontSize: 13, fontWeight: "500" as const },
  addCatBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: "#E5E7EB", borderStyle: "dashed" as const, gap: 4 },
  addCatBtnText: { fontSize: 13, color: "#6B7280" },
  catPickerWrap: { marginTop: 12, backgroundColor: "#F9FAFB", borderRadius: 10, borderWidth: 1, borderColor: "#E5E7EB", overflow: "hidden" as const },
  catPickerItem: { flexDirection: "row", alignItems: "center", padding: 12, gap: 10, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  catPickerText: { fontSize: 15, color: "#1F2937" },
});
