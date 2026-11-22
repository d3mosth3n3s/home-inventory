import { useState, useRef } from "react";
import { createItem, uploadPhoto, analyzeImage } from "../api";
import { useItems } from "../context/ItemsContext";
import useEditableOptions from "./useEditableOptions.js";
import { validateItem, formatApiError } from "../utils/itemValidation";

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
  roomLocation: "Unassigned",
};

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const detectedName = (item) =>
  item.item_name ||
  [item.brand, item.model].filter(Boolean).join(" ") ||
  item.box?.class_name ||
  "Detected item";

export default function useItemForm() {
  const { loadItems } = useItems();
  const [analysisMode, setAnalysisMode] = useState("single");
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageUri, setImageUri] = useState(null);
  const [analysisSize, setAnalysisSize] = useState(null);
  const [formKey, setFormKey] = useState(0);

  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [analysisError, setAnalysisError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [detectedItems, setDetectedItems] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Synchronous locks prevent rapid duplicate requests.
  const analyzingRef = useRef(false);
  const savingRef = useRef(false);

  const set = (key) => (value) => {
    if (analyzingRef.current || savingRef.current) return;

    setForm((f) => ({ ...f, [key]: value }));
  };

  const categoryOpts = useEditableOptions("category", set("category"));

  const roomOpts = useEditableOptions("room", set("roomLocation"));

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
      roomLocation: item.room_location || "Unassigned",
    });
  };

  const handleImagePicked = async (uri, mode = analysisMode) => {
    if (analyzingRef.current || savingRef.current) return;

    analyzingRef.current = true;

    setImageUri(uri);
    setAnalysisError("");
    setSubmitError("");
    setSuccessMessage("");
    setDetectedItems([]);
    setAnalysisSize(null);
    setSelectedIndex(0);
    setAnalyzing(true);

    try {
      const response = await analyzeImage(uri, mode);
      const found = response.data?.items || [];
      const width = response.data?.image_width;
      const height = response.data?.image_height;

      if (width > 0 && height > 0) {
        setAnalysisSize({ width, height });
      }
      setDetectedItems(found);

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
        formatApiError(
          error,
          "Image analysis failed. You can still enter the item manually.",
        ),
      );
    } finally {
      analyzingRef.current = false;
      setAnalyzing(false);
    }
  };

  const changeAnalysisMode = async (mode) => {
    if (analyzingRef.current || savingRef.current) return;
    if (mode === analysisMode) return;

    setAnalysisMode(mode);

    if (imageUri) {
      await handleImagePicked(imageUri, mode);
    }
  };

  const selectDetected = (index) => {
    if (analyzingRef.current || savingRef.current) return;
    if (index === selectedIndex || !detectedItems[index]) return;

    const updated = detectedItems.map((it, i) =>
      i === selectedIndex ? { ...it, ...snapshot() } : it,
    );

    setDetectedItems(updated);
    setSelectedIndex(index);
    loadIntoForm(updated[index]);
  };

  const removeDetected = (index) => {
    if (analyzingRef.current || savingRef.current) return;

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
    set("purchasePrice")(text);
  };

  const submit = async () => {
    if (savingRef.current || analyzingRef.current) return;

    const validationError = validateItem(form);

    if (validationError) {
      setSubmitError(validationError);
      return;
    }

    savingRef.current = true;
    setSaving(true);
    setSubmitError("");
    setSuccessMessage("");

    try {
      const res = await createItem({
        name: form.name.trim(),
        category: form.category,
        brand: form.brand,
        model: form.model,
        notes: form.description,
        purchase_price: form.purchasePrice ? Number(form.purchasePrice) : null,
        serial_number: form.serialNumber,
        condition: form.condition,
        room_location: form.roomLocation,
        quantity: 1,
      });

      let photoFailed = false;

      if (imageUri) {
        try {
          await uploadPhoto(res.data.id, imageUri);
        } catch (error) {
          console.error("Photo upload failed", error);
          photoFailed = true;
        }
      }

      setForm((f) => ({
        ...EMPTY_FORM,
        category: f.category,
        roomLocation: f.roomLocation,
      }));

      setImageUri(null);
      setDetectedItems([]);
      setSelectedIndex(0);
      setAnalysisError("");
      setFormKey((k) => k + 1);

      setSuccessMessage(
        photoFailed
          ? "Item saved, but the photo could not be uploaded. You can add it from Edit Item."
          : "Item added to your inventory.",
      );

      loadItems();
    } catch (error) {
      console.error("Add asset failed", error);

      setSubmitError(formatApiError(error, "Couldn't save the item."));
    } finally {
      savingRef.current = false;
      setSaving(false);
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
    saving,
    busy: analyzing || saving,
    analysisError,
    submitError,
    successMessage,
    detectedItems,
    selectedIndex,
    selectDetected,
    removeDetected,
    handleImagePicked,
    submit,
    analysisMode,
    changeAnalysisMode,
    analysisSize,
  };
}
