import React, { useState, useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from "@react-navigation/native";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { ItemsProvider } from "./context/ItemsContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { OptionsProvider } from "./context/OptionsContext";

import AppNavigator from "./navigation/AppNavigator";
import LoginScreen from "./screens/LoginScreen";
import HomeScreen from "./screens/HomeScreen";

const linking = {
  prefixes: [],
  config: {
    screens: {
      Dashboard: "",
      Inventory: "inventory",
      Rooms: "rooms",
      AddItem: "inventory/new",
      EditItem: "inventory/:id/edit",
    },
  },
};

function Root() {
  const { isDark, colors } = useTheme();
  const { session, loading } = useAuth();

  const [authPage, setAuthPage] = useState("home");
  useEffect(() => {
    if (session) {
      setAuthPage("home");
    }
  }, [session]);
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
    if (authPage === "home") {
      return (
        <HomeScreen
          onLogin={() => setAuthPage("login")}
          onRegister={() => setAuthPage("register")}
        />
      );
    }

    return (
      <LoginScreen
        key={authPage}
        initialRegistering={authPage === "register"}
        onBack={() => setAuthPage("home")}
      />
    );
  }

  return (
    <ItemsProvider key={session.user.id}>
      <OptionsProvider>
        <NavigationContainer linking={linking} theme={navTheme}>
          <AppNavigator />
        </NavigationContainer>
      </OptionsProvider>
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
