import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  Button,
  StyleSheet,
} from "react-native";
import { getItems, createItem } from "./api";

export default function App() {
  const [items, setItems] = useState([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");

  const loadItems = () => {
    getItems()
      .then((res) => setItems(res.data))
      .catch(console.error);
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleAdd = async () => {
    if (!name) return;
    await createItem({ name, category, quantity: 1 });
    setName("");
    setCategory("");
    loadItems();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Item Inventory</Text>
      <TextInput
        style={styles.input}
        placeholder="Item name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Category"
        value={category}
        onChangeText={setCategory}
      />
      <Button title="Add Item" onPress={handleAdd} />
      <FlatList
        data={items}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Text style={styles.item}>
            {item.name} — {item.category} (qty: {item.quantity})
          </Text>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 400 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 8, marginBottom: 10 },
  item: { padding: 10, borderBottomWidth: 1, borderBottomColor: "#eee" },
});
