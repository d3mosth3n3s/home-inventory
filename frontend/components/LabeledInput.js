import React, { useMemo } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { useTheme } from "../context/ThemeContext";

export default function LabeledInput({ label, ...inputProps }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholderTextColor={colors.placeholder}
        {...inputProps}
      />
    </View>
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.inputBg,
      borderRadius: 4,
      marginBottom: 10,
      paddingHorizontal: 8,
      minHeight: 42,
    },
    label: { fontSize: 16, marginRight: 5, color: c.text },
    input: { flex: 1, fontSize: 16, paddingVertical: 8, color: c.text },
  });
