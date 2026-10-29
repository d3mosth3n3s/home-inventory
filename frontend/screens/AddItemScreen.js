import React from "react";
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

export default function AddItemScreen() {
  const f = useItemForm();
  const { form, set } = f;

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
            placeholderTextColor="#999"
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
          >
            {CONDITIONS.map((c) => (
              <Picker.Item key={c} label={c} value={c} />
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
        <Button
          title="Add Asset"
          onPress={() => {
            console.log("1. button pressed");
            f.submit();
          }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { alignItems: "center" },
  container: { width: "100%", maxWidth: 600, padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 12 },
  statusText: { color: "#555", marginBottom: 8 },
  errorText: { color: "#b00020", marginBottom: 8 },
  inputLabel: { fontSize: 16, marginRight: 5 },
  descriptionContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    marginBottom: 10,
    padding: 8,
  },
  descriptionInput: { fontSize: 16, minHeight: 80, paddingVertical: 8 },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#bababa",
    borderRadius: 4,
    marginBottom: 10,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
});
