import React from "react";
import useLocalStorage from "../hooks/useLocalStorage";
import { formatDurationWithMinutes } from "../hooks/useTimeCalculations";
import { DailySubmission, Settings } from "../types";

interface LawLimitsProps {
  totalMinutes: number;
  settings: Settings;
}

interface DailyEntry {
  date: string; // YYYY-MM-DD format
  totalMinutes: number;
}

const ProgressBar: React.FC<{
  value: number;
  max: number;
  label: string;
  settings: Settings;
}> = ({ value, max, label, settings }) => {
  const percentage = Math.min((value / max) * 100, 100);
  const isOver = value > max;

  // Convert minutes to hours and minutes for display
  const hours = Math.floor(value / 60);
  const minutes = value % 60;

  // Format the display values - use clean hours and minutes without decimals
  const valueDisplay = formatDurationWithMinutes({
    hours,
    minutes,
    totalMinutes: value,
  });

  const maxDisplay = formatDurationWithMinutes({
    hours: max / 60,
    minutes: 0,
    totalMinutes: max,
  });

  return (
    <div>
      <div className="flex justify-between mb-1">
        <span
          className={`text-base font-medium ${
            settings.darkMode ? "text-gray-200" : "text-slate-700"
          }`}
        >
          {label}
        </span>
        <span
          className={`text-sm font-medium ${
            isOver
              ? settings.darkMode
                ? "text-red-400"
                : "text-red-600"
              : settings.darkMode
              ? "text-gray-400"
              : "text-slate-500"
          }`}
        >
          {valueDisplay} / {maxDisplay}
        </span>
      </div>
      <div
        className={`w-full rounded-full h-2.5 ${
          settings.darkMode ? "bg-gray-700" : "bg-slate-200"
        }`}
      >
        <div
          className={`h-2 rounded-full ${
            isOver
              ? "bg-red-500"
              : settings.darkMode
              ? "bg-emerald-500"
              : "bg-emerald-600"
          }`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      {isOver && (
        <p
          className={`text-xs mt-1 ${
            settings.darkMode ? "text-red-400" : "text-red-600"
          }`}
        >
          You have exceeded the legal limit.
        </p>
      )}
    </div>
  );
};

const LawLimits: React.FC<LawLimitsProps> = ({ totalMinutes, settings }) => {
  const [dailySubmissions, setDailySubmissions] = useLocalStorage<
    DailySubmission[]
  >("dailySubmissions", []);

  const UK_DAILY_LIMIT = 9; // Can be extended to 10 twice a week
  const UK_WEEKLY_LIMIT = 56;
  const UK_FORTNIGHTLY_LIMIT = 90;

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split("T")[0];

  // Calculate totals for different periods in minutes
  const getPeriodTotalMinutes = (days: number) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffDateStr = cutoffDate.toISOString().split("T")[0];

    return dailySubmissions
      .filter((entry) => entry.date >= cutoffDateStr)
      .reduce((sum, entry) => sum + entry.totalMinutes, 0);
  };

  // For daily minutes, sum all submissions for today, or use current totalMinutes if no submissions
  const todaySubmissions = dailySubmissions.filter((sub) => sub.date === today);
  const dailyMinutes =
    todaySubmissions.length > 0
      ? todaySubmissions.reduce((sum, sub) => sum + sub.totalMinutes, 0)
      : totalMinutes;
  const weeklyMinutes = getPeriodTotalMinutes(7);
  const fortnightlyMinutes = getPeriodTotalMinutes(14);

  const handleReset = () => {
    setDailySubmissions([]);
  };

  const handleResetWeek = () => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7);
    const cutoffDateStr = cutoffDate.toISOString().split("T")[0];

    setDailySubmissions((prev) =>
      prev.filter((entry) => entry.date < cutoffDateStr)
    );
  };

  return (
    <div className="space-y-6 text-gray-800">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold">Driving Time Limits (UK Standard)</h2>
      </div>

      <div className="space-y-6">
        <ProgressBar
          value={dailyMinutes}
          max={UK_DAILY_LIMIT * 60}
          label="Daily Driving"
          settings={settings}
        />
        <ProgressBar
          value={weeklyMinutes}
          max={UK_WEEKLY_LIMIT * 60}
          label="Weekly Driving"
          settings={settings}
        />
        <ProgressBar
          value={fortnightlyMinutes}
          max={UK_FORTNIGHTLY_LIMIT * 60}
          label="Fortnightly Driving"
          settings={settings}
        />

        <div className="flex justify-center pt-2">
          <button
            onClick={handleReset}
            className="text-xs bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
          >
            Reset All
          </button>
        </div>
      </div>

      <div className="bg-white/50 p-3 rounded-lg border border-gray-200/80">
        <h3 className="text-sm font-bold mb-2">History Tracking</h3>
        <p className="text-xs text-slate-600 mb-3">
          Your driving hours are automatically tracked daily. Weekly and
          fortnightly totals are calculated from your daily history.
        </p>
        <div className="text-xs text-slate-600">
          <p>• Daily: Today's time tracker entries</p>
          <p>• Weekly: Last 7 days of driving</p>
          <p>• Fortnightly: Last 14 days of driving</p>
        </div>
      </div>

      {/* <div className="text-xs text-slate-500 text-center p-4 bg-slate-100/50 rounded-lg">
        Disclaimer: This is for informational purposes only and not legal
        advice. Always refer to official documentation and your contract.
      </div> */}
    </div>
  );
};

export default LawLimits;
