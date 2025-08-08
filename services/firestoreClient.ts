import { doc, setDoc, collection, writeBatch } from "firebase/firestore";
import { db } from "./firebase";
import { DailyPay, DailySubmission, Settings, TimeEntry } from "../types";

export type StorageSnapshot = {
  settings: Settings;
  timeEntries: TimeEntry[];
  payHistory: DailyPay[];
  dailySubmissions: DailySubmission[];
  hourlyRate: number;
};

export async function importLocalDataToCloud(
  userId: string,
  snapshot: StorageSnapshot
) {
  const userRoot = doc(db, "users", userId);
  const batch = writeBatch(db);

  // settings as a single document
  batch.set(doc(userRoot, "meta", "settings"), snapshot.settings);

  // hourlyRate as a single document
  batch.set(doc(userRoot, "meta", "preferences"), {
    hourlyRate: snapshot.hourlyRate,
  });

  // time entries collection
  const entriesCol = collection(userRoot, "entries");
  for (const entry of snapshot.timeEntries) {
    batch.set(doc(entriesCol, String(entry.id)), entry);
  }

  // pay history collection
  const payCol = collection(userRoot, "payHistory");
  for (const pay of snapshot.payHistory) {
    batch.set(doc(payCol, String(pay.id)), pay);
  }

  // daily submissions collection
  const subCol = collection(userRoot, "dailySubmissions");
  for (const sub of snapshot.dailySubmissions) {
    // Use date as id to avoid duplicates
    batch.set(doc(subCol, sub.date), sub);
  }

  await batch.commit();
}
