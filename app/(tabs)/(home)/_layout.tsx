import { Stack } from "expo-router";
import { useLayout } from "@/providers/LayoutProvider";

export default function HomeLayout() {
  const { showDesktopLayout } = useLayout();

  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          headerShown: false,
        }} 
      />
    </Stack>
  );
}
