import React, { useState, useMemo } from "react";
import useLocalStorage from "../hooks/useLocalStorage";
import { DailyWage, Settings } from "../types";
import { formatDurationWithMinutes } from "../hooks/useTimeCalculations";

interface WageHistoryProps {
  wageHistory: DailyWage[];
  setWageHistory: (history: DailyWage[]) => void;
  settings: Settings;
}

const WageHistory: React.FC<WageHistoryProps> = ({
  wageHistory,
  setWageHistory,
  settings,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<
    "week" | "month" | "all"
  >("week");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  // Sort wage history by date (newest first)
  const sortedWageHistory = useMemo(() => {
    return [...wageHistory].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [wageHistory]);

  // Filter wages by selected period
  const filteredWages = useMemo(() => {
    const now = new Date();
    const selectedDateObj = new Date(selectedDate);

    switch (selectedPeriod) {
      case "week":
        const weekStart = new Date(selectedDateObj);
        // Use the week start day from settings
        const weekStartDayMap: Record<string, number> = {
          sunday: 0,
          monday: 1,
          tuesday: 2,
          wednesday: 3,
          thursday: 4,
          friday: 5,
          saturday: 6,
        };
        const weekStartDay = weekStartDayMap[settings.weekStartDay];
        const currentDay = weekStart.getDay();
        const daysToSubtract = currentDay - weekStartDay;
        weekStart.setDate(weekStart.getDate() - daysToSubtract);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6); // 7 days total
        return sortedWageHistory.filter((wage) => {
          const wageDate = new Date(wage.date);
          // Set time to start of day for accurate comparison
          wageDate.setHours(0, 0, 0, 0);
          const weekStartAdjusted = new Date(weekStart);
          weekStartAdjusted.setHours(0, 0, 0, 0);
          const weekEndAdjusted = new Date(weekEnd);
          weekEndAdjusted.setHours(23, 59, 59, 999);
          return wageDate >= weekStartAdjusted && wageDate <= weekEndAdjusted;
        });
      case "month":
        const monthStart = new Date(
          selectedDateObj.getFullYear(),
          selectedDateObj.getMonth(),
          1
        );
        const monthEnd = new Date(
          selectedDateObj.getFullYear(),
          selectedDateObj.getMonth() + 1,
          0
        );
        return sortedWageHistory.filter((wage) => {
          const wageDate = new Date(wage.date);
          // Set time to start of day for accurate comparison
          wageDate.setHours(0, 0, 0, 0);
          const monthStartAdjusted = new Date(monthStart);
          monthStartAdjusted.setHours(0, 0, 0, 0);
          const monthEndAdjusted = new Date(monthEnd);
          monthEndAdjusted.setHours(23, 59, 59, 999);
          return wageDate >= monthStartAdjusted && wageDate <= monthEndAdjusted;
        });
      case "all":
        return sortedWageHistory;
      default:
        return sortedWageHistory;
    }
  }, [sortedWageHistory, selectedPeriod, selectedDate, settings.weekStartDay]);

  // Calculate totals for filtered wages
  const totals = useMemo(() => {
    return filteredWages.reduce(
      (acc, wage) => {
        acc.totalWage += wage.totalWage;
        acc.standardPay += wage.standardPay;
        acc.overtimePay += wage.overtimePay;
        acc.standardHours += wage.standardHours;
        acc.standardMinutes += wage.standardMinutes;
        acc.overtimeHours += wage.overtimeHours;
        acc.overtimeMinutes += wage.overtimeMinutes;
        acc.submissionCount += 1;
        return acc;
      },
      {
        totalWage: 0,
        standardPay: 0,
        overtimePay: 0,
        standardHours: 0,
        standardMinutes: 0,
        overtimeHours: 0,
        overtimeMinutes: 0,
        submissionCount: 0,
      }
    );
  }, [filteredWages]);

  // Group wages by date
  const wagesByDate = useMemo(() => {
    const grouped: Record<string, DailyWage[]> = {};
    filteredWages.forEach((wage) => {
      if (!grouped[wage.date]) {
        grouped[wage.date] = [];
      }
      grouped[wage.date].push(wage);
    });
    return grouped;
  }, [filteredWages]) as Record<string, DailyWage[]>;

  const handleDeleteWage = (wageId: string) => {
    setWageHistory(wageHistory.filter((wage) => wage.id !== wageId));
  };

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case "week":
        const weekStart = new Date(selectedDate);
        // Use the week start day from settings
        const weekStartDayMap: Record<string, number> = {
          sunday: 0,
          monday: 1,
          tuesday: 2,
          wednesday: 3,
          thursday: 4,
          friday: 5,
          saturday: 6,
        };
        const weekStartDay = weekStartDayMap[settings.weekStartDay];
        const currentDay = weekStart.getDay();
        const daysToSubtract = currentDay - weekStartDay;
        weekStart.setDate(weekStart.getDate() - daysToSubtract);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        return `${formatDate(
          weekStart.toISOString().split("T")[0]
        )} - ${formatDate(weekEnd.toISOString().split("T")[0])}`;
      case "month":
        const monthDate = new Date(selectedDate);
        return monthDate.toLocaleDateString("en-GB", {
          month: "long",
          year: "numeric",
        });
      case "all":
        return "All Time";
      default:
        return "";
    }
  };

  return (
    <div className="h-full flex flex-col text-[#003D5B]">
      {/* Header with period selector */}
      <div className="flex-shrink-0 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Wage History</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedPeriod("week")}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                selectedPeriod === "week"
                  ? "bg-[#003D5B] text-white"
                  : "bg-slate-200 text-slate-600 hover:bg-slate-300"
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setSelectedPeriod("month")}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                selectedPeriod === "month"
                  ? "bg-[#003D5B] text-white"
                  : "bg-slate-200 text-slate-600 hover:bg-slate-300"
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setSelectedPeriod("all")}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                selectedPeriod === "all"
                  ? "bg-[#003D5B] text-white"
                  : "bg-slate-200 text-slate-600 hover:bg-slate-300"
              }`}
            >
              All
            </button>
          </div>
        </div>

        {/* Date selector for week/month */}
        {selectedPeriod !== "all" && (
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold tracking-wider uppercase text-slate-500">
              {selectedPeriod === "week" ? "Week Starting" : "Month"}
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="flex-1 p-1.5 text-sm bg-transparent border border-slate-300 rounded-md focus:ring-2 focus:ring-[#003D5B] focus:border-[#003D5B]"
            />
          </div>
        )}

        {/* Period summary */}
        <div className="bg-white/50 p-3 rounded-lg border border-gray-200/80">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-slate-700">
              {getPeriodLabel()}
            </span>
            <span className="text-xs text-slate-500">
              {totals.submissionCount} submission
              {totals.submissionCount !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-600">Total Wage:</span>
              <span className="font-mono font-bold text-slate-800 ml-2">
                {formatCurrency(totals.totalWage)}
              </span>
            </div>
            <div>
              <span className="text-slate-600">Hours:</span>
              <span className="font-mono text-slate-800 ml-2">
                {formatDurationWithMinutes({
                  hours: totals.standardHours + totals.overtimeHours,
                  minutes: totals.standardMinutes + totals.overtimeMinutes,
                  totalMinutes:
                    (totals.standardHours + totals.overtimeHours) * 60 +
                    totals.standardMinutes +
                    totals.overtimeMinutes,
                })}
              </span>
            </div>
          </div>

          {/* Goal Progress */}
          {((selectedPeriod === "week" && settings.weeklyGoal > 0) ||
            (selectedPeriod === "month" && settings.monthlyGoal > 0)) && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-slate-700">
                  Goal Progress
                </span>
                <span className="text-xs text-slate-500">
                  {selectedPeriod === "week" ? "Weekly" : "Monthly"}
                </span>
              </div>
              {(() => {
                const goal =
                  selectedPeriod === "week"
                    ? settings.weeklyGoal
                    : settings.monthlyGoal;
                const progress = (totals.totalWage / goal) * 100;
                const isComplete = totals.totalWage >= goal;

                return (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-600">Target:</span>
                      <span className="font-mono text-xs font-medium text-slate-800">
                        {formatCurrency(goal)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-600">Progress:</span>
                      <span
                        className={`font-mono text-xs font-medium ${
                          isComplete ? "text-green-600" : "text-slate-800"
                        }`}
                      >
                        {formatCurrency(totals.totalWage)} /{" "}
                        {formatCurrency(goal)}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          isComplete ? "bg-green-500" : "bg-[#003D5B]"
                        }`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                    <div className="text-center">
                      <span
                        className={`text-xs font-medium ${
                          isComplete ? "text-green-600" : "text-slate-600"
                        }`}
                      >
                        {isComplete
                          ? "🎉 Goal Achieved!"
                          : `${Math.round(progress)}% Complete`}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Wage list with proper scrolling */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-6">
        {Object.entries(wagesByDate).length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-500">No wages found for this period.</p>
          </div>
        ) : (
          Object.entries(wagesByDate)
            .sort(
              ([dateA], [dateB]) =>
                new Date(dateB).getTime() - new Date(dateA).getTime()
            )
            .map(([date, wages]) => (
              <div
                key={date}
                className="bg-white/50 rounded-lg border border-gray-200/80 overflow-hidden"
              >
                <div className="bg-slate-50 px-3 py-2 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-700">
                      {formatDate(date)}
                    </span>
                    <span className="text-xs text-slate-500">
                      {wages.length} submission{wages.length > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
                <div className="p-3 space-y-2">
                  {wages
                    .sort(
                      (a, b) =>
                        new Date(b.timestamp).getTime() -
                        new Date(a.timestamp).getTime()
                    )
                    .map((wage) => (
                      <div
                        key={wage.id}
                        className="flex justify-between items-center p-2 bg-slate-50 rounded border border-gray-200/50"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-slate-500">
                              {wage.submissionTime}
                            </span>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs text-slate-500 capitalize">
                              {wage.calculationMethod === "timeTracker"
                                ? "Time Tracker"
                                : "Manual Hours"}
                            </span>
                          </div>
                          <div className="text-sm">
                            <span className="text-slate-600">
                              {formatDurationWithMinutes({
                                hours: wage.standardHours + wage.overtimeHours,
                                minutes:
                                  wage.standardMinutes + wage.overtimeMinutes,
                                totalMinutes:
                                  (wage.standardHours + wage.overtimeHours) *
                                    60 +
                                  wage.standardMinutes +
                                  wage.overtimeMinutes,
                              })}
                            </span>
                            {wage.overtimeHours > 0 && (
                              <span className="text-orange-600 ml-2">
                                (+
                                {formatDurationWithMinutes({
                                  hours: wage.overtimeHours,
                                  minutes: wage.overtimeMinutes,
                                  totalMinutes:
                                    wage.overtimeHours * 60 +
                                    wage.overtimeMinutes,
                                })}{" "}
                                OT)
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="font-mono font-bold text-slate-800">
                              {formatCurrency(wage.totalWage)}
                            </span>
                            {wage.afterTaxWage &&
                              wage.afterTaxWage !== wage.totalWage && (
                                <div className="text-xs text-red-600">
                                  {formatCurrency(wage.afterTaxWage)} after tax
                                </div>
                              )}
                          </div>
                          <button
                            onClick={() => handleDeleteWage(wage.id)}
                            className="text-red-500 hover:text-red-700 text-xs"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
};

export default WageHistory;
