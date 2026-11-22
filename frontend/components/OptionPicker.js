import React, { useMemo } from "react";
import { View, Text, TextInput, Button, StyleSheet } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { ADD_NEW } from "../hooks/useEditableOptions.js";
import { useTheme } from "../context/ThemeContext";

export default function OptionPicker({
  value,
  opts,
  addLabel,
  newPlaceholder,
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <>
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={opts.adding ? ADD_NEW : value}
          onValueChange={opts.handleChange}
          style={styles.picker}
          dropdownIconColor={colors.text}
          enabled={!opts.saving}
        >
          {opts.options.map((o) => (
            <Picker.Item key={o} label={o} value={o} color={colors.text} />
          ))}

          <Picker.Item label={addLabel} value={ADD_NEW} color={colors.text} />
        </Picker>
      </View>

      {opts.adding && (
        <View style={styles.addContainer}>
          <View style={styles.addRow}>
            <TextInput
              style={styles.input}
              placeholder={newPlaceholder}
              placeholderTextColor={colors.placeholder}
              value={opts.text}
              onChangeText={opts.setText}
              maxLength={50}
              editable={!opts.saving}
              onSubmitEditing={opts.confirm}
            />

            <Button
              title={opts.saving ? "Adding..." : "Add"}
              onPress={opts.confirm}
              color={colors.accent}
              disabled={opts.saving}
            />

            <Button
              title="Cancel"
              onPress={opts.cancel}
              color={colors.mutedText}
              disabled={opts.saving}
            />
          </View>

          {!!opts.error && <Text style={styles.error}>{opts.error}</Text>}
        </View>
      )}
    </>
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
    pickerWrapper: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 4,
      marginBottom: 10,
      overflow: "hidden",
      backgroundColor: c.inputBg,
    },

    picker: {
      color: c.text,
      backgroundColor: c.inputBg,
    },

    addContainer: {
      marginBottom: 10,
      gap: 6,
    },

    addRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },

    input: {
      flex: 1,
      minWidth: 0,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.inputBg,
      color: c.text,
      padding: 8,
      borderRadius: 4,
    },

    error: {
      fontSize: 13,
      color: c.danger,
    },
  });
