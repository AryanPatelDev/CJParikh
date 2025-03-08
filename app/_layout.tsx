import { Stack } from "expo-router";
import { ThemeProvider } from "./context/ThemeContext";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useContext } from "react";
import { ThemeContext } from "./context/ThemeContext";
import { View } from "react-native";

function RootLayoutNav() {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? "#1a1a1a" : "#ffffff" }}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: isDark ? "#1a1a1a" : "#ffffff",
          },
        }}
      />
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <RootLayoutNav />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
