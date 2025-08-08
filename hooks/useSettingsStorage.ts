import { useEffect } from "react";
import useLocalStorage from "./useLocalStorage";
import { Settings } from "../types";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../services/firebase";

const defaultSettings: Settings = {
  weekStartDay: "monday",
  standardRates: [
    {
      id: "default",
      name: "Default Standard Rate",
      rate: 0,
    },
  ],
  overtimeRates: [
    {
      id: "default",
      name: "Default Overtime Rate",
      rate: 0,
    },
  ],
  enableTaxCalculations: false,
  taxRate: 0.2,
  enableNiCalculations: false,
  currency: "GBP",
  weeklyGoal: 0,
  monthlyGoal: 0,
  darkMode: false,
  storageMode: "local",
};

function omitStorageMode(settings: Settings): Omit<Settings, "storageMode"> {
  const { storageMode: _sm, ...rest } = settings as Settings & {
    storageMode: Settings["storageMode"];
  };
  return rest;
}

export default function useSettingsStorage(userId?: string) {
  const [settings, setSettings] = useLocalStorage<Settings>(
    "settings",
    defaultSettings
  );

  const storageMode = settings.storageMode ?? "local";

  // Cloud subscription when in cloud mode and signed in
  useEffect(() => {
    if (storageMode !== "cloud" || !userId) return;
    const ref = doc(db, "users", userId, "meta", "settings");
    const unsubscribe = onSnapshot(ref, (snap) => {
      const cloud = snap.data() as Partial<Settings> | undefined;
      if (!cloud) return;
      // Preserve local storageMode while adopting cloud settings
      setSettings((prev) => ({
        ...prev,
        ...cloud,
        storageMode: prev.storageMode ?? "local",
      }));
    });
    return () => unsubscribe();
  }, [storageMode, userId, setSettings]);

  // Setter wrapper: write to cloud when in cloud mode, always update local
  const updateSettings = async (
    next: Settings | ((prev: Settings) => Settings)
  ) => {
    const resolved = typeof next === "function" ? next(settings) : next;
    // Always update local for fast UI
    setSettings(resolved);
    if (storageMode === "cloud" && userId) {
      const ref = doc(db, "users", userId, "meta", "settings");
      await setDoc(ref, omitStorageMode(resolved), { merge: true });
    }
  };

  return { settings, setSettings: updateSettings } as const;
}
