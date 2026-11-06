import React, { useMemo } from "react";
import { View, Text, Pressable, Switch, StyleSheet } from "react-native";
import { DrawerContentScrollView } from "@react-navigation/drawer";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

const NAV_ITEMS = [
  { label: "Dashboard", route: "Dashboard", icon: "home" },
  { label: "Inventory", route: "Inventory", icon: "cube" },
  { label: "Rooms", route: "Rooms", icon: "grid" },
  { label: "Add Item", route: "AddItem", icon: "create" },
];

export default function Sidebar({ state, navigation, ...rest }) {
  const activeRoute = state.routes[state.index].name;
  const { isDark, toggle, colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

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
        <Text style={styles.title}>ReCovered</Text>
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
              <Ionicons
                name={item.icon}
                size={24}
                color={active ? colors.accent : colors.mutedText}
              />
              <Text style={[styles.navLabel, active && styles.navLabelActive]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* spacer pushes the footer to the bottom */}
      <View style={{ flex: 1 }} />

      {/* ---------- theme toggle ---------- */}
      <View style={styles.themeRow}>
        <Text style={styles.themeEmoji}>☀️</Text>
        <Switch
          value={isDark}
          onValueChange={toggle}
          trackColor={{ false: colors.border, true: colors.accent }}
          thumbColor="#fff"
        />
        <Text style={styles.themeEmoji}>🌙</Text>
      </View>

      {/* ---------- BOTTOM: user / sign out ---------- */}
      <View style={styles.footer}>
        {/* <Text style={styles.email}>{session?.user?.email}</Text> */}
        <Pressable onPress={handleSignOut} style={styles.navItem}>
          <Ionicons name="log-out-outline" size={24} color={colors.mutedText} />
          <Text style={styles.navLabel}>Sign out</Text>
        </Pressable>
      </View>
    </DrawerContentScrollView>
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
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
      backgroundColor: c.border,
    },
    title: { fontSize: 22, fontWeight: "bold", color: c.text },

    nav: { paddingHorizontal: 12, gap: 4 },
    navItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 8,
    },
    // accent color at ~13% opacity: works in both palettes (needs 6-digit hex)
    navItemActive: { backgroundColor: c.accent + "22" },
    navLabel: { fontSize: 16, color: c.mutedText },
    navLabelActive: { fontWeight: "600", color: c.text },

    themeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    themeEmoji: { color: c.text },

    footer: {
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
  });
