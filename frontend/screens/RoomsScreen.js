import React, { useMemo, useState } from "react";
import {
  SectionList,
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { useItems } from "../context/ItemsContext";
import { useTheme } from "../context/ThemeContext";
import { useOptions } from "../context/OptionsContext";

import useRoomLayout from "../hooks/useRoomLayout";
import ItemRow from "../components/ItemRow";
import FloorPlan from "../components/FloorPlan";

import {
  OTHER_ROOM,
  roomKeyFor,
  itemValue,
  formatMoney,
} from "../constants/rooms";

export default function RoomsScreen() {
  const { items, loadItems } = useItems();
  const { colors } = useTheme();
  const { addOption, renameRoom, deleteRoom } = useOptions();

  const f = useRoomLayout();

  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editHeight, setEditHeight] = useState(125);

  const [adding, setAdding] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [roomError, setRoomError] = useState("");
  const [creating, setCreating] = useState(false);

  const [roomAction, setRoomAction] = useState(null);
  const [newRoomName, setNewRoomName] = useState("");
  const [managing, setManaging] = useState(false);
  const [manageError, setManageError] = useState("");

  const grouped = useMemo(() => {
    const map = Object.create(null);

    for (const item of items) {
      const key = roomKeyFor(item);

      (map[key] ||= []).push(item);
    }

    return map;
  }, [items]);

  const allRooms = [...f.layout, OTHER_ROOM];

  const sections = allRooms
    .filter(
      (room) =>
        grouped[room.key]?.length && (!selected || selected === room.key),
    )
    .map((room) => ({
      key: room.key,
      title: room.label,
      data: grouped[room.key],
      total: grouped[room.key].reduce((sum, item) => sum + itemValue(item), 0),
    }));

  const grandTotal = items.reduce((sum, item) => sum + itemValue(item), 0);

  const selectedLabel = allRooms.find((room) => room.key === selected)?.label;

  const layoutHeight = Math.max(
    100,
    ...f.layout.map((room) => room.y + room.h),
  );

  const canvasHeight = editing
    ? Math.max(editHeight, layoutHeight)
    : layoutHeight;

  const startEditing = () => {
    setSelected(null);
    setAdding(false);

    setEditHeight(Math.ceil(layoutHeight / 5) * 5 + 30);

    setEditing(true);
    cancelRoomAction();
  };

  const cancelEditing = () => {
    f.cancelChanges();
    setEditing(false);
  };

  const saveEditing = async () => {
    const success = await f.saveLayout();

    if (success) {
      setEditing(false);
    }
  };

  const resetEditing = () => {
    f.resetLayout();
  };

  const createRoom = async () => {
    if (creating) return;

    const name = roomName.trim();

    if (!name) {
      setRoomError("Enter a room name.");
      return;
    }

    if (roomKeyFor({ room_location: name }) === OTHER_ROOM.key) {
      setRoomError("Choose a different room name.");
      return;
    }

    if (
      allRooms.some((room) => room.key === roomKeyFor({ room_location: name }))
    ) {
      setRoomError("This room already exists.");
      return;
    }

    setCreating(true);
    setRoomError("");

    try {
      await addOption("room", name);

      setRoomName("");
      setAdding(false);
      setSelected(null);
    } catch (error) {
      setRoomError(error.message);
    } finally {
      setCreating(false);
    }
  };
  const selectedItems = grouped[selected] ?? [];

  const startRename = () => {
    setNewRoomName(selectedLabel ?? "");
    setManageError("");
    setRoomAction("rename");
  };

  const startDelete = () => {
    setManageError("");
    setRoomAction("delete");
  };

  const cancelRoomAction = () => {
    setRoomAction(null);
    setNewRoomName("");
    setManageError("");
  };

  const selectRoom = (key) => {
    if (managing) return;

    cancelRoomAction();
    setSelected(key);
  };

  const confirmRoomAction = async () => {
    if (managing || !selectedLabel || !roomAction) {
      return;
    }

    if (roomAction === "rename" && !newRoomName.trim()) {
      setManageError("Enter a room name.");
      return;
    }

    setManaging(true);
    setManageError("");

    try {
      let result;

      if (roomAction === "rename") {
        result = await renameRoom(selectedLabel, newRoomName.trim(), f.layout);
      } else {
        result = await deleteRoom(selectedLabel, f.layout);
      }

      f.replaceLayout(result.layout);

      await loadItems();

      setSelected(null);
      cancelRoomAction();
    } catch (error) {
      setManageError(error.message || "Couldn't update room.");
    } finally {
      setManaging(false);
    }
  };
  return (
    <SectionList
      contentContainerStyle={styles.page}
      sections={editing ? [] : sections}
      keyExtractor={(item) => item.id.toString()}
      stickySectionHeadersEnabled={false}
      ListHeaderComponent={
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Rooms</Text>

            {!editing && !f.loading && !f.error && (
              <Pressable
                onPress={startEditing}
                disabled={managing}
                style={styles.outlineButton}
              >
                <Ionicons name="create-outline" size={18} color={colors.text} />

                <Text style={styles.buttonText}>Edit layout</Text>
              </Pressable>
            )}
          </View>

          <Text style={styles.subtitle}>
            {items.length} items · {formatMoney(grandTotal)} total
          </Text>

          {f.loading ? (
            <ActivityIndicator size="large" color={colors.accent} />
          ) : (
            <>
              {editing && (
                <View style={styles.editBanner}>
                  <Ionicons
                    name="move-outline"
                    size={20}
                    color={colors.accent}
                  />

                  <Text style={styles.editHint}>
                    Drag rooms to move them. Drag the corner handles to resize.
                  </Text>
                </View>
              )}

              <FloorPlan
                layout={f.layout}
                grouped={grouped}
                selected={selected}
                onSelect={selectRoom}
                colors={colors}
                editing={editing && !f.saving}
                onUpdate={f.updateRoom}
                canvasHeight={canvasHeight}
              />

              {editing ? (
                <View style={styles.toolbar}>
                  <Pressable
                    onPress={resetEditing}
                    disabled={f.saving}
                    style={styles.outlineButton}
                  >
                    <Ionicons
                      name="refresh-outline"
                      size={18}
                      color={colors.text}
                    />

                    <Text style={styles.buttonText}>Reset</Text>
                  </Pressable>

                  <Pressable
                    disabled={f.saving}
                    onPress={() =>
                      setEditHeight(Math.max(editHeight, layoutHeight) + 25)
                    }
                    style={styles.outlineButton}
                  >
                    <Text style={styles.buttonText}>+ Space</Text>
                  </Pressable>

                  <Pressable
                    onPress={cancelEditing}
                    disabled={f.saving}
                    style={styles.outlineButton}
                  >
                    <Text style={styles.buttonText}>Cancel</Text>
                  </Pressable>

                  <Pressable
                    onPress={saveEditing}
                    disabled={f.saving}
                    style={styles.primaryButton}
                  >
                    {f.saving ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="checkmark" size={18} color="#fff" />

                        <Text style={styles.primaryText}>Save layout</Text>
                      </>
                    )}
                  </Pressable>
                </View>
              ) : (
                <>
                  <View style={styles.toolbar}>
                    <Pressable
                      onPress={() => {
                        setAdding(!adding);
                        setRoomError("");
                      }}
                      style={styles.outlineButton}
                    >
                      <Ionicons name="add" size={20} color={colors.accent} />

                      <Text style={styles.buttonText}>Add room</Text>
                    </Pressable>
                  </View>

                  {adding && (
                    <View style={styles.addRow}>
                      <TextInput
                        style={styles.input}
                        value={roomName}
                        onChangeText={setRoomName}
                        placeholder="Room name"
                        placeholderTextColor={colors.placeholder}
                        maxLength={50}
                        editable={!creating}
                        onSubmitEditing={createRoom}
                      />

                      <Pressable
                        onPress={createRoom}
                        disabled={creating}
                        style={styles.primaryButton}
                      >
                        <Text style={styles.primaryText}>
                          {creating ? "Adding..." : "Add"}
                        </Text>
                      </Pressable>
                    </View>
                  )}

                  <View style={styles.filterRow}>
                    <Text style={styles.hint}>
                      {selected
                        ? `Showing ${selectedLabel}`
                        : "Tap a room to filter"}
                    </Text>

                    {selected && (
                      <Pressable onPress={() => setSelected(null)}>
                        <Text style={styles.clear}>Show all</Text>
                      </Pressable>
                    )}
                  </View>
                  {selected && selected !== OTHER_ROOM.key && selectedLabel && (
                    <View style={styles.managementPanel}>
                      <View style={styles.titleRow}>
                        <View>
                          <Text style={styles.managementTitle}>
                            {selectedLabel}
                          </Text>

                          <Text style={styles.hint}>
                            {selectedItems.length} items
                          </Text>
                        </View>
                      </View>

                      {!roomAction && (
                        <View style={styles.toolbar}>
                          <Pressable
                            onPress={startRename}
                            style={styles.outlineButton}
                          >
                            <Ionicons
                              name="pencil-outline"
                              size={18}
                              color={colors.text}
                            />

                            <Text style={styles.buttonText}>Rename</Text>
                          </Pressable>

                          <Pressable
                            onPress={startDelete}
                            style={styles.dangerButton}
                          >
                            <Ionicons
                              name="trash-outline"
                              size={18}
                              color={colors.danger}
                            />

                            <Text style={styles.dangerText}>Delete room</Text>
                          </Pressable>
                        </View>
                      )}

                      {roomAction === "rename" && (
                        <>
                          <TextInput
                            style={styles.input}
                            value={newRoomName}
                            onChangeText={setNewRoomName}
                            placeholder="New room name"
                            placeholderTextColor={colors.placeholder}
                            maxLength={50}
                            editable={!managing}
                          />

                          <View style={styles.toolbar}>
                            <Pressable
                              onPress={cancelRoomAction}
                              disabled={managing}
                              style={styles.outlineButton}
                            >
                              <Text style={styles.buttonText}>Cancel</Text>
                            </Pressable>

                            <Pressable
                              onPress={confirmRoomAction}
                              disabled={managing}
                              style={styles.primaryButton}
                            >
                              <Text style={styles.primaryText}>
                                {managing ? "Saving..." : "Rename room"}
                              </Text>
                            </Pressable>
                          </View>
                        </>
                      )}

                      {roomAction === "delete" && (
                        <>
                          <Text style={styles.deleteWarning}>
                            Delete {selectedLabel}?
                          </Text>

                          <Text style={styles.hint}>
                            {selectedItems.length} items will be moved to
                            Unassigned. No items will be deleted.
                          </Text>

                          <View style={styles.toolbar}>
                            <Pressable
                              onPress={cancelRoomAction}
                              disabled={managing}
                              style={styles.outlineButton}
                            >
                              <Text style={styles.buttonText}>Cancel</Text>
                            </Pressable>

                            <Pressable
                              onPress={confirmRoomAction}
                              disabled={managing}
                              style={styles.confirmDeleteButton}
                            >
                              <Text style={styles.primaryText}>
                                {managing ? "Deleting..." : "Delete room"}
                              </Text>
                            </Pressable>
                          </View>
                        </>
                      )}

                      {!!manageError && (
                        <Text style={styles.error}>{manageError}</Text>
                      )}
                    </View>
                  )}
                </>
              )}
            </>
          )}

          {!!roomError && <Text style={styles.error}>{roomError}</Text>}

          {!!f.error && <Text style={styles.error}>{f.error}</Text>}
        </View>
      }
      renderSectionHeader={({ section }) => (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{section.title}</Text>

          <Text style={styles.sectionMeta}>
            {section.data.length} · {formatMoney(section.total)}
          </Text>
        </View>
      )}
      renderItem={({ item }) => <ItemRow item={item} />}
      ListEmptyComponent={
        !editing &&
        !f.loading && (
          <Text style={styles.empty}>
            {selected ? "Nothing in this room yet." : "No items yet."}
          </Text>
        )
      }
    />
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
    managementPanel: {
      marginTop: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },

    managementTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: c.text,
      marginBottom: 4,
    },

    dangerButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      borderWidth: 1,
      borderColor: c.danger,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },

    dangerText: {
      color: c.danger,
      fontSize: 14,
      fontWeight: "500",
    },

    deleteWarning: {
      color: c.danger,
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 8,
    },

    confirmDeleteButton: {
      backgroundColor: c.danger,
      paddingHorizontal: 14,
      paddingVertical: 11,
      alignItems: "center",
      justifyContent: "center",
    },
    page: {
      padding: 16,
      maxWidth: 900,
      width: "100%",
      alignSelf: "center",
    },

    header: {
      marginBottom: 8,
    },

    titleRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 6,
    },

    title: {
      fontSize: 24,
      fontWeight: "bold",
      color: c.text,
    },

    subtitle: {
      color: c.mutedText,
      fontSize: 14,
      marginBottom: 16,
    },

    editBanner: {
      flexDirection: "row",
      alignItems: "center",
      padding: 12,
      gap: 10,
      marginBottom: 12,
      backgroundColor: c.accent + "15",
      borderWidth: 1,
      borderColor: c.accent,
    },

    editHint: {
      color: c.text,
      fontSize: 13,
      flex: 1,
    },

    toolbar: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      gap: 8,
      marginTop: 12,
      marginBottom: 12,
    },

    outlineButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },

    primaryButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: c.accent,
      paddingHorizontal: 14,
      paddingVertical: 11,
    },

    buttonText: {
      color: c.text,
      fontSize: 14,
      fontWeight: "500",
    },

    primaryText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "600",
    },

    addRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 12,
    },

    input: {
      flex: 1,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.inputBg,
      color: c.text,
      padding: 10,
      minHeight: 42,
    },

    filterRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 10,
    },

    hint: {
      color: c.mutedText,
      fontSize: 13,
    },

    clear: {
      color: c.accent,
      fontSize: 13,
      fontWeight: "600",
    },

    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "baseline",
      marginTop: 16,
      marginBottom: 6,
      paddingBottom: 4,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },

    sectionTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: c.text,
    },

    sectionMeta: {
      color: c.mutedText,
      fontSize: 13,
    },

    empty: {
      color: c.mutedText,
      fontSize: 14,
      marginTop: 12,
    },

    error: {
      color: c.danger,
      fontSize: 14,
      marginVertical: 8,
    },
  });
