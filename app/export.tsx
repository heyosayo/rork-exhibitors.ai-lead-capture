import React, { useState, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
} from "react-native";
import { FileSpreadsheet, Copy, CheckCircle, Mail, Calendar, Check } from "lucide-react-native";
import { useCards } from "@/providers/CardProvider";
import { useEvents } from "@/providers/EventProvider";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Clipboard from 'expo-clipboard';
import * as MailComposer from 'expo-mail-composer';
import { Stack } from "expo-router";

export default function ExportScreen() {
  const { cards } = useCards();
  const { events } = useEvents();
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [showEventFilter, setShowEventFilter] = useState(false);

  const filteredCards = useMemo(() => {
    if (selectedEventIds.length === 0) {
      return cards;
    }
    return cards.filter(card => {
      const eventId = card.eventId || 'non-categorized';
      return selectedEventIds.includes(eventId);
    });
  }, [cards, selectedEventIds]);

  const generateCSV = () => {
    const headers = ["Name", "Title", "Company", "Email", "Phone", "Website", "Address", "Notes", "Event", "Timestamp"];
    const rows = filteredCards.map(card => {
      const event = events.find(e => e.id === (card.eventId || 'non-categorized'));
      return [
        card.name || "",
        card.title || "",
        card.company || "",
        card.email || "",
        card.phone || "",
        card.website || "",
        card.address || "",
        card.notes || "",
        event?.name || "Non-Categorized",
        card.createdAt ? new Date(card.createdAt).toLocaleString() : "",
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    return csvContent;
  };

  const generateJSON = () => {
    return JSON.stringify(filteredCards.map(card => {
      const event = events.find(e => e.id === (card.eventId || 'non-categorized'));
      return {
        name: card.name,
        title: card.title,
        company: card.company,
        email: card.email,
        phone: card.phone,
        website: card.website,
        address: card.address,
        notes: card.notes,
        event: event?.name || "Non-Categorized",
        timestamp: card.createdAt ? new Date(card.createdAt).toLocaleString() : null,
      };
    }), null, 2);
  };

  const handleCopyToClipboard = async (format: 'csv' | 'json') => {
    const content = format === 'csv' ? generateCSV() : generateJSON();
    await Clipboard.setStringAsync(content);
    setCopiedFormat(format);
    setTimeout(() => setCopiedFormat(null), 2000);
    
    Alert.alert(
      "Copied!",
      `${format.toUpperCase()} data copied to clipboard. You can now paste it into Google Sheets or any spreadsheet application.`,
      [{ text: "OK" }]
    );
  };

  const handleEmailExport = async () => {
    if (Platform.OS === 'web') {
      Alert.alert(
        "Email Export",
        "Email export is not available on web. Please use the copy options instead.",
        [{ text: "OK" }]
      );
      return;
    }

    const isAvailable = await MailComposer.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert(
        "Email Not Available",
        "Email is not configured on this device. Please use the copy options instead.",
        [{ text: "OK" }]
      );
      return;
    }

    const csvContent = generateCSV();
    const fileName = `business-cards-${new Date().toISOString().split('T')[0]}.csv`;
    
    try {
      const exportDescription = selectedEventIds.length > 0 
        ? `from ${selectedEventIds.length} selected event(s)` 
        : 'from all events';
      
      await MailComposer.composeAsync({
        subject: `Business Cards Export - ${filteredCards.length} contacts ${exportDescription}`,
        body: `Please find attached ${filteredCards.length} business card contacts exported as a CSV file ${exportDescription}.\n\nYou can import this file directly into Google Sheets, Excel, or any other spreadsheet application.`,
        attachments: [{
          filename: fileName,
          content: csvContent,
          mimeType: 'text/csv',
        } as any],
      });
    } catch (error) {
      console.error('Email export error:', error);
      Alert.alert(
        "Export Error",
        "Failed to create email. Please try the copy option instead.",
        [{ text: "OK" }]
      );
    }
  };

  const toggleEventSelection = (eventId: string) => {
    setSelectedEventIds(prev => 
      prev.includes(eventId) 
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
    );
  };

  const selectAllEvents = () => {
    setSelectedEventIds(events.map(e => e.id));
  };

  const clearEventSelection = () => {
    setSelectedEventIds([]);
  };

  const ExportOption = ({ 
    title, 
    description, 
    icon, 
    onPress, 
    format 
  }: { 
    title: string; 
    description: string; 
    icon: React.ReactNode; 
    onPress: () => void;
    format?: string;
  }) => (
    <TouchableOpacity style={styles.exportOption} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.optionIcon}>
        <Text>{icon}</Text>
      </View>
      <View style={styles.optionContent}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionDescription}>{description}</Text>
      </View>
      {copiedFormat === format && (
        <CheckCircle size={24} color="#10B981" />
      )}
    </TouchableOpacity>
  );

  return (
    <>
      <Stack.Screen options={{ title: "Export Data" }} />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.statsCard}>
            <FileSpreadsheet size={32} color="#4128C5" />
            <Text style={styles.statsTitle}>Export Your Data</Text>
            <Text style={styles.statsCount}>
              {selectedEventIds.length > 0 
                ? `${filteredCards.length} of ${cards.length} business cards selected`
                : `${cards.length} business cards`
              }
            </Text>
            <Text style={styles.statsDescription}>
              {selectedEventIds.length > 0 
                ? `Exporting from ${selectedEventIds.length} selected event(s)`
                : 'Export your scanned business cards to import into Google Sheets or other applications'
              }
            </Text>
          </View>

          {cards.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                No cards to export yet. Scan some business cards first!
              </Text>
            </View>
          ) : (
            <View style={styles.exportOptions}>
              <Text style={styles.sectionTitle}>Filter by Events</Text>
              
              {/* Event Filter Section */}
              <View style={styles.filterSection}>
                <TouchableOpacity 
                  style={styles.filterToggle} 
                  onPress={() => setShowEventFilter(!showEventFilter)}
                  activeOpacity={0.7}
                >
                  <Calendar size={20} color="#4128C5" />
                  <Text style={styles.filterToggleText}>Select Events to Export</Text>
                  <Text style={styles.filterCount}>
                    {selectedEventIds.length > 0 ? `${selectedEventIds.length} selected` : 'All events'}
                  </Text>
                </TouchableOpacity>
                
                {showEventFilter && (
                  <View style={styles.eventFilterContainer}>
                    <View style={styles.filterActions}>
                      <TouchableOpacity onPress={selectAllEvents} style={styles.filterAction}>
                        <Text style={styles.filterActionText}>Select All</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={clearEventSelection} style={styles.filterAction}>
                        <Text style={styles.filterActionText}>Clear All</Text>
                      </TouchableOpacity>
                    </View>
                    
                    {events.map(event => {
                      const isSelected = selectedEventIds.includes(event.id);
                      const eventCards = cards.filter(card => (card.eventId || 'non-categorized') === event.id);
                      
                      return (
                        <TouchableOpacity
                          key={event.id}
                          style={[styles.eventOption, isSelected && styles.eventOptionSelected]}
                          onPress={() => toggleEventSelection(event.id)}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.eventColor, { backgroundColor: event.color }]} />
                          <View style={styles.eventInfo}>
                            <Text style={styles.eventName}>{event.name}</Text>
                            <Text style={styles.eventCardCount}>{eventCards.length} cards</Text>
                          </View>
                          <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                            {isSelected && <Check size={16} color="#FFFFFF" />}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

              <Text style={styles.sectionTitle}>Export Formats</Text>
              
              <ExportOption
                title="Copy as CSV"
                description={`Best for Google Sheets and Excel. ${filteredCards.length} cards will be exported.`}
                icon={<Copy size={24} color="#4128C5" />}
                onPress={() => handleCopyToClipboard('csv')}
                format="csv"
              />

              <ExportOption
                title="Email as CSV"
                description={`Send CSV file via email attachment. ${filteredCards.length} cards will be exported.`}
                icon={<Mail size={24} color="#4128C5" />}
                onPress={handleEmailExport}
              />

              <View style={styles.instructions}>
                <Text style={styles.instructionsTitle}>How to import to Google Sheets:</Text>
                <Text style={styles.instructionStep}>1. Copy data as CSV using the button above</Text>
                <Text style={styles.instructionStep}>2. Open Google Sheets in your browser</Text>
                <Text style={styles.instructionStep}>3. Select cell A1 and paste (Ctrl/Cmd + V)</Text>
                <Text style={styles.instructionStep}>4. Use &quot;Data → Split text to columns&quot; if needed</Text>
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6FAFE",
  },
  content: {
    padding: 16,
  },
  statsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1F2937",
    marginTop: 12,
    marginBottom: 8,
  },
  statsCount: {
    fontSize: 18,
    color: "#4128C5",
    fontWeight: "500",
    marginBottom: 8,
  },
  statsDescription: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
  exportOptions: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 8,
  },
  exportOption: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 18,
  },
  emptyState: {
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#9CA3AF",
    textAlign: "center",
  },
  instructions: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  instructionsTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 12,
  },
  instructionStep: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 20,
    marginBottom: 6,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterToggle: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  filterToggleText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginLeft: 12,
    flex: 1,
  },
  filterCount: {
    fontSize: 14,
    color: "#6B7280",
  },
  eventFilterContainer: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  filterActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  filterAction: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  filterActionText: {
    fontSize: 14,
    color: "#4128C5",
    fontWeight: "500",
  },
  eventOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  eventOptionSelected: {
    borderColor: "#4128C5",
    backgroundColor: "#F8FAFF",
  },
  eventColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  eventInfo: {
    flex: 1,
  },
  eventName: {
    fontSize: 15,
    fontWeight: "500",
    color: "#1F2937",
    marginBottom: 2,
  },
  eventCardCount: {
    fontSize: 13,
    color: "#6B7280",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxSelected: {
    backgroundColor: "#4128C5",
    borderColor: "#4128C5",
  },
});