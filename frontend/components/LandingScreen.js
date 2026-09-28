import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ActivityIndicator,
  Image,
} from "react-native";
import {
  useFonts,
  PlusJakartaSans_200ExtraLight,
  PlusJakartaSans_300Light,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from "@expo-google-fonts/plus-jakarta-sans";

import { supabase } from "../lib/supabase";

export default function LandingScreen() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_200ExtraLight,
    PlusJakartaSans_300Light,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [mode, setMode] = useState("signIn");

  const handleSubmit = async () => {
    setErrorMsg("");
    setLoading(true);

    const { error } =
      mode === "signIn"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    setLoading(false);
    if (error) setErrorMsg(error.message);
  };
  if (!fontsLoaded) return null;
  return (
    <View style={{ flex: 1 }}>
      <View style={styles.container}>
        <Image
          source={require("../assets/logo.png")}
          style={styles.logo}
          accessibilityLabel="ReCovered logo"
        />
        <Text style={styles.title}>ReCovered</Text>
        <View style={styles.subtitleGroup}>
          <Text style={styles.subtitle}>
            A private home inventory system you can count on.
          </Text>
          <Text style={styles.subtitle}>
            For the moments you can’t plan for.
          </Text>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#999"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#999"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}

        {loading ? (
          <ActivityIndicator style={{ marginTop: 12 }} />
        ) : (
          <Button
            color="#4a46c4"
            title={mode === "signIn" ? "Sign In" : "Sign Up"}
            onPress={handleSubmit}
          />
        )}

        <Text
          style={styles.toggle}
          onPress={() => setMode(mode === "signIn" ? "signUp" : "signIn")}
        >
          {mode === "signIn"
            ? "Don't have an account? Sign up"
            : "Already have an account? Sign in"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    alignItems: "center",
  },
  title: {
    fontFamily: "PlusJakartaSans_300Light",
    fontSize: 58,
    fontWeight: "normal",
    textAlign: "center",
  },
  subtitleGroup: {
    marginBottom: 24,
  },
  subtitle: {
    fontFamily: "PlusJakartaSans_300Light",
    fontSize: 14,
    color: "#383838",
    textAlign: "center",
    marginBottom: 5,
  },
  input: {
    maxWidth: 400,
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 10,
    borderRadius: 6,
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: "contain",
    marginBottom: 16,
  },
  error: { color: "red", marginBottom: 8, textAlign: "center" },
  toggle: { marginTop: 16, textAlign: "center", color: "#8682ec" },
});
