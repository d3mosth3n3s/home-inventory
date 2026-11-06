import React from "react";
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from "@react-navigation/native";
import { ItemsProvider } from "./context/ItemsContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import AppNavigator from "./navigation/AppNavigator";

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
  const base = isDark ? DarkTheme : DefaultTheme;

  const navTheme = {
    ...base,
    colors: {
      ...base.colors,
      background: colors.background,
      card: colors.surface, // header bar
      text: colors.text,
      border: colors.border,
      primary: colors.accent,
    },
  };

  return (
    <NavigationContainer linking={linking} theme={navTheme}>
      <AppNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ItemsProvider>
        <Root />
      </ItemsProvider>
    </ThemeProvider>
  );
}
