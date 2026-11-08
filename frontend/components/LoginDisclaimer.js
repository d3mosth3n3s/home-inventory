import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../context/ThemeContext";

export default function LoginDisclaimer() {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface },
      ]}
    >
      <Text style={[styles.title, { color: colors.text }]}>
        Prototype Notice
      </Text>

      <Text style={[styles.message, { color: colors.text }]}>
        ReCovered is currently a prototype developed for
        demonstration and testing purposes. A login page and
        user authentication have not yet been implemented.
        Please avoid entering sensitive personal information
        while these features are under development.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: "#90CAF9",
    borderRadius: 8,
    padding: 14,
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6,
  },
  message: {
    fontSize: 14,
    lineHeight: 21,
  },
});
