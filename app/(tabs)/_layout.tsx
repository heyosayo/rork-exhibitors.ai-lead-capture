import { Tabs } from "expo-router";
import { CreditCard, Settings, Calendar } from "lucide-react-native";
import React from "react";
import { View, StyleSheet } from "react-native";
import DesktopSidebar from "@/components/DesktopSidebar";
import { useLayout } from "@/providers/LayoutProvider";

export default function TabLayout() {
  const { showDesktopLayout } = useLayout();

  if (showDesktopLayout) {
    return (
      <View style={styles.desktopContainer}>
        <DesktopSidebar />
        <View style={styles.desktopContent}>
          <Tabs
            screenOptions={{
              tabBarActiveTintColor: "#4F46E5",
              tabBarInactiveTintColor: "#9CA3AF",
              headerShown: false,
              tabBarStyle: { display: "none" },
            }}
          >
            <Tabs.Screen
              name="(home)"
              options={{
                title: "Cards",
                tabBarIcon: ({ color }) => <CreditCard size={24} color={color} />,
              }}
            />
            <Tabs.Screen
              name="events"
              options={{
                title: "Events",
                tabBarIcon: ({ color }) => <Calendar size={24} color={color} />,
              }}
            />
            <Tabs.Screen
              name="settings"
              options={{
                title: "Settings",
                tabBarIcon: ({ color }) => <Settings size={24} color={color} />,
              }}
            />
            <Tabs.Screen
              name="export"
              options={{
                href: null,
              }}
            />
          </Tabs>
        </View>
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#4F46E5",
        tabBarInactiveTintColor: "#9CA3AF",
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#E5E7EB',
          borderTopWidth: 1,
        },
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: "Cards",
          tabBarIcon: ({ color }) => <CreditCard size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: "Events",
          tabBarIcon: ({ color }) => <Calendar size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => <Settings size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="export"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  desktopContainer: {
    flex: 1,
    flexDirection: "row",
  },
  desktopContent: {
    flex: 1,
  },
});
