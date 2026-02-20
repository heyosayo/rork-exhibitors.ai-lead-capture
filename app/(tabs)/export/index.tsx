import React, { useState, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
  Modal,
  TextInput,
  KeyboardAvoidingView,
} from "react-native";
import { FileSpreadsheet, Copy, CheckCircle, Mail, Calendar, Check, X, Send, Cloud, ExternalLink } from "lucide-react-native";
import * as Linking from 'expo-linking';
import { useCards } from "@/providers/CardProvider";
import { useEvents } from "@/providers/EventProvider";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Clipboard from 'expo-clipboard';
import * as MailComposer from 'expo-mail-composer';


export default function ExportScreen() {
  const { cards } = useCards();
  const { events } = useEvents();

  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [showEventFilter, setShowEventFilter] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isExportingToSheets, setIsExportingToSheets] = useState(false);

  const GOOGLE_SHEET_ID = '1PLlMziq0C9GQGKJAzCbxWIS2SMctPF1aarVXZePFyXI';
  const GOOGLE_SHEET_URL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/edit`;

  const filteredCards = useMemo(() => {
    if (selectedEventIds.length === 0) return cards;
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

  const handleEmailExport = () => {
    setShowEmailModal(true);
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const sendEmailExport = async () => {
    if (!recipientEmail.trim()) {
      Alert.alert("Error", "Please enter an email address.");
      return;
    }
    if (!validateEmail(recipientEmail.trim())) {
      Alert.alert("Error", "Please enter a valid email address.");
      return;
    }
    if (Platform.OS === 'web') {
      Alert.alert("Email Export", "Email export is not available on web. Please use the copy options instead.", [{ text: "OK" }]);
      setShowEmailModal(false);
      return;
    }
    const isAvailable = await MailComposer.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert("Email Not Available", "Email is not configured on this device. Please use the copy options instead.", [{ text: "OK" }]);
      setShowEmailModal(false);
      return;
    }
    setIsSending(true);
    const csvContent = generateCSV();
    const fileName = `business-cards-${new Date().toISOString().split('T')[0]}.csv`;
    try {
      const exportDescription = selectedEventIds.length > 0
        ? `from ${selectedEventIds.length} selected event(s)`
        : 'from all events';
      await MailComposer.composeAsync({
        recipients: [recipientEmail.trim()],
        subject: `Business Cards Export - ${filteredCards.length} contacts ${exportDescription}`,
        body: `Please find attached ${filteredCards.length} business card contacts exported as a CSV file ${exportDescription}.\n\nYou can import this file directly into Google Sheets, Excel, or any other spreadsheet application.`,
        attachments: [{
          filename: fileName,
          content: csvContent,
          mimeType: 'text/csv',
        } as any],
      });
      setShowEmailModal(false);
      setRecipientEmail('');
    } catch (error) {
      console.error('Email export error:', error);
      Alert.alert("Export Error", "Failed to create email. Please try the copy option instead.", [{ text: "OK" }]);
    } finally {
      setIsSending(false);
    }
  };

  const handleGoogleSheetsExport = async () => {
    if (filteredCards.length === 0) {
      Alert.alert("No Cards", "There are no cards to export.");
      return;
    }
    setIsExportingToSheets(true);
    try {
      const rows = filteredCards.map(card => {
        const event = events.find(e => e.id === (card.eventId || 'non-categorized'));
        return {
          name: card.name || "",
          title: card.title || "",
          company: card.company || "",
          email: card.email || "",
          phone: card.phone || "",
          website: card.website || "",
          address: card.address || "",
          notes: card.notes || "",
          event: event?.name || "Non-Categorized",
          timestamp: card.createdAt ? new Date(card.createdAt).toLocaleString() : new Date().toLocaleString(),
        };
      });
      const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwYourScriptIdHere/exec';
      await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetId: GOOGLE_SHEET_ID, data: rows }),
        mode: 'no-cors',
      });
      Alert.alert(
        "Export Initiated",
        `${filteredCards.length} cards have been sent to Google Sheets. Please check the sheet to verify the data was added.`,
        [
          { text: "View Sheet", onPress: () => Linking.openURL(GOOGLE_SHEET_URL) },
          { text: "OK" }
        ]
      );
    } catch (error) {
      console.error('Google Sheets export error:', error);
      Alert.alert(
        "Export Option",
        "To export directly to Google Sheets, you can:\n\n1. Copy as CSV and paste into the sheet\n2. Use Email export to send to yourself\n\nWould you like to open the Google Sheet now?",
        [
          { text: "Open Sheet", onPress: () => Linking.openURL(GOOGLE_SHEET_URL) },
          { text: "Copy CSV", onPress: () => handleCopyToClipboard('csv') },
          { text: "Cancel", style: "cancel" }
        ]
      );
    } finally {
      setIsExportingToSheets(false);
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
      <View style={styles.optionIcon}>{icon}</View>
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
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View>
          <View>
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
                <Text style={styles.emptyText}>No cards to export yet. Scan some business cards first!</Text>
              </View>
            ) : (
              <View style={styles.exportOptions}>
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
                <ExportOption
                  title="Export to Google Sheets"
                  description={`Send ${filteredCards.length} cards directly to the connected Google Sheet.`}
                  icon={isExportingToSheets ? <CheckCircle size={24} color="#10B981" /> : <Cloud size={24} color="#4128C5" />}
                  onPress={handleGoogleSheetsExport}
                />
                <TouchableOpacity
                  style={styles.viewSheetLink}
                  onPress={() => Linking.openURL(GOOGLE_SHEET_URL)}
                  activeOpacity={0.7}
                >
                  <ExternalLink size={16} color="#4128C5" />
                  <Text style={styles.viewSheetText}>View Google Sheet</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View>
            {cards.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Filter by Events</Text>
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

                <View style={styles.instructions}>
                  <Text style={styles.instructionsTitle}>How to import to Google Sheets:</Text>
                  <Text style={styles.instructionStep}>1. Copy data as CSV using the button above</Text>
                  <Text style={styles.instructionStep}>2. Open Google Sheets in your browser</Text>
                  <Text style={styles.instructionStep}>3. Select cell A1 and paste (Ctrl/Cmd + V)</Text>
                  <Text style={styles.instructionStep}>4. Use &quot;Data → Split text to columns&quot; if needed</Text>
                </View>
              </>
            )}
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showEmailModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEmailModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Send Export via Email</Text>
              <TouchableOpacity
                onPress={() => { setShowEmailModal(false); setRecipientEmail(''); }}
                style={styles.closeButton}
              >
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalDescription}>
              Enter the email address where you would like to send the CSV export of {filteredCards.length} business cards.
            </Text>
            <View style={styles.inputContainer}>
              <Mail size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.emailInput}
                placeholder="Enter email address"
                placeholderTextColor="#9CA3AF"
                value={recipientEmail}
                onChangeText={setRecipientEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
              />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => { setShowEmailModal(false); setRecipientEmail(''); }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sendButton, isSending && styles.sendButtonDisabled]}
                onPress={sendEmailExport}
                disabled={isSending}
              >
                <Send size={18} color="#FFFFFF" />
                <Text style={styles.sendButtonText}>
                  {isSending ? 'Sending...' : 'Send Export'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
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
    fontWeight: "600" as const,
    color: "#1F2937",
    marginTop: 12,
    marginBottom: 8,
  },
  statsCount: {
    fontSize: 18,
    color: "#4128C5",
    fontWeight: "500" as const,
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
    fontWeight: "600" as const,
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
    fontWeight: "600" as const,
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
    marginTop: 16,
  },
  instructionsTitle: {
    fontSize: 15,
    fontWeight: "600" as const,
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
    fontWeight: "600" as const,
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
    fontWeight: "500" as const,
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
    fontWeight: "500" as const,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  modalDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  inputIcon: {
    marginRight: 12,
  },
  emailInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1F2937',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  sendButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#4128C5',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  viewSheetLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  viewSheetText: {
    fontSize: 14,
    color: '#4128C5',
    fontWeight: '500' as const,
  },
});
