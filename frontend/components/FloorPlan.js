import React, { useMemo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { ROOMS, OTHER_ROOM, itemValue, formatMoney } from "../constants/rooms";

const MAX_TOKENS = 8;

/**
 * Top-down house floorplan. Each room shows its item count, total value,
 * and a token per item. Rooms are shaded by their share of total value.
 *
 * props:
 *   grouped   { [roomKey]: item[] }
 *   selected  roomKey | null
 *   onSelect  (roomKey | null) => void
 *   colors    theme colors
 */
export default function FloorPlan({ grouped, selected, onSelect, colors }) {
  const c = {
    text: colors.text ?? "#111",
    muted: colors.mutedText ?? "#777",
    card: colors.surface ?? colors.card ?? colors.background ?? "#fff",
    border: colors.border ?? colors.text ?? "#333",
    accent: colors.primary ?? "#3b82f6",
  };
  const styles = useMemo(() => makeStyles(c), [colors]);

  const totals = useMemo(() => {
    const t = {};
    for (const key in grouped)
      t[key] = grouped[key].reduce((s, i) => s + itemValue(i), 0);
    return t;
  }, [grouped]);
  const maxTotal = Math.max(1, ...Object.values(totals));

  const toggle = (key) => onSelect(selected === key ? null : key);
  const otherItems = grouped[OTHER_ROOM.key] ?? [];

  return (
    <View>
      <View style={styles.house}>
        {ROOMS.map((room) => {
          const items = grouped[room.key] ?? [];
          const total = totals[room.key] ?? 0;
          const isSelected = selected === room.key;
          const dimmed = selected && !isSelected;

          return (
            <Pressable
              key={room.key}
              onPress={() => toggle(room.key)}
              accessibilityRole="button"
              accessibilityLabel={`${room.label}, ${items.length} items, ${formatMoney(total)}`}
              style={[
                styles.room,
                {
                  left: `${room.x}%`,
                  top: `${room.y}%`,
                  width: `${room.w}%`,
                  height: `${room.h}%`,
                  opacity: dimmed ? 0.45 : 1,
                },
                isSelected && styles.roomSelected,
              ]}
            >
              {/* value heat shading */}
              <View
                pointerEvents="none"
                style={[
                  StyleSheet.absoluteFill,
                  {
                    backgroundColor: c.accent,
                    opacity: total ? 0.08 + 0.3 * (total / maxTotal) : 0,
                  },
                ]}
              />
              <Text style={styles.roomLabel} numberOfLines={1}>
                {room.label}
              </Text>
              <Text style={styles.roomMeta} numberOfLines={1}>
                {items.length} {items.length === 1 ? "item" : "items"}
                {total ? ` · ${formatMoney(total)}` : ""}
              </Text>
              <View style={styles.tokens}>
                {items.slice(0, MAX_TOKENS).map((item) => (
                  <View key={item.id} style={styles.token}>
                    <Text style={styles.tokenText}>
                      {String(item.name ?? "?")
                        .charAt(0)
                        .toUpperCase()}
                    </Text>
                  </View>
                ))}
                {items.length > MAX_TOKENS && (
                  <Text style={styles.more}>+{items.length - MAX_TOKENS}</Text>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      {otherItems.length > 0 && (
        <Pressable
          onPress={() => toggle(OTHER_ROOM.key)}
          style={[
            styles.otherChip,
            selected === OTHER_ROOM.key && styles.roomSelected,
          ]}
        >
          <Text style={styles.roomMeta}>
            {OTHER_ROOM.label}: {otherItems.length} ·{" "}
            {formatMoney(totals[OTHER_ROOM.key] ?? 0)}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
    house: {
      width: "100%",
      aspectRatio: 1.5,
      borderWidth: 3,
      borderColor: c.border,
      borderRadius: 6,
      backgroundColor: c.card,
      overflow: "hidden",
    },
    room: {
      position: "absolute",
      borderWidth: 1,
      borderColor: c.border,
      padding: 6,
      overflow: "hidden",
    },
    roomSelected: { borderWidth: 2.5, borderColor: c.accent },
    roomLabel: { color: c.text, fontWeight: "700", fontSize: 13 },
    roomMeta: { color: c.muted, fontSize: 11, marginTop: 1 },
    tokens: { flexDirection: "row", flexWrap: "wrap", marginTop: 4, gap: 3 },
    token: {
      width: 18,
      height: 18,
      borderRadius: 4,
      backgroundColor: c.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    tokenText: { color: "#fff", fontSize: 10, fontWeight: "700" },
    more: { color: c.muted, fontSize: 11, alignSelf: "center" },
    otherChip: {
      alignSelf: "flex-start",
      marginTop: 8,
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: c.border,
    },
  });
