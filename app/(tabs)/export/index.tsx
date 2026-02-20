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
    return cards.filter(card => selectedEventIds.includes(card.eventId || 'non-categorized'));
  }, [cards, selectedEventIds]);

  const generateCSV = () => {
    const headers = ["Name", "Title", "Company", "Email", "Phone", "Website", "Address", "Notes", "Event", "Timestamp"];
    const rows = filteredCards.map(card => {
      const event = events.find(e => e.id === (card.eventId || 'non-categorized'));
      return [card.name || "", card.title || "", card.company || "", card.email || "", card.phone || "", card.website || "", card.address || "", card.notes || "", event?.name || "Non-Categorized", card.createdAt ? new Date(card.createdAt).toLocaleString() : ""];
    });
    return [headers.join(","), ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(","))].join("\n");
  };

  const handleCopyToClipboard = async (format: 'csv' | 'json') => {
    const content = format === 'csv' ? generateCSV() : JSON.stringify(filteredCards.map(card => {
      const event = events.find(e => e.id === (card.eventId || 'non-categorized'));
      return { name: card.name, title: card.title, company: card.company, email: card.email, phone: card.phone, website: card.website, address: card.address, notes: card.notes, event: event?.name || "Non-Categorized", timestamp: card.createdAt ? new Date(card.createdAt).toLocaleString() : null };
    }), null, 2);
    await Clipboard.setStringAsync(content);
    setCopiedFormat(format);
    setTimeout(() => setCopiedFormat(null), 2000);
    Alert.alert("Copied!", `${format.toUpperCase()} data copied to clipboard.`);
  };

  const sendEmailExport = async () => {
    if (!recipientEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail.trim())) {
      Alert.alert("Error", "Please enter a valid email address.");
      return;
    }
    if (Platform.OS === 'web') {
      Alert.alert("Email Export", "Email export is not available on web. Please use copy options instead.");
      setShowEmailModal(false);
      return;
    }
    const isAvailable = await MailComposer.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert("Email Not Available", "Email is not configured on this device.");
      setShowEmailModal(false);
      return;
    }
    setIsSending(true);
    try {
      const csvContent = generateCSV();
      const desc = selectedEventIds.length > 0 ? `from ${selectedEventIds.length} selected event(s)` : 'from all events';
      await MailComposer.composeAsync({
        recipients: [recipientEmail.trim()],
        subject: `Business Cards Export - ${filteredCards.length} contacts ${desc}`,
        body: `Please find attached ${filteredCards.length} business card contacts exported as CSV ${desc}.`,
        attachments: [{ filename: `business-cards-${new Date().toISOString().split('T')[0]}.csv`, content: csvContent, mimeType: 'text/csv' } as any],
      });
      setShowEmailModal(false);
      setRecipientEmail('');
    } catch (error) {
      console.error('Email export error:', error);
      Alert.alert("Export Error", "Failed to create email.");
    } finally {
      setIsSending(false);
    }
  };

  const handleGoogleSheetsExport = async () => {
    if (filteredCards.length === 0) { Alert.alert("No Cards", "There are no cards to export."); return; }
    setIsExportingToSheets(true);
    try {
      const rows = filteredCards.map(card => {
        const event = events.find(e => e.id === (card.eventId || 'non-categorized'));
        return { name: card.name || "", title: card.title || "", company: card.company || "", email: card.email || "", phone: card.phone || "", website: card.website || "", address: card.address || "", notes: card.notes || "", event: event?.name || "Non-Categorized", timestamp: card.createdAt ? new Date(card.createdAt).toLocaleString() : new Date().toLocaleString() };
      });
      await fetch('https://script.google.com/macros/s/AKfycbwYourScriptIdHere/exec', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sheetId: GOOGLE_SHEET_ID, data: rows }), mode: 'no-cors' });
      Alert.alert("Export Initiated", `${filteredCards.length} cards sent to Google Sheets.`, [{ text: "View Sheet", onPress: () => Linking.openURL(GOOGLE_SHEET_URL) }, { text: "OK" }]);
    } catch (error) {
      console.error('Google Sheets export error:', error);
      Alert.alert("Export Option", "Copy as CSV and paste into the sheet.", [{ text: "Open Sheet", onPress: () => Linking.openURL(GOOGLE_SHEET_URL) }, { text: "Copy CSV", onPress: () => handleCopyToClipboard('csv') }, { text: "Cancel", style: "cancel" }]);
    } finally {
      setIsExportingToSheets(false);
    }
  };

  const toggleEventSelection = (eventId: string) => {
    setSelectedEventIds(prev => prev.includes(eventId) ? prev.filter(id => id !== eventId) : [...prev, eventId]);
  };

  return (
    <SafeAreaView style={s.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.statsCard}>
          <FileSpreadsheet size={32} color="#4128C5" />
          <Text style={s.statsTitle}>Export Your Data</Text>
          <Text style={s.statsCount}>
            {selectedEventIds.length > 0 ? `${filteredCards.length} of ${cards.length} business cards selected` : `${cards.length} business cards`}
          </Text>
          <Text style={s.statsDesc}>
            {selectedEventIds.length > 0 ? `Exporting from ${selectedEventIds.length} selected event(s)` : 'Export your scanned business cards'}
          </Text>
        </View>

        {cards.length === 0 ? (
          <View style={s.emptyState}><Text style={s.emptyText}>No cards to export yet. Scan some business cards first!</Text></View>
        ) : (
          <>
            <Text style={s.sectionTitle}>Export Formats</Text>
            <ExportOption title="Copy as CSV" description={`Best for Google Sheets. ${filteredCards.length} cards.`} icon={<Copy size={24} color="#4128C5" />} onPress={() => handleCopyToClipboard('csv')} isCopied={copiedFormat === 'csv'} />
            <ExportOption title="Email as CSV" description={`Send CSV via email. ${filteredCards.length} cards.`} icon={<Mail size={24} color="#4128C5" />} onPress={() => setShowEmailModal(true)} />
            <ExportOption title="Export to Google Sheets" description={`Send ${filteredCards.length} cards to Google Sheet.`} icon={isExportingToSheets ? <CheckCircle size={24} color="#10B981" /> : <Cloud size={24} color="#4128C5" />} onPress={handleGoogleSheetsExport} />
            <TouchableOpacity style={s.viewSheetLink} onPress={() => Linking.openURL(GOOGLE_SHEET_URL)}>
              <ExternalLink size={16} color="#4128C5" />
              <Text style={s.viewSheetText}>View Google Sheet</Text>
            </TouchableOpacity>

            <Text style={s.sectionTitle}>Filter by Events</Text>
            <TouchableOpacity style={s.filterToggle} onPress={() => setShowEventFilter(!showEventFilter)}>
              <Calendar size={20} color="#4128C5" />
              <Text style={s.filterToggleText}>Select Events to Export</Text>
              <Text style={s.filterCount}>{selectedEventIds.length > 0 ? `${selectedEventIds.length} selected` : 'All events'}</Text>
            </TouchableOpacity>
            {showEventFilter && (
              <View style={s.eventFilterContainer}>
                <View style={s.filterActions}>
                  <TouchableOpacity onPress={() => setSelectedEventIds(events.map(e => e.id))} style={s.filterAction}><Text style={s.filterActionText}>Select All</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => setSelectedEventIds([])} style={s.filterAction}><Text style={s.filterActionText}>Clear All</Text></TouchableOpacity>
                </View>
                {events.map(event => {
                  const isSelected = selectedEventIds.includes(event.id);
                  const count = cards.filter(c => (c.eventId || 'non-categorized') === event.id).length;
                  return (
                    <TouchableOpacity key={event.id} style={[s.eventOption, isSelected && s.eventOptionSelected]} onPress={() => toggleEventSelection(event.id)}>
                      <View style={[s.eventColor, { backgroundColor: event.color }]} />
                      <View style={{ flex: 1 }}><Text style={s.eventName}>{event.name}</Text><Text style={s.eventCardCount}>{count} cards</Text></View>
                      <View style={[s.checkbox, isSelected && s.checkboxSelected]}>{isSelected && <Check size={16} color="#FFFFFF" />}</View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
            <View style={s.instructions}>
              <Text style={s.instructionsTitle}>How to import to Google Sheets:</Text>
              <Text style={s.instructionStep}>1. Copy data as CSV using the button above</Text>
              <Text style={s.instructionStep}>2. Open Google Sheets in your browser</Text>
              <Text style={s.instructionStep}>3. Select cell A1 and paste (Ctrl/Cmd + V)</Text>
              <Text style={s.instructionStep}>4. Use "Data → Split text to columns" if needed</Text>
            </View>
          </>
        )}
      </ScrollView>

      <Modal visible={showEmailModal} transparent animationType="fade" onRequestClose={() => setShowEmailModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Send Export via Email</Text>
              <TouchableOpacity onPress={() => { setShowEmailModal(false); setRecipientEmail(''); }} style={{ padding: 4 }}><X size={24} color="#6B7280" /></TouchableOpacity>
            </View>
            <Text style={s.modalDesc}>Enter the email address to send {filteredCards.length} business cards as CSV.</Text>
            <View style={s.inputContainer}>
              <Mail size={20} color="#6B7280" style={{ marginRight: 12 }} />
              <TextInput style={s.emailInput} placeholder="Enter email address" placeholderTextColor="#9CA3AF" value={recipientEmail} onChangeText={setRecipientEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoFocus />
            </View>
            <View style={s.modalActions}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => { setShowEmailModal(false); setRecipientEmail(''); }}><Text style={s.cancelBtnText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[s.sendBtn, isSending && { backgroundColor: '#9CA3AF' }]} onPress={sendEmailExport} disabled={isSending}>
                <Send size={18} color="#FFFFFF" />
                <Text style={s.sendBtnText}>{isSending ? 'Sending...' : 'Send Export'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function ExportOption({ title, description, icon, onPress, isCopied }: { title: string; description: string; icon: React.ReactNode; onPress: () => void; isCopied?: boolean }) {
  return (
    <TouchableOpacity style={s.exportOption} onPress={onPress} activeOpacity={0.7}>
      <View style={s.optionIcon}>{icon}</View>
      <View style={{ flex: 1 }}><Text style={s.optionTitle}>{title}</Text><Text style={s.optionDesc}>{description}</Text></View>
      {isCopied && <CheckCircle size={24} color="#10B981" />}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F6FAFE" },
  content: { padding: 16 },
  statsCard: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 24, alignItems: "center", marginBottom: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3 },
  statsTitle: { fontSize: 24, fontWeight: "600" as const, color: "#1F2937", marginTop: 12, marginBottom: 8 },
  statsCount: { fontSize: 18, color: "#4128C5", fontWeight: "500" as const, marginBottom: 8 },
  statsDesc: { fontSize: 14, color: "#6B7280", textAlign: "center", lineHeight: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "600" as const, color: "#1F2937", marginBottom: 8, marginTop: 8 },
  exportOption: { backgroundColor: "#FFFFFF", borderRadius: 12, padding: 16, flexDirection: "row", alignItems: "center", marginBottom: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  optionIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#EEF2FF", justifyContent: "center", alignItems: "center", marginRight: 16 },
  optionTitle: { fontSize: 16, fontWeight: "600" as const, color: "#1F2937", marginBottom: 4 },
  optionDesc: { fontSize: 14, color: "#6B7280", lineHeight: 18 },
  emptyState: { padding: 32, alignItems: "center" },
  emptyText: { fontSize: 16, color: "#9CA3AF", textAlign: "center" },
  viewSheetLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 8 },
  viewSheetText: { fontSize: 14, color: '#4128C5', fontWeight: '500' as const },
  filterToggle: { backgroundColor: "#FFFFFF", borderRadius: 12, padding: 16, flexDirection: "row", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, marginBottom: 12 },
  filterToggleText: { fontSize: 16, fontWeight: "600" as const, color: "#1F2937", marginLeft: 12, flex: 1 },
  filterCount: { fontSize: 14, color: "#6B7280" },
  eventFilterContainer: { backgroundColor: "#F9FAFB", borderRadius: 12, padding: 16, marginBottom: 12 },
  filterActions: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  filterAction: { paddingVertical: 8, paddingHorizontal: 16, backgroundColor: "#FFFFFF", borderRadius: 8, borderWidth: 1, borderColor: "#E5E7EB" },
  filterActionText: { fontSize: 14, color: "#4128C5", fontWeight: "500" as const },
  eventOption: { flexDirection: "row", alignItems: "center", padding: 12, backgroundColor: "#FFFFFF", borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: "#E5E7EB" },
  eventOptionSelected: { borderColor: "#4128C5", backgroundColor: "#F8FAFF" },
  eventColor: { width: 16, height: 16, borderRadius: 8, marginRight: 12 },
  eventName: { fontSize: 15, fontWeight: "500" as const, color: "#1F2937", marginBottom: 2 },
  eventCardCount: { fontSize: 13, color: "#6B7280" },
  checkbox: { width: 24, height: 24, borderRadius: 4, borderWidth: 2, borderColor: "#D1D5DB", justifyContent: "center", alignItems: "center" },
  checkboxSelected: { backgroundColor: "#4128C5", borderColor: "#4128C5" },
  instructions: { backgroundColor: "#F9FAFB", borderRadius: 12, padding: 16, marginTop: 16 },
  instructionsTitle: { fontSize: 15, fontWeight: "600" as const, color: "#1F2937", marginBottom: 12 },
  instructionStep: { fontSize: 14, color: "#4B5563", lineHeight: 20, marginBottom: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, width: '100%', maxWidth: 400 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '600' as const, color: '#1F2937' },
  modalDesc: { fontSize: 14, color: '#6B7280', lineHeight: 20, marginBottom: 20 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 16, marginBottom: 24 },
  emailInput: { flex: 1, paddingVertical: 14, fontSize: 16, color: '#1F2937' },
  modalActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#F3F4F6', alignItems: 'center' },
  cancelBtnText: { fontSize: 16, fontWeight: '600' as const, color: '#6B7280' },
  sendBtn: { flex: 1, flexDirection: 'row', paddingVertical: 14, borderRadius: 12, backgroundColor: '#4128C5', alignItems: 'center', justifyContent: 'center', gap: 8 },
  sendBtnText: { fontSize: 16, fontWeight: '600' as const, color: '#FFFFFF' },
});
