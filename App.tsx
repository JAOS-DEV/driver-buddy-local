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

  // Show admin panel if user is admin
  if (userIsAdmin && activeView === View.ADMIN) {
    return (
      <div className="h-screen flex flex-col">
        <AdminPanel user={user} />
        <BottomNav
          activeView={activeView}
          setActiveView={setActiveView}
          userProfile={userProfile}
          settings={settings}
        />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div
        className={`h-[100dvh] w-full flex items-center justify-center overflow-hidden ${
          settings.darkMode ? "bg-gray-900" : "bg-[#FAF7F0]"
        }`}
      >
        {/* Mobile container - full height on mobile, larger fixed height on desktop */}
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
              <LawLimits totalMinutes={totalDuration.totalMinutes} />
            )}
            {activeView === View.CHAT && <UnionChatbot />}
            {activeView === View.SETTINGS && (
              <SettingsComponent
                settings={settings}
                setSettings={setSettings}
                user={user}
                userProfile={userProfile}
              />
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
