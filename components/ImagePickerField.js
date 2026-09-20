import { useState } from "react";
import { Alert, Button, Image, View, StyleSheet } from "react-native";
import * as ImagePicker from "expo-image-picker";

export default function ImagePickerField({ onImagePicked }) {
  const [image, setImage] = useState(null);

  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(
        "Permission required",
        "Permission to access the media library is required.",
      );
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setImage(uri);
      onImagePicked(uri);
    }
  };

  return (
    <View style={styles.container}>
      <Button title="Pick an image" onPress={pickImage} />
      {image && <Image source={{ uri: image }} style={styles.image} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center" },
  image: { width: 120, height: 120, marginTop: 8 },
});
