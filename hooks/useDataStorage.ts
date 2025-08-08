import { useEffect, useMemo, useRef, useState } from "react";
import useLocalStorage from "./useLocalStorage";
import { DailyPay, DailySubmission, Settings, TimeEntry } from "../types";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
} from "firebase/firestore";
import { db } from "../services/firebase";

type StorageSlices = {
  entries: TimeEntry[];
  setEntries: (
    entries: TimeEntry[] | ((previous: TimeEntry[]) => TimeEntry[])
  ) => void;
  hourlyRate: number;
  setHourlyRate: (rate: number | ((previous: number) => number)) => void;
  payHistory: DailyPay[];
  setPayHistory: (
    history: DailyPay[] | ((previous: DailyPay[]) => DailyPay[])
  ) => void;
  dailySubmissions: DailySubmission[];
  setDailySubmissions: (
    subs:
      | DailySubmission[]
      | ((previous: DailySubmission[]) => DailySubmission[])
  ) => void;
};

function useCloudSlices(userId: string | undefined): StorageSlices {
  const [entries, setEntriesState] = useState<TimeEntry[]>([]);
  const [hourlyRate, setHourlyRateState] = useState<number>(0);
  const [payHistory, setPayHistoryState] = useState<DailyPay[]>([]);
  const [dailySubmissions, setDailySubmissionsState] = useState<
    DailySubmission[]
  >([]);

  // Track mounted state to avoid state updates after unmount
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Subscribe to Firestore in real time
  useEffect(() => {
    if (!userId) return;
    const uid = userId as string;

    const entriesUnsub = onSnapshot(
      collection(db, "users", uid, "entries"),
      (snap) => {
        if (!mountedRef.current) return;
        const data: TimeEntry[] = snap.docs
          .map((d) => d.data() as unknown as TimeEntry)
          .sort((a, b) => Number(a.id) - Number(b.id));
        setEntriesState(data);
      }
    );

    const payUnsub = onSnapshot(
      collection(db, "users", uid, "payHistory"),
      (snap) => {
        if (!mountedRef.current) return;
        const data: DailyPay[] = snap.docs.map(
          (d) => d.data() as unknown as DailyPay
        );
        setPayHistoryState(data);
      }
    );

    const subsUnsub = onSnapshot(
      collection(db, "users", uid, "dailySubmissions"),
      (snap) => {
        if (!mountedRef.current) return;
        const data: DailySubmission[] = snap.docs.map(
          (d) => d.data() as unknown as DailySubmission
        );
        setDailySubmissionsState(data);
      }
    );

    const prefsUnsub = onSnapshot(
      doc(db, "users", uid, "meta", "preferences"),
      (snap) => {
        if (!mountedRef.current) return;
        const data = snap.data() as { hourlyRate?: number } | undefined;
        setHourlyRateState(data?.hourlyRate ?? 0);
      }
    );

    return () => {
      entriesUnsub();
      payUnsub();
      subsUnsub();
      prefsUnsub();
    };
  }, [userId]);

  // Helpers to compute diffs
  function mapById<T extends { id: string | number }>(list: T[]) {
    const map = new Map<string, T>();
    for (const item of list) {
      map.set(String(item.id), item);
    }
    return map;
  }

  const setEntries = (
    next: TimeEntry[] | ((prev: TimeEntry[]) => TimeEntry[])
  ) => {
    if (!userId) return;
    const uid = userId as string;
    const resolvedNext = typeof next === "function" ? next(entries) : next;
    const currentMap = mapById(entries);
    const nextMap = mapById(resolvedNext);

    void (async () => {
      // Deletes
      for (const [id] of currentMap) {
        if (!nextMap.has(id)) {
          await deleteDoc(doc(db, "users", uid, "entries", id));
        }
      }
      // Upserts
      for (const [id, entry] of nextMap) {
        await setDoc(doc(db, "users", uid, "entries", id), entry, {
          merge: true,
        });
      }
    })();
  };

  const setPayHistory = (
    next: DailyPay[] | ((prev: DailyPay[]) => DailyPay[])
  ) => {
    if (!userId) return;
    const uid = userId as string;
    const resolvedNext = typeof next === "function" ? next(payHistory) : next;
    const currentMap = mapById(payHistory);
    const nextMap = mapById(resolvedNext);

    void (async () => {
      for (const [id] of currentMap) {
        if (!nextMap.has(id)) {
          await deleteDoc(doc(db, "users", uid, "payHistory", id));
        }
      }
      for (const [id, pay] of nextMap) {
        await setDoc(doc(db, "users", uid, "payHistory", id), pay, {
          merge: true,
        });
      }
    })();
  };

  const setDailySubmissions = (
    next: DailySubmission[] | ((prev: DailySubmission[]) => DailySubmission[])
  ) => {
    if (!userId) return;
    const uid = userId as string;
    // DailySubmission id is date
    const resolvedNext =
      typeof next === "function" ? next(dailySubmissions) : next;
    const currentMap: Map<string, DailySubmission> = new Map(
      dailySubmissions.map((s) => [s.date as string, s] as const)
    );
    const nextMap: Map<string, DailySubmission> = new Map(
      resolvedNext.map((s) => [s.date as string, s] as const)
    );

    void (async () => {
      for (const [date] of currentMap) {
        if (!nextMap.has(date)) {
          await deleteDoc(doc(db, "users", uid, "dailySubmissions", date));
        }
      }
      for (const [date, sub] of nextMap) {
        await setDoc(doc(db, "users", uid, "dailySubmissions", date), sub, {
          merge: true,
        });
      }
    })();
  };

  const setHourlyRate = (rate: number | ((prev: number) => number)) => {
    if (!userId) return;
    const uid = userId as string;
    const value = typeof rate === "function" ? rate(hourlyRate) : rate;
    void setDoc(
      doc(db, "users", uid, "meta", "preferences"),
      { hourlyRate: value },
      { merge: true }
    );
  };

  return {
    entries,
    setEntries,
    hourlyRate,
    setHourlyRate,
    payHistory,
    setPayHistory,
    dailySubmissions,
    setDailySubmissions,
  };
}

