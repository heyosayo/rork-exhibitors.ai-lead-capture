import { Stack } from "expo-router";
import { useLayout } from "@/providers/LayoutProvider";

export default function EventsLayout() {
  const { showDesktopLayout } = useLayout();

  return (
    <Stack
      screenOptions={{
        headerShown: !showDesktopLayout,
        headerStyle: {
          backgroundColor: '#4128C5',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ 
          title: "Events",
        }} 
      />
    </Stack>
  );
}
