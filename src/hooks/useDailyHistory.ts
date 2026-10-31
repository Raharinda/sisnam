import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { firestore } from "@/lib/firebase";

export type DailyUsage = {
  date: string;
  startEnergy: number;
  endEnergy: number;
  energy: number;
  cost: number;
  emission: number;
  updatedAt: number;
};

function numberValue(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function localDateKey(epochSeconds: number) {
  const date = new Date(epochSeconds * 1000);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function saveDailyUsage(
  deviceId: string,
  energy: number,
  tariff: number,
  emissionFactor: number,
  timestamp = Math.floor(Date.now() / 1000),
) {
  const date = localDateKey(timestamp);
  const dailyRef = doc(firestore, "devices", deviceId, "dailyHistory", date);
  await runTransaction(firestore, async (transaction) => {
    const snapshot = await transaction.get(dailyRef);
    const current = snapshot.data();
    const currentStart = numberValue(current?.startEnergy);
    const startEnergy = snapshot.exists() ? currentStart : energy;
    const resetDetected = energy < startEnergy;
    const nextStart = resetDetected ? energy : startEnergy;
    const dailyEnergy = resetDetected ? 0 : Math.max(0, energy - nextStart);

    transaction.set(dailyRef, {
      date,
      startEnergy: nextStart,
      endEnergy: energy,
      energy: dailyEnergy,
      cost: dailyEnergy * Math.max(0, Number(tariff) || 0),
      emission: dailyEnergy * Math.max(0, Number(emissionFactor) || 0),
      updatedAt: timestamp,
    });
  });
}

export function useSaveDailyUsage(
  deviceId: string,
  energy: number | null,
  tariff: number,
  emissionFactor: number,
  timestamp: number | null,
) {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (energy === null || timestamp === null) return;
    saveDailyUsage(deviceId, energy, tariff, emissionFactor, timestamp).catch((reason) => {
      setError(reason instanceof Error ? reason.message : "Pemakaian harian gagal disimpan.");
    });
  }, [deviceId, energy, tariff, emissionFactor, timestamp]);

  return { error };
}

export function useDailyHistory(deviceId: string) {
  const [history, setHistory] = useState<DailyUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const historyQuery = query(
      collection(firestore, "devices", deviceId, "dailyHistory"),
      orderBy("date", "desc"),
    );
    return onSnapshot(historyQuery, (snapshot) => {
      const entries = snapshot.docs.map((item) => {
        const daily = item.data() as Record<string, unknown>;
        return {
          date: String(daily.date || item.id),
          startEnergy: numberValue(daily.startEnergy),
          endEnergy: numberValue(daily.endEnergy),
          energy: numberValue(daily.energy),
          cost: numberValue(daily.cost),
          emission: numberValue(daily.emission),
          updatedAt: numberValue(daily.updatedAt),
        };
      });
      setHistory(entries);
      setLoading(false);
    }, (reason) => {
      setError(reason.message || "Tidak dapat membaca riwayat harian.");
      setLoading(false);
    });
  }, [deviceId]);

  return { history, loading, error };
}
