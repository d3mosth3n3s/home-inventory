import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { getItems, createItem, getSummary } from "./api";

const CATEGORIES = [
  "Electronics",
  "Furniture",
  "Jewelry",
  "Appliance",
  "Other",
];
const CONDITIONS = ["new", "good", "fair", "poor"];

export default function App() {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({ total_items: 0, total_value: 0 });

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [condition, setCondition] = useState("good");
  const [roomLocation, setRoomLocation] = useState("");

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

  const handleAdd = async () => {
    if (!name) return;
    await createItem({
      name,
      category,
      purchase_price: purchasePrice ? parseFloat(purchasePrice) : null,
      serial_number: serialNumber,
      condition,
      room_location: roomLocation,
      quantity: 1,
    });
    setName("");
    setCategory("");
    setPurchasePrice("");
    setSerialNumber("");
    setRoomLocation("");
    setCondition("good");
    loadItems();
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Insured Assets</Text>

      <View style={styles.summaryBox}>
        <Text style={styles.summaryValue}>
          ${summary.total_value?.toLocaleString() ?? 0}
        </Text>
        <Text style={styles.summaryLabel}>
          Total value — {summary.total_items ?? 0} items
        </Text>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Item name (e.g. Samsung 65in TV)"
        placeholderTextColor="#999"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Category (e.g. Electronics)"
        placeholderTextColor="#999"
        value={category}
        onChangeText={setCategory}
      />
      <TextInput
        style={styles.input}
        placeholder="Purchase price ($)"
        placeholderTextColor="#999"
        keyboardType="numeric"
        value={purchasePrice}
        onChangeText={setPurchasePrice}
      />
      <TextInput
        style={styles.input}
        placeholder="Serial number"
        placeholderTextColor="#999"
        value={serialNumber}
        onChangeText={setSerialNumber}
      />
      <View style={styles.pickerWrapper}>
        <Picker
          style={styles.pickerWrapper}
          selectedValue={condition}
          onValueChange={(value) => setCondition(value)}
        >
          {CONDITIONS.map((c) => (
            <Picker.Item key={c} label={c} value={c} />
          ))}
        </Picker>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Room / location"
        placeholderTextColor="#999"
        value={roomLocation}
        onChangeText={setRoomLocation}
      />
      <Button title="Add Asset" onPress={handleAdd} />

      <FlatList
        style={{ marginTop: 20 }}
        data={items}
        keyExtractor={(item) => item.id.toString()}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <View style={styles.item}>
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
        )}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 100, maxWidth: 1000 },
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

  item: { padding: 10, borderBottomWidth: 1, borderBottomColor: "#eee" },
  itemName: { fontSize: 16, fontWeight: "600" },
  itemMeta: { fontSize: 12, color: "#888", marginTop: 2 },
  itemValue: { fontSize: 14, fontWeight: "500", marginTop: 4 },
});
