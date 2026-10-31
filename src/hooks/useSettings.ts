import { onValue, ref, update } from "firebase/database";
import { useEffect, useState } from "react";
import { database } from "@/lib/firebase";

export type DeviceSettings = {
  tariff: number;
  emissionFactor: number;
  baselineEnergy: number;
  baselineTs: number;
};

export const DEFAULT_SETTINGS: DeviceSettings = {
  tariff: 1444.7,
  emissionFactor: 0.87,
  baselineEnergy: 0,
  baselineTs: 0,
};

export async function writeSettings(deviceId: string, values: Partial<DeviceSettings>) {
  await update(ref(database, `devices/${deviceId}/settings`), values);
}

export function useSettings(deviceId: string) {
  const [settings, setSettings] = useState<DeviceSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const settingsRef = ref(database, `devices/${deviceId}/settings`);
    return onValue(settingsRef, (snapshot) => {
      const value = snapshot.val() || {};
      const toNumber = (input: unknown, fallback: number) => {
        const result = Number(input);
        return Number.isFinite(result) ? result : fallback;
      };
      setSettings({
        tariff: toNumber(value.tariff, DEFAULT_SETTINGS.tariff),
        emissionFactor: toNumber(value.emissionFactor, DEFAULT_SETTINGS.emissionFactor),
        baselineEnergy: toNumber(value.baselineEnergy, 0),
        baselineTs: toNumber(value.baselineTs, 0),
      });
      setLoading(false);
    }, (reason) => {
      setError(reason.message || "Tidak dapat membaca pengaturan.");
      setLoading(false);
    });
  }, [deviceId]);

  const saveSettings = async (values: Partial<DeviceSettings>) => {
    setError(null);
    try {
      await writeSettings(deviceId, values);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Pengaturan gagal disimpan.");
      throw reason;
    }
  };

  return { settings, loading, error, saveSettings };
}
