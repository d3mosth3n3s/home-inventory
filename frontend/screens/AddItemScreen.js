import React, { useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";

import ImagePickerField from "../components/ImagePickerField";
import LabeledInput from "../components/LabeledInput";
import OptionPicker from "../components/OptionPicker";
import ScanResults from "../components/ScanResults";

import useItemForm, { CONDITIONS } from "../hooks/useItemForm";
import { useTheme } from "../context/ThemeContext";
import { LIMITS } from "../utils/itemValidation";

const ANALYSIS_MODES = [
  {
    value: "single",
    title: "Single object",
    icon: "cube-outline",
    description: "Identify one primary item.",
  },
  {
    value: "multiple",
    title: "Multiple objects",
    icon: "grid-outline",
    description: "Identify several items in one photo.",
  },
];

export default function AddItemScreen() {
  const f = useItemForm();
  const { form, set } = f;
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const { width } = useWindowDimensions();
  const isWide = width >= 1100;

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.container}>
        <Text style={styles.title}>Add Item</Text>

        <Text style={styles.subtitle}>
          Upload a photograph or enter your item details manually.
        </Text>

        <View
          style={[
            styles.workspace,
            {
              flexDirection: isWide ? "row" : "column",
            },
          ]}
        >
          {/* LEFT PANEL: IMAGE ANALYSIS */}

          <View
            style={[
              styles.panel,
              isWide ? styles.desktopPanel : styles.mobilePanel,
            ]}
          >
            <View style={styles.panelHeader}>
              <Ionicons name="scan-outline" size={24} color={colors.accent} />

              <Text style={styles.sectionTitle}>Image Analysis</Text>
            </View>

            {/* ANALYSIS MODE SELECTOR */}

            <Text style={styles.fieldLabel}>Analysis mode</Text>

            <View style={styles.modeSelector}>
              {ANALYSIS_MODES.map((mode) => {
                const active = f.analysisMode === mode.value;

                return (
                  <Pressable
                    key={mode.value}
                    disabled={f.busy}
                    onPress={() => f.changeAnalysisMode(mode.value)}
                    accessibilityRole="radio"
                    accessibilityState={{
                      checked: active,
                      disabled: f.busy,
                    }}
                    style={[
                      styles.modeOption,
                      active && styles.modeOptionActive,
                      f.busy && styles.disabledButton,
                    ]}
                  >
                    <Ionicons
                      name={mode.icon}
                      size={24}
                      color={active ? colors.accent : colors.mutedText}
                    />

                    <View style={styles.modeTextContainer}>
                      <Text style={styles.modeTitle}>{mode.title}</Text>

                      <Text style={styles.modeDescription}>
                        {mode.description}
                      </Text>
                    </View>

                    <Ionicons
                      name={active ? "radio-button-on" : "radio-button-off"}
                      size={20}
                      color={active ? colors.accent : colors.mutedText}
                    />
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.modeHint}>
              Changing modes after uploading an image will run the analysis
              again and replace the detected details.
            </Text>

            {/* IMAGE UPLOAD AND PREVIEW */}

            <ImagePickerField
              key={f.formKey}
              onImagePicked={f.handleImagePicked}
              disabled={f.busy}
              analyzing={f.analyzing}
              detectedItems={f.detectedItems}
              selectedIndex={f.selectedIndex}
              onSelect={f.selectDetected}
              analysisSize={f.analysisSize}
            />
            {/* ANALYSIS STATUS */}

            {f.analyzing && (
              <View style={styles.statusBox}>
                <ActivityIndicator size="small" color={colors.accent} />

                <View style={styles.statusContent}>
                  <Text style={styles.statusTitle}>Analyzing your image</Text>

                  <Text style={styles.statusText}>
                    {f.analysisMode === "single"
                      ? "Identifying the primary object."
                      : "Identifying multiple objects and extracting their details."}
                    {" Please wait."}
                  </Text>
                </View>
              </View>
            )}

            {!!f.analysisError && (
              <View style={styles.errorBox}>
                <Ionicons
                  name="alert-circle-outline"
                  size={20}
                  color={colors.danger}
                />

                <Text style={styles.errorText}>{f.analysisError}</Text>
              </View>
            )}

            {!f.analyzing && !f.analysisError && f.detectedItems.length > 0 && (
              <View style={styles.statusBox}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={22}
                  color={colors.accent}
                />

                <View style={styles.statusContent}>
                  <Text style={styles.statusTitle}>Analysis complete</Text>

                  <Text style={styles.statusText}>
                    {f.detectedItems.length}{" "}
                    {f.detectedItems.length === 1
                      ? "item detected"
                      : "items detected"}
                    . Review the details before saving.
                  </Text>
                </View>
              </View>
            )}

            {/* DETECTED OBJECTS */}

            {f.detectedItems.length > 0 && (
              <View
                pointerEvents={f.busy ? "none" : "auto"}
                style={[styles.scanSection, f.busy && styles.disabledForm]}
              >
                <ScanResults
                  detectedItems={f.detectedItems}
                  selectedIndex={f.selectedIndex}
                  currentName={form.name}
                  onSelect={f.selectDetected}
                  onRemove={f.removeDetected}
                  disabled={f.busy}
                />
              </View>
            )}
          </View>

          {/* RIGHT PANEL: ITEM DETAILS */}

          <View
            style={[
              styles.panel,
              isWide ? styles.desktopPanel : styles.mobilePanel,
            ]}
          >
            <View style={styles.panelHeader}>
              <Ionicons
                name="document-text-outline"
                size={24}
                color={colors.accent}
              />

              <Text style={styles.sectionTitle}>Item Details</Text>
            </View>

            <View
              pointerEvents={f.busy ? "none" : "auto"}
              style={[styles.form, f.busy && styles.disabledForm]}
            >
              <LabeledInput
                label="Item Name:"
                placeholder="Enter item name"
                value={form.name}
                onChangeText={set("name")}
                maxLength={LIMITS.name}
                editable={!f.busy}
              />

              <LabeledInput
                label="Brand:"
                placeholder="Enter brand"
                value={form.brand}
                onChangeText={set("brand")}
                maxLength={LIMITS.brand}
                editable={!f.busy}
              />

              <LabeledInput
                label="Model:"
                placeholder="Enter model"
                value={form.model}
                onChangeText={set("model")}
                maxLength={LIMITS.model}
                editable={!f.busy}
              />

              {/* DESCRIPTION */}

              <View style={styles.descriptionContainer}>
                <Text style={styles.inputLabel}>Description:</Text>

                <TextInput
                  style={styles.descriptionInput}
                  placeholder="Enter item description"
                  placeholderTextColor={colors.placeholder}
                  value={form.description}
                  onChangeText={set("description")}
                  maxLength={LIMITS.description}
                  editable={!f.busy}
                  multiline
                  textAlignVertical="top"
                />

                <Text style={styles.characterCount}>
                  {form.description.length}/{LIMITS.description}
                </Text>
              </View>

              {/* CATEGORY */}

              <Text style={styles.fieldLabel}>Category</Text>

              <OptionPicker
                value={form.category}
                opts={f.categoryOpts}
                addLabel="+ Add new category..."
                newPlaceholder="New category name"
              />

              {/* PURCHASE PRICE */}

              <LabeledInput
                label="Purchase Price: $"
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={form.purchasePrice}
                onChangeText={f.onPriceChange}
                maxLength={10}
                editable={!f.busy}
              />

              {/* SERIAL NUMBER */}

              <LabeledInput
                label="Serial Number:"
                placeholder="Enter serial number"
                value={form.serialNumber}
                onChangeText={set("serialNumber")}
                maxLength={LIMITS.serialNumber}
                editable={!f.busy}
              />

              {/* CONDITION */}

              <Text style={styles.fieldLabel}>Condition</Text>

              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={form.condition}
                  onValueChange={set("condition")}
                  style={styles.picker}
                  dropdownIconColor={colors.text}
                  enabled={!f.busy}
                >
                  {CONDITIONS.map((c) => (
                    <Picker.Item
                      key={c}
                      label={c.charAt(0).toUpperCase() + c.slice(1)}
                      value={c}
                      color={colors.text}
                    />
                  ))}
                </Picker>
              </View>

              {/* ROOM */}

              <Text style={styles.fieldLabel}>Room</Text>

              <OptionPicker
                value={form.roomLocation}
                opts={f.roomOpts}
                addLabel="+ Add new room..."
                newPlaceholder="New room name"
              />
            </View>

            {/* SUBMISSION MESSAGES */}

            {!!f.submitError && (
              <View style={styles.errorBox}>
                <Ionicons
                  name="alert-circle-outline"
                  size={20}
                  color={colors.danger}
                />

                <Text style={styles.errorText}>{f.submitError}</Text>
              </View>
            )}

            {!!f.successMessage && (
              <View style={styles.statusBox}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={22}
                  color={colors.accent}
                />

                <Text style={styles.statusTitle}>{f.successMessage}</Text>
              </View>
            )}

            {/* SUBMIT BUTTON */}

            <Pressable
              onPress={f.submit}
              disabled={f.busy}
              style={[styles.submitButton, f.busy && styles.disabledButton]}
            >
              {f.busy ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Ionicons name="add-circle-outline" size={22} color="#ffffff" />
              )}

              <Text style={styles.submitButtonText}>
                {f.analyzing
                  ? "Analyzing image..."
                  : f.saving
                    ? "Saving item..."
                    : "Add Asset"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
    // PAGE LAYOUT

    scrollContent: {
      alignItems: "center",
    },

    container: {
      width: "100%",
      maxWidth: 1400,
      padding: 24,
    },

    title: {
      fontSize: 28,
      fontWeight: "600",
      marginBottom: 6,
      color: c.text,
    },

    subtitle: {
      color: c.mutedText,
      fontSize: 14,
      marginBottom: 24,
    },

    workspace: {
      gap: 24,
      alignItems: "flex-start",
    },

    panel: {
      minWidth: 0,
      padding: 20,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 8,
    },

    desktopPanel: {
      flex: 1,
    },

    mobilePanel: {
      width: "100%",
    },

    panelHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingBottom: 16,
      marginBottom: 20,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },

    sectionTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: c.text,
    },

    // MODE SELECTOR

    modeSelector: {
      gap: 8,
      marginBottom: 10,
    },

    modeOption: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 14,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 6,
      backgroundColor: c.inputBg,
    },

    modeOptionActive: {
      borderColor: c.accent,
      backgroundColor: c.accent + "12",
    },

    modeTextContainer: {
      flex: 1,
      gap: 4,
    },

    modeTitle: {
      fontSize: 15,
      fontWeight: "600",
      color: c.text,
    },

    modeDescription: {
      fontSize: 12,
      lineHeight: 18,
      color: c.mutedText,
    },

    modeHint: {
      fontSize: 12,
      color: c.mutedText,
      lineHeight: 18,
      marginBottom: 16,
    },

    // DETECTED OBJECTS

    scanSection: {
      marginTop: 20,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: c.border,
      gap: 12,
    },

    // FORM

    form: {
      marginTop: 4,
    },

    disabledForm: {
      opacity: 0.45,
    },

    inputLabel: {
      fontSize: 16,
      marginRight: 5,
      color: c.text,
    },

    fieldLabel: {
      fontSize: 13,
      fontWeight: "500",
      color: c.mutedText,
      marginBottom: 6,
    },

    descriptionContainer: {
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.inputBg,
      borderRadius: 4,
      marginBottom: 10,
      padding: 8,
    },

    descriptionInput: {
      fontSize: 16,
      minHeight: 100,
      paddingVertical: 8,
      color: c.text,
    },

    characterCount: {
      fontSize: 12,
      color: c.mutedText,
      textAlign: "right",
      paddingTop: 4,
    },

    pickerWrapper: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 4,
      marginBottom: 10,
      overflow: "hidden",
      backgroundColor: c.inputBg,
    },

    picker: {
      color: c.text,
      backgroundColor: c.inputBg,
      minHeight: 42,
    },

    // STATUS MESSAGES

    statusBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: c.inputBg,
      borderWidth: 1,
      borderColor: c.border,
      borderLeftWidth: 3,
      borderLeftColor: c.accent,
      borderRadius: 6,
      padding: 14,
      marginVertical: 10,
    },

    statusContent: {
      flex: 1,
      gap: 4,
    },

    statusTitle: {
      flexShrink: 1,
      fontSize: 14,
      fontWeight: "600",
      color: c.text,
    },

    statusText: {
      color: c.mutedText,
      fontSize: 13,
      lineHeight: 19,
    },

    errorBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      padding: 12,
      marginVertical: 10,
      borderWidth: 1,
      borderColor: c.danger,
      borderRadius: 6,
      backgroundColor: c.danger + "11",
    },

    errorText: {
      flex: 1,
      color: c.danger,
      fontSize: 14,
      lineHeight: 20,
    },

    // SUBMIT BUTTON

    submitButton: {
      backgroundColor: c.accent,
      borderRadius: 6,
      paddingVertical: 16,
      marginTop: 12,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 10,
    },

    disabledButton: {
      opacity: 0.5,
    },

    submitButtonText: {
      color: "#ffffff",
      fontSize: 16,
      fontWeight: "600",
    },
  });
