import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { Trash2, Info, Shield, ChevronRight, FileSpreadsheet } from "lucide-react-native";
import { useCards } from "@/providers/CardProvider";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

export default function SettingsScreen() {
  const { cards, clearAllCards } = useCards();

  const handleClearData = () => {
    Alert.alert(
      "Clear All Data",
      `This will permanently delete all ${cards.length} scanned business cards. This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete All", 
          style: "destructive",
          onPress: clearAllCards
        }
      ]
    );
  };

  const SettingItem = ({ 
    icon, 
    title, 
    description, 
    onPress, 
    destructive = false 
  }: { 
    icon: React.ReactNode; 
    title: string; 
    description?: string; 
    onPress?: () => void;
    destructive?: boolean;
  }) => (
    <TouchableOpacity 
      style={styles.settingItem} 
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={[styles.settingIcon, destructive && styles.destructiveIcon]}>
        {icon}
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, destructive && styles.destructiveText]}>
          {title}
        </Text>
        {description && (
          <Text style={styles.settingDescription}>{description}</Text>
        )}
      </View>
      {onPress && <ChevronRight size={20} color="#9CA3AF" />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon={<FileSpreadsheet size={20} color="#4F46E5" />}
              title="Export Your Data"
              description="Export business cards to CSV or email"
              onPress={() => router.push('/export')}
            />
            <SettingItem
              icon={<Trash2 size={20} color="#EF4444" />}
              title="Clear All Data"
              description={`Delete all ${cards.length} scanned business cards`}
              onPress={handleClearData}
              destructive
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon={<Shield size={20} color="#4F46E5" />}
              title="Data Storage"
              description="All data is stored locally on your device"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon={<Info size={20} color="#4F46E5" />}
              title="Business Card Scanner"
              description="Version 1.0.0"
            />
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>How it works</Text>
          <Text style={styles.infoText}>
            1. Take a photo of a business card or name badge{'\n'}
            2. AI automatically extracts contact information{'\n'}
            3. Review and edit the extracted data{'\n'}
            4. Export to CSV for Google Sheets import
          </Text>
        </View>
      </ScrollView>
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  destructiveIcon: {
    backgroundColor: "#FEE2E2",
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1F2937",
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: "#6B7280",
  },
  destructiveText: {
    color: "#EF4444",
  },
  infoCard: {
    backgroundColor: "#EEF2FF",
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4F46E5",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 20,
  },
});