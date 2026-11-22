import React, { useState, useRef } from "react";
import {
  Alert,
  Image,
  View,
  Text,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from "react-native";

import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

const BOX_COLORS = [
  "#E08A76", // Coral
  "#79ADC9", // Blue
  "#85B89A", // Sage green
  "#C6A76B", // Gold
  "#AA91CB", // Lavender
  "#D48DAF", // Rose
  "#76B9BA", // Teal
  "#B8BF78", // Olive
];

function BoundingBox({
  item,
  index,
  selected,
  imageSize,
  frameSize,
  accent,
  onSelect,
  disabled,
}) {
  const box = item.box;

  if (!box || !imageSize || !frameSize) {
    return null;
  }

  const { width: iw, height: ih } = imageSize;
  const { width: fw, height: fh } = frameSize;

  if (!iw || !ih || !fw || !fh) {
    return null;
  }

  // Account for empty space caused by resizeMode="contain".
  const scale = Math.min(fw / iw, fh / ih);

  const displayedWidth = iw * scale;
  const displayedHeight = ih * scale;

  const offsetX = (fw - displayedWidth) / 2;
  const offsetY = (fh - displayedHeight) / 2;

  const x1 = Math.max(0, Number(box.x1));
  const y1 = Math.max(0, Number(box.y1));
  const x2 = Math.min(iw, Number(box.x2));
  const y2 = Math.min(ih, Number(box.y2));

  if (![x1, y1, x2, y2].every(Number.isFinite) || x2 <= x1 || y2 <= y1) {
    return null;
  }

  const left = offsetX + x1 * scale;
  const top = offsetY + y1 * scale;
  const width = (x2 - x1) * scale;
  const height = (y2 - y1) * scale;

  const color = BOX_COLORS[index % BOX_COLORS.length];

  const cornerSize = Math.min(24, width / 3, height / 3);

  return (
    <Pressable
      disabled={disabled}
      onPress={() => onSelect?.(index)}
      accessibilityRole="button"
      accessibilityLabel={`Select ${item.item_name || "detected object"}`}
      accessibilityState={{ selected }}
      style={[
        styles.boundingBox,
        {
          left,
          top,
          width,
          height,
          borderColor: color,
          borderWidth: selected ? 3 : 2,
          backgroundColor: selected ? `${color}20` : "transparent",
        },
      ]}
    >
      {selected && (
        <>
          <View
            pointerEvents="none"
            style={[
              styles.corner,
              styles.topLeft,
              {
                borderColor: color,
                width: cornerSize,
                height: cornerSize,
              },
            ]}
          />

          <View
            pointerEvents="none"
            style={[
              styles.corner,
              styles.topRight,
              {
                borderColor: color,
                width: cornerSize,
                height: cornerSize,
              },
            ]}
          />

          <View
            pointerEvents="none"
            style={[
              styles.corner,
              styles.bottomLeft,
              {
                borderColor: color,
                width: cornerSize,
                height: cornerSize,
              },
            ]}
          />

          <View
            pointerEvents="none"
            style={[
              styles.corner,
              styles.bottomRight,
              {
                borderColor: color,
                width: cornerSize,
                height: cornerSize,
              },
            ]}
          />
        </>
      )}

      <View
        pointerEvents="none"
        style={[
          styles.boxLabel,
          {
            backgroundColor: color,
            top: top >= 28 ? -27 : 0,
          },
        ]}
      >
        <Text style={styles.boxLabelText}>
          {String(index + 1).padStart(2, "0")}
          {" · "}
          {item.item_name || box.class_name || "Object"}
        </Text>
      </View>
    </Pressable>
  );
}

export default function ImagePickerField({
  onImagePicked,
  disabled = false,
  analyzing = false,
  detectedItems = [],
  selectedIndex = 0,
  onSelect,
  analysisSize = null,
}) {
  const { colors } = useTheme();

  const [image, setImage] = useState(null);
  const [imageSize, setImageSize] = useState(null);
  const [frameSize, setFrameSize] = useState(null);
  const [picking, setPicking] = useState(false);
  const [showBoxes, setShowBoxes] = useState(true);

  const pickingRef = useRef(false);

  const pickImage = async () => {
    if (disabled || pickingRef.current) return;

    pickingRef.current = true;
    setPicking(true);

    try {
      if (Platform.OS !== "web") {
        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
          Alert.alert(
            "Permission required",
            "Photo library access is required.",
          );

          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets?.length) {
        const asset = result.assets[0];

        setImage(asset.uri);

        setImageSize(
          asset.width > 0 && asset.height > 0
            ? {
                width: asset.width,
                height: asset.height,
              }
            : null,
        );

        setShowBoxes(true);

        await onImagePicked(asset.uri);
      }
    } catch (error) {
      console.error("Image picker failed", error);
    } finally {
      pickingRef.current = false;
      setPicking(false);
    }
  };

  // Draw larger boxes first so smaller objects
  // remain accessible when detections overlap.
  const orderedDetections = detectedItems
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const area = (item) => {
        const box = item.box;

        if (!box) return 0;

        return (box.x2 - box.x1) * (box.y2 - box.y1);
      };

      return area(b.item) - area(a.item);
    });

  return (
    <View style={styles.container}>
      {image ? (
        <>
          <View style={styles.imageToolbar}>
            <View style={styles.imageStatus}>
              <Ionicons
                name="image-outline"
                size={16}
                color={colors.mutedText}
              />

              <Text style={[styles.toolbarText, { color: colors.mutedText }]}>
                Image preview
              </Text>
            </View>

            {detectedItems.length > 0 && !analyzing && (
              <Pressable
                onPress={() => setShowBoxes((v) => !v)}
                accessibilityRole="button"
                style={styles.toggleButton}
              >
                <Ionicons
                  name={showBoxes ? "eye-outline" : "eye-off-outline"}
                  size={18}
                  color={colors.accent}
                />

                <Text style={[styles.toolbarText, { color: colors.text }]}>
                  {showBoxes ? "Hide outlines" : "Show outlines"}
                </Text>
              </Pressable>
            )}
          </View>

          <View
            style={[styles.imageContainer, { borderColor: colors.border }]}
            onLayout={(event) => {
              const { width, height } = event.nativeEvent.layout;

              setFrameSize({ width, height });
            }}
          >
            <Image
              source={{ uri: image }}
              style={styles.image}
              resizeMode="contain"
              onLoad={(event) => {
                const source = event.nativeEvent.source;

                if (source?.width && source?.height) {
                  setImageSize(
                    (previous) =>
                      previous ?? {
                        width: source.width,
                        height: source.height,
                      },
                  );
                }
              }}
            />

            {showBoxes &&
              !analyzing &&
              orderedDetections.map(({ item, index }) => (
                <BoundingBox
                  key={item.slot_order ?? index}
                  item={item}
                  index={index}
                  selected={index === selectedIndex}
                  imageSize={analysisSize ?? imageSize}
                  frameSize={frameSize}
                  accent={colors.accent}
                  onSelect={onSelect}
                  disabled={disabled}
                />
              ))}

            {analyzing && (
              <View style={styles.overlay}>
                <ActivityIndicator size="large" color={colors.accent} />

                <Text style={styles.overlayText}>Analyzing image</Text>

                <Text style={styles.overlaySubtitle}>
                  Identifying objects and extracting details
                </Text>
              </View>
            )}
          </View>

          <View style={styles.bottomToolbar}>
            <Text style={[styles.toolbarText, { color: colors.mutedText }]}>
              {analyzing
                ? "Analysis in progress"
                : detectedItems.length > 0
                  ? `${detectedItems.length} detected ${
                      detectedItems.length === 1 ? "object" : "objects"
                    }`
                  : "Photo uploaded"}
            </Text>

            <Pressable
              onPress={pickImage}
              disabled={disabled || picking}
              style={[
                styles.changeButton,
                { borderColor: colors.border },
                (disabled || picking) && {
                  opacity: 0.45,
                },
              ]}
            >
              <Ionicons
                name="swap-horizontal-outline"
                size={17}
                color={colors.text}
              />

              <Text style={[styles.toolbarText, { color: colors.text }]}>
                Change image
              </Text>
            </Pressable>
          </View>
        </>
      ) : (
        <Pressable
          onPress={pickImage}
          disabled={disabled || picking}
          style={[
            styles.uploadArea,
            {
              borderColor: colors.border,
              backgroundColor: colors.inputBg,
            },
          ]}
        >
          <View
            style={[
              styles.uploadIcon,
              {
                backgroundColor: colors.accent + "18",
              },
            ]}
          >
            <Ionicons
              name="cloud-upload-outline"
              size={32}
              color={colors.accent}
            />
          </View>

          <Text style={[styles.uploadTitle, { color: colors.text }]}>
            Upload an image
          </Text>

          <Text style={[styles.uploadSubtitle, { color: colors.mutedText }]}>
            Select a photograph to begin AI analysis
          </Text>

          <View
            style={[styles.uploadButton, { backgroundColor: colors.accent }]}
          >
            <Text style={styles.uploadButtonText}>
              {picking ? "Opening..." : "Browse files"}
            </Text>
          </View>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    gap: 10,
  },

  imageToolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },

  imageStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  toolbarText: {
    fontSize: 12,
    fontWeight: "500",
  },

  toggleButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 4,
  },

  imageContainer: {
    width: "100%",
    aspectRatio: 4 / 3,
    position: "relative",
    backgroundColor: "#101720",
    overflow: "hidden",
    borderRadius: 4,
    borderWidth: 1,
  },

  image: {
    width: "100%",
    height: "100%",
  },

  boundingBox: {
    position: "absolute",
    borderWidth: 1,
  },

  corner: {
    position: "absolute",
  },

  topLeft: {
    top: -1,
    left: -1,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },

  topRight: {
    top: -1,
    right: -1,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },

  bottomLeft: {
    bottom: -1,
    left: -1,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },

  bottomRight: {
    bottom: -1,
    right: -1,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  boxLabel: {
    position: "absolute",
    left: -2,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 2,
    alignSelf: "flex-start",
    zIndex: 10,
  },

  boxLabelText: {
    color: "#101820",
    fontSize: 12,
    fontWeight: "700",
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(8,14,21,0.78)",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 20,
  },

  overlayText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "600",
  },

  overlaySubtitle: {
    color: "#a3bbd0",
    fontSize: 12,
    textAlign: "center",
  },

  bottomToolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },

  changeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 4,
  },

  uploadArea: {
    width: "100%",
    minHeight: 270,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },

  uploadIcon: {
    width: 64,
    height: 64,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  uploadTitle: {
    fontSize: 18,
    fontWeight: "600",
  },

  uploadSubtitle: {
    fontSize: 13,
    textAlign: "center",
  },

  uploadButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 4,
    marginTop: 6,
  },

  uploadButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 13,
  },
});
