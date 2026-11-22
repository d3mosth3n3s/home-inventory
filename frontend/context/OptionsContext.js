import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";
import { roomKeyFor } from "../constants/rooms";

const OptionsContext = createContext(null);

export const DEFAULT_ROOMS = [
  "Living Room",
  "Bedroom",
  "Kitchen",
  "Garage",
  "Office",
  "Bathroom",
  "Hall / Closet",
  "Unassigned",
];

export const DEFAULT_CATEGORIES = [
  "Electronics",
  "Furniture",
  "Jewelry",
  "Appliance",
  "Clothing",
  "Footwear",
  "Tools",
  "Other",
];

export function mergeOptions(...lists) {
  const unique = new Map();

  for (const value of lists.flat()) {
    if (typeof value !== "string" || !value.trim()) {
      continue;
    }

    const name = value.trim();
    const key = name.toLowerCase();

    if (!unique.has(key)) {
      unique.set(key, name);
    }
  }

  return [...unique.values()];
}

export function OptionsProvider({ children }) {
  const { user } = useAuth();

  const [options, setOptions] = useState([]);
  const [error, setError] = useState("");

  const loadOptions = useCallback(async () => {
    if (!user?.id) return [];

    const { data, error } = await supabase
      .from("user_options")
      .select("kind, name, active")
      .eq("user_id", user.id)
      .order("created_at");

    if (error) {
      setError(error.message);
      throw error;
    }

    setOptions(data || []);
    setError("");

    return data || [];
  }, [user?.id]);

  useEffect(() => {
    loadOptions().catch(console.error);
  }, [loadOptions]);

  const hiddenRoomKeys = options
    .filter((o) => o.kind === "room" && !o.active)
    .map((o) => roomKeyFor({ room_location: o.name }));

  const rooms = mergeOptions(
    DEFAULT_ROOMS,
    options.filter((o) => o.kind === "room" && o.active).map((o) => o.name),
  ).filter(
    (name) => !hiddenRoomKeys.includes(roomKeyFor({ room_location: name })),
  );

  const categories = mergeOptions(
    DEFAULT_CATEGORIES,
    options.filter((o) => o.kind === "category" && o.active).map((o) => o.name),
  );

  const manageRoom = async (
    action,
    oldName = null,
    newName = null,
    layout = null,
  ) => {
    const { data, error } = await supabase.rpc("manage_inventory_room", {
      p_action: action,
      p_old_name: oldName,
      p_new_name: newName,
      p_layout: layout,
    });

    if (error) throw error;

    await loadOptions();

    return data;
  };

  const addOption = async (kind, name) => {
    const trimmed = name.trim();

    if (!user) {
      throw new Error("You must be signed in.");
    }

    if (!["room", "category"].includes(kind)) {
      throw new Error("Invalid option type.");
    }

    if (!trimmed || trimmed.length > 50) {
      throw new Error("Enter a name between 1 and 50 characters.");
    }

    const existing = (kind === "room" ? rooms : categories).find(
      (o) => o.toLowerCase() === trimmed.toLowerCase(),
    );

    if (existing) return existing;

    if (kind === "room") {
      const result = await manageRoom("add", null, trimmed);

      return result.name;
    }

    const { error } = await supabase.from("user_options").upsert(
      {
        user_id: user.id,
        kind,
        name: trimmed,
        active: true,
      },
      {
        onConflict: "user_id,kind,name_key",
        ignoreDuplicates: true,
      },
    );

    if (error) throw error;

    const data = await loadOptions();

    return (
      data.find(
        (o) =>
          o.kind === kind && o.name.toLowerCase() === trimmed.toLowerCase(),
      )?.name || trimmed
    );
  };

  const renameRoom = (oldName, newName, layout) =>
    manageRoom("rename", oldName, newName, layout);

  const deleteRoom = (name, layout) => manageRoom("delete", name, null, layout);

  return (
    <OptionsContext.Provider
      value={{
        rooms,
        categories,
        hiddenRoomKeys,
        addOption,
        renameRoom,
        deleteRoom,
        loadOptions,
        error,
      }}
    >
      {children}
    </OptionsContext.Provider>
  );
}

export function useOptions() {
  const context = useContext(OptionsContext);

  if (!context) {
    throw new Error("useOptions must be used inside OptionsProvider");
  }

  return context;
}
