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

  const [name, setName] = useState("");
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
      const detectedItem = response.data?.items?.[0];

      if (!detectedItem) {
        setAnalysisError("No item was detected. Please enter the details manually.");
        return;
      }

      const detectedName =
        detectedItem.item_name ||
        [detectedItem.brand, detectedItem.model].filter(Boolean).join(" ") ||
        detectedItem.class_name ||
        "Detected item";
      setName(detectedName);
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

        <TextInput
          style={styles.input}
          placeholder="Item name (e.g. Samsung 65in TV)"
          placeholderTextColor="#999"
          value={name}
          onChangeText={setName}
        />

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

        <TextInput
          style={styles.input}
          placeholder="Purchase price ($)"
          placeholderTextColor="#999"
          keyboardType="decimal-pad"
          value={purchasePrice}
          onChangeText={handlePriceChange}
        />

        <TextInput
          style={styles.input}
          placeholder="Serial number"
          placeholderTextColor="#999"
          value={serialNumber}
          onChangeText={setSerialNumber}
        />

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
});
