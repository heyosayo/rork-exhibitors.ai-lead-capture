import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { X, Camera, CheckCircle, Calendar, ChevronDown, Plus, Edit3, ImageIcon } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useCards } from "@/providers/CardProvider";
import { useEvents } from "@/providers/EventProvider";
import { BusinessCard } from "@/types/card";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ScanScreen() {
  const { addCard } = useCards();
  const { events, addEvent, getEventById, getNonCategorizedEvent } = useEvents();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const [image, setImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<Partial<BusinessCard>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [cameraPermission, requestPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [showEventPicker, setShowEventPicker] = useState(false);
  const [showNewEventForm, setShowNewEventForm] = useState(false);
  const [newEventName, setNewEventName] = useState("");
  const [newEventDescription, setNewEventDescription] = useState("");
  const [pendingEventName, setPendingEventName] = useState<string | null>(null);

  const processImage = useCallback(async (base64Image: string) => {
    setIsProcessing(true);
    setIsEditing(false);
    try {
      const response = await fetch("https://toolkit.rork.com/text/llm/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: `You are a business card OCR system. Extract contact information from the business card image and return ONLY a JSON object with these fields:
              - name, title, company, email, phone, officePhone, cellPhone, faxPhone, website, address, notes
              If a field is not found, use null. Return ONLY valid JSON.`
            },
            {
              role: "user",
              content: [
                { type: "text", text: "Extract the contact information from this business card:" },
                { type: "image", image: base64Image }
              ]
            }
          ]
        })
      });
      const data = await response.json();
      try {
        const cleanedResponse = data.completion.replace(/```json\n?|\n?```/g, '').trim();
        const parsed = JSON.parse(cleanedResponse);
        setExtractedData(parsed);
        setIsEditing(true);
      } catch {
        console.error("Failed to parse AI response:", data.completion);
        Alert.alert("Processing Error", "Could not extract data from the image. Please try again.");
      }
    } catch (error) {
      console.error("Error processing image:", error);
      Alert.alert("Error", "Failed to process the image. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleTakePhoto = useCallback(async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.8 });
      if (photo && photo.base64) {
        setShowCamera(false);
        setImage(photo.uri);
        processImage(photo.base64);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to take photo. Please try again.");
    }
  }, [processImage]);

  const handleOpenCamera = useCallback(async () => {
    if (!cameraPermission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert("Camera Permission Required", "Please enable camera access in your device settings.");
        return;
      }
    }
    setShowCamera(true);
  }, [cameraPermission, requestPermission]);

  const handlePickFromGallery = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });
      if (!result.canceled && result.assets[0]) {
        setShowCamera(false);
        setImage(result.assets[0].uri);
        if (result.assets[0].base64) {
          processImage(result.assets[0].base64);
        } else {
          Alert.alert("Error", "Failed to process the image. Please try again.");
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to access gallery. Please try again.");
    }
  }, [processImage]);

  useEffect(() => {
    if (mode === 'gallery') handlePickFromGallery();
  }, [mode, handlePickFromGallery]);

  useEffect(() => {
    if (pendingEventName) {
      const newEvent = events.find(e => e.name === pendingEventName);
      if (newEvent) {
        setSelectedEventId(newEvent.id);
        setPendingEventName(null);
      }
    } else if ((extractedData.name || extractedData.company) && !selectedEventId) {
      const recentEvents = events.filter(e => e.id !== "non-categorized");
      if (recentEvents.length > 0) {
        const mostRecent = recentEvents.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0];
        setSelectedEventId(mostRecent.id);
      }
    }
  }, [events, pendingEventName, extractedData, selectedEventId]);

  const handleSave = () => {
    if (!extractedData.name && !extractedData.company) {
      Alert.alert("Missing Information", "Please add at least a name or company.");
      return;
    }
    addCard({
      ...extractedData,
      id: Date.now().toString(),
      eventId: selectedEventId,
      createdAt: new Date().toISOString(),
      profilePhotoUrl: null,
      categoryIds: [],
    } as BusinessCard);
    Alert.alert("Success", "Business card saved successfully!", [
      { text: "OK", onPress: () => router.back() }
    ]);
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

  const getSelectedEventName = () => {
    if (!selectedEventId) return getNonCategorizedEvent()?.name || "Non-Categorized";
    return getEventById(selectedEventId)?.name || "Unknown Event";
  };

  const updateField = (field: keyof BusinessCard, value: string) => {
    setExtractedData(prev => ({ ...prev, [field]: value || null }));
  };

  const resetForNextScan = () => {
    if (extractedData.name || extractedData.company) {
      addCard({
        ...extractedData,
        id: Date.now().toString(),
        eventId: selectedEventId,
        createdAt: new Date().toISOString(),
        profilePhotoUrl: null,
        categoryIds: [],
      } as BusinessCard);
    }
    setImage(null);
    setExtractedData({});
    setIsEditing(false);
    setSelectedEventId(null);
    setShowEventPicker(false);
    setShowNewEventForm(false);
    setNewEventName("");
    setNewEventDescription("");
    setPendingEventName(null);
  };

  return (
    <SafeAreaView style={s.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={s.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.closeBtn}>
            <X size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Scan Business Card</Text>
          <View style={{ width: 40 }} />
        </View>

        {showCamera ? (
          <View style={s.cameraContainer}>
            <CameraView ref={cameraRef} style={s.camera} facing="back">
              <View style={s.cameraOverlay}>
                <TouchableOpacity style={s.cameraCloseBtn} onPress={() => setShowCamera(false)}>
                  <X size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={s.cameraControls}>
                  <TouchableOpacity style={s.galleryBtn} onPress={handlePickFromGallery}>
                    <ImageIcon size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                  <TouchableOpacity style={s.captureBtn} onPress={handleTakePhoto}>
                    <View style={s.captureBtnInner} />
                  </TouchableOpacity>
                  <View style={{ width: 50 }} />
                </View>
              </View>
            </CameraView>
          </View>
        ) : (
          <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
            {!image ? (
              <View style={s.captureSection}>
                <View style={s.placeholder}>
                  <Camera size={64} color="#9CA3AF" />
                  <Text style={s.placeholderText}>Select or capture a business card</Text>
                </View>
                <View style={{ gap: 12 }}>
                  <TouchableOpacity style={s.primaryBtn} onPress={handleOpenCamera}>
                    <Camera size={20} color="#FFFFFF" />
                    <Text style={s.primaryBtnText}>Take Photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.secondaryBtn} onPress={handlePickFromGallery}>
                    <Text style={s.secondaryBtnText}>Choose from Gallery</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.manualBtn} onPress={() => router.push('/manual-entry' as any)}>
                    <Edit3 size={20} color="#4128C5" />
                    <Text style={s.manualBtnText}>Add Manually</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={{ flex: 1 }}>
                <Image source={{ uri: image }} style={s.previewImage} />
                {isProcessing ? (
                  <View style={s.processingContainer}>
                    <ActivityIndicator size="large" color="#4128C5" />
                    <Text style={s.processingText}>Extracting information...</Text>
                  </View>
                ) : isEditing ? (
                  <View style={s.formContainer}>
                    <Text style={s.formTitle}>Review & Edit Information</Text>
                    <FormField label="Name" value={extractedData.name} field="name" updateField={updateField} />
                    <FormField label="Title" value={extractedData.title} field="title" updateField={updateField} />
                    <FormField label="Company" value={extractedData.company} field="company" updateField={updateField} />
                    <FormField label="Email" value={extractedData.email} field="email" updateField={updateField} keyboardType="email-address" />
                    <View style={{ flexDirection: 'row' }}>
                      <View style={{ flex: 1 }}>
                        <FormField label="Office" value={extractedData.officePhone} field="officePhone" updateField={updateField} keyboardType="phone-pad" />
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <FormField label="Cell" value={extractedData.cellPhone} field="cellPhone" updateField={updateField} keyboardType="phone-pad" />
                      </View>
                    </View>
                    <FormField label="Fax" value={extractedData.faxPhone} field="faxPhone" updateField={updateField} keyboardType="phone-pad" />
                    <FormField label="Website" value={extractedData.website} field="website" updateField={updateField} />
                    <FormField label="Address" value={extractedData.address} field="address" updateField={updateField} multiline />
                    <FormField label="Notes" value={extractedData.notes} field="notes" updateField={updateField} multiline />

                    <View style={s.eventSection}>
                      <View style={s.eventHeader}>
                        <Calendar size={20} color="#6B7280" />
                        <Text style={s.eventLabel}>Event</Text>
                      </View>
                      <TouchableOpacity style={s.eventSelector} onPress={() => setShowEventPicker(!showEventPicker)}>
                        <Text style={s.eventSelectorText}>{getSelectedEventName()}</Text>
                        <ChevronDown size={20} color="#6B7280" />
                      </TouchableOpacity>
                      {showEventPicker && (
                        <View style={s.eventPicker}>
                          <TouchableOpacity style={s.eventOption} onPress={() => { setSelectedEventId(null); setShowEventPicker(false); }}>
                            <Text style={[s.eventOptionText, !selectedEventId && s.selectedEventText]}>
                              {getNonCategorizedEvent()?.name || "Non-Categorized"}
                            </Text>
                          </TouchableOpacity>
                          {events.filter(e => e.id !== "non-categorized").map(event => (
                            <TouchableOpacity key={event.id} style={s.eventOption} onPress={() => { setSelectedEventId(event.id); setShowEventPicker(false); }}>
                              <Text style={[s.eventOptionText, selectedEventId === event.id && s.selectedEventText]}>{event.name}</Text>
                            </TouchableOpacity>
                          ))}
                          <TouchableOpacity style={[s.eventOption, { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F8F9FF' }]} onPress={() => { setShowEventPicker(false); setShowNewEventForm(true); }}>
                            <Plus size={16} color="#4128C5" />
                            <Text style={{ fontSize: 16, color: '#4128C5', fontWeight: '600' as const }}>Create New Event</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>

                    {showNewEventForm && (
                      <View style={s.newEventForm}>
                        <Text style={{ fontSize: 16, fontWeight: '600' as const, color: '#1F2937', marginBottom: 16 }}>Create New Event</Text>
                        <FormField label="Event Name" value={newEventName} field={undefined as any} updateField={(_f, v) => setNewEventName(v)} />
                        <FormField label="Description (Optional)" value={newEventDescription} field={undefined as any} updateField={(_f, v) => setNewEventDescription(v)} multiline />
                        <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                          <TouchableOpacity style={[s.primaryBtn, { flex: 1 }]} onPress={handleCreateNewEvent}>
                            <Text style={s.primaryBtnText}>Create Event</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={[s.secondaryBtn, { flex: 1 }]} onPress={() => { setShowNewEventForm(false); setNewEventName(""); setNewEventDescription(""); }}>
                            <Text style={s.secondaryBtnText}>Cancel</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}

                    <View style={{ marginTop: 24, gap: 12 }}>
                      <TouchableOpacity style={s.saveBtn} onPress={handleSave}>
                        <CheckCircle size={20} color="#FFFFFF" />
                        <Text style={s.saveBtnText}>Save</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={s.retakeBtn} onPress={resetForNextScan}>
                        <Text style={s.retakeBtnText}>Scan Another</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : null}
              </View>
            )}
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FormField({ label, value, field, updateField, keyboardType, multiline }: {
  label: string;
  value?: string | null;
  field: keyof BusinessCard;
  updateField: (field: keyof BusinessCard, value: string) => void;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  multiline?: boolean;
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={s.inputLabel}>{label}</Text>
      <TextInput
        style={[s.input, multiline && { minHeight: 60, textAlignVertical: 'top' as const }]}
        value={value || ""}
        onChangeText={(text) => updateField(field, text)}
        placeholder={`Enter ${label.toLowerCase()}`}
        placeholderTextColor="#9CA3AF"
        keyboardType={keyboardType || 'default'}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
        multiline={multiline}
        numberOfLines={multiline ? 2 : 1}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F6FAFE" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
  closeBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#1F2937" },
  cameraContainer: { flex: 1, backgroundColor: "#000000" },
  camera: { flex: 1 },
  cameraOverlay: { flex: 1, backgroundColor: "transparent", justifyContent: "flex-end" },
  cameraCloseBtn: { position: "absolute", top: 16, left: 16, width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  cameraControls: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 40, paddingBottom: 50 },
  galleryBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  captureBtn: { width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(255,255,255,0.3)", justifyContent: "center", alignItems: "center", borderWidth: 4, borderColor: "#FFFFFF" },
  captureBtnInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#FFFFFF" },
  content: { flexGrow: 1, padding: 16 },
  captureSection: { flex: 1, justifyContent: "center" },
  placeholder: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 48, alignItems: "center", marginBottom: 32, borderWidth: 2, borderColor: "#E5E7EB", borderStyle: "dashed" },
  placeholderText: { fontSize: 16, color: "#9CA3AF", marginTop: 16 },
  primaryBtn: { backgroundColor: "#4128C5", flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 16, borderRadius: 12, gap: 8 },
  primaryBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  secondaryBtn: { backgroundColor: "#FFFFFF", padding: 16, borderRadius: 12, alignItems: "center", borderWidth: 1, borderColor: "#E5E7EB" },
  secondaryBtnText: { color: "#4128C5", fontSize: 16, fontWeight: "600" as const },
  manualBtn: { backgroundColor: "#FFFFFF", flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "center" as const, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: "#4128C5", gap: 8 },
  manualBtnText: { color: "#4128C5", fontSize: 16, fontWeight: "600" as const },
  previewImage: { width: "100%", height: 250, borderRadius: 12, marginBottom: 20, backgroundColor: "#F3F4F6" },
  processingContainer: { alignItems: "center", padding: 32 },
  processingText: { fontSize: 16, color: "#6B7280", marginTop: 16 },
  formContainer: { backgroundColor: "#FFFFFF", borderRadius: 12, padding: 20 },
  formTitle: { fontSize: 18, fontWeight: "600", color: "#1F2937", marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: "500", color: "#4B5563", marginBottom: 6 },
  input: { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 8, padding: 12, fontSize: 16, color: "#1F2937", backgroundColor: "#F9FAFB" },
  eventSection: { marginBottom: 16 },
  eventHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 8 },
  eventLabel: { fontSize: 14, fontWeight: "500", color: "#4B5563" },
  eventSelector: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 8, padding: 12, backgroundColor: "#F9FAFB" },
  eventSelectorText: { fontSize: 16, color: "#1F2937" },
  eventPicker: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 8, marginTop: 4, maxHeight: 200, zIndex: 1000 },
  eventOption: { padding: 12, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  eventOptionText: { fontSize: 16, color: "#1F2937" },
  selectedEventText: { color: "#4128C5", fontWeight: "600" },
  newEventForm: { backgroundColor: "#F8F9FF", borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: "#E0E7FF" },
  saveBtn: { backgroundColor: "#10B981", flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 16, borderRadius: 12, gap: 8 },
  saveBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  retakeBtn: { backgroundColor: "#F3F4F6", padding: 16, borderRadius: 12, alignItems: "center" },
  retakeBtnText: { color: "#4B5563", fontSize: 16, fontWeight: "600" },
});
