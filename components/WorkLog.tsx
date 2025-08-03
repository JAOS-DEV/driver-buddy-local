import React from "react";
import { TimeEntry, DailySubmission, Settings } from "../types";
import TimeTracker from "./TimeTracker";
import { useTimeCalculations } from "../hooks/useTimeCalculations";
import useLocalStorage from "../hooks/useLocalStorage";

interface WorkLogProps {
  settings: Settings;
  entries: TimeEntry[];
  setEntries: (entries: TimeEntry[]) => void;
  dailySubmissions: DailySubmission[];
  setDailySubmissions: (submissions: DailySubmission[]) => void;
}

const WorkLog: React.FC<WorkLogProps> = ({
  settings,
  entries,
  setEntries,
  dailySubmissions,
  setDailySubmissions,
}) => {
  // Clear any existing default data on first load only
  React.useEffect(() => {
    const hasClearedDefault = localStorage.getItem("hasClearedDefault");
    if (!hasClearedDefault) {
      const existingEntries = localStorage.getItem("timeEntries");
      if (existingEntries) {
        try {
          const parsed = JSON.parse(existingEntries);
          // If there are entries that look like default data, clear them
          if (parsed.length > 0) {
            const hasDefaultData = parsed.some(
              (entry: any) =>
                entry.startTime === "0900" ||
                entry.startTime === "0600" ||
                entry.endTime === "0950" ||
                entry.endTime === "0800"
            );
            if (hasDefaultData) {
              setEntries([]);
            }
          }
        } catch (e) {
          // If parsing fails, clear the localStorage
          setEntries([]);
        }
      }
      // Mark that we've cleared default data
      localStorage.setItem("hasClearedDefault", "true");
    }
  }, [setEntries]);
  const [hourlyRate, setHourlyRate] = useLocalStorage<number>("hourlyRate", 0);
  const [payHistory, setPayHistory] = useLocalStorage<any[]>("payHistory", []);
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

  return (
    <div className="h-full flex flex-col">
      <main className="flex-1">
        <TimeTracker
          entries={entries}
          addEntry={addEntry}
          removeEntry={removeEntry}
          clearEntries={clearEntries}
          settings={settings}
          dailySubmissions={dailySubmissions}
          setDailySubmissions={setDailySubmissions}
        />
      </main>
    </div>
  );
};

export default WorkLog;
