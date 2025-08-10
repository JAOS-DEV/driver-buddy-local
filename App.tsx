import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Settings,
  DailyPay,
  TimeEntry,
  DailySubmission,
  UserProfile,
} from "./types";
import WorkLog from "./components/WorkLog";
import UnionChatbot from "./components/UnionChatbot";
import SettingsComponent from "./components/Settings";
import PayCalculator from "./components/PayCalculator";
import LawLimits from "./components/LawLimits";
import BottomNav from "./components/BottomNav";
import ErrorBoundary from "./components/ErrorBoundary";
import AdminPanel from "./components/AdminPanel";
import useLocalStorage from "./hooks/useLocalStorage";
import { useTimeCalculations } from "./hooks/useTimeCalculations";
import Login from "./components/Login";
import { auth, onAuthStateChanged } from "./services/firebase";
import {
  getUserProfile,
  createUserProfile,
  isPremium,
} from "./services/firestoreStorage";
import type { User } from "firebase/auth";

const App: React.FC = () => {
  const [activeView, setActiveView] = useLocalStorage<View>(
    "activeView",
    View.WORK
  );
  const [settings, setSettings] = useLocalStorage<Settings>("settings", {
    weekStartDay: "monday",
    standardRates: [
      {
        id: "default",
        name: "Standard Rate",
        rate: 0,
      },
    ],
    overtimeRates: [
      {
        id: "default",
        name: "Overtime Rate",
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
  });

  // Onboarding (first run)
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState<1 | 2>(1);
  useEffect(() => {
    const done = localStorage.getItem("onboardingComplete");
    if (!done) setShowOnboarding(true);
  }, []);
  const closeOnboarding = () => {
    localStorage.setItem("onboardingComplete", "true");
    setShowOnboarding(false);
  };

  // Get time entries for pay calculations
  const [entries, setEntries] = useLocalStorage<TimeEntry[]>("timeEntries", []);
  const [hourlyRate, setHourlyRate] = useLocalStorage<number>("hourlyRate", 0);
  const [payHistory, setPayHistory] = useLocalStorage<DailyPay[]>(
    "payHistory",
    []
  );
  const [dailySubmissions, setDailySubmissions] = useLocalStorage<
    DailySubmission[]
  >("dailySubmissions", []);
  const { totalDuration } = useTimeCalculations(entries);

  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const applyingCloudRef = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setAuthChecked(true);

      if (firebaseUser) {
        // Load or create user profile
        try {
          let profile = await getUserProfile(firebaseUser.uid);
          if (!profile) {
            // Create new user profile
            await createUserProfile(firebaseUser.uid, firebaseUser.email || "");
            profile = await getUserProfile(firebaseUser.uid);
          }
          setUserProfile(profile);
        } catch (error) {
          console.error("Error loading user profile:", error);
        }
      } else {
        setUserProfile(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Live-subscribe to the user's profile so role changes reflect instantly
  useEffect(() => {
    if (!user) return;
    let unsubscribeProfile: undefined | (() => void);
    (async () => {
      try {
        const { onSnapshot, doc } = await import("firebase/firestore");
        const { db } = await import("./services/firebase");
        const profileRef = doc(db, "users", user.uid, "profile", "user");
        unsubscribeProfile = onSnapshot(
          profileRef,
          (snap) => {
            if (snap.exists()) {
              setUserProfile(snap.data() as UserProfile);
            }
          },
          (err) => {
            console.error("Profile subscribe error:", err);
          }
        );
      } catch (e) {
        console.error("Failed to subscribe to profile:", e);
      }
    })();
    return () => {
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, [user?.uid]);

  // Auto-sync to cloud when enabled and authenticated (debounced, loop guard)
  useEffect(() => {
    if (!authChecked || !user) return;
    if (settings.storageMode !== "cloud") return;
    // Gate cloud writes to premium/admin only
    const userIsPremium = isPremium(userProfile);
    if (!userIsPremium) return;
    if (applyingCloudRef.current) return;

    let timeoutId: number | undefined;
    const performSync = async () => {
      const payload = {
        settings,
        timeEntries: entries,
        dailySubmissions,
        payHistory,
      };
      const { writeCloudSnapshot } = await import(
        "./services/firestoreStorage"
      );
      try {
        await writeCloudSnapshot(user.uid, payload);
        // set lastSyncAt locally after successful write
        const nowIso = new Date().toISOString();
        setSettings((prev) => ({ ...prev, lastSyncAt: nowIso }));
        localStorage.setItem(
          "settings",
          JSON.stringify({ ...settings, lastSyncAt: nowIso })
        );
      } catch (e) {
        // Silent fail in UI; user can use manual sync
        console.error("Auto-sync failed", e);
      }
    };
    // debounce writes
    timeoutId = window.setTimeout(performSync, 400);
    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    authChecked,
    user,
    settings.storageMode,
    JSON.stringify(settings),
    JSON.stringify(entries),
    JSON.stringify(dailySubmissions),
    JSON.stringify(payHistory),
    userProfile,
  ]);

  // Cloud read mode: subscribe when in cloud storage mode
  useEffect(() => {
    if (!authChecked || !user) return;
    if (settings.storageMode !== "cloud") return;
    // Gate cloud reads to premium/admin only so free users don't re-apply cloud settings
    const userIsPremium = isPremium(userProfile);
    if (!userIsPremium) return;
    let unsubscribers: Array<() => void> = [];

    const setup = async () => {
      const { onSnapshot, doc, collection } = await import(
        "firebase/firestore"
      );
      const { db } = await import("./services/firebase");
      const userRoot = doc(db, "users", user.uid);

      // Settings doc listener
      const settingsDoc = doc(userRoot, "meta", "settings");
      const unsubSettings = onSnapshot(settingsDoc, (snap) => {
        const data = snap.data() as any;
        if (!data) return;
        applyingCloudRef.current = true;
        const lastSyncIso = data.lastSyncAt?.toDate
          ? data.lastSyncAt.toDate().toISOString()
          : data.lastSyncAt;
        const incoming = { ...data, lastSyncAt: lastSyncIso } as Settings;
        setSettings((prev) => ({ ...prev, ...incoming, storageMode: "cloud" }));
        localStorage.setItem(
          "settings",
          JSON.stringify({ ...incoming, storageMode: "cloud" })
        );
        setTimeout(() => {
          applyingCloudRef.current = false;
        }, 50);
      });
      unsubscribers.push(unsubSettings);

      // Collections listeners
      const subscribeCol = (
        colName: "timeEntries" | "dailySubmissions" | "payHistory",
        setter: (v: any) => void,
        storageKey: string
      ) => {
        const colRef = collection(userRoot, colName);
        const unsub = onSnapshot(colRef, (qs) => {
          applyingCloudRef.current = true;
          const arr = qs.docs.map((d) => d.data());
          setter(arr as any);
          localStorage.setItem(storageKey, JSON.stringify(arr));
          setTimeout(() => {
            applyingCloudRef.current = false;
          }, 50);
        });
        unsubscribers.push(unsub);
      };

      subscribeCol("timeEntries", setEntries, "timeEntries");
      subscribeCol("dailySubmissions", setDailySubmissions, "dailySubmissions");
      subscribeCol("payHistory", setPayHistory, "payHistory");
    };
    setup();

    return () => {
      unsubscribers.forEach((u) => u());
      applyingCloudRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authChecked, user, settings.storageMode, userProfile]);

  // Check if user is premium and admin
  const userIsPremium = isPremium(userProfile);
  const userIsAdmin = userProfile?.role === "admin";

  // Show loading while auth is being checked
  if (!authChecked) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#FAF7F0]">
        <div className="text-center">
          <div className="text-lg font-bold text-[#003D5B] mb-2">
            Loading...
          </div>
          <div className="text-sm text-slate-500">Please wait</div>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!user) {
    return <Login />;
  }

  return (
    <ErrorBoundary>
      <div
        className={`h-[100dvh] w-full flex items-center justify-center overflow-hidden ${
          settings.darkMode ? "bg-gray-900" : "bg-[#FAF7F0]"
        }`}
      >
        {/* Onboarding Modal */}
        {showOnboarding && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3">
            <div
              className={`w-full max-w-sm rounded-xl shadow-2xl border ${
                settings.darkMode
                  ? "bg-gray-800 border-gray-600 text-gray-100"
                  : "bg-white border-gray-200 text-slate-800"
              }`}
            >
              <div
                className={`px-4 py-3 border-b ${
                  settings.darkMode ? "border-gray-600" : "border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold">
                    Welcome to Driver Buddy
                  </h3>
                  <button
                    aria-label="Close onboarding"
                    onClick={closeOnboarding}
                    className={
                      settings.darkMode
                        ? "text-gray-400 hover:text-gray-200"
                        : "text-slate-400 hover:text-slate-600"
                    }
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="px-4 py-3 space-y-2 text-sm">
                {onboardingStep === 1 ? (
                  <>
                    <p>
                      Step 1: Track time in <strong>Tracker</strong>.
                    </p>
                    <p className="text-xs text-slate-500">
                      Add your shifts and submit entries when done.
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      Step 2: Save pay in <strong>Pay</strong>.
                    </p>
                    <p className="text-xs text-slate-500">
                      Change the date to save a past day.
                    </p>
                  </>
                )}
              </div>
              <div
                className={`px-4 py-3 border-t flex justify-end gap-2 ${
                  settings.darkMode ? "border-gray-600" : "border-gray-200"
                }`}
              >
                {onboardingStep === 1 ? (
                  <button
                    aria-label="Next"
                    onClick={() => setOnboardingStep(2)}
                    className={
                      settings.darkMode
                        ? "bg-gray-700 hover:bg-gray-600 text-gray-100 px-3 py-1.5 rounded-md"
                        : "bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-md"
                    }
                  >
                    Next
                  </button>
                ) : (
                  <button
                    aria-label="Finish onboarding"
                    onClick={closeOnboarding}
                    className={
                      settings.darkMode
                        ? "bg-gray-700 hover:bg-gray-600 text-gray-100 px-3 py-1.5 rounded-md"
                        : "bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-md"
                    }
                  >
                    Got it
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <div
          className={`w-full h-full sm:h-[700px] sm:max-w-md sm:rounded-3xl sm:shadow-2xl sm:border flex flex-col overflow-hidden mx-auto ${
            settings.darkMode
              ? "bg-gray-800 sm:border-gray-600/50"
              : "bg-[#FAF7F0] sm:border-slate-200/50"
          }`}
        >
          <div className="flex-1 overflow-hidden pt-2 pr-6 pl-6 pb-0">
            {activeView === View.WORK && (
              <WorkLog
                settings={settings}
                entries={entries}
                setEntries={setEntries}
                dailySubmissions={dailySubmissions}
                setDailySubmissions={setDailySubmissions}
              />
            )}
            {activeView === View.PAY && (
              <PayCalculator
                totalMinutes={totalDuration.totalMinutes}
                hourlyRate={hourlyRate}
                setHourlyRate={setHourlyRate}
                settings={settings}
                payHistory={payHistory}
                setPayHistory={setPayHistory}
                dailySubmissions={dailySubmissions}
                userProfile={userProfile}
              />
            )}
            {activeView === View.LAW_LIMITS && (
              <LawLimits
                totalMinutes={totalDuration.totalMinutes}
                settings={settings}
              />
            )}
            {activeView === View.CHAT && <UnionChatbot settings={settings} />}
            {activeView === View.SETTINGS && (
              <SettingsComponent
                settings={settings}
                setSettings={setSettings}
                user={user}
                userProfile={userProfile}
              />
            )}
            {userIsAdmin && activeView === View.ADMIN && (
              <AdminPanel user={user} settings={settings} />
            )}
          </div>
          {authChecked && user && (
            <BottomNav
              activeView={activeView}
              setActiveView={setActiveView}
              userProfile={userProfile}
              settings={settings}
            />
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default App;
