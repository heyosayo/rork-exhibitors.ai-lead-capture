import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useFonts, Poppins_600SemiBold, Poppins_700Bold } from "@expo-google-fonts/poppins";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { CardProvider } from "@/providers/CardProvider";
import { EventProvider } from "@/providers/EventProvider";
import { AuthProvider, useAuth } from "@/providers/AuthProvider";
import { LayoutProvider } from "@/providers/LayoutProvider";
import { trpc, trpcClient } from "@/lib/trpc";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) {
      console.log("Auth still loading, waiting...");
      return;
    }

    console.log("Auth loaded, hiding splash screen");
    SplashScreen.hideAsync();

    const inAuthGroup = segments[0] === ("login" as string) || segments[0] === ("signup" as string);

    if (!isAuthenticated && !inAuthGroup) {
      console.log("Not authenticated, redirecting to login");
      router.replace("/login" as any);
    } else if (isAuthenticated && inAuthGroup) {
      console.log("Authenticated, redirecting to home");
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, segments, router]);

  return <>{children}</>;
}

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen 
        name="login" 
        options={{ 
          headerShown: false,
          gestureEnabled: false,
        }} 
      />
      <Stack.Screen 
        name="signup" 
        options={{ 
          headerShown: false,
        }} 
      />
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
      <Stack.Screen 
        name="admin" 
        options={{ 
          headerShown: false,
        }} 
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      console.log("Poppins fonts loaded");
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <AuthProvider>
            <AuthGate>
              <LayoutProvider>
                <EventProvider>
                  <CardProvider>
                    <RootLayoutNav />
                  </CardProvider>
                </EventProvider>
              </LayoutProvider>
            </AuthGate>
          </AuthProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
