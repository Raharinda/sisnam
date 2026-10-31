import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/lib/auth";
import { useDeviceId } from "@/hooks/useDeviceId";
import { useReadings } from "@/hooks/useReadings";
import { useRelay } from "@/hooks/useRelay";
import { useSettings } from "@/hooks/useSettings";
import { useSaveDailyUsage } from "@/hooks/useDailyHistory";
import { calculateCost, calculateEmission, estimateMonthlyCost, periodEnergy } from "@/utils/calc";
import { formatDate, formatNumber, formatRupiah } from "@/utils/format";

function Metric({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return <View style={styles.metric}><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricValue}>{value} <Text style={styles.unit}>{unit}</Text></Text></View>;
}

export default function DashboardScreen() {
  const { user, loading: authLoading, logout } = useAuth();
  const { deviceId, loading: deviceLoading } = useDeviceId();
  const { readings, loading, error } = useReadings(deviceId);
  const { relay, pending, error: relayError, updateRelay } = useRelay(deviceId);
  const { settings, error: settingsError, saveSettings } = useSettings(deviceId);
  const { error: historyError } = useSaveDailyUsage(deviceId, readings?.energy ?? null, settings.tariff, settings.emissionFactor, readings?.ts ?? null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { if (!authLoading && !user) router.replace("/login"); }, [authLoading, user]);

  const age = readings ? Math.floor(Date.now() / 1000) - readings.ts : Infinity;
  const online = relay && age < 30;
  const period = readings ? periodEnergy(readings.energy, settings.baselineEnergy) : 0;
  const resetWarning = readings !== null && readings.energy < settings.baselineEnergy;
  const metrics = useMemo(() => readings ? [
    ["Daya sekarang", formatNumber(readings.power), "W"], ["Tegangan", formatNumber(readings.voltage), "V"],
    ["Arus", formatNumber(readings.current), "A"], ["Frekuensi", formatNumber(readings.frequency), "Hz"],
    ["Power factor", formatNumber(readings.pf), ""], ["Total energi", formatNumber(readings.energy, 3), "kWh"],
  ] : [], [readings]);

  if (authLoading || deviceLoading || !user) return <View style={styles.center}><Text style={styles.muted}>Memuat...</Text></View>;

  const setRelayValue = async (value: boolean) => {
    if (value) {
      Alert.alert("Nyalakan relay?", "Perangkat akan menyambungkan stop kontak beban.", [
        { text: "Batal", style: "cancel" },
        { text: "Nyalakan", onPress: () => updateRelay(value).catch(() => undefined) },
      ]);
    } else await updateRelay(value).catch(() => undefined);
  };

  const newPeriod = () => {
    if (!readings) { Alert.alert("Belum ada data", "Baseline baru membutuhkan readings dari perangkat."); return; }
    saveSettings({ baselineEnergy: readings.energy, baselineTs: Math.floor(Date.now() / 1000) })
      .then(() => Alert.alert("Berhasil", "Periode energi baru sudah dimulai.")).catch(() => undefined);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); setTimeout(() => setRefreshing(false), 500); }} />}>
      <View style={styles.topbar}><View><Text style={styles.heading}>Dashboard</Text><Text style={styles.device}>{deviceId}</Text></View><Pressable onPress={() => router.push("/settings")}><Text style={styles.link}>Pengaturan</Text></Pressable></View>
      <View style={styles.statusRow}><View style={[styles.dot, { backgroundColor: online ? "#22c55e" : "#f59e0b" }]} /><Text style={styles.status}>{!relay && age >= 30 ? "Relay OFF, pengukuran berhenti" : online ? "Online" : "Offline"}</Text><Text style={styles.timestamp}>{readings ? `Update ${formatDate(readings.ts)}` : "Belum ada data"}</Text></View>
      {error || relayError || settingsError || historyError ? <Text style={styles.error}>{error || relayError || settingsError || historyError}</Text> : null}
      <View style={styles.card}><View><Text style={styles.cardTitle}>Kontrol relay</Text><Text style={styles.relayState}>{relay ? "ON - beban tersambung" : "OFF - beban terputus"}</Text>{pending ? <Text style={styles.pending}>Menunggu perangkat menerapkan...</Text> : null}</View><Switch value={relay} onValueChange={setRelayValue} disabled={pending} trackColor={{ false: "#475569", true: "#38bdf8" }} thumbColor="#f8fafc" /></View>
      {loading ? <Text style={styles.muted}>Memuat readings...</Text> : !readings ? <View style={styles.card}><Text style={styles.cardTitle}>Belum ada readings</Text><Text style={styles.muted}>Nyalakan relay atau periksa koneksi Firebase.</Text></View> : <View style={styles.grid}>{metrics.map(([label, value, unit]) => <Metric key={label} label={label} value={value} unit={unit} />)}</View>}
      {resetWarning ? <Text style={styles.warning}>Energi readings lebih kecil dari baseline. PZEM mungkin baru direset; mulai periode baru untuk menghitung ulang.</Text> : null}
      <Pressable style={styles.secondaryButton} onPress={() => router.push("/history")}><Text style={styles.secondaryText}>Lihat riwayat harian</Text></Pressable>
      <View style={styles.card}><Text style={styles.cardTitle}>Periode ini</Text><View style={styles.row}><Text style={styles.muted}>Energi</Text><Text style={styles.strong}>{formatNumber(period, 3)} kWh</Text></View><View style={styles.row}><Text style={styles.muted}>Biaya</Text><Text style={styles.strong}>{formatRupiah(calculateCost(period, settings.tariff))}</Text></View><View style={styles.row}><Text style={styles.muted}>Emisi karbon</Text><Text style={styles.strong}>{formatNumber(calculateEmission(period, settings.emissionFactor))} kg CO2e</Text></View><View style={styles.row}><Text style={styles.muted}>Estimasi bulanan <Text style={styles.small}>(estimasi kasar)</Text></Text><Text style={styles.strong}>{formatRupiah(estimateMonthlyCost(readings?.power || 0, settings.tariff))}</Text></View><Pressable style={styles.secondaryButton} onPress={newPeriod}><Text style={styles.secondaryText}>Mulai periode baru</Text></Pressable></View>
      <Pressable onPress={() => logout()}><Text style={styles.logout}>Keluar</Text></Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0f172a" }, content: { padding: 20, paddingTop: 56, gap: 14 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0f172a" }, muted: { color: "#94a3b8" },
  topbar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, heading: { color: "#f8fafc", fontSize: 28, fontWeight: "800" }, device: { color: "#64748b", marginTop: 4 }, link: { color: "#38bdf8", fontWeight: "700" },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 8 }, dot: { width: 9, height: 9, borderRadius: 5 }, status: { color: "#cbd5e1", fontWeight: "700" }, timestamp: { color: "#64748b", fontSize: 12, marginLeft: "auto" },
  card: { backgroundColor: "#1e293b", borderRadius: 16, padding: 16, gap: 10 }, cardTitle: { color: "#f8fafc", fontSize: 16, fontWeight: "700" }, relayState: { color: "#cbd5e1" }, pending: { color: "#fbbf24", fontSize: 12 }, error: { color: "#fca5a5", backgroundColor: "#451a1a", padding: 12, borderRadius: 10 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 }, metric: { backgroundColor: "#1e293b", borderRadius: 14, padding: 14, width: "31%", minWidth: 100 }, metricLabel: { color: "#94a3b8", fontSize: 12 }, metricValue: { color: "#f8fafc", fontSize: 17, fontWeight: "800", marginTop: 7 }, unit: { color: "#94a3b8", fontSize: 11, fontWeight: "400" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, strong: { color: "#f8fafc", fontWeight: "700" }, small: { fontSize: 11 }, warning: { color: "#fcd34d", backgroundColor: "#422006", padding: 12, borderRadius: 10, lineHeight: 19 }, secondaryButton: { borderWidth: 1, borderColor: "#38bdf8", borderRadius: 10, padding: 12, alignItems: "center", marginTop: 4 }, secondaryText: { color: "#7dd3fc", fontWeight: "700" }, logout: { color: "#fca5a5", textAlign: "center", padding: 14, fontWeight: "700" },
});
