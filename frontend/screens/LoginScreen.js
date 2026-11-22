import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Image,
  ScrollView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";

import {
  useFonts,
  Urbanist_300Light,
  Urbanist_400Regular,
  Urbanist_500Medium,
  Urbanist_600SemiBold,
} from "@expo-google-fonts/urbanist";

const C = {
  background: "#141518",
  text: "#e9ebf0",
  muted: "#b2b5bd",
  accent: "#f84d00",
  border: "rgba(255,255,255,0.18)",
};

export default function LoginScreen({ onBack, initialRegistering = false }) {
  const { signIn, signUp } = useAuth();

  const [registering, setRegistering] = useState(initialRegistering);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const [fontsLoaded, fontError] = useFonts({
    Urbanist_300Light,
    Urbanist_400Regular,
    Urbanist_500Medium,
    Urbanist_600SemiBold,
  });

  async function handleSubmit() {
    if (busy) return;

    if (!email.trim() || !password) {
      setMessage("Enter your email and password.");
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const { data, error } = registering
        ? await signUp(email.trim(), password)
        : await signIn(email.trim(), password);

      if (error) throw error;

      if (registering && !data.session) {
        setMessage("Check your email to confirm your account.");
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <View style={styles.page}>
      {/* BACKGROUND IMAGE */}

      <Image
        source={require("../assets/hero-background.jpg")}
        style={styles.backgroundImage}
        resizeMode="cover"
      />

      {/* DARK OVERLAY */}

      <View style={styles.overlay} />

      {/* HEADER */}

      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color={C.text} />

          <Text style={styles.backText}>Back to homepage</Text>
        </Pressable>
      </View>

      {/* LOGIN CONTENT */}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.glassCard}>
          {/* BRAND */}

          <View style={styles.brand}>
            <Image
              source={require("../assets/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />

            <Text style={styles.brandName}>ReCovered</Text>
          </View>

          {/* HEADING */}

          <Text style={styles.title}>
            {registering ? "Create your account." : "Welcome back."}
          </Text>

          <Text style={styles.subtitle}>
            {registering
              ? "Start documenting what matters."
              : "Sign in to access your inventory."}
          </Text>

          {/* EMAIL */}

          <Text style={styles.label}>Email address</Text>

          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={19} color={C.muted} />

            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={C.muted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              autoComplete="email"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {/* PASSWORD */}

          <Text style={styles.label}>Password</Text>

          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={19} color={C.muted} />

            <TextInput
              style={styles.input}
              placeholder="Enter password"
              placeholderTextColor={C.muted}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete={registering ? "new-password" : "current-password"}
              value={password}
              onChangeText={setPassword}
              returnKeyType="go"
              onSubmitEditing={handleSubmit}
            />

            <Pressable
              onPress={() => setShowPassword(!showPassword)}
              accessibilityLabel={
                showPassword ? "Hide password" : "Show password"
              }
              hitSlop={8}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={C.muted}
              />
            </Pressable>
          </View>

          {/* STATUS MESSAGE */}

          {message ? (
            <View style={styles.messageBox}>
              <Text style={styles.message}>{message}</Text>
            </View>
          ) : null}

          {/* SUBMIT */}

          <Pressable
            style={[styles.button, busy && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color={C.background} />
            ) : (
              <>
                <Text style={styles.buttonText}>
                  {registering ? "Create account" : "Sign in"}
                </Text>

                <Ionicons name="arrow-forward" size={20} color={C.background} />
              </>
            )}
          </Pressable>

          <View style={styles.divider} />

          {/* SWITCH BETWEEN LOGIN AND REGISTER */}

          <Pressable
            disabled={busy}
            onPress={() => {
              setRegistering(!registering);
              setMessage("");
            }}
          >
            <Text style={styles.switchText}>
              {registering
                ? "Already have an account? "
                : "Don't have an account? "}

              <Text style={styles.link}>
                {registering ? "Log in" : "Sign up"}
              </Text>
            </Text>
          </Pressable>
        </View>

        {/* SECURITY NOTE */}

        <View style={styles.securityNote}>
          <Ionicons name="lock-closed-outline" size={14} color={C.muted} />

          <Text style={styles.securityText}>Private by design.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: C.background,
  },

  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10,11,14,0.72)",
  },

  // HEADER

  header: {
    paddingHorizontal: 32,
    paddingVertical: 24,
  },

  backButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 10,
  },

  backText: {
    fontSize: 14,
    color: C.text,
    fontFamily: "Urbanist_500Medium",
  },

  // LAYOUT

  scroll: {
    flex: 1,
  },

  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 80,
    paddingTop: 24,
    gap: 24,
  },

  glassCard: {
    width: "100%",
    maxWidth: 440,
    padding: 32,

    backgroundColor: "rgba(20,21,24,0.50)",
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 16,

    ...Platform.select({
      web: {
        backdropFilter: "blur(28px)",
      },
      default: {},
    }),
  },

  // BRAND AND HEADINGS

  brand: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginBottom: 28,
  },

  logo: {
    width: 36,
    height: 36,
  },

  brandName: {
    fontSize: 28,
    color: C.text,
    fontFamily: "Urbanist_400Regular",
    letterSpacing: -0.5,
  },

  title: {
    fontSize: 36,
    color: C.text,
    fontFamily: "Urbanist_300Light",
    textAlign: "center",
    letterSpacing: -1,
  },

  subtitle: {
    color: C.muted,
    fontSize: 15,
    fontFamily: "Urbanist_400Regular",
    textAlign: "center",
    lineHeight: 23,
    marginTop: 8,
    marginBottom: 32,
  },

  // INPUTS

  label: {
    color: C.text,
    fontSize: 13,
    fontFamily: "Urbanist_500Medium",
    marginBottom: 8,
  },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,

    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.05)",

    marginBottom: 20,
  },

  input: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 15,
    fontSize: 15,
    color: C.text,
    fontFamily: "Urbanist_400Regular",

    ...Platform.select({
      web: {
        outlineStyle: "none",
      },
      default: {},
    }),
  },

  // SUBMIT BUTTON

  button: {
    backgroundColor: C.accent,
    borderRadius: 6,
    paddingVertical: 16,
    paddingHorizontal: 20,

    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,

    marginTop: 8,
  },

  buttonText: {
    color: C.background,
    fontSize: 16,
    fontFamily: "Urbanist_600SemiBold",
  },

  // MESSAGES

  messageBox: {
    padding: 12,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginBottom: 12,
  },

  message: {
    color: C.text,
    fontFamily: "Urbanist_400Regular",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },

  // LOGIN / REGISTER SWITCH

  divider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 24,
  },

  switchText: {
    color: C.muted,
    fontSize: 14,
    textAlign: "center",
    fontFamily: "Urbanist_400Regular",
  },

  link: {
    color: C.accent,
    fontFamily: "Urbanist_600SemiBold",
  },

  // SECURITY NOTE

  securityNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  securityText: {
    color: C.muted,
    fontSize: 12,
    fontFamily: "Urbanist_400Regular",
  },
});
