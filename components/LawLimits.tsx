import React from "react";
import useLocalStorage from "../hooks/useLocalStorage";

interface LawLimitsProps {
  totalMinutes: number;
}

interface DailyEntry {
  date: string; // YYYY-MM-DD format
  totalMinutes: number;
}

const ProgressBar: React.FC<{ value: number; max: number; label: string }> = ({
  value,
  max,
  label,
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  const isOver = value > max;
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-base font-medium text-slate-700">{label}</span>
        <span
          className={`text-sm font-medium ${
            isOver ? "text-red-600" : "text-slate-500"
          }`}
        >
          {value.toFixed(2)} / {max} hours
        </span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full ${
            isOver ? "bg-red-500" : "bg-[#003D5B]"
          }`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      {isOver && (
        <p className="text-red-600 text-xs mt-1">
          You have exceeded the legal limit.
        </p>
      )}
    </div>
  );
};

const LawLimits: React.FC<LawLimitsProps> = ({ totalMinutes }) => {
  const [dailySubmissions, setDailySubmissions] = useLocalStorage<
    DailySubmission[]
  >("dailySubmissions", []);

  const UK_DAILY_LIMIT = 9; // Can be extended to 10 twice a week
  const UK_WEEKLY_LIMIT = 56;
  const UK_FORTNIGHTLY_LIMIT = 90;

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split("T")[0];

  // Calculate totals for different periods
  const getPeriodTotal = (days: number) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffDateStr = cutoffDate.toISOString().split("T")[0];

    return (
      dailySubmissions
        .filter((entry) => entry.date >= cutoffDateStr)
        .reduce((sum, entry) => sum + entry.totalMinutes, 0) / 60
    );
  };

  // For daily hours, sum all submissions for today, or use current totalMinutes if no submissions
  const todaySubmissions = dailySubmissions.filter((sub) => sub.date === today);
  const dailyHours =
    todaySubmissions.length > 0
      ? todaySubmissions.reduce((sum, sub) => sum + sub.totalMinutes, 0) / 60
      : totalMinutes / 60;
  const weeklyHours = getPeriodTotal(7);
  const fortnightlyHours = getPeriodTotal(14);

  const handleReset = () => {
    setDailySubmissions([]);
  };

  const handleResetWeek = () => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7);
    const cutoffDateStr = cutoffDate.toISOString().split("T")[0];

    setDailySubmissions((prev) =>
      prev.filter((entry) => entry.date >= cutoffDateStr)
    );
  };

  return (
    <div className="space-y-6 text-[#003D5B]">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold">Driving Time Limits (UK Standard)</h2>
        <div className="flex gap-2">
          <button
            onClick={handleResetWeek}
            className="text-xs bg-orange-500 text-white px-3 py-1 rounded-md hover:bg-orange-600 transition-colors"
          >
            Reset Week
          </button>
          <button
            onClick={handleReset}
            className="text-xs bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition-colors"
          >
            Reset All
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <ProgressBar
          value={dailyHours}
          max={UK_DAILY_LIMIT}
          label="Daily Driving"
        />
        <ProgressBar
          value={weeklyHours}
          max={UK_WEEKLY_LIMIT}
          label="Weekly Driving"
        />
        <ProgressBar
          value={fortnightlyHours}
          max={UK_FORTNIGHTLY_LIMIT}
          label="Fortnightly Driving"
        />
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

      <div className="text-xs text-slate-500 text-center p-4 bg-slate-100/50 rounded-lg">
        Disclaimer: This is for informational purposes only and not legal
        advice. Always refer to official documentation and your contract.
      </div>
    </div>
  );
};

export default LawLimits;
