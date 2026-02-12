import { Stack } from "expo-router";
import { useLayout } from "@/providers/LayoutProvider";

export default function SettingsLayout() {
  const { showDesktopLayout } = useLayout();

  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          headerShown: !showDesktopLayout,
          title: "Settings",
          headerStyle: {
            backgroundColor: '#f8f9fa',
          },
          headerTintColor: '#1F2937',
        }} 
      />
    </Stack>
  );
}
