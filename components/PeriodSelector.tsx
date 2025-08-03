import React from "react";
import { Settings } from "../types";

interface PeriodSelectorProps {
  selectedPeriod: "week" | "month" | "all";
  selectedDate: string;
  settings: Settings;
  onPeriodChange: (period: "week" | "month" | "all") => void;
  onDateChange: (date: string) => void;
  getPeriodLabel: () => string;
  getCurrentWeekStart: () => Date;
  getCurrentMonthStart: () => Date;
  navigateWeek: (direction: "next" | "prev") => void;
  navigateMonth: (direction: "next" | "prev") => void;
  goToCurrentPeriod: () => void;
}

const PeriodSelector: React.FC<PeriodSelectorProps> = ({
  selectedPeriod,
  selectedDate,
  settings,
  onPeriodChange,
  onDateChange,
  getPeriodLabel,
  getCurrentWeekStart,
  getCurrentMonthStart,
  navigateWeek,
  navigateMonth,
  goToCurrentPeriod,
}) => {
  return (
    <div
      className={`p-1.5 rounded-lg border ${
        settings.darkMode
          ? "bg-gray-700/50 border-gray-600"
          : "bg-white/50 border-gray-200/80"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span
          className={`text-xs font-bold tracking-wider uppercase ${
            settings.darkMode ? "text-gray-400" : "text-slate-500"
          }`}
        >
          PERIOD
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => {
              onPeriodChange("week");
              const currentWeekStart = getCurrentWeekStart();
              onDateChange(currentWeekStart.toISOString().split("T")[0]);
            }}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              selectedPeriod === "week"
                ? settings.darkMode
                  ? "bg-gray-600 text-white"
                  : "bg-gray-700 text-white"
                : settings.darkMode
                ? "bg-gray-600 text-gray-300 hover:bg-gray-500"
                : "bg-slate-200 text-slate-600 hover:bg-slate-300"
            }`}
          >
            Week
          </button>
          <button
            onClick={() => {
              onPeriodChange("month");
              const currentMonthStart = getCurrentMonthStart();
              const monthStartString = currentMonthStart
                .toISOString()
                .split("T")[0];
              onDateChange(monthStartString);
            }}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              selectedPeriod === "month"
                ? settings.darkMode
                  ? "bg-gray-600 text-white"
                  : "bg-gray-700 text-white"
                : settings.darkMode
                ? "bg-gray-600 text-gray-300 hover:bg-gray-500"
                : "bg-slate-200 text-slate-600 hover:bg-slate-300"
            }`}
          >
            Month
          </button>
          <button
            onClick={() => onPeriodChange("all")}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              selectedPeriod === "all"
                ? settings.darkMode
                  ? "bg-gray-600 text-white"
                  : "bg-gray-700 text-white"
                : settings.darkMode
                ? "bg-gray-600 text-gray-300 hover:bg-gray-500"
                : "bg-slate-200 text-slate-600 hover:bg-slate-300"
            }`}
          >
            All
          </button>
        </div>
      </div>

      {/* Date Selection */}
      <div className="flex items-center justify-between">
        <span
          className={`text-xs ${
            settings.darkMode ? "text-gray-400" : "text-slate-600"
          }`}
        >
          {getPeriodLabel()}
        </span>
        {selectedPeriod !== "all" && (
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                selectedPeriod === "week"
                  ? navigateWeek("prev")
                  : navigateMonth("prev")
              }
              className={`p-1 rounded transition-colors ${
                settings.darkMode
                  ? "text-gray-400 hover:text-gray-200 hover:bg-gray-600"
                  : "text-slate-600 hover:text-slate-800 hover:bg-slate-100"
              }`}
              title={`Previous ${selectedPeriod}`}
            >
              ←
            </button>
            <button
              onClick={goToCurrentPeriod}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                settings.darkMode
                  ? "bg-gray-600 text-gray-300 hover:bg-gray-500"
                  : "bg-slate-200 text-slate-600 hover:bg-slate-300"
              }`}
              title={`Go to current ${selectedPeriod}`}
            >
              {selectedPeriod === "week" ? "This Week" : "This Month"}
            </button>
            <button
              onClick={() =>
                selectedPeriod === "week"
                  ? navigateWeek("next")
                  : navigateMonth("next")
              }
              className={`p-1 rounded transition-colors ${
                settings.darkMode
                  ? "text-gray-400 hover:text-gray-200 hover:bg-gray-600"
                  : "text-slate-600 hover:text-slate-800 hover:bg-slate-100"
              }`}
              title={`Next ${selectedPeriod}`}
            >
              →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PeriodSelector;
