import React from "react";
import { TimeEntry, WorkTab, DailySubmission, Settings } from "../types";
import TimeTracker from "./TimeTracker";
import WageCalculator from "./WageCalculator";
import LawLimits from "./LawLimits";
import { useTimeCalculations } from "../hooks/useTimeCalculations";
import useLocalStorage from "../hooks/useLocalStorage";

interface WorkLogProps {
  settings: Settings;
}

const WorkLog: React.FC<WorkLogProps> = ({ settings }) => {
  const [entries, setEntries] = useLocalStorage<TimeEntry[]>("timeEntries", []);
  const [hourlyRate, setHourlyRate] = useLocalStorage<number>("hourlyRate", 0);
  const [dailySubmissions, setDailySubmissions] = useLocalStorage<
    DailySubmission[]
  >("dailySubmissions", []);
  const [wageHistory, setWageHistory] = useLocalStorage<any[]>(
    "wageHistory",
    []
  );
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

  const clearEntries = () => {
    setEntries([]);
  };

  const handleDailySubmit = (submission: DailySubmission) => {
    // This will be called when a day is submitted
    // The submission is already saved in TimeTracker component
    console.log("Day submitted:", submission);
  };

  return (
    <div className="h-full flex flex-col">
      <main className="flex-1 pt-4">
        <TimeTracker
          entries={entries}
          addEntry={addEntry}
          removeEntry={removeEntry}
          onDailySubmit={handleDailySubmit}
          clearEntries={clearEntries}
        />
      </main>
    </div>
  );
};

export default WorkLog;
