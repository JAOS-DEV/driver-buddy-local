import React, { useState } from "react";
import { View } from "./types";
import WorkLog from "./components/WorkLog";
import UnionChatbot from "./components/UnionChatbot";
import Settings from "./components/Settings";
import BottomNav from "./components/BottomNav";
import useLocalStorage from "./hooks/useLocalStorage";
import { Settings as SettingsType } from "./types";

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>(View.WORK);
  const [settings, setSettings] = useLocalStorage<SettingsType>("settings", {
    weekStartDay: "monday",
    defaultHourlyRate: 0,
    defaultOvertimeRate: 0,
    enableTaxCalculations: false,
    taxRate: 0.2, // 20% default UK rate
    currency: "GBP",
    weeklyGoal: 0,
    monthlyGoal: 0,
  });

  return (
    <div className="h-[100dvh] w-full flex items-center justify-center bg-[#FAF7F0] overflow-hidden">
      {/* Mobile container - full height on mobile, larger fixed height on desktop */}
      <div className="w-full h-full sm:h-[700px] sm:max-w-md bg-[#FAF7F0] sm:rounded-3xl sm:shadow-2xl sm:border sm:border-slate-200/50 flex flex-col overflow-hidden mx-auto">
        <div className="flex-1 overflow-hidden p-6 pb-0">
          {activeView === View.WORK && <WorkLog settings={settings} />}
          {activeView === View.CHAT && <UnionChatbot />}
          {activeView === View.SETTINGS && (
            <Settings settings={settings} setSettings={setSettings} />
          )}
        </div>
        <BottomNav activeView={activeView} setActiveView={setActiveView} />
      </div>
    </div>
  );
};

export default App;
