// frontend/components/Sidebar.js
import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { DrawerContentScrollView } from "@react-navigation/drawer";
// import { supabase } from "../lib/supabase"; // uncomment once auth is wired in

// One place to edit your nav links. `route` must match a Drawer.Screen name.
const NAV_ITEMS = [
  { label: "Dashboard", route: "Dashboard" },
  { label: "Inventory", route: "Inventory" },
  { label: "Add Item", route: "AddItem" },
  // { label: "Export", route: "Export" },
  // { label: "Account", route: "Account" },
];

export default function Sidebar({ state, navigation, ...rest }) {
  const activeRoute = state.routes[state.index].name;

  const go = (route) => {
    navigation.navigate(route);
    navigation.closeDrawer(); // closes the mobile drawer; harmless when permanent
  };

  const handleSignOut = () => {
    // supabase.auth.signOut();
  };

  return (
    <DrawerContentScrollView
      state={state}
      navigation={navigation}
      {...rest}
      contentContainerStyle={styles.container}
    >
      {/* ---------- TOP: brand ---------- */}
      <View style={styles.brand}>
        <View style={styles.logoPlaceholder} />
        <Text style={styles.title}>Home Inventory</Text>
      </View>

      {/* ---------- MIDDLE: nav links ---------- */}
      <View style={styles.nav}>
        {NAV_ITEMS.map((item) => {
          const active = item.route === activeRoute;
          return (
            <Pressable
              key={item.route}
              onPress={() => go(item.route)}
              style={[styles.navItem, active && styles.navItemActive]}
            >
              {/* icon slot */}
              <View style={styles.iconPlaceholder} />
              <Text style={[styles.navLabel, active && styles.navLabelActive]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* spacer pushes the footer to the bottom */}
      <View style={{ flex: 1 }} />

      {/* ---------- BOTTOM: user / sign out ---------- */}
      <View style={styles.footer}>
        {/* <Text>{session?.user?.email}</Text> */}
        <Pressable onPress={handleSignOut} style={styles.navItem}>
          <View style={styles.iconPlaceholder} />
          <Text style={styles.navLabel}>Sign out</Text>
        </Pressable>
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1 },

  brand: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    gap: 12,
  },
  logoPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: "#ddd",
  },
  title: { fontSize: 18, fontWeight: "bold" },

  nav: { paddingHorizontal: 12, gap: 4 },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  navItemActive: { backgroundColor: "#eee" },
  iconPlaceholder: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: "#ddd",
  },
  navLabel: { fontSize: 16 },
  navLabelActive: { fontWeight: "600" },

  footer: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
});
