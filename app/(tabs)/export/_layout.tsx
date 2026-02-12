import { Stack } from "expo-router";
import { useLayout } from "@/providers/LayoutProvider";

export default function ExportLayout() {
  const { showDesktopLayout } = useLayout();

  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          headerShown: !showDesktopLayout,
          title: "Export",
          headerStyle: {
            backgroundColor: '#f8f9fa',
          },
          headerTintColor: '#1F2937',
        }} 
      />
    </Stack>
  );
}
