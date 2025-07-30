import React from "react";
import { TimeEntry, WorkTab, DailySubmission } from "../types";
import TimeTracker from "./TimeTracker";
import WageCalculator from "./WageCalculator";
import LawLimits from "./LawLimits";
import { useTimeCalculations } from "../hooks/useTimeCalculations";
import useLocalStorage from "../hooks/useLocalStorage";

const TabButton: React.FC<{
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`py-2 px-1 text-center font-semibold transition-colors duration-200 w-full ${
      isActive
        ? "text-[#003D5B] border-b-2 border-[#003D5B]"
        : "text-slate-500 hover:text-slate-800"
    }`}
  >
    {label}
  </button>
);

const WorkLog: React.FC = () => {
  const [activeTab, setActiveTab] = useLocalStorage<WorkTab>(
    "activeTab",
    WorkTab.TRACKER
  );
  const [entries, setEntries] = useLocalStorage<TimeEntry[]>("timeEntries", []);
  const [hourlyRate, setHourlyRate] = useLocalStorage<number>("hourlyRate", 0);
  const [dailySubmissions, setDailySubmissions] = useLocalStorage<
    DailySubmission[]
  >("dailySubmissions", []);
  const { totalDuration } = useTimeCalculations(entries);

  const addEntry = (startTime: string, endTime: string) => {
    const newEntry: TimeEntry = {
      id: Date.now(),
      startTime,
      endTime,
    };
    setEntries((prev) => [...prev, newEntry]);
  };

  const removeEntry = (id: number) => {
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
  };

  const handleDailySubmit = (submission: DailySubmission) => {
    // This will be called when a day is submitted
    // The submission is already saved in TimeTracker component
    console.log("Day submitted:", submission);
  };

  return (
    <div className="h-full flex flex-col">
      <header className="flex-shrink-0">
        <h1 className="text-xl font-bold text-[#003D5B] text-left mb-3">
          Drive Time Tracker
        </h1>
        <div className="border-b border-slate-200">
          <nav className="flex justify-around items-center">
            <TabButton
              label="Time Tracker"
              isActive={activeTab === WorkTab.TRACKER}
              onClick={() => setActiveTab(WorkTab.TRACKER)}
            />
            <TabButton
              label="Wage"
              isActive={activeTab === WorkTab.WAGE}
              onClick={() => setActiveTab(WorkTab.WAGE)}
            />
            <TabButton
              label="Law Limits"
              isActive={activeTab === WorkTab.LAW}
              onClick={() => setActiveTab(WorkTab.LAW)}
            />
          </nav>
        </div>
      </header>
      <main className="flex-1 pt-4">
        {activeTab === WorkTab.TRACKER && (
          <TimeTracker
            entries={entries}
            addEntry={addEntry}
            removeEntry={removeEntry}
            onDailySubmit={handleDailySubmit}
          />
        )}
        {activeTab === WorkTab.WAGE && (
          <WageCalculator
            totalMinutes={totalDuration.totalMinutes}
            hourlyRate={hourlyRate}
            setHourlyRate={setHourlyRate}
          />
        )}
        {activeTab === WorkTab.LAW && (
          <LawLimits totalMinutes={totalDuration.totalMinutes} />
        )}
      </main>
    </div>
  );
};

export default WorkLog;
