import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/lib/auth";
import { useDeviceId } from "@/hooks/useDeviceId";
import { useSettings, writeSettings } from "@/hooks/useSettings";

export default function SettingsScreen() {
  const { user, loading: authLoading } = useAuth();
  const { deviceId, setDeviceId, loading: deviceLoading } = useDeviceId();
  const { settings } = useSettings(deviceId);
  const [deviceInput, setDeviceInput] = useState(deviceId);
  const [tariff, setTariff] = useState("");
  const [emission, setEmission] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (!authLoading && !user) router.replace("/login"); }, [authLoading, user]);
  useEffect(() => { setDeviceInput(deviceId); }, [deviceId]);
  useEffect(() => { setTariff(String(settings.tariff)); setEmission(String(settings.emissionFactor)); }, [settings]);

  const save = async () => {
    const tariffValue = Number(tariff.replace(",", "."));
    const emissionValue = Number(emission.replace(",", "."));
    if (!deviceInput.trim() || !Number.isFinite(tariffValue) || tariffValue <= 0 || !Number.isFinite(emissionValue) || emissionValue <= 0) {
      Alert.alert("Input tidak valid", "Device ID wajib diisi. Tarif dan faktor emisi harus berupa angka positif.");
      return;
    }
    setBusy(true);
    try {
      await writeSettings(deviceInput.trim(), { tariff: tariffValue, emissionFactor: emissionValue });
      await setDeviceId(deviceInput);
      Alert.alert("Berhasil", "Pengaturan tersimpan.");
    } catch (reason) {
      Alert.alert("Gagal menyimpan", reason instanceof Error ? reason.message : "Periksa koneksi dan permission Firebase.");
    } finally { setBusy(false); }
  };

  if (authLoading || deviceLoading || !user) return <View style={styles.center}><Text style={styles.muted}>Memuat...</Text></View>;
  return <ScrollView style={styles.screen} contentContainerStyle={styles.content}><Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Kembali</Text></Pressable><Text style={styles.heading}>Pengaturan</Text><Text style={styles.label}>Device ID</Text><TextInput value={deviceInput} onChangeText={setDeviceInput} autoCapitalize="none" style={styles.input} placeholder="esp32_01" placeholderTextColor="#64748b" /><Text style={styles.label}>Tarif listrik (Rp/kWh)</Text><TextInput value={tariff} onChangeText={setTariff} keyboardType="decimal-pad" style={styles.input} /><Text style={styles.label}>Faktor emisi (kg CO2e/kWh)</Text><TextInput value={emission} onChangeText={setEmission} keyboardType="decimal-pad" style={styles.input} /><Pressable disabled={busy} onPress={save} style={styles.button}><Text style={styles.buttonText}>{busy ? "Menyimpan..." : "Simpan pengaturan"}</Text></Pressable></ScrollView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0f172a" }, content: { padding: 22, paddingTop: 56, gap: 10 }, center: { flex: 1, backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center" }, muted: { color: "#94a3b8" },
  back: { color: "#7dd3fc", fontSize: 16, marginBottom: 14 }, heading: { color: "#f8fafc", fontSize: 28, fontWeight: "800", marginBottom: 18 }, label: { color: "#cbd5e1", fontWeight: "700", marginTop: 8 }, input: { backgroundColor: "#1e293b", color: "#f8fafc", borderRadius: 12, padding: 14, fontSize: 16 }, button: { backgroundColor: "#0284c7", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 18 }, buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
