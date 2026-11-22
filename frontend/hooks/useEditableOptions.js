import { useState, useRef } from "react";
import { roomKeyFor } from "../constants/rooms";
import { useOptions, mergeOptions } from "../context/OptionsContext";
import { useItems } from "../context/ItemsContext";

export const ADD_NEW = "__add_new__";

export default function useEditableOptions(kind, onSelect, initial = []) {
  const { rooms, categories, hiddenRoomKeys, addOption } = useOptions();
  const { items } = useItems();

  const [adding, setAdding] = useState(false);
  const [text, setText] = useState("");
  const [temporaryOptions, setTemporaryOptions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const savingRef = useRef(false);

  const savedOptions = kind === "room" ? rooms : categories;

  const existingItemOptions = items.map((item) =>
    kind === "room" ? item.room_location : item.category,
  );

  const options = mergeOptions(
    savedOptions,
    initial,
    existingItemOptions,
    temporaryOptions,
  ).filter(
    (name) =>
      kind !== "room" ||
      !hiddenRoomKeys.includes(roomKeyFor({ room_location: name })),
  );

  const handleChange = (value) => {
    if (savingRef.current) return;

    setError("");

    if (value === ADD_NEW) {
      setAdding(true);
    } else {
      setAdding(false);
      setText("");
      onSelect(value);
    }
  };

  const cancel = () => {
    if (savingRef.current) return;

    setAdding(false);
    setText("");
    setError("");
  };

  const confirm = async () => {
    if (savingRef.current) return;

    const trimmed = text.trim();

    if (!trimmed) {
      setError("Please enter a name.");
      return;
    }

    if (trimmed.length > 50) {
      setError("Names cannot exceed 50 characters.");
      return;
    }

    savingRef.current = true;
    setSaving(true);
    setError("");

    try {
      const name = await addOption(kind, trimmed);

      onSelect(name);

      setText("");
      setAdding(false);
    } catch (err) {
      setError(err.message || "Couldn't save this option.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  // AI-generated categories remain available locally until saved.
  const ensure = (value) => {
    setTemporaryOptions((prev) => mergeOptions(prev, [value]));
  };

  return {
    options,
    adding,
    text,
    setText,
    saving,
    error,
    handleChange,
    confirm,
    cancel,
    ensure,
  };
}
