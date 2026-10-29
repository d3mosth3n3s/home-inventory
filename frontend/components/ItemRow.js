import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { API_ORIGIN } from "../api";

export default function ItemRow({ item }) {
  return (
    <View style={styles.row}>
      {item.photo_url ? (
        <Image
          source={{ uri: `${API_ORIGIN}${item.photo_url}` }}
          style={styles.thumb}
        />
      ) : (
        <View style={[styles.thumb, styles.thumbPlaceholder]} />
      )}
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.meta}>
          {item.category || "Uncategorized"} · {item.condition} ·{" "}
          {item.room_location || "no location set"}
        </Text>
        <Text style={styles.value}>
          ${(item.current_value ?? item.purchase_price ?? 0).toLocaleString()}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  thumb: { width: 56, height: 56, borderRadius: 6, backgroundColor: "#eee" },
  thumbPlaceholder: { borderWidth: 1, borderColor: "#ddd" },
  name: { fontSize: 16, fontWeight: "600" },
  meta: { fontSize: 12, color: "#888", marginTop: 2 },
  value: { fontSize: 14, fontWeight: "500", marginTop: 4 },
});
