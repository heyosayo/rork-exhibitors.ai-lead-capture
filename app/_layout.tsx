import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { CardProvider } from "@/providers/CardProvider";
import { EventProvider } from "@/providers/EventProvider";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen 
        name="scan" 
        options={{ 
          presentation: "modal",
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="card/[id]" 
        options={{ 
          title: "Contact Details",
          headerStyle: {
            backgroundColor: '#f8f9fa',
          },
        }} 
      />
      <Stack.Screen 
        name="event-details" 
        options={{ 
          headerShown: false,
        }} 
      />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <EventProvider>
          <CardProvider>
            <RootLayoutNav />
          </CardProvider>
        </EventProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}