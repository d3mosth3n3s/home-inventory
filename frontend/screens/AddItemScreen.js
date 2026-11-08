import React, { useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import ImagePickerField from "../components/ImagePickerField";
import LabeledInput from "../components/LabeledInput";
import OptionPicker from "../components/OptionPicker";
import ScanResults from "../components/ScanResults";
import useItemForm, { CONDITIONS } from "../hooks/useItemForm";
import { useTheme } from "../context/ThemeContext";

export default function AddItemScreen() {
  const f = useItemForm();
  const { form, set } = f;
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.container}>
        <Text style={styles.title}>Add Item</Text>

        <ImagePickerField key={f.formKey} onImagePicked={f.handleImagePicked} />
        {f.analyzing && (
          <Text style={styles.statusText}>Analyzing image...</Text>
        )}
        {!!f.analysisError && (
          <Text style={styles.errorText}>{f.analysisError}</Text>
        )}

        <ScanResults
          detectedItems={f.detectedItems}
          selectedIndex={f.selectedIndex}
          currentName={form.name}
          onSelect={f.selectDetected}
          onRemove={f.removeDetected}
        />

        <LabeledInput
          label="Object Detected:"
          placeholder="No object detected"
          value={form.name}
          onChangeText={set("name")}
        />
        <LabeledInput
          label="Brand:"
          placeholder="Enter brand"
          value={form.brand}
          onChangeText={set("brand")}
        />
        <LabeledInput
          label="Model:"
          placeholder="Enter model"
          value={form.model}
          onChangeText={set("model")}
        />

        <View style={styles.descriptionContainer}>
          <Text style={styles.inputLabel}>Description:</Text>
          <TextInput
            style={styles.descriptionInput}
            placeholder="Enter item description"
            placeholderTextColor={colors.placeholder}
            value={form.description}
            onChangeText={set("description")}
            multiline
            textAlignVertical="top"
          />
        </View>

        <OptionPicker
          value={form.category}
          opts={f.categoryOpts}
          addLabel="+ Add new category..."
          newPlaceholder="New category name"
        />

        <LabeledInput
          label="Purchase Price: $"
          placeholder="0.00"
          keyboardType="decimal-pad"
          value={form.purchasePrice}
          onChangeText={f.onPriceChange}
        />
        <LabeledInput
          label="Serial Number:"
          placeholder="Enter serial number"
          value={form.serialNumber}
          onChangeText={set("serialNumber")}
        />

        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={form.condition}
            onValueChange={set("condition")}
            style={styles.picker}
            dropdownIconColor={colors.text}
          >
            {CONDITIONS.map((c) => (
              <Picker.Item key={c} label={c.charAt(0).toUpperCase() + c.slice(1)} value={c} color={colors.text} />
            ))}
          </Picker>
        </View>

        <OptionPicker
          value={form.roomLocation}
          opts={f.roomOpts}
          addLabel="+ Add new room..."
          newPlaceholder="New room name"
        />

        {!!f.submitError && (
          <Text style={styles.errorText}>{f.submitError}</Text>
        )}
        <Button title="Add Asset" onPress={f.submit} color={colors.accent} />
      </View>
    </ScrollView>
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
    scrollContent: { alignItems: "center" },
    container: { width: "100%", maxWidth: 600, padding: 20 },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: 12,
      color: c.text,
    },
    statusText: { color: c.mutedText, marginBottom: 8 },
    errorText: { color: c.danger, marginBottom: 8 },
    inputLabel: { fontSize: 16, marginRight: 5, color: c.text },
    descriptionContainer: {
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.inputBg,
      borderRadius: 4,
      marginBottom: 10,
      padding: 8,
    },
    descriptionInput: {
      fontSize: 16,
      minHeight: 80,
      paddingVertical: 8,
      color: c.text,
    },
    pickerWrapper: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 4,
      marginBottom: 10,
      overflow: "hidden",
      backgroundColor: c.inputBg,
    },
    picker: { color: c.text, backgroundColor: c.inputBg },
  });
