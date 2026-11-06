import { useState } from "react";
import { createItem, uploadPhoto, analyzeImage } from "../api";
import { useItems } from "../context/ItemsContext";
import useEditableOptions from "./useEditableOptions.js";

export const CONDITIONS = ["new", "good", "fair", "poor"];

const EMPTY_FORM = {
  name: "",
  brand: "",
  model: "",
  description: "",
  purchasePrice: "",
  serialNumber: "",
  condition: "good",
  category: "Electronics",
  roomLocation: "Living Room",
};

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const detectedName = (item) =>
  item.item_name ||
  [item.brand, item.model].filter(Boolean).join(" ") ||
  item.box?.class_name ||
  "Detected item";

export default function useItemForm() {
  const { loadItems } = useItems();

  const [form, setForm] = useState(EMPTY_FORM);

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const categoryOpts = useEditableOptions(
    ["Electronics", "Furniture", "Jewelry", "Appliance", "Other"],
    set("category"),
  );
  const roomOpts = useEditableOptions(
    ["Living Room", "Bedroom", "Kitchen", "Garage", "Office", "Other"],
    set("roomLocation"),
  );

  const [imageUri, setImageUri] = useState(null);
  const [formKey, setFormKey] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const [detectedItems, setDetectedItems] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [submitError, setSubmitError] = useState("");

  // form -> detected-item shape (saves edits before switching items)
  const snapshot = () => ({
    item_name: form.name,
    brand: form.brand,
    model: form.model,
    notes: form.description,
    serial_number: form.serialNumber,
    category: form.category,
    purchase_price: form.purchasePrice,
    condition: form.condition,
    room_location: form.roomLocation,
  });

  // detected-item shape -> form
  const loadIntoForm = (item) => {
    const category = item.category ? capitalize(item.category) : "Electronics";
    categoryOpts.ensure(category);
    setForm({
      name: detectedName(item),
      brand: item.brand || "",
      model: item.model || "",
      description: item.notes || "",
      serialNumber: item.serial_number || "",
      purchasePrice:
        item.purchase_price != null ? String(item.purchase_price) : "",
      condition: item.condition || "good",
      category,
      roomLocation: item.room_location || "Living Room",
    });
  };

  const handleImagePicked = async (uri) => {
    setImageUri(uri);
    setAnalysisError("");
    setAnalyzing(true);
    try {
      const response = await analyzeImage(uri);
      const found = response.data?.items || [];
      setDetectedItems(found);
      setSelectedIndex(0);
      if (!found[0]) {
        setAnalysisError(
          "No item was detected. Please enter the details manually.",
        );
        return;
      }
      loadIntoForm(found[0]);
    } catch (error) {
      console.error("Image analysis failed", error);
      setAnalysisError(
        error.response?.data?.detail ||
          "Image analysis failed. You can still enter the item manually.",
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const selectDetected = (index) => {
    if (index === selectedIndex || !detectedItems[index]) return;
    const updated = detectedItems.map((it, i) =>
      i === selectedIndex ? { ...it, ...snapshot() } : it,
    );
    setDetectedItems(updated);
    setSelectedIndex(index);
    loadIntoForm(updated[index]);
  };

  const removeDetected = (index) => {
    // keep edits to the current item unless it's the one being removed
    const updated = detectedItems.map((it, i) =>
      i === selectedIndex && i !== index ? { ...it, ...snapshot() } : it,
    );
    const remaining = updated.filter((_, i) => i !== index);
    setDetectedItems(remaining);

    if (remaining.length === 0) {
      setSelectedIndex(0);
      setForm(EMPTY_FORM);
    } else if (index === selectedIndex) {
      const next = Math.min(index, remaining.length - 1);
      setSelectedIndex(next);
      loadIntoForm(remaining[next]);
    } else if (index < selectedIndex) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const onPriceChange = (text) => {
    const filtered = text.replace(/[^0-9.]/g, "");
    const parts = filtered.split(".");
    set("purchasePrice")(
      parts.length > 2 ? parts[0] + "." + parts.slice(1).join("") : filtered,
    );
  };

  const submit = async () => {
    if (!form.name.trim()) {
      setSubmitError("Enter an item name first (the 'Object Detected' field).");
      return;
    }
    setSubmitError("");
    console.log("2. submit called, name =", JSON.stringify(form.name));
    console.log("3. passed guard, sending request");
    try {
      const res = await createItem({
        name: form.name,
        category: form.category,
        brand: form.brand,
        model: form.model,
        notes: form.description,
        purchase_price: form.purchasePrice
          ? parseFloat(form.purchasePrice)
          : null,
        serial_number: form.serialNumber,
        condition: form.condition,
        room_location: form.roomLocation,
        quantity: 1,
      });
      console.log("4. server responded", res.status);
      if (imageUri) await uploadPhoto(res.data.id, imageUri);

      setForm((f) => ({
        ...EMPTY_FORM,
        category: f.category,
        roomLocation: f.roomLocation,
      }));
      setImageUri(null);
      setAnalysisError("");
      setFormKey((k) => k + 1);
      loadItems();
    } catch (error) {
      console.error("Add asset failed", error);
      setSubmitError(
        error.response?.data?.detail ||
          "Couldn't save the item. Is the backend running?",
      );
    }
  };

  return {
    form,
    set,
    onPriceChange,
    categoryOpts,
    roomOpts,
    formKey,
    analyzing,
    analysisError,
    detectedItems,
    selectedIndex,
    selectDetected,
    removeDetected,
    handleImagePicked,
    submit,
  };
}
