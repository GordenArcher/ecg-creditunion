import {
  DarkTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "react-native";

export const unstable_settings = {
  initialRouteName: "login",
};

function RootLayoutNav() {
  return (
    <NavigationThemeProvider
      value={{
        ...DarkTheme,
        colors: { ...DarkTheme.colors, background: "#000000" },
      }}
    >
      <Stack>
        <Stack.Screen
          name="login"
          options={{ headerShown: false, gestureEnabled: false }}
        />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="onboarding/account-setup"
          options={{ headerShown: false, gestureEnabled: false }}
        />
      </Stack>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  return <RootLayoutNav />;
}
