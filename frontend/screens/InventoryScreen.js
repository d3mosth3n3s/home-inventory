import React, { useMemo, useState } from "react";
import {
  View,
  FlatList,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import { useItems } from "../context/ItemsContext";
import { useTheme } from "../context/ThemeContext";
import ItemRow from "../components/ItemRow";
import { exportItemsPdf } from "../api";



export default function InventoryScreen() {
  const { items } = useItems();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [room, setRoom] = useState("");
  const [sort, setSort] = useState("newest");
  const [exporting, setExporting] = useState(false);
const [exportError, setExportError] = useState("");

  // Generate filter options from existing inventory
  const categories = useMemo(
    () =>
      [...new Set(items.map((item) => item.category).filter(Boolean))].sort(),
    [items],
  );

  const rooms = useMemo(
    () =>
      [
        ...new Set(items.map((item) => item.room_location).filter(Boolean)),
      ].sort(),
    [items],
  );

  // Search, filter, and sort inventory
  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    const results = items.filter((item) => {
      const matchesSearch =
        !query ||
        [
          item.name,
          item.brand,
          item.model,
          item.serial_number,
          item.notes,
        ].some((value) =>
          String(value ?? "")
            .toLowerCase()
            .includes(query),
        );

      const matchesCategory = !category || item.category === category;

      const matchesRoom = !room || item.room_location === room;

      return matchesSearch && matchesCategory && matchesRoom;
    });

    const getValue = (item) =>
      Number(item.current_value ?? item.purchase_price ?? 0);

    switch (sort) {
      case "name-asc":
        return results.sort((a, b) => a.name.localeCompare(b.name));

      case "name-desc":
        return results.sort((a, b) => b.name.localeCompare(a.name));

      case "price-high":
        return results.sort((a, b) => getValue(b) - getValue(a));

      case "price-low":
        return results.sort((a, b) => getValue(a) - getValue(b));

      case "oldest":
        return results.sort((a, b) => a.id - b.id);

      default:
        return results.sort((a, b) => b.id - a.id);
    }
  }, [items, search, category, room, sort]);

  const hasFilters = Boolean(search || category || room || sort !== "newest");

  const clearFilters = () => {
    setSearch("");
    setCategory("");
    setRoom("");
    setSort("newest");
  };

