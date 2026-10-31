import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/lib/auth";
import { useDeviceId } from "@/hooks/useDeviceId";
import { useDailyHistory } from "@/hooks/useDailyHistory";
import { formatNumber, formatRupiah } from "@/utils/format";
import { useEffect } from "react";

export default function HistoryScreen() {
  const { user, loading: authLoading } = useAuth();
  const { deviceId, loading: deviceLoading } = useDeviceId();
  const { history, loading, error } = useDailyHistory(deviceId);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [authLoading, user]);

  if (authLoading || deviceLoading || !user) {
    return <View style={styles.center}><Text style={styles.muted}>Memuat...</Text></View>;
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Kembali</Text></Pressable>
      <Text style={styles.heading}>Riwayat harian</Text>
      <Text style={styles.subtitle}>Pemakaian tersimpan untuk {deviceId}</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading ? <Text style={styles.muted}>Memuat riwayat...</Text> : history.length === 0 ? (
        <View style={styles.card}><Text style={styles.cardTitle}>Belum ada riwayat</Text><Text style={styles.muted}>Riwayat akan tersimpan saat readings energi diterima.</Text></View>
      ) : history.map((item) => (
        <View style={styles.card} key={item.date}>
          <Text style={styles.cardTitle}>{item.date}</Text>
          <View style={styles.row}><Text style={styles.muted}>Energi</Text><Text style={styles.value}>{formatNumber(item.energy, 3)} kWh</Text></View>
          <View style={styles.row}><Text style={styles.muted}>Biaya</Text><Text style={styles.value}>{formatRupiah(item.cost)}</Text></View>
          <View style={styles.row}><Text style={styles.muted}>Emisi</Text><Text style={styles.value}>{formatNumber(item.emission)} kg CO2e</Text></View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0f172a" },
  content: { padding: 22, paddingTop: 56, gap: 12 },
  center: { flex: 1, backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center" },
  back: { color: "#7dd3fc", fontSize: 16, marginBottom: 8 },
  heading: { color: "#f8fafc", fontSize: 28, fontWeight: "800" },
  subtitle: { color: "#64748b" },
  muted: { color: "#94a3b8" },
  error: { color: "#fca5a5", backgroundColor: "#451a1a", padding: 12, borderRadius: 10 },
  card: { backgroundColor: "#1e293b", borderRadius: 16, padding: 16, gap: 10 },
  cardTitle: { color: "#f8fafc", fontSize: 17, fontWeight: "700" },
  row: { flexDirection: "row", justifyContent: "space-between" },
  value: { color: "#f8fafc", fontWeight: "700" },
});
