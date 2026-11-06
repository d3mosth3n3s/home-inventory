import React, { useMemo } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { useItems } from "../context/ItemsContext";
import { useTheme } from "../context/ThemeContext";
import ItemRow from "../components/ItemRow";

export default function DashboardScreen({ navigation }) {
  const { items, summary } = useItems();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const recent = items.slice(0, 5); // flip with .slice(-5).reverse() if your API returns oldest-first

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Insured Assets</Text>

        <Pressable
          style={styles.addButton}
          onPress={() => navigation.navigate("AddItem")}
        >
          <Text style={styles.addButtonText}>Add Item?</Text>
        </Pressable>
      </View>

      <View style={styles.grid}>
        <View style={styles.card}>
          <Text style={styles.summaryValue}>
            ${summary.total_value?.toLocaleString() ?? 0}
          </Text>
          <Text style={styles.summaryLabel}>Total value</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.summaryValue}>{summary.total_items ?? 0}</Text>
          <Text style={styles.summaryLabel}>Items</Text>
        </View>

        <View style={[styles.card, styles.wideCard]}>
          <Text style={styles.cardTitle}>Recently added</Text>
          {recent.map((item) => (
            <ItemRow key={item.id} item={item} />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
    page: {
      padding: 16,
      maxWidth: 1200,
      width: "100%",
      alignSelf: "center",
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: 12,
      color: c.text,
    },
    grid: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
    card: {
      flexGrow: 1,
      flexBasis: 240,
      backgroundColor: c.surface,
      borderRadius: 8,
      padding: 16,
    },
    wideCard: { flexBasis: "100%" },
    summaryValue: { fontSize: 28, fontWeight: "bold", color: c.text },
    summaryLabel: { fontSize: 13, color: c.mutedText, marginTop: 2 },
    cardTitle: {
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 8,
      color: c.text,
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap", // lets the button drop below the title on narrow phones
      gap: 12,
      marginBottom: 12,
    },
    addButton: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
      backgroundColor: c.accent,
    },
    addButtonText: { color: "#fff", fontWeight: "600" },
  });
