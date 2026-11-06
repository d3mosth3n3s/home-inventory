import React, { useMemo, useState } from "react";
import { SectionList, View, Text, Pressable, StyleSheet } from "react-native";
import { useItems } from "../context/ItemsContext";
import { useTheme } from "../context/ThemeContext";
import ItemRow from "../components/ItemRow";
import FloorPlan from "../components/FloorPlan";
import {
  ALL_ROOMS,
  roomKeyFor,
  itemValue,
  formatMoney,
} from "../constants/rooms";

export default function RoomsScreen() {
  const { items } = useItems();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [selected, setSelected] = useState(null);

  const grouped = useMemo(() => {
    const map = {};
    for (const item of items) {
      const key = roomKeyFor(item);
      (map[key] ||= []).push(item);
    }
    return map;
  }, [items]);

  const sections = useMemo(
    () =>
      ALL_ROOMS.filter(
        (r) => grouped[r.key]?.length && (!selected || selected === r.key),
      ).map((r) => ({
        key: r.key,
        title: r.label,
        total: grouped[r.key].reduce((s, i) => s + itemValue(i), 0),
        data: grouped[r.key],
      })),
    [grouped, selected],
  );

  const grandTotal = items.reduce((s, i) => s + itemValue(i), 0);
  const selectedLabel = ALL_ROOMS.find((r) => r.key === selected)?.label;

  return (
    <SectionList
      contentContainerStyle={styles.page}
      sections={sections}
      keyExtractor={(item) => item.id.toString()}
      stickySectionHeadersEnabled={false}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.title}>Rooms</Text>
          <Text style={styles.subtitle}>
            {items.length} items · {formatMoney(grandTotal)} total
          </Text>
          <FloorPlan
            grouped={grouped}
            selected={selected}
            onSelect={setSelected}
            colors={colors}
          />
          <View style={styles.filterRow}>
            <Text style={styles.hint}>
              {selected ? `Showing ${selectedLabel}` : "Tap a room to filter"}
            </Text>
            {selected && (
              <Pressable onPress={() => setSelected(null)} hitSlop={8}>
                <Text style={styles.clear}>Show all</Text>
              </Pressable>
            )}
          </View>
        </View>
      }
      renderSectionHeader={({ section }) => (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Text style={styles.sectionMeta}>
            {section.data.length} · {formatMoney(section.total)}
          </Text>
        </View>
      )}
      renderItem={({ item }) => <ItemRow item={item} />}
      ListEmptyComponent={
        <Text style={styles.empty}>
          {selected ? "Nothing in this room yet." : "No items yet."}
        </Text>
      }
    />
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
    page: { padding: 16, maxWidth: 900, width: "100%", alignSelf: "center" },
    header: { marginBottom: 8 },
    title: { fontSize: 24, fontWeight: "bold", color: c.text },
    subtitle: { color: c.mutedText, fontSize: 14, marginBottom: 12 },
    filterRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 10,
    },
    hint: { color: c.mutedText, fontSize: 13 },
    clear: { color: c.primary ?? c.text, fontSize: 13, fontWeight: "600" },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "baseline",
      marginTop: 16,
      marginBottom: 6,
      paddingBottom: 4,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border ?? c.mutedText,
    },
    sectionTitle: { fontSize: 18, fontWeight: "700", color: c.text },
    sectionMeta: { color: c.mutedText, fontSize: 13 },
    empty: { color: c.mutedText, fontSize: 14, marginTop: 12 },
  });
