import { onValue, ref } from "firebase/database";
import { useEffect, useState } from "react";
import { database } from "@/lib/firebase";

export type Readings = {
  voltage: number;
  current: number;
  power: number;
  energy: number;
  frequency: number;
  pf: number;
  ts: number;
};

function numberValue(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

export function useReadings(deviceId: string) {
  const [readings, setReadings] = useState<Readings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const readingsRef = ref(database, `devices/${deviceId}/readings`);
    return onValue(readingsRef, (snapshot) => {
      const value = snapshot.val();
      if (!value) {
        setReadings(null);
      } else {
        setReadings({
          voltage: numberValue(value.voltage),
          current: numberValue(value.current),
          power: numberValue(value.power),
          energy: numberValue(value.energy),
          frequency: numberValue(value.frequency),
          pf: numberValue(value.pf),
          ts: numberValue(value.ts),
        });
      }
      setLoading(false);
    }, (reason) => {
      setError(reason.message || "Tidak dapat membaca data perangkat.");
      setLoading(false);
    });
  }, [deviceId]);

  return { readings, loading, error };
}
