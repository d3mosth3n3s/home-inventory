import { useState, useRef } from "react";
import {
  Alert,
  Button,
  Image,
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useTheme } from "../context/ThemeContext";

export default function ImagePickerField({
  onImagePicked,
  disabled = false,
  analyzing = false,
}) {
  const { colors } = useTheme();

  const [image, setImage] = useState(null);
  const [picking, setPicking] = useState(false);

  const pickingRef = useRef(false);

  const pickImage = async () => {
    if (disabled || pickingRef.current) return;

    pickingRef.current = true;
    setPicking(true);

    try {
      if (Platform.OS !== "web") {
        const permissionResult =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permissionResult.granted) {
          Alert.alert(
            "Permission required",
            "Permission to access the media library is required.",
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
        const uri = result.assets[0].uri;

        setImage(uri);
        await onImagePicked(uri);
      }
    } catch (error) {
      console.error("Image picker failed", error);
    } finally {
      pickingRef.current = false;
      setPicking(false);
    }
  };

  return (
    <View style={styles.container}>
      <Button
        title={
          analyzing ? "Analyzing..." : image ? "Change image" : "Pick an image"
        }
        onPress={pickImage}
        color={colors.accent}
        disabled={disabled || picking}
      />

      {image && (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: image }}
            style={styles.image}
            resizeMode="contain"
          />

          {analyzing && (
            <View style={styles.overlay}>
              <ActivityIndicator size="large" color={colors.accent} />

              <Text style={styles.overlayText}>Analyzing image...</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    padding: 8,
    gap: 12,
  },

  imageContainer: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: 8,
    overflow: "hidden",
  },

  image: {
    width: "100%",
    height: "100%",
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },

  overlayText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "500",
  },
});
