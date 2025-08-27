import { Stack } from "expo-router";

export default function SettingsLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
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