const handleExportPdf = async () => {
  if (exporting) return;

  setExporting(true);
  setExportError("");

  try {
    if (Platform.OS !== "web") {
      setExportError(
        "PDF export is currently available on the web version."
      );
      return;
    }

    const response = await exportItemsPdf();

    const blob = new Blob([response.data], {
      type: "application/pdf",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "ReCovered_Inventory.pdf";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (error) {
    console.error("PDF export failed:", error);

    setExportError(
      "Unable to export inventory. Please try again."
    );
  } finally {
    setExporting(false);
  }
};

  return (
    <FlatList
      contentContainerStyle={styles.page}
      data={filteredItems}
      keyExtractor={(item) => item.id.toString()}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View style={styles.header}>
          {/* TITLE AND PDF EXPORT*/}

          {/* TITLE AND PDF EXPORT */}

<View style={styles.titleRow}>
  <Text style={styles.title}>Inventory</Text>

  <Pressable
    style={[
      styles.exportButton,
      exporting && styles.exportButtonDisabled,
    ]}
    onPress={handleExportPdf}
    disabled={exporting}
    accessibilityRole="button"
    accessibilityLabel="Export inventory as PDF"
  >
    {exporting ? (
      <ActivityIndicator size="small" color="#FFFFFF" />
    ) : (
      <Ionicons
        name="download-outline"
        size={20}
        color="#FFFFFF"
      />
    )}

    <Text style={styles.exportButtonText}>
      {exporting ? "Exporting..." : "Export as PDF"}
    </Text>
  </Pressable>
</View>

{!!exportError && (
  <Text style={styles.exportError}>
    {exportError}
  </Text>
)}

          {/* SEARCH */}

          <View style={styles.searchBar}>
            <Ionicons
              name="search-outline"
              size={21}
              color={colors.mutedText}
            />

            <TextInput
              style={styles.searchInput}
              placeholder="Search your inventory..."
              placeholderTextColor={colors.placeholder}
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
            />

            {!!search && (
              <Pressable
                onPress={() => setSearch("")}
                accessibilityLabel="Clear search"
              >
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={colors.mutedText}
                />
              </Pressable>
            )}
          </View>

          {/* FILTERS */}

          <View style={styles.filterRow}>
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Category</Text>

              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={category}
                  onValueChange={setCategory}
                  style={styles.picker}
                  dropdownIconColor={colors.text}
                >
                  <Picker.Item
                    label="All categories"
                    value=""
                    color={colors.text}
                  />

                  {categories.map((value) => (
                    <Picker.Item
                      key={value}
                      label={value}
                      value={value}
                      color={colors.text}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Room</Text>

              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={room}
                  onValueChange={setRoom}
                  style={styles.picker}
                  dropdownIconColor={colors.text}
                >
                  <Picker.Item label="All rooms" value="" color={colors.text} />

                  {rooms.map((value) => (
                    <Picker.Item
                      key={value}
                      label={value}
                      value={value}
                      color={colors.text}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Sort by</Text>

              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={sort}
                  onValueChange={setSort}
                  style={styles.picker}
                  dropdownIconColor={colors.text}
                >
                  <Picker.Item label="Newest first" value="newest" />
                  <Picker.Item label="Oldest first" value="oldest" />
                  <Picker.Item label="Name: A–Z" value="name-asc" />
                  <Picker.Item label="Name: Z–A" value="name-desc" />
                  <Picker.Item label="Value: High to low" value="price-high" />
                  <Picker.Item label="Value: Low to high" value="price-low" />
                </Picker>
              </View>
            </View>
          </View>

          {/* RESULTS */}

          <View style={styles.resultsRow}>
            <Text style={styles.resultsText}>
              Showing {filteredItems.length} of {items.length} items
            </Text>

            {hasFilters && (
              <Pressable onPress={clearFilters} style={styles.clearButton}>
                <Ionicons
                  name="refresh-outline"
                  size={16}
                  color={colors.accent}
                />

                <Text style={styles.clearText}>Clear filters</Text>
              </Pressable>
            )}
          </View>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Ionicons
            name={items.length ? "search-outline" : "cube-outline"}
            size={40}
            color={colors.mutedText}
          />

          <Text style={styles.emptyTitle}>
            {items.length ? "No matching items" : "No items yet"}
          </Text>

          <Text style={styles.empty}>
            {items.length
              ? "Try adjusting your search or filters."
              : "Add your first item to start building your inventory."}
          </Text>
        </View>
      }
      renderItem={({ item }) => <ItemRow item={item} />}
    />
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
    page: {
      padding: 16,
      maxWidth: 900,
      width: "100%",
      alignSelf: "center",
    },

    header: {
      marginBottom: 16,
      gap: 16,
    },

    title: {
      fontSize: 24,
      fontWeight: "bold",
      color: c.text,
    },

    // PDF EXPORT

titleRow: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  flexWrap: "wrap",
  gap: 12,
},

exportButton: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: c.accent,
  paddingHorizontal: 14,
  paddingVertical: 10,
  borderRadius: 6,
  gap: 8,
},

exportButtonText: {
  color: "#FFFFFF",
  fontSize: 14,
  fontWeight: "600",
},

exportButtonDisabled: {
  opacity: 0.6,
},

exportError: {
  color: "#D32F2F",
  fontSize: 13,
},

    // SEARCH

    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.inputBg,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 6,
      paddingHorizontal: 12,
      gap: 10,
    },

    searchInput: {
      flex: 1,
      minWidth: 0,
      fontSize: 15,
      color: c.text,
      paddingVertical: 12,
    },

    // FILTERS

    filterRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },

    filterGroup: {
      flex: 1,
      minWidth: 140,
      gap: 6,
    },

    filterLabel: {
      fontSize: 12,
      fontWeight: "500",
      color: c.mutedText,
    },

    pickerWrapper: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 6,
      backgroundColor: c.inputBg,
      overflow: "hidden",
    },

    picker: {
      color: c.text,
      backgroundColor: c.inputBg,
      minHeight: 42,
      width: "100%",
      fontSize: 14,
    },

    // RESULTS

    resultsRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: 8,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      paddingBottom: 12,
    },

    resultsText: {
      color: c.mutedText,
      fontSize: 13,
    },

    clearButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },

    clearText: {
      color: c.accent,
      fontSize: 13,
      fontWeight: "500",
    },

    // EMPTY STATE

    emptyContainer: {
      alignItems: "center",
      paddingVertical: 48,
      paddingHorizontal: 16,
      gap: 12,
    },

    emptyTitle: {
      color: c.text,
      fontSize: 20,
      fontWeight: "500",
    },

    empty: {
      color: c.mutedText,
      fontSize: 14,
      textAlign: "center",
    },
  });
