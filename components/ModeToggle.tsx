import React from "react";
import { StyleSheet, Text, View, TouchableOpacity, Platform } from "react-native";
import { Monitor, Smartphone } from "lucide-react-native";
import { useLayout } from "@/providers/LayoutProvider";

export default function ModeToggle() {
  const { mode, setLayoutMode } = useLayout();

  if (Platform.OS !== "web") return null;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.option, mode === "desktop" && styles.optionActive]}
        onPress={() => setLayoutMode("desktop")}
        activeOpacity={0.7}
        testID="mode-toggle-desktop"
      >
        <Monitor size={16} color={mode === "desktop" ? "#FFFFFF" : "#6B7280"} />
        <Text style={[styles.optionText, mode === "desktop" && styles.optionTextActive]}>
          Desktop
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.option, mode === "mobile" && styles.optionActive]}
        onPress={() => setLayoutMode("mobile")}
        activeOpacity={0.7}
        testID="mode-toggle-mobile"
      >
        <Smartphone size={16} color={mode === "mobile" ? "#FFFFFF" : "#6B7280"} />
        <Text style={[styles.optionText, mode === "mobile" && styles.optionTextActive]}>
          Mobile
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    padding: 3,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 6,
  },
  optionActive: {
    backgroundColor: "#4128C5",
  },
  optionText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: "#6B7280",
  },
  optionTextActive: {
    color: "#FFFFFF",
  },
});
