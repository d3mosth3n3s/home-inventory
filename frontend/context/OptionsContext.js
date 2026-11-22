import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";

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
    if (typeof value !== "string" || !value.trim()) continue;

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
    if (!user) return;

    const { data, error } = await supabase
      .from("user_options")
      .select("kind, name")
      .eq("user_id", user.id)
      .order("created_at");

    if (error) {
      setError(error.message);
      return;
    }

    setOptions(data || []);
    setError("");
  }, [user?.id]);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

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

    const defaults = kind === "room" ? DEFAULT_ROOMS : DEFAULT_CATEGORIES;

    const existing = mergeOptions(
      defaults,
      options.filter((o) => o.kind === kind).map((o) => o.name),
    ).find((o) => o.toLowerCase() === trimmed.toLowerCase());

    if (existing) return existing;

    const { error } = await supabase.from("user_options").upsert(
      {
        user_id: user.id,
        kind,
        name: trimmed,
      },
      {
        onConflict: "user_id,kind,name_key",
        ignoreDuplicates: true,
      },
    );

    if (error) throw error;

    // Refresh from Supabase so stored capitalization is preserved.
    const { data, error: readError } = await supabase
      .from("user_options")
      .select("kind, name")
      .eq("user_id", user.id)
      .order("created_at");

    if (readError) throw readError;

    setOptions(data || []);

    return (
      data?.find(
        (o) =>
          o.kind === kind && o.name.toLowerCase() === trimmed.toLowerCase(),
      )?.name || trimmed
    );
  };

  const rooms = mergeOptions(
    DEFAULT_ROOMS,
    options.filter((o) => o.kind === "room").map((o) => o.name),
  );

  const categories = mergeOptions(
    DEFAULT_CATEGORIES,
    options.filter((o) => o.kind === "category").map((o) => o.name),
  );

  return (
    <OptionsContext.Provider
      value={{
        rooms,
        categories,
        addOption,
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
