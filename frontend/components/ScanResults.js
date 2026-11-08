import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function ScanResults({
  detectedItems,
  selectedIndex,
  currentName,
  onSelect,
  onRemove,
}) {
  if (detectedItems.length === 0) return null;

  return (
    <View style={styles.box}>
      <Text style={styles.heading}>
        Scan Results ({detectedItems.length} items detected)
      </Text>
      <View style={styles.disclaimerBox}>
        <Text style={styles.disclaimerText}>
          AI-generated scan results may be inaccurate or incomplete.
          Please review all detected items, verify their details,
          and manually add any missing belongings before saving.
        </Text>
      </View>
      {detectedItems.map((item, index) => (
        <View key={index} style={styles.row}>
          <TouchableOpacity
            style={[styles.pick, selectedIndex === index && styles.selected]}
            onPress={() => onSelect(index)}
          >
            <Text>
              {index + 1}.{" "}
              {index === selectedIndex
                ? currentName || "Unnamed item"
                : item.item_name || item.box?.class_name || "Unknown item"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onRemove(index)}
            style={{ padding: 8 }}
          >
            <Text style={{ color: "#b00020" }}>Remove</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
    backgroundColor: "#f9f9f9",
  },
  heading: { fontSize: 16, fontWeight: "600" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingVertical: 4,
  },
  pick: { flex: 1, paddingVertical: 6 },
  selected: {
    backgroundColor: "#e3f2fd",
    borderRadius: 4,
    paddingHorizontal: 8,
  },
  disclaimerBox: {
  backgroundColor: "#FFF3CD",
  borderColor: "#E6C76E",
  borderWidth: 1,
  borderRadius: 6,
  padding: 12,
  marginTop: 10,
  marginBottom: 15,
},
disclaimerText: {
  color: "#664D03",
  fontSize: 14,
  lineHeight: 21,
},
});
