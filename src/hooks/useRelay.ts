import { onValue, ref, set } from "firebase/database";
import { useEffect, useState } from "react";
import { database } from "@/lib/firebase";

export function useRelay(deviceId: string) {
  const [relay, setRelay] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const relayRef = ref(database, `devices/${deviceId}/relay`);
    return onValue(relayRef, (snapshot) => {
      setRelay(snapshot.val() === true);
      setPending(false);
    }, (reason) => setError(reason.message || "Tidak dapat membaca status relay."));
  }, [deviceId]);

  const updateRelay = async (value: boolean) => {
    setError(null);
    setPending(true);
    try {
      await set(ref(database, `devices/${deviceId}/relay`), value);
    } catch (reason) {
      setPending(false);
      setError(reason instanceof Error ? reason.message : "Perintah relay gagal dikirim.");
      throw reason;
    }
  };

  return { relay, pending, error, updateRelay };
}
