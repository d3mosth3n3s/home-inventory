import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  PanResponder,
  StyleSheet,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import {
  OTHER_ROOM,
  MIN_ROOM_SIZE,
  itemValue,
  formatMoney,
  snap,
} from "../constants/rooms";

import { photoUrlFor } from "../api";

const MAX_TOKENS = 8;

function Token({ item, styles }) {
  const [failed, setFailed] = useState(false);
  const uri = photoUrlFor(item);

  if (uri && !failed) {
    return (
      <Image
        source={{ uri }}
        style={styles.tokenImage}
        resizeMode="cover"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <View style={styles.token}>
      <Text style={styles.tokenText}>
        {String(item.name ?? "?")
          .charAt(0)
          .toUpperCase()}
      </Text>
    </View>
  );
}

function useRoomGesture({
  room,
  editing,
  dimensions,
  canvasHeight,
  onUpdate,
  resizing = false,
}) {
  const latest = useRef(null);
  const start = useRef(null);

  latest.current = {
    room,
    editing,
    dimensions,
    canvasHeight,
    onUpdate,
    resizing,
  };

  return useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => latest.current.editing,

        onMoveShouldSetPanResponder: () => latest.current.editing,

        onPanResponderGrant: () => {
          start.current = {
            ...latest.current.room,
          };
        },

        onPanResponderMove: (_, gesture) => {
          const { dimensions, canvasHeight, onUpdate, resizing } =
            latest.current;

          if (!start.current || !dimensions.width || !dimensions.height) {
            return;
          }

          const original = start.current;

          const dx = snap((gesture.dx / dimensions.width) * 100);

          const dy = snap((gesture.dy / dimensions.height) * canvasHeight);

          let candidate;

          if (resizing) {
            candidate = {
              ...original,
              w: Math.min(
                100 - original.x,
                Math.max(MIN_ROOM_SIZE, original.w + dx),
              ),
              h: Math.min(
                canvasHeight - original.y,
                Math.max(MIN_ROOM_SIZE, original.h + dy),
              ),
            };
          } else {
            candidate = {
              ...original,
              x: Math.max(0, Math.min(100 - original.w, original.x + dx)),
              y: Math.max(
                0,
                Math.min(canvasHeight - original.h, original.y + dy),
              ),
            };
          }

          onUpdate(candidate, canvasHeight);
        },

        onPanResponderRelease: () => {
          start.current = null;
        },

        onPanResponderTerminate: () => {
          start.current = null;
        },

        onPanResponderTerminationRequest: () => false,
      }),
    [],
  );
}

function Room({
  room,
  items,
  editing,
  selected,
  onSelect,
  onUpdate,
  canvasHeight,
  dimensions,
  maxTotal,
  styles,
  colors,
}) {
  const moveGesture = useRoomGesture({
    room,
    editing,
    dimensions,
    canvasHeight,
    onUpdate,
  });

  const resizeGesture = useRoomGesture({
    room,
    editing,
    dimensions,
    canvasHeight,
    onUpdate,
    resizing: true,
  });

  const total = items.reduce((sum, item) => sum + itemValue(item), 0);

  const isSelected = selected === room.key;

  const position = {
    left: `${room.x}%`,
    top: `${(room.y / canvasHeight) * 100}%`,
    width: `${room.w}%`,
    height: `${(room.h / canvasHeight) * 100}%`,
  };

  const content = (
    <>
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: colors.accent,
            opacity: total ? 0.08 + 0.3 * (total / maxTotal) : 0,
          },
        ]}
      />

      <Text style={styles.roomLabel} numberOfLines={1}>
        {room.label}
      </Text>

      <Text style={styles.roomMeta} numberOfLines={1}>
        {items.length} items
        {total ? ` · ${formatMoney(total)}` : ""}
      </Text>

      {!editing && (
        <View style={styles.tokens}>
          {items.slice(0, MAX_TOKENS).map((item) => (
            <Token key={item.id} item={item} styles={styles} />
          ))}

          {items.length > MAX_TOKENS && (
            <Text style={styles.more}>+{items.length - MAX_TOKENS}</Text>
          )}
        </View>
      )}
    </>
  );

  if (editing) {
    return (
      <View
        style={[styles.room, position, styles.editableRoom]}
        {...moveGesture.panHandlers}
      >
        {content}

        <View style={styles.moveIcon}>
          <Ionicons name="move-outline" size={18} color={colors.mutedText} />
        </View>

        <View style={styles.resizeHandle} {...resizeGesture.panHandlers}>
          <Ionicons name="resize-outline" size={17} color="#ffffff" />
        </View>
      </View>
    );
  }

  return (
    <Pressable
      onPress={() => onSelect(isSelected ? null : room.key)}
      accessibilityRole="button"
      accessibilityLabel={`${room.label}, ${items.length} items`}
      style={[
        styles.room,
        position,
        selected && !isSelected && styles.dimmed,
        isSelected && styles.roomSelected,
      ]}
    >
      {content}
    </Pressable>
  );
}

