import React from "react";
import { View, Settings, DailyPay, TimeEntry, DailySubmission } from "./types";
import WorkLog from "./components/WorkLog";
import UnionChatbot from "./components/UnionChatbot";
import SettingsComponent from "./components/Settings";
import PayCalculator from "./components/PayCalculator";
import LawLimits from "./components/LawLimits";
import BottomNav from "./components/BottomNav";
import useLocalStorage from "./hooks/useLocalStorage";
import { useTimeCalculations } from "./hooks/useTimeCalculations";

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

  return (
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
            <SettingsComponent settings={settings} setSettings={setSettings} />
          )}
        </div>
        <BottomNav
          activeView={activeView}
          setActiveView={setActiveView}
          settings={settings}
        />
      </div>
    </div>
  );
};

export default App;
