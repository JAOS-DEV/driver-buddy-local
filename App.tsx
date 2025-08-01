import React from "react";
import { View, Settings, DailyPay, TimeEntry } from "./types";
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
    defaultHourlyRate: 0,
    defaultOvertimeRate: 0,
    enableTaxCalculations: false,
    taxRate: 0.2,
    currency: "GBP",
    weeklyGoal: 0,
    monthlyGoal: 0,
  });

  // Get time entries for pay calculations
  const [entries, setEntries] = useLocalStorage<TimeEntry[]>("timeEntries", []);
  const [hourlyRate, setHourlyRate] = useLocalStorage<number>("hourlyRate", 0);
  const [payHistory, setPayHistory] = useLocalStorage<DailyPay[]>(
    "payHistory",
    []
  );
  const { totalDuration } = useTimeCalculations(entries);

  return (
    <div className="h-[100dvh] w-full flex items-center justify-center bg-[#FAF7F0] overflow-hidden">
      {/* Mobile container - full height on mobile, larger fixed height on desktop */}
      <div className="w-full h-full sm:h-[700px] sm:max-w-md bg-[#FAF7F0] sm:rounded-3xl sm:shadow-2xl sm:border sm:border-slate-200/50 flex flex-col overflow-hidden mx-auto">
        <div className="flex-1 overflow-hidden pt-2 pr-6 pl-6 pb-0">
          {activeView === View.WORK && (
            <WorkLog
              settings={settings}
              entries={entries}
              setEntries={setEntries}
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
        <BottomNav activeView={activeView} setActiveView={setActiveView} />
      </div>
    </div>
  );
};

export default App;
