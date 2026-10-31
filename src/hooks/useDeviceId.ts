import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

const DEVICE_ID_KEY = "sisnam.deviceId";

export function useDeviceId() {
  const [deviceId, setDeviceIdState] = useState("esp32_01");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(DEVICE_ID_KEY).then((value) => {
      if (value) setDeviceIdState(value);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const setDeviceId = async (value: string) => {
    const normalized = value.trim();
    await AsyncStorage.setItem(DEVICE_ID_KEY, normalized);
    setDeviceIdState(normalized);
  };

  return { deviceId, setDeviceId, loading };
}