export default function FloorPlan({
  layout,
  grouped,
  selected,
  onSelect,
  colors,
  editing = false,
  onUpdate,
  canvasHeight = 100,
}) {
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [dimensions, setDimensions] = useState({
    width: 0,
    height: 0,
  });

  const maxTotal = Math.max(
    1,
    ...Object.values(grouped).map((items) =>
      items.reduce((sum, item) => sum + itemValue(item), 0),
    ),
  );

  const otherItems = grouped[OTHER_ROOM.key] ?? [];

  return (
    <View>
      <View
        style={[
          styles.house,
          {
            aspectRatio: (100 / canvasHeight) * 1.5,
          },
        ]}
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;

          setDimensions({ width, height });
        }}
      >
        {editing &&
          Array.from({ length: 19 }, (_, index) => (
            <View
              key={`vertical-${index}`}
              pointerEvents="none"
              style={[
                styles.verticalLine,
                {
                  left: `${(index + 1) * 5}%`,
                },
              ]}
            />
          ))}

        {editing &&
          Array.from(
            {
              length: Math.ceil(canvasHeight / 5) - 1,
            },
            (_, index) => (
              <View
                key={`horizontal-${index}`}
                pointerEvents="none"
                style={[
                  styles.horizontalLine,
                  {
                    top: `${((index + 1) * 5 * 100) / canvasHeight}%`,
                  },
                ]}
              />
            ),
          )}

        {layout.map((room) => (
          <Room
            key={room.key}
            room={room}
            items={grouped[room.key] ?? []}
            editing={editing}
            selected={selected}
            onSelect={onSelect}
            onUpdate={onUpdate}
            canvasHeight={canvasHeight}
            dimensions={dimensions}
            maxTotal={maxTotal}
            styles={styles}
            colors={colors}
          />
        ))}
      </View>

      {!editing && otherItems.length > 0 && (
        <Pressable
          onPress={() =>
            onSelect(selected === OTHER_ROOM.key ? null : OTHER_ROOM.key)
          }
          style={[
            styles.otherChip,
            selected === OTHER_ROOM.key && styles.roomSelected,
          ]}
        >
          <Text style={styles.roomMeta}>
            Unassigned: {otherItems.length} ·{" "}
            {formatMoney(
              otherItems.reduce((sum, item) => sum + itemValue(item), 0),
            )}
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
      backgroundColor: c.background,
      borderWidth: 1,
      borderColor: c.border,
      overflow: "hidden",
    },

    room: {
      position: "absolute",
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      padding: 6,
      overflow: "hidden",
    },

    editableRoom: {
      borderColor: c.accent,
    },

    roomSelected: {
      borderWidth: 2,
      borderColor: c.accent,
    },

    dimmed: {
      opacity: 0.45,
    },

    roomLabel: {
      color: c.text,
      fontWeight: "700",
      fontSize: 13,
    },

    roomMeta: {
      color: c.mutedText,
      fontSize: 11,
      marginTop: 2,
    },

    moveIcon: {
      position: "absolute",
      top: 6,
      right: 6,
    },

    resizeHandle: {
      position: "absolute",
      bottom: 0,
      right: 0,
      width: 26,
      height: 26,
      backgroundColor: c.accent,
      alignItems: "center",
      justifyContent: "center",
      zIndex: 5,
    },

    verticalLine: {
      position: "absolute",
      top: 0,
      bottom: 0,
      width: 1,
      backgroundColor: c.border,
      opacity: 0.35,
    },

    horizontalLine: {
      position: "absolute",
      left: 0,
      right: 0,
      height: 1,
      backgroundColor: c.border,
      opacity: 0.35,
    },

    tokens: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginTop: 4,
      gap: 3,
    },

    token: {
      width: 36,
      height: 36,
      borderRadius: 4,
      backgroundColor: c.accent,
      alignItems: "center",
      justifyContent: "center",
    },

    tokenImage: {
      width: 36,
      height: 36,
      borderRadius: 4,
      backgroundColor: c.border,
    },

    tokenText: {
      color: "#fff",
      fontSize: 12,
      fontWeight: "700",
    },

    more: {
      color: c.mutedText,
      fontSize: 11,
      alignSelf: "center",
    },

    otherChip: {
      alignSelf: "flex-start",
      marginTop: 8,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: c.border,
    },
  });
