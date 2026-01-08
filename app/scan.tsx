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
  const [showEventSelection, setShowEventSelection] = useState(false);
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: `You are a business card OCR system. Extract contact information from the business card image and return ONLY a JSON object with these fields:
              - name: full name
              - title: job title
              - company: company name
              - email: email address
              - phone: general phone number (if only one is present)
              - officePhone: office phone number
              - cellPhone: cell/mobile phone number
              - faxPhone: fax number
              - website: website URL
              - address: physical mailing address
              - notes: any other relevant information
              
              If a field is not found, use null. Return ONLY valid JSON, no other text.`
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
        // Go directly to editing mode
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
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.8,
      });
      
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
        Alert.alert(
          "Camera Permission Required",
          "Please enable camera access in your device settings to take photos."
        );
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
    if (mode === 'gallery') {
      handlePickFromGallery();
    }
  }, [mode, handlePickFromGallery]);

  // Auto-select newly created event or most recent event
  useEffect(() => {
    if (pendingEventName) {
      const newEvent = events.find(e => e.name === pendingEventName);
      if (newEvent) {
        setSelectedEventId(newEvent.id);
        setPendingEventName(null);
      }
    } else if (extractedData.name || extractedData.company) {
      // Auto-select the most recent event (excluding non-categorized) when contact data is available
      const recentEvents = events.filter(e => e.id !== "non-categorized");
      if (recentEvents.length > 0) {
        // Sort by creation date and get the most recent
        const mostRecentEvent = recentEvents.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0];
        if (!selectedEventId) {
          setSelectedEventId(mostRecentEvent.id);
        }
      }
    }
  }, [events, pendingEventName, extractedData, selectedEventId]);

  const handleEventSelectionComplete = () => {
    // Auto-select the most recent event if none selected
    if (!selectedEventId) {
      const recentEvents = events.filter(e => e.id !== "non-categorized");
      if (recentEvents.length > 0) {
        const mostRecentEvent = recentEvents.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0];
        setSelectedEventId(mostRecentEvent.id);
      }
    }
    setShowEventSelection(false);
    handleFinalSave();
  };

  const handleSave = () => {
    if (!extractedData.name && !extractedData.company) {
      Alert.alert("Missing Information", "Please add at least a name or company.");
      return;
    }

    // Show event selection before saving
    setShowEventSelection(true);
    setIsEditing(false);
  };

  const handleFinalSave = () => {
    addCard({
      ...extractedData,
      id: Date.now().toString(),
      eventId: selectedEventId,
      createdAt: new Date().toISOString(),
      profilePhotoUrl: null,
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

    addEvent({
      name: newEventName.trim(),
      description: newEventDescription.trim() || null,
      color: "#4128C5", // Default color
    });

    setPendingEventName(newEventName.trim());
    setShowNewEventForm(false);
    setShowEventSelection(true);
    setNewEventName("");
    setNewEventDescription("");
  };

  const getSelectedEventName = () => {
    if (!selectedEventId) {
      const nonCategorized = getNonCategorizedEvent();
      return nonCategorized?.name || "Non-Categorized";
    }
    const event = getEventById(selectedEventId);
    return event?.name || "Unknown Event";
  };

  const updateField = (field: keyof BusinessCard, value: string) => {
    setExtractedData(prev => ({ ...prev, [field]: value || null }));
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
          <Text style={styles.headerTitle}>Scan Business Card</Text>
          <View style={styles.headerRightSpacer} />
        </View>

        {showCamera ? (
          <View style={styles.cameraContainer}>
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing="back"
            >
              <View style={styles.cameraOverlay}>
                <TouchableOpacity
                  style={styles.cameraCloseButton}
                  onPress={() => setShowCamera(false)}
                >
                  <X size={24} color="#FFFFFF" />
                </TouchableOpacity>
                
                <View style={styles.cameraControls}>
                  <TouchableOpacity
                    style={styles.galleryButton}
                    onPress={handlePickFromGallery}
                  >
                    <ImageIcon size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.captureButton}
                    onPress={handleTakePhoto}
                  >
                    <View style={styles.captureButtonInner} />
                  </TouchableOpacity>
                  
                  <View style={styles.controlSpacer} />
                </View>
              </View>
            </CameraView>
          </View>
        ) : (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {!image ? (
            <View style={styles.captureSection}>
              <View style={styles.cameraPlaceholder}>
                <Camera size={64} color="#9CA3AF" />
                <Text style={styles.placeholderText}>Select or capture a business card</Text>
              </View>

              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  style={styles.primaryButton}
                  onPress={handleOpenCamera}
                >
                  <Camera size={20} color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>Take Photo</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.secondaryButton}
                  onPress={handlePickFromGallery}
                >
                  <Text style={styles.secondaryButtonText}>Choose from Gallery</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.manualEntryButton}
                  onPress={() => router.push('/manual-entry' as any)}
                >
                  <Edit3 size={20} color="#4128C5" />
                  <Text style={styles.manualEntryButtonText}>Add Manually</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.processSection}>
              <Image source={{ uri: image }} style={styles.previewImage} />

              {isProcessing ? (
                <View style={styles.processingContainer}>
                  <ActivityIndicator size="large" color="#4128C5" />
                  <Text style={styles.processingText}>Extracting information...</Text>
                </View>
              ) : showEventSelection ? (
                <View style={styles.eventSelectionContainer}>
                  <Text style={styles.eventSelectionTitle}>Select Event for this Contact</Text>
                  <Text style={styles.eventSelectionSubtitle}>Choose which event this contact belongs to</Text>
                  
                  <View style={styles.eventSelectionList}>
                    <TouchableOpacity 
                      style={[
                        styles.eventSelectionOption,
                        !selectedEventId && styles.selectedEventOption
                      ]}
                      onPress={() => setSelectedEventId(null)}
                    >
                      <View style={[
                        styles.eventColorDot,
                        { backgroundColor: getNonCategorizedEvent()?.color || "#6B7280" }
                      ]} />
                      <View style={styles.eventSelectionInfo}>
                        <Text style={[
                          styles.eventSelectionName,
                          !selectedEventId && styles.selectedEventName
                        ]}>
                          {getNonCategorizedEvent()?.name || "Non-Categorized"}
                        </Text>
                        <Text style={styles.eventSelectionDescription}>
                          {getNonCategorizedEvent()?.description || "Cards without a specific event"}
                        </Text>
                      </View>
                      {!selectedEventId && (
                        <CheckCircle size={20} color="#4128C5" />
                      )}
                    </TouchableOpacity>
                    
                    {events.filter(e => e.id !== "non-categorized").map(event => (
                      <TouchableOpacity 
                        key={event.id}
                        style={[
                          styles.eventSelectionOption,
                          selectedEventId === event.id && styles.selectedEventOption
                        ]}
                        onPress={() => setSelectedEventId(event.id)}
                      >
                        <View style={[
                          styles.eventColorDot,
                          { backgroundColor: event.color }
                        ]} />
                        <View style={styles.eventSelectionInfo}>
                          <Text style={[
                            styles.eventSelectionName,
                            selectedEventId === event.id && styles.selectedEventName
                          ]}>
                            {event.name}
                          </Text>
                          {event.description && (
                            <Text style={styles.eventSelectionDescription}>
                              {event.description}
                            </Text>
                          )}
                        </View>
                        {selectedEventId === event.id && (
                          <CheckCircle size={20} color="#4128C5" />
                        )}
                      </TouchableOpacity>
                    ))}
                    
                    <TouchableOpacity 
                      style={styles.createNewEventOption}
                      onPress={() => {
                        setShowEventSelection(false);
                        setShowNewEventForm(true);
                      }}
                    >
                      <View style={styles.createNewEventIcon}>
                        <Plus size={16} color="#4128C5" />
                      </View>
                      <Text style={styles.createNewEventText}>Create New Event</Text>
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.eventSelectionButtons}>
                    <TouchableOpacity 
                      style={styles.continueButton}
                      onPress={handleEventSelectionComplete}
                    >
                      <Text style={styles.continueButtonText}>Save Contact</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.skipButton}
                      onPress={() => {
                        setSelectedEventId(null);
                        handleEventSelectionComplete();
                      }}
                    >
                      <Text style={styles.skipButtonText}>Skip for Now</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : showNewEventForm ? (
                <View style={styles.newEventFormContainer}>
                  <Text style={styles.newEventFormTitle}>Create New Event</Text>
                  <Text style={styles.newEventFormSubtitle}>Create a new event folder for this contact</Text>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Event Name</Text>
                    <TextInput
                      style={styles.input}
                      value={newEventName}
                      onChangeText={setNewEventName}
                      placeholder="Enter event name"
                      placeholderTextColor="#9CA3AF"
                      autoFocus
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
                  
                  <View style={styles.newEventFormButtons}>
                    <TouchableOpacity 
                      style={styles.createEventButton}
                      onPress={handleCreateNewEvent}
                    >
                      <Text style={styles.createEventButtonText}>Create Event</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.backToSelectionButton}
                      onPress={() => {
                        setShowNewEventForm(false);
                        setShowEventSelection(true);
                        setNewEventName("");
                        setNewEventDescription("");
                      }}
                    >
                      <Text style={styles.backToSelectionButtonText}>Back to Selection</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : isEditing ? (
                <View style={styles.formContainer}>
                  <Text style={styles.formTitle}>Review & Edit Information</Text>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Name</Text>
                    <TextInput
                      style={styles.input}
                      value={extractedData.name || ""}
                      onChangeText={(text) => updateField("name", text)}
                      placeholder="Enter name"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Title</Text>
                    <TextInput
                      style={styles.input}
                      value={extractedData.title || ""}
                      onChangeText={(text) => updateField("title", text)}
                      placeholder="Enter job title"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Company</Text>
                    <TextInput
                      style={styles.input}
                      value={extractedData.company || ""}
                      onChangeText={(text) => updateField("company", text)}
                      placeholder="Enter company"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Email</Text>
                    <TextInput
                      style={styles.input}
                      value={extractedData.email || ""}
                      onChangeText={(text) => updateField("email", text)}
                      placeholder="Enter email"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>

                  <View style={styles.inputRow}>
                    <View style={[styles.inputGroup, styles.inputFlex]}>
                      <Text style={styles.inputLabel}>Office</Text>
                      <TextInput
                        testID="input-phone-office"
                        style={styles.input}
                        value={extractedData.officePhone || ""}
                        onChangeText={(text) => updateField("officePhone", text)}
                        placeholder="Office phone"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="phone-pad"
                      />
                    </View>
                    <View style={[styles.inputGroup, styles.inputFlex, { marginLeft: 12 }]}> 
                      <Text style={styles.inputLabel}>Cell</Text>
                      <TextInput
                        testID="input-phone-cell"
                        style={styles.input}
                        value={extractedData.cellPhone || ""}
                        onChangeText={(text) => updateField("cellPhone", text)}
                        placeholder="Cell phone"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="phone-pad"
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Fax</Text>
                    <TextInput
                      testID="input-phone-fax"
                      style={styles.input}
                      value={extractedData.faxPhone || ""}
                      onChangeText={(text) => updateField("faxPhone", text)}
                      placeholder="Fax number"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="phone-pad"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Website</Text>
                    <TextInput
                      testID="input-website"
                      style={styles.input}
                      value={extractedData.website || ""}
                      onChangeText={(text) => updateField("website", text)}
                      placeholder="Enter website"
                      placeholderTextColor="#9CA3AF"
                      autoCapitalize="none"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Address</Text>
                    <TextInput
                      testID="input-address"
                      style={[styles.input, styles.textArea]}
                      value={extractedData.address || ""}
                      onChangeText={(text) => updateField("address", text)}
                      placeholder="Street, City, State, ZIP"
                      placeholderTextColor="#9CA3AF"
                      multiline
                      numberOfLines={2}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Notes</Text>
                    <TextInput
                      testID="input-notes"
                      style={[styles.input, styles.textArea]}
                      value={extractedData.notes || ""}
                      onChangeText={(text) => updateField("notes", text)}
                      placeholder="Add any additional notes..."
                      placeholderTextColor="#9CA3AF"
                      multiline
                      numberOfLines={3}
                    />
                  </View>

                  <View style={styles.eventSection}>
                    <View style={styles.eventHeader}>
                      <Calendar size={20} color="#6B7280" />
                      <Text style={styles.eventTitle}>Event</Text>
                    </View>
                    
                    <TouchableOpacity 
                      style={styles.eventSelector}
                      onPress={() => setShowEventPicker(!showEventPicker)}
                    >
                      <Text style={styles.eventSelectorText}>{getSelectedEventName()}</Text>
                      <ChevronDown size={20} color="#6B7280" />
                    </TouchableOpacity>
                    
                    {showEventPicker && (
                      <View style={styles.eventPicker}>
                        <TouchableOpacity 
                          style={styles.eventOption}
                          onPress={() => {
                            setSelectedEventId(null);
                            setShowEventPicker(false);
                          }}
                        >
                          <Text style={[
                            styles.eventOptionText,
                            !selectedEventId && styles.selectedEventText
                          ]}>
                            {getNonCategorizedEvent()?.name || "Non-Categorized"}
                          </Text>
                        </TouchableOpacity>
                        {events.filter(e => e.id !== "non-categorized").map(event => (
                          <TouchableOpacity 
                            key={event.id}
                            style={styles.eventOption}
                            onPress={() => {
                              setSelectedEventId(event.id);
                              setShowEventPicker(false);
                            }}
                          >
                            <Text style={[
                              styles.eventOptionText,
                              selectedEventId === event.id && styles.selectedEventText
                            ]}>
                              {event.name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                        <TouchableOpacity 
                          style={[styles.eventOption, styles.createEventOption]}
                          onPress={() => {
                            setShowEventPicker(false);
                            setShowNewEventForm(true);
                          }}
                        >
                          <Plus size={16} color="#4128C5" />
                          <Text style={styles.createEventText}>Create New Event</Text>
                        </TouchableOpacity>
                      </View>
                    )}
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

                  <View style={styles.actionButtons}>
                    <TouchableOpacity 
                      style={styles.saveButton}
                      onPress={handleSave}
                    >
                      <CheckCircle size={20} color="#FFFFFF" />
                      <Text style={styles.saveButtonText}>Save</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.retakeButton}
                      onPress={() => {
                        // Save current card first
                        if (extractedData.name || extractedData.company) {
                          addCard({
                            ...extractedData,
                            id: Date.now().toString(),
                            eventId: selectedEventId,
                            createdAt: new Date().toISOString(),
                            profilePhotoUrl: null,
                          } as BusinessCard);
                        }
                        
                        // Reset state for next scan
                        setImage(null);
                        setExtractedData({});
                        setIsEditing(false);
                        setSelectedEventId(null);
                        setShowEventPicker(false);
                        setShowNewEventForm(false);
                        setShowEventSelection(false);
                        setNewEventName("");
                        setNewEventDescription("");
                        setPendingEventName(null);
                      }}
                    >
                      <Text style={styles.retakeButtonText}>Scan Another</Text>
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
  headerRightSpacer: {
    width: 40,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "flex-end",
  },
  cameraCloseButton: {
    position: "absolute",
    top: 16,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  cameraControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingBottom: 50,
  },
  galleryButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#FFFFFF",
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FFFFFF",
  },
  controlSpacer: {
    width: 50,
  },
  content: {
    flexGrow: 1,
    padding: 16,
  },
  captureSection: {
    flex: 1,
    justifyContent: "center",
  },
  cameraPlaceholder: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 48,
    alignItems: "center",
    marginBottom: 32,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
  },
  placeholderText: {
    fontSize: 16,
    color: "#9CA3AF",
    marginTop: 16,
  },
  buttonContainer: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: "#4128C5",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  secondaryButtonText: {
    color: "#4128C5",
    fontSize: 16,
    fontWeight: "600" as const,
  },
  manualEntryButton: {
    backgroundColor: "#FFFFFF",
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#4128C5",
    gap: 8,
  },
  manualEntryButtonText: {
    color: "#4128C5",
    fontSize: 16,
    fontWeight: "600" as const,
  },
  processSection: {
    flex: 1,
  },
  previewImage: {
    width: "100%",
    height: 250,
    borderRadius: 12,
    marginBottom: 20,
    backgroundColor: "#F3F4F6",
  },
  processingContainer: {
    alignItems: "center",
    padding: 32,
  },
  processingText: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 16,
  },
  formContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#4B5563",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#1F2937",
    backgroundColor: "#F9FAFB",
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: "top",
  },
  inputRow: {
    flexDirection: "row",
  },
  inputFlex: {
    flex: 1,
  },
  actionButtons: {
    marginTop: 24,
    gap: 12,
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
  retakeButton: {
    backgroundColor: "#F3F4F6",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  retakeButtonText: {
    color: "#4B5563",
    fontSize: 16,
    fontWeight: "600",
  },
  disabledButton: {
    backgroundColor: "#E5E7EB",
  },
  disabledButtonText: {
    color: "#9CA3AF",
  },
  eventSection: {
    marginBottom: 16,
  },
  eventHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#4B5563",
  },
  eventSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#F9FAFB",
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
    color: "#4128C5",
    fontWeight: "600",
  },
  createEventOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F8F9FF",
  },
  createEventText: {
    fontSize: 16,
    color: "#4128C5",
    fontWeight: "600",
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
  eventSelectionContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
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
  skipButton: {
    backgroundColor: "#F3F4F6",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  skipButtonText: {
    color: "#6B7280",
    fontSize: 16,
    fontWeight: "600",
  },
  newEventFormContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
  },
  newEventFormTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 8,
  },
  newEventFormSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
  },
  newEventFormButtons: {
    gap: 12,
    marginTop: 16,
  },
  createEventButton: {
    backgroundColor: "#4128C5",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  createEventButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  backToSelectionButton: {
    backgroundColor: "#F3F4F6",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  backToSelectionButtonText: {
    color: "#6B7280",
    fontSize: 16,
    fontWeight: "600",
  },
});