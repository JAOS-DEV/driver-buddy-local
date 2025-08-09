import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import { DailyPay, DailySubmission, Settings, TimeEntry } from "../types";

export type CloudSnapshot = {
  settings: Settings | null;
  timeEntries: TimeEntry[];
  dailySubmissions: DailySubmission[];
  payHistory: DailyPay[];
  lastSyncedAt?: string;
};

const userRoot = (uid: string) => doc(db, "users", uid);

export async function readCloudSnapshot(uid: string): Promise<CloudSnapshot> {
  const rootRef = userRoot(uid);
  const settingsSnap = await getDoc(doc(rootRef, "meta", "settings"));
  const timeEntriesSnap = await getDocs(collection(rootRef, "timeEntries"));
  const submissionsSnap = await getDocs(
    collection(rootRef, "dailySubmissions")
  );
  const payHistorySnap = await getDocs(collection(rootRef, "payHistory"));

  return {
    settings: (settingsSnap.data() as Settings) || null,
    timeEntries: timeEntriesSnap.docs.map((d) => d.data() as TimeEntry),
    dailySubmissions: submissionsSnap.docs.map(
      (d) => d.data() as DailySubmission
    ),
    payHistory: payHistorySnap.docs.map((d) => d.data() as DailyPay),
  };
}

export async function writeCloudSnapshot(
  uid: string,
  data: Omit<CloudSnapshot, "lastSyncedAt">
): Promise<void> {
  const rootRef = userRoot(uid);
  const batch = writeBatch(db);

  if (data.settings) {
    batch.set(doc(rootRef, "meta", "settings"), {
      ...data.settings,
      lastSyncAt: serverTimestamp(),
    });
  }

  // Replace collections atomically by deleting existing and writing new
  const timeEntriesCol = collection(rootRef, "timeEntries");
  const submissionsCol = collection(rootRef, "dailySubmissions");
  const payHistoryCol = collection(rootRef, "payHistory");

  const [existingTE, existingSub, existingPay] = await Promise.all([
    getDocs(timeEntriesCol),
    getDocs(submissionsCol),
    getDocs(payHistoryCol),
  ]);

  existingTE.forEach((d) => batch.delete(d.ref));
  existingSub.forEach((d) => batch.delete(d.ref));
  existingPay.forEach((d) => batch.delete(d.ref));

  data.timeEntries.forEach((t) =>
    batch.set(doc(timeEntriesCol, String(t.id)), {
      ...t,
      updatedAt: serverTimestamp(),
    })
  );
  data.dailySubmissions.forEach((s) =>
    batch.set(doc(submissionsCol, s.timestamp), {
      ...s,
      updatedAt: serverTimestamp(),
    })
  );
  data.payHistory.forEach((p) =>
    batch.set(doc(payHistoryCol, p.id), { ...p, updatedAt: serverTimestamp() })
  );

  await batch.commit();
}

export async function clearCloudData(uid: string): Promise<void> {
  const rootRef = userRoot(uid);
  const batch = writeBatch(db);

  // Clear settings
  batch.delete(doc(rootRef, "meta", "settings"));

  for (const colName of ["timeEntries", "dailySubmissions", "payHistory"]) {
    const snap = await getDocs(collection(rootRef, colName));
    snap.forEach((d) => batch.delete(d.ref));
  }
  await batch.commit();
}

export async function downloadCloudData(uid: string): Promise<void> {
  const cloudData = await readCloudSnapshot(uid);

  // Save to localStorage
  if (cloudData.settings) {
    localStorage.setItem("settings", JSON.stringify(cloudData.settings));
  }
  if (cloudData.timeEntries) {
    localStorage.setItem("timeEntries", JSON.stringify(cloudData.timeEntries));
  }
  if (cloudData.dailySubmissions) {
    localStorage.setItem(
      "dailySubmissions",
      JSON.stringify(cloudData.dailySubmissions)
    );
  }
  if (cloudData.payHistory) {
    localStorage.setItem("payHistory", JSON.stringify(cloudData.payHistory));
  }
}
