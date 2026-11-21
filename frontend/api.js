import axios from "axios";
import { Platform } from "react-native";
import { supabase } from "./lib/supabase";

const PROD_ORIGIN = "https://home-inventory-5p3d.onrender.com";

const LOCAL_ORIGIN =
  Platform.OS === "android" ? "http://10.0.2.2:5000" : "http://127.0.0.1:5000";

const API_ORIGIN = __DEV__ ? LOCAL_ORIGIN : PROD_ORIGIN;

console.log("API_ORIGIN is:", API_ORIGIN);

const API_BASE = `${API_ORIGIN}/api`;

const client = axios.create({
  baseURL: API_BASE,
});

// Attach the current Supabase access token to API requests.
client.interceptors.request.use(async (config) => {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    return Promise.reject(error);
  }

  if (session?.access_token) {
    config.headers.set("Authorization", `Bearer ${session.access_token}`);
  } else {
    config.headers.delete("Authorization");
  }

  return config;
});

// Inventory endpoints
export const getItems = () => client.get("/items");

export const createItem = (item) => client.post("/items", item);

export const updateItem = (id, item) => client.put(`/items/${id}`, item);

export const deleteItem = (id) => client.delete(`/items/${id}`);

export const getSummary = () => client.get("/items/summary");

// Authenticated CSV export
export const exportItems = () =>
  client.get("/items/export", {
    responseType: "blob",
  });

// Keep this for compatibility, but do not use it
// for authenticated downloads.
export const getExportUrl = () => `${API_BASE}/items/export`;

export { API_ORIGIN };

// Resolve photo URLs
export const photoUrlFor = (item) => {
  const p = item?.photo_url;
  if (!p) return null;

  const url = /^(https?:|file:|data:|blob:)/.test(p) ? p : `${API_ORIGIN}${p}`;

  return item.updated_at
    ? `${url}${url.includes("?") ? "&" : "?"}v=${encodeURIComponent(item.updated_at)}`
    : url;
};

// Append image to FormData
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

// Image analysis
export const analyzeImage = async (uri) => {
  const formData = new FormData();

  await appendImage(formData, uri, "image");

  return client.post("/analyze-image", formData);
};

// Photo upload
export const uploadPhoto = async (itemId, uri) => {
  const formData = new FormData();

  await appendImage(formData, uri, "photo");

  return client.post(`/items/${itemId}/photo`, formData);
};
