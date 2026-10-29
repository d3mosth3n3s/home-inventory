import React from "react";
import { View, TextInput, Button, StyleSheet } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { ADD_NEW } from "../hooks/useEditableOptions.js";

export default function OptionPicker({
  value,
  opts,
  addLabel,
  newPlaceholder,
}) {
  return (
    <>
      <View style={styles.pickerWrapper}>
        <Picker selectedValue={value} onValueChange={opts.handleChange}>
          {opts.options.map((o) => (
            <Picker.Item key={o} label={o} value={o} />
          ))}
          <Picker.Item label={addLabel} value={ADD_NEW} />
        </Picker>
      </View>
      {opts.adding && (
        <View style={styles.addRow}>
          <TextInput
            style={styles.input}
            placeholder={newPlaceholder}
            placeholderTextColor="#999"
            value={opts.text}
            onChangeText={opts.setText}
          />
          <Button title="Add" onPress={opts.confirm} />
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#bababa",
    borderRadius: 4,
    marginBottom: 10,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  addRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  input: {
    flex: 1,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    borderRadius: 4,
  },
});
