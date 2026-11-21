import React from "react";
import { View, ActivityIndicator } from "react-native";
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from "@react-navigation/native";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { ItemsProvider } from "./context/ItemsContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";

import AppNavigator from "./navigation/AppNavigator";
import LoginScreen from "./screens/LoginScreen";

const linking = {
  prefixes: [],
  config: {
    screens: {
      Dashboard: "",
      Inventory: "inventory",
      AddItem: "inventory/new",
    },
  },
};

function Root() {
  const { isDark, colors } = useTheme();
  const { session, loading } = useAuth();

  const base = isDark ? DarkTheme : DefaultTheme;

  const navTheme = {
    ...base,
    colors: {
      ...base.colors,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      primary: colors.accent,
    },
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!session) {
    return <LoginScreen />;
  }

  return (
    <ItemsProvider key={session.user.id}>
      <NavigationContainer linking={linking} theme={navTheme}>
        <AppNavigator />
      </NavigationContainer>
    </ItemsProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Root />
      </AuthProvider>
    </ThemeProvider>
  );
}
