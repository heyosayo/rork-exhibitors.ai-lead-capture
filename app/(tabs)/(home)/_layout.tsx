import { Stack } from "expo-router";

export default function HomeLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: "Business Cards",
          headerStyle: {
            backgroundColor: '#f8f9fa',
          },
          headerTintColor: '#1F2937',
        }} 
      />
    </Stack>
  );
}