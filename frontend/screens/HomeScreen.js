import React from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  Image,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const C = {
  background: "#141518",
  surface: "#1b1c21",
  text: "#e9ebf0",
  muted: "#b2b6bd",
  accent: "#f35f1a",
  border: "#34363b",
  glassBorder: "rgba(255,255,255,0.20)",
};

const FEATURES = [
  {
    number: "01",
    icon: "cube-outline",
    title: "Document.",
    description:
      "Organize your belongings with photographs, serial numbers, and important details.",
  },
  {
    number: "02",
    icon: "stats-chart-outline",
    title: "Track.",
    description:
      "Understand the value of your possessions and keep your inventory up to date.",
  },
  {
    number: "03",
    icon: "shield-checkmark-outline",
    title: "Prepare.",
    description:
      "Have the information you need when filing an insurance claim or recovering from a disaster.",
  },
];

const PREVIEW_ITEMS = [
  {
    name: "Electronics",
    icon: "desktop-outline",
    value: "$8,240",
  },
  {
    name: "Furniture",
    icon: "bed-outline",
    value: "$6,120",
  },
  {
    name: "Personal belongings",
    icon: "watch-outline",
    value: "$10,490",
  },
];

export default function HomeScreen({ onLogin, onRegister }) {
  const { width } = useWindowDimensions();

  const isWide = width >= 900;
  const isSmall = width < 500;
  const padding = isWide ? 64 : 24;

  return (
    <View style={styles.pageBackground}>
      <Image
        source={require("../assets/hero-background.jpg")}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      <ScrollView
        style={styles.page}
        contentContainerStyle={styles.pageContent}
      >
        {/* NAVIGATION */}
        <View style={styles.header}>
          <View style={[styles.headerInner, { paddingHorizontal: padding }]}>
            <View style={styles.brand}>
              <Image
                source={require("../assets/logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />

              <Text style={styles.brandName}>ReCovered</Text>
            </View>

            <View style={styles.navActions}>
              <Pressable onPress={onLogin} style={styles.loginButton}>
                <Text style={styles.loginText}>Log in</Text>
              </Pressable>

              {!isSmall && (
                <Pressable onPress={onRegister} style={styles.outlineButton}>
                  <Text style={styles.outlineText}>Get started</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
        {/* HERO BACKGROUND */}
        <View style={styles.heroOverlay}>
          <View
            style={[
              styles.hero,
              {
                paddingHorizontal: padding,
                paddingTop: isWide ? 140 : 32,
                paddingBottom: 40,
                flexDirection: isWide ? "row" : "column",
              },
            ]}
          >
            {/* HERO TEXT */}

            <View style={styles.heroContent}>
              <Text
                style={[
                  styles.headline,
                  {
                    fontSize: isWide ? 68 : 42,
                    lineHeight: isWide ? 76 : 49,
                  },
                ]}
              >
                Everything you own.
                {"\n"}
                <Text style={styles.headlineAccent}>
                  Everything accounted for.
                </Text>
              </Text>

              <Text style={styles.description}>
                A single place to document your belongings, understand their
                value, and prepare for the unexpected.
              </Text>

              <View
                style={[
                  styles.heroActions,
                  {
                    flexDirection: isSmall ? "column" : "row",
                  },
                ]}
              >
                <Pressable onPress={onRegister} style={styles.primaryButton}>
                  <Text style={styles.primaryText}>Create your inventory</Text>

                  <Ionicons
                    name="arrow-forward"
                    size={18}
                    color={C.background}
                  />
                </Pressable>

                <Pressable onPress={onLogin} style={styles.secondaryButton}>
                  <Text style={styles.secondaryText}>Sign in</Text>
                </Pressable>
              </View>

              <View style={styles.securityNote}>
                <Ionicons
                  name="lock-closed-outline"
                  size={15}
                  color={C.muted}
                />

                <Text style={styles.securityText}>Private by design.</Text>
              </View>
            </View>

            {/* GLASS INVENTORY PREVIEW */}

            <View style={[styles.preview, { width: isWide ? "40%" : "100%" }]}>
              <View style={styles.previewHeader}>
                <Text style={styles.previewCaption}>Inventory Overview</Text>

                <Ionicons
                  name="shield-checkmark-outline"
                  color={C.accent}
                  size={20}
                />
              </View>

              <View style={styles.previewValue}>
                <Text style={styles.previewCaption}>Total Asset Value</Text>

                <Text style={styles.value}>$24,850.00</Text>

                <Text style={styles.previewCaption}>Example inventory</Text>
              </View>

              {PREVIEW_ITEMS.map((item) => (
                <View key={item.name} style={styles.previewRow}>
                  <Ionicons name={item.icon} color={C.muted} size={21} />

                  <Text style={styles.previewItem}>{item.name}</Text>

                  <Text style={styles.previewPrice}>{item.value}</Text>
                </View>
              ))}

              <View style={styles.previewFooter}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={16}
                  color={C.accent}
                />

                <Text style={styles.previewFooterText}>
                  Organized. Documented. Prepared.
                </Text>
              </View>
            </View>
          </View>
        </View>
        {/* FEATURES */}
        {/* CALL TO ACTION */}={/* FOOTER */}
        <View style={[styles.footer, { paddingHorizontal: padding }]}>
          <Text style={styles.footerText}>
            © {new Date().getFullYear()} ReCovered
          </Text>

          <Text style={styles.footerText}>Built for peace of mind.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  logo: {
    width: 36,
    height: 36,
  },
  pageBackground: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: C.background,
  },

  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },

  page: {
    flex: 1,
    backgroundColor: "transparent",
  },

  pageContent: {
    flexGrow: 1,
  },

  // NAVIGATION

  header: {
    borderBottomWidth: 1,
    borderBottomColor: C.glassBorder,

    ...Platform.select({
      web: {
        backdropFilter: "blur(20px)",
      },
      default: {},
    }),
  },

  headerInner: {
    maxWidth: 1440,
    width: "100%",
    alignSelf: "center",
    paddingVertical: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  brandName: {
    color: C.text,
    fontSize: 23,
    fontWeight: "500",
    letterSpacing: -1,
  },

  navActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },

  loginButton: {
    paddingVertical: 10,
  },

  loginText: {
    color: C.text,
    fontWeight: "500",
    fontSize: 14,
  },

  outlineButton: {
    borderWidth: 1,
    borderColor: C.accent,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 6,
  },

  outlineText: {
    color: C.accent,
    fontWeight: "600",
    fontSize: 14,
  },

  // HERO

  heroBackground: {
    width: "100%",
    minHeight: 600,
  },
  heroOverlay: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "flex-start",
  },

  hero: {
    maxWidth: 1440,
    width: "100%",
    alignSelf: "center",
    alignItems: "center",
    gap: 26,
  },

  heroContent: {
    flex: 1,
    minWidth: 0,
    alignSelf: "stretch",
    justifyContent: "center",
    gap: 24,
  },

  eyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  accentLine: {
    width: 28,
    height: 1,
    backgroundColor: C.accent,
  },

  eyebrow: {
    color: C.accent,
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 2,
  },

  headline: {
    color: C.text,
    fontWeight: "300",
    letterSpacing: -2,
  },

  headlineAccent: {
    color: C.accent,
    fontWeight: "300",
  },

  description: {
    color: C.muted,
    fontSize: 17,
    lineHeight: 28,
    maxWidth: 500,
    fontWeight: "400",
  },

  heroActions: {
    gap: 12,
    marginTop: 8,
    flexWrap: "wrap",
  },

  // BUTTONS

  primaryButton: {
    backgroundColor: C.accent,
    paddingHorizontal: 22,
    paddingVertical: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    borderRadius: 6,
  },

  primaryText: {
    color: C.background,
    fontSize: 15,
    fontWeight: "600",
  },

  secondaryButton: {
    borderWidth: 1,
    borderColor: C.glassBorder,
    backgroundColor: "rgba(255,255,255,0.07)",
    paddingHorizontal: 24,
    paddingVertical: 17,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,

    ...Platform.select({
      web: {
        backdropFilter: "blur(12px)",
      },
      default: {},
    }),
  },

  secondaryText: {
    color: C.text,
    fontSize: 15,
    fontWeight: "500",
  },

  securityNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  securityText: {
    fontSize: 12,
    color: C.muted,
  },

  // GLASS INVENTORY PREVIEW

  preview: {
    borderWidth: 1,
    borderColor: C.glassBorder,
    backgroundColor: "rgba(18, 28, 51, 0.55)",

    overflow: "hidden",
    maxWidth: 460,

    ...Platform.select({
      web: {
        backdropFilter: "blur(24px)",
      },
      default: {},
    }),
  },

  previewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.12)",
  },

  previewLabel: {
    color: C.muted,
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: "500",
  },

  previewValue: {
    padding: 24,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.12)",
  },

  value: {
    color: C.text,
    fontSize: 38,
    fontWeight: "300",
    letterSpacing: -1.5,
  },

  previewCaption: {
    color: C.muted,
    fontSize: 12,
  },

  previewRow: {
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.12)",
  },

  previewItem: {
    color: C.text,
    fontSize: 14,
    flex: 1,
  },

  previewPrice: {
    color: C.text,
    fontSize: 14,
    fontWeight: "500",
  },

  previewFooter: {
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  previewFooterText: {
    color: C.accent,
    fontSize: 12,
  },

  // FEATURES

  featuresSection: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: C.glassBorder,
    backgroundColor: "rgba(14, 18, 16, 0.71)",
  },

  features: {
    maxWidth: 1440,
    width: "100%",
    alignSelf: "center",
  },

  feature: {
    flex: 1,
    paddingVertical: 36,
    paddingHorizontal: 24,
    gap: 18,
  },

  featureDivider: {
    borderLeftWidth: 1,
    borderLeftColor: C.border,
  },

  featureDividerMobile: {
    borderTopWidth: 1,
    borderTopColor: C.border,
  },

  featureTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  featureNumber: {
    color: C.muted,
    fontSize: 12,
    letterSpacing: 1,
  },

  featureTitle: {
    color: C.text,
    fontSize: 30,
    fontWeight: "300",
    letterSpacing: -1,
  },

  featureDescription: {
    color: C.muted,
    fontSize: 15,
    lineHeight: 24,
  },

  // CALL TO ACTION

  cta: {
    maxWidth: 1440,
    width: "100%",
    alignSelf: "center",
    paddingVertical: 64,
    alignItems: "center",
    gap: 32,
    justifyContent: "space-between",
  },

  ctaContent: {
    flex: 1,
    gap: 16,
  },

  ctaTitle: {
    color: C.text,
    fontSize: 36,
    fontWeight: "300",
    letterSpacing: -1,
  },

  // FOOTER

  footer: {
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingVertical: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
  },

  footerText: {
    color: C.muted,
    fontSize: 12,
  },
});
