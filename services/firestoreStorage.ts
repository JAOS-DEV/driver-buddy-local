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
  addDoc,
} from "firebase/firestore";
import { db, auth } from "./firebase";
import {
  DailyPay,
  DailySubmission,
  Settings,
  TimeEntry,
  UserProfile,
  UserRole,
} from "../types";

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

export async function cloudDataExists(uid: string): Promise<boolean> {
  const rootRef = userRoot(uid);
  const [settingsSnap, teSnap, subSnap, paySnap] = await Promise.all([
    getDoc(doc(rootRef, "meta", "settings")),
    getDocs(collection(rootRef, "timeEntries")),
    getDocs(collection(rootRef, "dailySubmissions")),
    getDocs(collection(rootRef, "payHistory")),
  ]);
  if (settingsSnap.exists()) return true;
  if (!teSnap.empty) return true;
  if (!subSnap.empty) return true;
  if (!paySnap.empty) return true;
  return false;
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

// One-time free recovery flag under users/{uid}/meta/limits
export async function getFreeDownloadConsumed(uid: string): Promise<boolean> {
  try {
    const limitsDoc = await getDoc(doc(db, "users", uid, "meta", "limits"));
    const consumed =
      limitsDoc.exists() && (limitsDoc.data() as any).freeDownloadConsumed;
    return Boolean(consumed);
  } catch (e) {
    console.warn("getFreeDownloadConsumed error", e);
    return false;
  }
}

export async function setFreeDownloadConsumed(uid: string): Promise<void> {
  try {
    await setDoc(
      doc(db, "users", uid, "meta", "limits"),
      { freeDownloadConsumed: true, freeDownloadAt: serverTimestamp() },
      { merge: true }
    );
  } catch (e) {
    console.warn("setFreeDownloadConsumed error", e);
  }
}

// User profile management
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userDoc = await getDoc(doc(db, "users", uid, "profile", "user"));
    if (!userDoc.exists()) return null;
    return userDoc.data() as UserProfile;
  } catch (error) {
    console.error("Error getting user profile:", error);
    return null;
  }
}

export async function createUserProfile(
  uid: string,
  email: string
): Promise<void> {
  const now = new Date().toISOString();
  const profile: UserProfile = {
    uid,
    email,
    role: "free",
    createdAt: now,
    updatedAt: now,
  };

  // Create the main user document (only if it doesn't exist)
  const userDocRef = doc(db, "users", uid);
  const userDoc = await getDoc(userDocRef);
  if (!userDoc.exists()) {
    await setDoc(userDocRef, {
      uid,
      email,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Create the profile document (only if it doesn't exist)
  const profileDocRef = doc(db, "users", uid, "profile", "user");
  const profileDoc = await getDoc(profileDocRef);
  if (!profileDoc.exists()) {
    await setDoc(profileDocRef, profile);
  }
}

export async function updateUserRole(
  uid: string,
  role: UserRole
): Promise<void> {
  const now = new Date().toISOString();
  await updateDoc(doc(db, "users", uid, "profile", "user"), {
    role,
    updatedAt: now,
  });

  // Write admin audit log
  try {
    await addDoc(collection(db, "adminLogs"), {
      targetUid: uid,
      newRole: role,
      changedByUid: auth.currentUser?.uid ?? null,
      changedByEmail: auth.currentUser?.email ?? null,
      at: serverTimestamp(),
    });
  } catch (e) {
    // Non-fatal; logging best effort
    console.warn("Failed to log admin action", e);
  }
}

export async function getAllUsers(): Promise<UserProfile[]> {
  try {
    const usersSnap = await getDocs(collection(db, "users"));

    // Fetch all profiles in parallel and return only existing profiles
    const profileDocs = await Promise.all(
      usersSnap.docs.map((userDoc) =>
        getDoc(doc(db, "users", userDoc.id, "profile", "user"))
      )
    );

    return profileDocs
      .filter((profileDoc) => profileDoc.exists())
      .map((profileDoc) => profileDoc.data() as UserProfile);
  } catch (error) {
    console.error("Error getting all users:", error);
    return [];
  }
}

export function isPremium(userProfile: UserProfile | null): boolean {
  if (!userProfile) return false;
  if (userProfile.role === "admin") return true;
  if (userProfile.role === "premium") return true;
  if (userProfile.role === "beta") return true;
  return false;
}

export function isBeta(userProfile: UserProfile | null): boolean {
  return !!userProfile && userProfile.role === "beta";
}

// Debug function retained for development, but avoid using in production UI
export async function debugFirestoreStructure(): Promise<void> {
  try {
    const usersSnap = await getDocs(collection(db, "users"));
    for (const userDoc of usersSnap.docs) {
      await getDoc(doc(db, "users", userDoc.id, "profile", "user"));
    }
  } catch (error) {
    console.error("Debug error:", error);
  }
}
