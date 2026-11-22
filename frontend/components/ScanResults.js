import React, { useMemo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

export default function ScanResults({
  detectedItems,
  selectedIndex,
  currentName,
  onSelect,
  onRemove,
  disabled = false,
}) {
  const { colors } = useTheme();

  const styles = useMemo(() => makeStyles(colors), [colors]);

  if (detectedItems.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Scan results</Text>

        <View style={styles.countBadge}>
          <Text style={styles.countText}>{detectedItems.length} detected</Text>
        </View>
      </View>

      <View style={styles.disclaimerBox}>
        <Ionicons
          name="information-circle-outline"
          size={20}
          color={colors.mutedText}
        />

        <Text style={styles.disclaimerText}>
          AI-generated results may be inaccurate or incomplete. Verify all item
          details and manually add any missing belongings.
        </Text>
      </View>

      {detectedItems.map((item, index) => {
        const selected = selectedIndex === index;

        const name = selected
          ? currentName || "Unnamed item"
          : item.item_name || item.box?.class_name || "Unknown item";

        const confidence = item.box?.confidence;

        return (
          <View
            key={item.slot_order ?? index}
            style={[styles.row, selected && styles.selectedRow]}
          >
            <Pressable
              onPress={() => onSelect(index)}
              disabled={disabled}
              accessibilityRole="button"
              accessibilityState={{
                selected,
                disabled,
              }}
              style={styles.itemButton}
            >
              <View
                style={[styles.numberBadge, selected && styles.selectedBadge]}
              >
                <Text
                  style={[styles.numberText, selected && styles.selectedNumber]}
                >
                  {String(index + 1).padStart(2, "0")}
                </Text>
              </View>

              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {name}
                </Text>

                <Text style={styles.itemMeta} numberOfLines={1}>
                  {item.category || "Uncategorized"}

                  {Number.isFinite(confidence)
                    ? ` · ${Math.round(
                        confidence <= 1 ? confidence * 100 : confidence,
                      )}% detection confidence`
                    : ""}
                </Text>
              </View>

              <Ionicons
                name={selected ? "checkmark-circle" : "chevron-forward"}
                size={20}
                color={selected ? colors.accent : colors.mutedText}
              />
            </Pressable>

            <View style={styles.divider} />

            <Pressable
              onPress={() => onRemove(index)}
              disabled={disabled}
              accessibilityLabel={`Remove ${name} from scan results`}
              style={styles.removeButton}
              hitSlop={5}
            >
              <Ionicons
                name="close-outline"
                size={20}
                color={colors.mutedText}
              />
            </Pressable>
          </View>
        );
      })}

      <Text style={styles.footer}>
        Select an object in the image or list to edit its details.
      </Text>
    </View>
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
    container: {
      width: "100%",
      gap: 8,
      marginBottom: 12,
    },

    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 4,
    },

    heading: {
      fontSize: 16,
      fontWeight: "600",
      color: c.text,
    },

    countBadge: {
      borderWidth: 1,
      borderColor: c.accent + "55",
      backgroundColor: c.accent + "15",
      borderRadius: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },

    countText: {
      color: c.accent,
      fontSize: 11,
      fontWeight: "600",
    },

    disclaimerBox: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      backgroundColor: c.inputBg,
      borderWidth: 1,
      borderColor: c.border,
      padding: 12,
      borderRadius: 4,
      marginBottom: 4,
    },

    disclaimerText: {
      color: c.mutedText,
      fontSize: 12,
      lineHeight: 18,
      flex: 1,
    },

    row: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.inputBg,
      borderRadius: 4,
      minHeight: 66,
    },

    selectedRow: {
      borderColor: c.accent,
      backgroundColor: c.accent + "0D",
    },

    itemButton: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      gap: 12,
      padding: 10,
    },

    numberBadge: {
      width: 34,
      height: 34,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#33495c",
      borderRadius: 4,
    },

    selectedBadge: {
      backgroundColor: c.accent,
    },

    numberText: {
      fontSize: 12,
      fontWeight: "600",
      color: "#d7e5f0",
    },

    selectedNumber: {
      color: "#ffffff",
    },

    itemInfo: {
      flex: 1,
      minWidth: 0,
      gap: 4,
    },

    itemName: {
      color: c.text,
      fontSize: 14,
      fontWeight: "600",
    },

    itemMeta: {
      color: c.mutedText,
      fontSize: 11,
    },

    divider: {
      width: 1,
      height: 28,
      backgroundColor: c.border,
    },

    removeButton: {
      padding: 12,
    },

    footer: {
      color: c.mutedText,
      fontSize: 12,
      marginTop: 4,
      lineHeight: 18,
    },
  });
