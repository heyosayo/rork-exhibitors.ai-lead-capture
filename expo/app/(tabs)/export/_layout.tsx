import { Stack } from "expo-router";

export default function ExportLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
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
