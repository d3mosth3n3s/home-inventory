import React, { useMemo } from "react";
import { View, Text, Image, Pressable, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { photoUrlFor } from "../api";
import { useTheme } from "../context/ThemeContext";

export default function ItemRow({ item }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation();

  return (
    <Pressable
      style={({ hovered, pressed }) => [
        styles.row,
        (hovered || pressed) && styles.rowActive,
      ]}
      onPress={() => navigation.navigate("EditItem", { id: item.id })}
    >
      {item.photo_url ? (
        <Image source={{ uri: photoUrlFor(item) }} style={styles.thumb} />
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
    </Pressable>
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      padding: 10,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    rowActive: { backgroundColor: c.surface },
    thumb: {
      width: 56,
      height: 56,
      borderRadius: 6,
      backgroundColor: c.surface,
    },
    thumbPlaceholder: { borderWidth: 1, borderColor: c.border },
    name: { fontSize: 16, fontWeight: "600", color: c.text },
    meta: { fontSize: 12, color: c.mutedText, marginTop: 2 },
    value: { fontSize: 14, fontWeight: "500", marginTop: 4, color: c.text },
  });
