import React, { useMemo } from "react";
import { FlatList, Text, StyleSheet } from "react-native";
import { useItems } from "../context/ItemsContext";
import { useTheme } from "../context/ThemeContext";
import ItemRow from "../components/ItemRow";

export default function InventoryScreen() {
  const { items } = useItems();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <FlatList
      contentContainerStyle={styles.page}
      data={items}
      keyExtractor={(item) => item.id.toString()}
      ListHeaderComponent={<Text style={styles.title}>Inventory</Text>}
      ListEmptyComponent={<Text style={styles.empty}>No items yet.</Text>}
      renderItem={({ item }) => <ItemRow item={item} />}
    />
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
    page: { padding: 16, maxWidth: 900, width: "100%", alignSelf: "center" },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: 12,
      color: c.text,
    },
    empty: { color: c.mutedText, fontSize: 14 },
  });
