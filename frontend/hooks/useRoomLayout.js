import { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { useOptions, mergeOptions } from "../context/OptionsContext";
import { useItems } from "../context/ItemsContext";

import { buildLayout, canPlace } from "../constants/rooms";

export default function useRoomLayout() {
  const { user } = useAuth();
  const { rooms } = useOptions();
  const { items } = useItems();

  const [saved, setSaved] = useState([]);
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const names = useMemo(
    () =>
      mergeOptions(
        rooms,
        items.map((item) => item.room_location),
      ),
    [rooms, items],
  );

  useEffect(() => {
    let active = true;

    async function load() {
      if (!user?.id) return;

      setLoading(true);
      setError("");

      try {
        const { data, error } = await supabase
          .from("room_layouts")
          .select("layout")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;

        if (active) {
          setSaved(data?.layout ?? []);
          setDraft(null);
        }
      } catch (error) {
        if (active) setError(error.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [user?.id]);

  const layout = useMemo(
    () => buildLayout(names, draft ?? saved),
    [names, draft, saved],
  );

  const updateRoom = (candidate, maxHeight) => {
    setDraft((previous) => {
      const current = buildLayout(names, previous ?? saved);

      if (!canPlace(candidate, current, maxHeight)) {
        return previous;
      }

      return current.map((room) =>
        room.key === candidate.key ? { ...room, ...candidate } : room,
      );
    });
  };

  const resetLayout = () => {
    setDraft([]);
  };

  const cancelChanges = () => {
    setDraft(null);
  };

  const saveLayout = async () => {
    if (!user?.id || loading || saving) return false;

    setSaving(true);
    setError("");

    try {
      const { error } = await supabase.from("room_layouts").upsert({
        user_id: user.id,
        layout,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      setSaved(layout);
      setDraft(null);

      return true;
    } catch (error) {
      setError(error.message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    layout,
    loading,
    saving,
    error,
    updateRoom,
    resetLayout,
    cancelChanges,
    saveLayout,
  };
}
