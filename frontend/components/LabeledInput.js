import React from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";

export default function LabeledInput({ label, ...inputProps }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholderTextColor="#999"
        {...inputProps}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    marginBottom: 10,
    paddingHorizontal: 8,
    minHeight: 42,
  },
  label: { fontSize: 16, marginRight: 5 },
  input: { flex: 1, fontSize: 16, paddingVertical: 8 },
});
