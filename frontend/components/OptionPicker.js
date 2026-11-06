import React, { useMemo } from "react";
import { View, TextInput, Button, StyleSheet } from "react-native";
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
          selectedValue={value}
          onValueChange={opts.handleChange}
          style={styles.picker}
          dropdownIconColor={colors.text}
        >
          {opts.options.map((o) => (
            <Picker.Item key={o} label={o} value={o} color={colors.text} />
          ))}
          <Picker.Item label={addLabel} value={ADD_NEW} color={colors.text} />
        </Picker>
      </View>
      {opts.adding && (
        <View style={styles.addRow}>
          <TextInput
            style={styles.input}
            placeholder={newPlaceholder}
            placeholderTextColor={colors.placeholder}
            value={opts.text}
            onChangeText={opts.setText}
          />
          <Button title="Add" onPress={opts.confirm} color={colors.accent} />
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
    addRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
    input: {
      flex: 1,
      marginRight: 8,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.inputBg,
      color: c.text,
      padding: 8,
      borderRadius: 4,
    },
  });
