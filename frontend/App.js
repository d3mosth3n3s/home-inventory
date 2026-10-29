import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { ItemsProvider } from "./context/ItemsContext";
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

export default function App() {
  return (
    <ItemsProvider>
      <NavigationContainer linking={linking}>
        <AppNavigator />
      </NavigationContainer>
    </ItemsProvider>
  );
}
