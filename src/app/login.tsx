import { useState } from "react";
import { Alert, ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/lib/auth";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Data belum lengkap", "Masukkan email dan password.");
      return;
    }
    setBusy(true);
    try {
      await signIn(email, password);
      router.replace("/");
    } catch (reason) {
      Alert.alert("Login gagal", reason instanceof Error ? reason.message : "Periksa koneksi dan data login.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>SISNAM</Text>
      <Text style={styles.title}>Pantau perangkat IoT</Text>
      <Text style={styles.subtitle}>Masuk untuk mengontrol energi rumah Anda.</Text>
      <TextInput autoCapitalize="none" keyboardType="email-address" placeholder="Email" placeholderTextColor="#8b94a7" value={email} onChangeText={setEmail} style={styles.input} />
      <TextInput secureTextEntry placeholder="Password" placeholderTextColor="#8b94a7" value={password} onChangeText={setPassword} style={styles.input} />
      <Pressable onPress={submit} disabled={busy} style={styles.button}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Masuk</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 28, backgroundColor: "#0f172a" },
  logo: { color: "#38bdf8", fontSize: 18, fontWeight: "800", letterSpacing: 3 },
  title: { color: "#f8fafc", fontSize: 30, fontWeight: "800", marginTop: 16 },
  subtitle: { color: "#94a3b8", fontSize: 15, marginTop: 8, marginBottom: 30 },
  input: { backgroundColor: "#1e293b", color: "#f8fafc", borderRadius: 12, padding: 15, marginBottom: 12, fontSize: 16 },
  button: { backgroundColor: "#0284c7", borderRadius: 12, alignItems: "center", padding: 16, marginTop: 8 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
