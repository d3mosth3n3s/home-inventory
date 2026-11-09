import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  Image,
  ScrollView,
  Platform,
  Alert,
  StyleSheet,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import ImagePickerField from "../components/ImagePickerField";
import LabeledInput from "../components/LabeledInput";
import OptionPicker from "../components/OptionPicker";
import useEditableOptions from "../hooks/useEditableOptions.js";
import { CONDITIONS } from "../hooks/useItemForm";
import { useItems } from "../context/ItemsContext";
import { useTheme } from "../context/ThemeContext";
import { updateItem, deleteItem, uploadPhoto, photoUrlFor } from "../api";

const CATEGORIES = [
  "Electronics",
  "Furniture",
  "Jewelry",
  "Appliance",
  "Other",
];
const ROOMS = [
  "Living Room",
  "Bedroom",
  "Kitchen",
  "Garage",
  "Office",
  "Other",
];

const withValue = (list, value) =>
  value && !list.includes(value) ? [...list, value] : list;

const numberText = (n) => (n != null ? String(n) : "");

const decimalOnly = (text) => {
  const filtered = text.replace(/[^0-9.]/g, "");
  const parts = filtered.split(".");
  return parts.length > 2 ? parts[0] + "." + parts.slice(1).join("") : filtered;
};

const confirmDelete = (name) =>
  new Promise((resolve) => {
    const message = `Delete "${name}"? This can't be undone.`;
    if (Platform.OS === "web") {
      resolve(window.confirm(message));
      return;
    }
    Alert.alert("Delete item", message, [
      { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
      { text: "Delete", style: "destructive", onPress: () => resolve(true) },
    ]);
  });

export default function EditItemScreen({ route, navigation }) {
  const { items } = useItems();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const id = Number(route.params?.id);
  const item = items.find((it) => it.id === id);

  if (!item) {
    return (
      <View style={styles.container}>
        <Text style={styles.statusText}>
          {items.length ? "Item not found." : "Loading..."}
        </Text>
      </View>
    );
  }

  // key resets the form when switching to a different item
  return <EditForm key={item.id} item={item} navigation={navigation} />;
}

function EditForm({ item, navigation }) {
  const { loadItems } = useItems();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [form, setForm] = useState({
    name: item.name || "",
    brand: item.brand || "",
    model: item.model || "",
    notes: item.notes || "",
    purchasePrice: numberText(item.purchase_price),
    currentValue: numberText(item.current_value),
    serialNumber: item.serial_number || "",
    quantity: numberText(item.quantity ?? 1),
    condition: item.condition || "good",
    category: item.category || "Electronics",
    roomLocation: item.room_location || "Living Room",
  });
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const categoryOpts = useEditableOptions(
    withValue(CATEGORIES, item.category),
    set("category"),
  );
  const roomOpts = useEditableOptions(
    withValue(ROOMS, item.room_location),
    set("roomLocation"),
  );

  const [newImageUri, setNewImageUri] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const currentPhoto = photoUrlFor(item);

  const save = async () => {
    if (!form.name.trim()) {
      setError("Item name can't be empty.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await updateItem(item.id, {
        name: form.name.trim(),
        brand: form.brand,
        model: form.model,
        notes: form.notes,
        category: form.category,
        purchase_price: form.purchasePrice
          ? parseFloat(form.purchasePrice)
          : null,
        current_value: form.currentValue ? parseFloat(form.currentValue) : null,
        serial_number: form.serialNumber,
        quantity: Math.max(1, parseInt(form.quantity, 10) || 1),
        condition: form.condition,
        room_location: form.roomLocation,
      });
      if (newImageUri) await uploadPhoto(item.id, newImageUri);
      loadItems();
      navigation.goBack();
    } catch (err) {
      console.error("Save failed", err);
      setError(err.response?.data?.detail || "Couldn't save changes.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!(await confirmDelete(item.name))) return;
    try {
      await deleteItem(item.id);
      loadItems();
      navigation.navigate("Inventory");
    } catch (err) {
      console.error("Delete failed", err);
      setError(err.response?.data?.detail || "Couldn't delete the item.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.container}>
        <Text style={styles.title}>Edit Item</Text>

        {currentPhoto && !newImageUri && (
          <Image source={{ uri: currentPhoto }} style={styles.photo} />
        )}
        <ImagePickerField onImagePicked={setNewImageUri} />

        <LabeledInput
          label="Name:"
          value={form.name}
          onChangeText={set("name")}
        />
        <LabeledInput
          label="Brand:"
          value={form.brand}
          onChangeText={set("brand")}
        />
        <LabeledInput
          label="Model:"
          value={form.model}
          onChangeText={set("model")}
        />

        <View style={styles.descriptionContainer}>
          <Text style={styles.inputLabel}>Description:</Text>
          <TextInput
            style={styles.descriptionInput}
            placeholderTextColor={colors.placeholder}
            value={form.notes}
            onChangeText={set("notes")}
            multiline
            textAlignVertical="top"
          />
        </View>

        <OptionPicker
          value={form.category}
          opts={categoryOpts}
          addLabel="+ Add new category..."
          newPlaceholder="New category name"
        />

        <LabeledInput
          label="Purchase Price: $"
          placeholder="0.00"
          keyboardType="decimal-pad"
          value={form.purchasePrice}
          onChangeText={(t) => set("purchasePrice")(decimalOnly(t))}
        />
        <LabeledInput
          label="Current Value: $"
          placeholder="0.00"
          keyboardType="decimal-pad"
          value={form.currentValue}
          onChangeText={(t) => set("currentValue")(decimalOnly(t))}
        />
        <LabeledInput
          label="Quantity:"
          keyboardType="number-pad"
          value={form.quantity}
          onChangeText={(t) => set("quantity")(t.replace(/[^0-9]/g, ""))}
        />
        <LabeledInput
          label="Serial Number:"
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
              <Picker.Item
                key={c}
                label={c.charAt(0).toUpperCase() + c.slice(1)}
                value={c}
                color={colors.text}
              />
            ))}
          </Picker>
        </View>

        <OptionPicker
          value={form.roomLocation}
          opts={roomOpts}
          addLabel="+ Add new room..."
          newPlaceholder="New room name"
        />

        {!!error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.buttons}>
          <Button
            title={saving ? "Saving..." : "Save Changes"}
            onPress={save}
            disabled={saving}
            color={colors.accent}
          />
          <View style={styles.spacer} />
          <Button
            title="Cancel"
            onPress={() => navigation.goBack()}
            color={colors.mutedText}
          />
          <View style={styles.spacer} />
          <Button title="Delete Item" onPress={remove} color={colors.danger} />
        </View>
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
    statusText: { color: c.mutedText },
    errorText: { color: c.danger, marginBottom: 8 },
    photo: {
      width: 160,
      height: 120,
      borderRadius: 6,
      alignSelf: "center",
      backgroundColor: c.surface,
    },
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
    buttons: { marginTop: 8 },
    spacer: { height: 8 },
  });
