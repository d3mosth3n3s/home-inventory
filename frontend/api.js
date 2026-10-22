import axios from "axios";
import { Platform } from "react-native";

const API_ORIGIN =
  "https://home-inventory-5p3d.onrender.com";

const API_BASE = `${API_ORIGIN}/api`;

const client = axios.create({
  baseURL: API_BASE,
});

export const getItems = () => client.get("/items");
export const createItem = (item) => client.post("/items", item);
export const updateItem = (id, item) =>
  client.put(`/items/${id}`, item);
export const deleteItem = (id) => client.delete(`/items/${id}`);
export const getSummary = () => client.get("/items/summary");
export const getExportUrl = () => `${API_BASE}/items/export`;
export { API_ORIGIN };

const appendImage = async (formData, uri, fieldName) => {
  if (Platform.OS === "web") {
    const blob = await fetch(uri).then((res) => res.blob());
    formData.append(fieldName, blob, "photo.jpg");
  } else {
    formData.append(fieldName, {
      uri,
      name: "photo.jpg",
      type: "image/jpeg",
    });
  }
};

export const analyzeImage = async (uri) => {
  const formData = new FormData();
  await appendImage(formData, uri, "image");

  return client.post("/analyze-image", formData);
};

export const uploadPhoto = async (itemId, uri) => {
  const formData = new FormData();
  await appendImage(formData, uri, "photo");

  return client.post(`/items/${itemId}/photo`, formData);
};
