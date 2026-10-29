import React from "react";
import { FlatList, View, Text, StyleSheet } from "react-native";
import { useItems } from "../context/ItemsContext";
import ItemRow from "../components/ItemRow";

export default function InventoryScreen() {
  const { items } = useItems();

  return (
    <FlatList
      contentContainerStyle={styles.page}
      data={items}
      keyExtractor={(item) => item.id.toString()}
      ListHeaderComponent={<Text style={styles.title}>Inventory</Text>}
      renderItem={({ item }) => <ItemRow item={item} />}
    />
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, maxWidth: 900, width: "100%", alignSelf: "center" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 12 },
});
