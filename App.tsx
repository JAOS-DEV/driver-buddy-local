import React from "react";
import { View, Settings, DailyPay, TimeEntry, DailySubmission } from "./types";
import WorkLog from "./components/WorkLog";
import UnionChatbot from "./components/UnionChatbot";
import SettingsComponent from "./components/Settings";
import PayCalculator from "./components/PayCalculator";
import LawLimits from "./components/LawLimits";
import BottomNav from "./components/BottomNav";
import ErrorBoundary from "./components/ErrorBoundary";
import Login from "./components/Login";
import useLocalStorage from "./hooks/useLocalStorage";
import useDataStorage from "./hooks/useDataStorage";
import useSettingsStorage from "./hooks/useSettingsStorage";
import { useTimeCalculations } from "./hooks/useTimeCalculations";
import { AuthProvider, useAuth } from "./hooks/useAuth";

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeView, setActiveView] = useLocalStorage<View>(
    "activeView",
    View.WORK
  );
  const { settings, setSettings } = useSettingsStorage(user?.uid || undefined);

  // Get time entries for pay calculations
  const {
    entries,
    setEntries,
    hourlyRate,
    setHourlyRate,
    payHistory,
    setPayHistory,
    dailySubmissions,
    setDailySubmissions,
  } = useDataStorage(settings.storageMode, user?.uid);
  const { totalDuration } = useTimeCalculations(entries);

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <div className="h-[100dvh] w-full flex items-center justify-center bg-[#FAF7F0]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login screen if user is not authenticated
  if (!user) {
    return <Login />;
  }

  // Show main app if user is authenticated
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
              />
            )}
          </div>
          <BottomNav
            activeView={activeView}
            setActiveView={setActiveView}
            settings={settings}
          />
        </div>
      </div>
    </ErrorBoundary>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
