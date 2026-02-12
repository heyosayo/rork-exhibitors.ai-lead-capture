import React from "react";
import { StyleSheet, Text, View, TouchableOpacity, Image } from "react-native";
import { CreditCard, Calendar, Settings, FileSpreadsheet, Users } from "lucide-react-native";
import { router, useSegments } from "expo-router";
import ModeToggle from "@/components/ModeToggle";

interface NavItem {
  label: string;
  icon: React.ReactNode;
  activeIcon: React.ReactNode;
  route: string;
  segment: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Cards",
    icon: <CreditCard size={22} color="#6B7280" />,
    activeIcon: <CreditCard size={22} color="#4128C5" />,
    route: "/",
    segment: "(home)",
  },
  {
    label: "Events",
    icon: <Calendar size={22} color="#6B7280" />,
    activeIcon: <Calendar size={22} color="#4128C5" />,
    route: "/(tabs)/events",
    segment: "events",
  },
  {
    label: "Export",
    icon: <FileSpreadsheet size={22} color="#6B7280" />,
    activeIcon: <FileSpreadsheet size={22} color="#4128C5" />,
    route: "/(tabs)/export",
    segment: "export",
  },
  {
    label: "Settings",
    icon: <Settings size={22} color="#6B7280" />,
    activeIcon: <Settings size={22} color="#4128C5" />,
    route: "/(tabs)/settings",
    segment: "settings",
  },
];

export default function DesktopSidebar() {
  const segments = useSegments();
  const currentSegment = segments[1] || "(home)";

  const handleNavPress = (route: string) => {
    router.push(route as any);
  };

  return (
    <View style={styles.sidebar}>
      <View style={styles.logoSection}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>Exhibitor Tech</Text>
        </View>
        <View style={styles.toggleWrapper}>
          <ModeToggle />
        </View>
      </View>

      <View style={styles.navSection}>
        {NAV_ITEMS.map((item) => {
          const isActive = currentSegment === item.segment;
          return (
            <TouchableOpacity
              key={item.segment}
              style={[styles.navItem, isActive && styles.navItemActive]}
              onPress={() => handleNavPress(item.route)}
              activeOpacity={0.7}
            >
              <View style={[styles.navIconWrap, isActive && styles.navIconWrapActive]}>
                {isActive ? item.activeIcon : item.icon}
              </View>
              <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                {item.label}
              </Text>
              {isActive && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={styles.adminButton}
          onPress={() => router.push("/admin" as any)}
          activeOpacity={0.7}
        >
          <Users size={20} color="#6B7280" />
          <Text style={styles.adminText}>Admin Panel</Text>
        </TouchableOpacity>

        <View style={styles.brandingContainer}>
          <Image
            source={{ uri: "https://exhibitors.ai/logo.png" }}
            style={styles.brandLogo}
            resizeMode="contain"
          />
          <Text style={styles.poweredBy}>Powered by Exhibitors.ai</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 260,
    backgroundColor: "#FFFFFF",
    borderRightWidth: 1,
    borderRightColor: "#E5E7EB",
    paddingTop: 0,
    paddingBottom: 20,
  },
  logoSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    gap: 16,
  },
  logoContainer: {
    backgroundColor: "#4128C5",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  logoText: {
    fontSize: 20,
    fontFamily: "Poppins_700Bold",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  toggleWrapper: {
    alignItems: "center",
  },
  navSection: {
    flex: 1,
    paddingTop: 12,
    paddingHorizontal: 12,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 4,
    position: "relative" as const,
  },
  navItemActive: {
    backgroundColor: "#F0EDFF",
  },
  navIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  navIconWrapActive: {
    backgroundColor: "#E8E4FF",
  },
  navLabel: {
    fontSize: 15,
    fontWeight: "500" as const,
    color: "#6B7280",
    flex: 1,
  },
  navLabelActive: {
    color: "#4128C5",
    fontWeight: "600" as const,
  },
  activeIndicator: {
    width: 4,
    height: 20,
    borderRadius: 2,
    backgroundColor: "#4128C5",
    position: "absolute" as const,
    right: 0,
  },
  bottomSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    gap: 16,
  },
  adminButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 12,
  },
  adminText: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: "#6B7280",
  },
  brandingContainer: {
    alignItems: "center",
    paddingTop: 8,
  },
  brandLogo: {
    width: 100,
    height: 24,
    marginBottom: 4,
  },
  poweredBy: {
    fontSize: 11,
    color: "#9CA3AF",
  },
});