export default function useDataStorage(
  storageMode: Settings["storageMode"],
  userId: string | undefined
): StorageSlices {
  const useCloud = storageMode === "cloud" && Boolean(userId);

  // Local slices
  const [entriesLocal, setEntriesLocal] = useLocalStorage<TimeEntry[]>(
    "timeEntries",
    []
  );
  const [hourlyRateLocal, setHourlyRateLocal] = useLocalStorage<number>(
    "hourlyRate",
    0
  );
  const [payHistoryLocal, setPayHistoryLocal] = useLocalStorage<DailyPay[]>(
    "payHistory",
    []
  );
  const [dailySubmissionsLocal, setDailySubmissionsLocal] = useLocalStorage<
    DailySubmission[]
  >("dailySubmissions", []);

  // Always call to keep hook order stable across mode changes
  const cloudSlices = useCloudSlices(userId);

  return useMemo(() => {
    if (useCloud) return cloudSlices;
    return {
      entries: entriesLocal,
      setEntries: setEntriesLocal,
      hourlyRate: hourlyRateLocal,
      setHourlyRate: setHourlyRateLocal,
      payHistory: payHistoryLocal,
      setPayHistory: setPayHistoryLocal,
      dailySubmissions: dailySubmissionsLocal,
      setDailySubmissions: setDailySubmissionsLocal,
    };
  }, [
    useCloud,
    cloudSlices,
    entriesLocal,
    setEntriesLocal,
    hourlyRateLocal,
    setHourlyRateLocal,
    payHistoryLocal,
    setPayHistoryLocal,
    dailySubmissionsLocal,
    setDailySubmissionsLocal,
  ]);
}
