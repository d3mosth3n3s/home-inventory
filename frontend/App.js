import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import ImagePickerField from "./components/ImagePickerField";
import {
  getItems,
  createItem,
  getSummary,
  uploadPhoto,
  analyzeImage,
  API_ORIGIN,
} from "./api";

const CONDITIONS = ["new", "good", "fair", "poor"];
const ADD_NEW = "__add_new__";

export default function App() {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({ total_items: 0, total_value: 0 });
  const [imageUri, setImageUri] = useState(null);
  const [formKey, setFormKey] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const [detectedItems, setDetectedItems] = useState([]);
  const [selectedItemIndex, setSelectedItemIndex] = useState(0);

const [name, setName] = useState("");
const [brand, setBrand] = useState("");
const [model, setModel] = useState("");
const [description, setDescription] = useState("");
const [purchasePrice, setPurchasePrice] = useState("");
const [serialNumber, setSerialNumber] = useState("");
const [condition, setCondition] = useState("good");

  const [categories, setCategories] = useState([
    "Electronics",
    "Furniture",
    "Jewelry",
    "Appliance",
    "Other",
  ]);
  const [category, setCategory] = useState("Electronics");
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryText, setNewCategoryText] = useState("");

  const [rooms, setRooms] = useState([
    "Living Room",
    "Bedroom",
    "Kitchen",
    "Garage",
    "Office",
    "Other",
  ]);
  const [roomLocation, setRoomLocation] = useState("Living Room");
  const [addingRoom, setAddingRoom] = useState(false);
  const [newRoomText, setNewRoomText] = useState("");

  const loadItems = () => {
    getItems()
      .then((res) => setItems(res.data))
      .catch(console.error);
    getSummary()
      .then((res) => setSummary(res.data))
      .catch(console.error);
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleImagePicked = async (uri) => {
    setImageUri(uri);
    setAnalysisError("");
    setAnalyzing(true);

    try {
      const response = await analyzeImage(uri);
      const allDetectedItems = response.data?.items || [];

      setDetectedItems(allDetectedItems);
      setSelectedItemIndex(0);

      const detectedItem = allDetectedItems[0];

      if (!detectedItem) {
        setAnalysisError("No item was detected. Please enter the details manually.");
        return;
      }

      const detectedName =
        detectedItem.item_name ||
        [detectedItem.brand, detectedItem.model].filter(Boolean).join(" ") ||
        detectedItem.box?.class_name ||
        "Detected item";
      setName(detectedName);
      setBrand(detectedItem.brand || "");
      setModel(detectedItem.model || "");
      setDescription(detectedItem.notes || "");
      setSerialNumber(detectedItem.serial_number || "");

      if (detectedItem.category) {
        const detectedCategory =
          detectedItem.category.charAt(0).toUpperCase() +
          detectedItem.category.slice(1);
        setCategories((previous) =>
          previous.includes(detectedCategory)
            ? previous
            : [...previous, detectedCategory],
        );
        setCategory(detectedCategory);
      }
    } catch (error) {
      console.error("Image analysis failed", error);
      const detail = error.response?.data?.detail;
      setAnalysisError(
        detail || "Image analysis failed. You can still enter the item manually.",
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSelectDetectedItem = (index) => {
  if (index === selectedItemIndex) return;

  const updatedItems = [...detectedItems];

  // Save edits made to the currently selected item.
  if (updatedItems[selectedItemIndex]) {
    updatedItems[selectedItemIndex] = {
      ...updatedItems[selectedItemIndex],
      item_name: name,
      brand,
      model,
      notes: description,
      serial_number: serialNumber,
      category,
      purchase_price: purchasePrice,
      condition,
      room_location: roomLocation,
    };
  }

  const item = updatedItems[index];
  if (!item) return;

  setDetectedItems(updatedItems);
  setSelectedItemIndex(index);

  // Load the next item's information.
  setName(item.item_name || item.box?.class_name || "Detected item");
  setBrand(item.brand || "");
  setModel(item.model || "");
  setDescription(item.notes || "");
  setSerialNumber(item.serial_number || "");
  setPurchasePrice(
    item.purchase_price != null ? String(item.purchase_price) : ""
  );
  setCondition(item.condition || "good");
  setRoomLocation(item.room_location || "Living Room");

  const selectedCategory = item.category
    ? item.category.charAt(0).toUpperCase() + item.category.slice(1)
    : "Electronics";

  setCategories((previous) =>
    previous.includes(selectedCategory)
      ? previous
      : [...previous, selectedCategory]
  );

  setCategory(selectedCategory);
};

  const handleRemoveDetectedItem = (index) => {
      const updatedItems = [...detectedItems];

  if (updatedItems[selectedItemIndex] && index !== selectedItemIndex) {
    updatedItems[selectedItemIndex] = {
      ...updatedItems[selectedItemIndex],
      item_name: name,
      brand,
      model,
      notes: description,
      serial_number: serialNumber,
      category,
      purchase_price: purchasePrice,
      condition,
      room_location: roomLocation,
    };
  }
  const remainingItems = updatedItems.filter(
    (_, itemIndex) => itemIndex !== index
  );

  setDetectedItems(remainingItems);

  if (remainingItems.length === 0) {
    setSelectedItemIndex(0);
    setName("");
    setBrand("");
    setModel("");
    setDescription("");
    setSerialNumber("");
    setPurchasePrice("");
    setCondition("good");
    setCategory("Electronics");
    setRoomLocation("Living Room");
    return;
  }

  // Reload a remaining item if the selected one was removed.
  if (index === selectedItemIndex) {
    const nextIndex = Math.min(index, remainingItems.length - 1);
    const item = remainingItems[nextIndex];

    setSelectedItemIndex(nextIndex);
    setName(item.item_name || item.box?.class_name || "Detected item");
    setBrand(item.brand || "");
    setModel(item.model || "");
    setDescription(item.notes || "");
    setSerialNumber(item.serial_number || "");
    setPurchasePrice(
      item.purchase_price != null ? String(item.purchase_price) : ""
    );
    setCondition(item.condition || "good");
    setRoomLocation(item.room_location || "Living Room");

    const nextCategory = item.category
      ? item.category.charAt(0).toUpperCase() + item.category.slice(1)
      : "Electronics";

    setCategories((previous) =>
      previous.includes(nextCategory)
        ? previous
        : [...previous, nextCategory]
    );
    setCategory(nextCategory);
  } else if (index < selectedItemIndex) {
    setSelectedItemIndex(selectedItemIndex - 1);
  }
};

  const handlePriceChange = (text) => {
    const filtered = text.replace(/[^0-9.]/g, "");
    const parts = filtered.split(".");
    const cleaned =
      parts.length > 2 ? parts[0] + "." + parts.slice(1).join("") : filtered;
    setPurchasePrice(cleaned);
  };

  const handleCategoryChange = (value) => {
    if (value === ADD_NEW) {
      setAddingCategory(true);
    } else {
      setCategory(value);
    }
  };

  const confirmNewCategory = () => {
    const trimmed = newCategoryText.trim();
    if (!trimmed) return;
    setCategories((prev) => [...prev, trimmed]);
    setCategory(trimmed);
    setNewCategoryText("");
    setAddingCategory(false);
  };

  const handleRoomChange = (value) => {
    if (value === ADD_NEW) {
      setAddingRoom(true);
    } else {
      setRoomLocation(value);
    }
  };

  const confirmNewRoom = () => {
    const trimmed = newRoomText.trim();
    if (!trimmed) return;
    setRooms((prev) => [...prev, trimmed]);
    setRoomLocation(trimmed);
    setNewRoomText("");
    setAddingRoom(false);
  };

  const handleAdd = async () => {
    if (!name) return;

    const res = await createItem({
      name,
      category,
      brand,
      model,
      notes: description,
      purchase_price: purchasePrice ? parseFloat(purchasePrice) : null,
      serial_number: serialNumber,
      condition,
      room_location: roomLocation,
      quantity: 1,
    });

    const newItem = res.data;

    if (imageUri) {
      await uploadPhoto(newItem.id, imageUri);
    }

    setName("");
    setBrand("");
    setModel("");
    setDescription("");
    setPurchasePrice("");
    setSerialNumber("");
    setCondition("good");
    setImageUri(null);
    setAnalysisError("");
    setFormKey((k) => k + 1);
    loadItems();
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.container}>
        <Text style={styles.title}>Insured Assets</Text>

        <View style={styles.summaryBox}>
          <Text style={styles.summaryValue}>
            ${summary.total_value?.toLocaleString() ?? 0}
          </Text>
          <Text style={styles.summaryLabel}>
            Total value — {summary.total_items ?? 0} items
          </Text>
        </View>

        <ImagePickerField
          key={formKey}
          onImagePicked={handleImagePicked}
        />
        {analyzing && <Text style={styles.statusText}>Analyzing image...</Text>}
        {!!analysisError && <Text style={styles.errorText}>{analysisError}</Text>}
        {detectedItems.length > 0 && (
  <View style={styles.scanReview}>
    <Text style={styles.itemName}>
      Scan Results ({detectedItems.length} items detected)
    </Text>

    {detectedItems.map((item, index) => (
      <View key={index} style={styles.scanReviewItem}>
        <TouchableOpacity
          style={[
            { flex: 1, paddingVertical: 6 },
            selectedItemIndex === index && styles.selectedScanItem,
          ]}
          onPress={() => handleSelectDetectedItem(index)}
        >
          <Text>
            {index + 1}.{" "}
            {index === selectedItemIndex
              ? name || "Unnamed item"
              : item.item_name ||
                item.box?.class_name ||
                "Unknown item"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleRemoveDetectedItem(index)}
          style={{ padding: 8 }}
        >
          <Text style={{ color: "#b00020" }}>Remove</Text>
        </TouchableOpacity>
      </View>
    ))}
  </View>
)}

<View style={styles.labeledInput}>
  <Text style={styles.inputLabel}>Object Detected:</Text>
  <TextInput
    style={styles.inlineTextInput}
    placeholder="No object detected"
    placeholderTextColor="#999"
    value={name}
    onChangeText={setName}
  />
</View>

<View style={styles.labeledInput}>
  <Text style={styles.inputLabel}>Brand:</Text>
  <TextInput
    style={styles.inlineTextInput}
    placeholder="Enter brand"
    placeholderTextColor="#999"
    value={brand}
    onChangeText={setBrand}
  />
</View>

<View style={styles.labeledInput}>
  <Text style={styles.inputLabel}>Model:</Text>
  <TextInput
    style={styles.inlineTextInput}
    placeholder="Enter model"
    placeholderTextColor="#999"
    value={model}
    onChangeText={setModel}
  />
</View>

<View style={styles.descriptionContainer}>
  <Text style={styles.inputLabel}>Description:</Text>
  <TextInput
    style={styles.descriptionInput}
    placeholder="Enter item description"
    placeholderTextColor="#999"
    value={description}
    onChangeText={setDescription}
    multiline
    textAlignVertical="top"
  />
</View>

        <View style={styles.pickerWrapper}>
          <Picker selectedValue={category} onValueChange={handleCategoryChange}>
            {categories.map((c) => (
              <Picker.Item key={c} label={c} value={c} />
            ))}
            <Picker.Item label="+ Add new category..." value={ADD_NEW} />
          </Picker>
        </View>
        {addingCategory && (
          <View style={styles.inlineAddRow}>
            <TextInput
              style={[styles.input, styles.inlineInput]}
              placeholder="New category name"
              placeholderTextColor="#999"
              value={newCategoryText}
              onChangeText={setNewCategoryText}
            />
            <Button title="Add" onPress={confirmNewCategory} />
          </View>
        )}

<View style={styles.labeledInput}>
  <Text style={styles.inputLabel}>Purchase Price: $</Text>
  <TextInput
    style={styles.inlineTextInput}
    placeholder="0.00"
    placeholderTextColor="#999"
    keyboardType="decimal-pad"
    value={purchasePrice}
    onChangeText={handlePriceChange}
  />
</View>

<View style={styles.labeledInput}>
  <Text style={styles.inputLabel}>Serial Number:</Text>
  <TextInput
    style={styles.inlineTextInput}
    placeholder="Enter serial number"
    placeholderTextColor="#999"
    value={serialNumber}
    onChangeText={setSerialNumber}
  />
</View>

        <View style={styles.pickerWrapper}>
          <Picker selectedValue={condition} onValueChange={setCondition}>
            {CONDITIONS.map((c) => (
              <Picker.Item key={c} label={c} value={c} />
            ))}
          </Picker>
        </View>

        <View style={styles.pickerWrapper}>
          <Picker selectedValue={roomLocation} onValueChange={handleRoomChange}>
            {rooms.map((r) => (
              <Picker.Item key={r} label={r} value={r} />
            ))}
            <Picker.Item label="+ Add new room..." value={ADD_NEW} />
          </Picker>
        </View>
        {addingRoom && (
          <View style={styles.inlineAddRow}>
            <TextInput
              style={[styles.input, styles.inlineInput]}
              placeholder="New room name"
              placeholderTextColor="#999"
              value={newRoomText}
              onChangeText={setNewRoomText}
            />
            <Button title="Add" onPress={confirmNewRoom} />
          </View>
        )}

        <Button title="Add Asset" onPress={handleAdd} />

        <FlatList
          style={{ marginTop: 20 }}
          data={items}
          keyExtractor={(item) => item.id.toString()}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <View
              style={[
                styles.item,
                { flexDirection: "row", alignItems: "center" },
              ]}
            >
              {item.photo_url ? (
                <Image
                  source={{ uri: `${API_ORIGIN}${item.photo_url}` }}
                  style={styles.thumbnail}
                />
              ) : (
                <View style={[styles.thumbnail, styles.thumbnailPlaceholder]} />
              )}
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemMeta}>
                  {item.category || "Uncategorized"} · {item.condition} ·{" "}
                  {item.room_location || "no location set"}
                </Text>
                <Text style={styles.itemValue}>
                  $
                  {(
                    item.current_value ??
                    item.purchase_price ??
                    0
                  ).toLocaleString()}
                </Text>
              </View>
            </View>
          )}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    alignItems: "center",
  },
  container: {
    width: "100%",
    maxWidth: 600,
    padding: 20,
  },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 12 },
  summaryBox: {
    backgroundColor: "#f2f2f2",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    alignItems: "center",
  },
  summaryValue: { fontSize: 28, fontWeight: "bold" },
  summaryLabel: { fontSize: 13, color: "#666", marginTop: 2 },
  statusText: { color: "#555", marginBottom: 8 },
  errorText: { color: "#b00020", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    marginBottom: 10,
    borderRadius: 4,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#bababa",
    borderRadius: 4,
    marginBottom: 10,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  inlineAddRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  inlineInput: { flex: 1, marginBottom: 0, marginRight: 8 },
  item: { padding: 10, borderBottomWidth: 1, borderBottomColor: "#eee" },
  itemName: { fontSize: 16, fontWeight: "600" },
  itemMeta: { fontSize: 12, color: "#888", marginTop: 2 },
  itemValue: { fontSize: 14, fontWeight: "500", marginTop: 4 },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: 6,
    backgroundColor: "#eee",
  },
  thumbnailPlaceholder: { borderWidth: 1, borderColor: "#ddd" },

  labeledInput: {
  flexDirection: "row",
  alignItems: "center",
  borderWidth: 1,
  borderColor: "#ccc",
  borderRadius: 4,
  marginBottom: 10,
  paddingHorizontal: 8,
  minHeight: 42,
},

inputLabel: {
  fontSize: 16,
  marginRight: 5,
},

inlineTextInput: {
  flex: 1,
  fontSize: 16,
  paddingVertical: 8,
},
descriptionContainer: {
  borderWidth: 1,
  borderColor: "#ccc",
  borderRadius: 4,
  marginBottom: 10,
  padding: 8,
},

descriptionInput: {
  fontSize: 16,
  minHeight: 80,
  paddingVertical: 8,
},

scanReview: {
  borderWidth: 1,
  borderColor: "#ccc",
  borderRadius: 6,
  padding: 12,
  marginBottom: 12,
  backgroundColor: "#f9f9f9",
},

scanReviewItem: {
  flexDirection: "row",
  alignItems: "center",
  borderBottomWidth: 1,
  borderBottomColor: "#eee",
  paddingVertical: 4,
},

selectedScanItem: {
  backgroundColor: "#e3f2fd",
  borderRadius: 4,
  paddingHorizontal: 8,
},

});
