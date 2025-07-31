import React, { useState, useMemo, useEffect, useRef } from "react";
import useLocalStorage from "../hooks/useLocalStorage";
import { DailyPay, Settings } from "../types";
import { formatDurationWithMinutes } from "../hooks/useTimeCalculations";

interface PayHistoryProps {
  payHistory: DailyPay[];
  setPayHistory: (history: DailyPay[]) => void;
  settings: Settings;
}

const PayHistory: React.FC<PayHistoryProps> = ({
  payHistory,
  setPayHistory,
  settings,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<
    "week" | "month" | "all"
  >("week");
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // Initialize to current week start based on settings
    const today = new Date();
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
    const currentDay = today.getDay();
    const daysToSubtract = currentDay - weekStartDay;
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - daysToSubtract);
    return weekStart.toISOString().split("T")[0];
  });

  // Get the current week start date based on settings
  const getCurrentWeekStart = () => {
    const today = new Date();
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
    const currentDay = today.getDay();
    const daysToSubtract = currentDay - weekStartDay;
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - daysToSubtract);
    return weekStart;
  };

  // Get the current month start date
  const getCurrentMonthStart = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1; // Convert to 1-indexed
    const monthStartString = `${year}-${month.toString().padStart(2, "0")}-01`;

    // Return a Date object for compatibility with existing code
    return new Date(monthStartString);
  };

  // Navigate to current period
  const goToCurrentPeriod = () => {
    if (selectedPeriod === "week") {
      const currentWeekStart = getCurrentWeekStart();
      setSelectedDate(currentWeekStart.toISOString().split("T")[0]);
    } else if (selectedPeriod === "month") {
      const currentMonthStart = getCurrentMonthStart();
      setSelectedDate(currentMonthStart.toISOString().split("T")[0]);
    }
  };

  // Navigate to next/previous week
  const navigateWeek = (direction: "next" | "prev") => {
    const selectedDateObj = new Date(selectedDate);
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
    const currentDay = selectedDateObj.getDay();
    const daysToSubtract = currentDay - weekStartDay;
    const currentWeekStart = new Date(selectedDateObj);
    currentWeekStart.setDate(currentWeekStart.getDate() - daysToSubtract);

    const newWeekStart = new Date(currentWeekStart);

    if (direction === "next") {
      newWeekStart.setDate(newWeekStart.getDate() + 7);
    } else {
      newWeekStart.setDate(newWeekStart.getDate() - 7);
    }

    setSelectedDate(newWeekStart.toISOString().split("T")[0]);
  };

  // Navigate to next/previous month
  const navigateMonth = (direction: "next" | "prev") => {
    // Parse the selectedDate string to get year and month
    const [yearStr, monthStr, dayStr] = selectedDate.split("-");
    const currentYear = parseInt(yearStr);
    const currentMonth = parseInt(monthStr); // Keep as 1-indexed for easier logic

    let newMonth: number;
    let newYear: number;

    if (direction === "next") {
      // Go to next month
      if (currentMonth === 12) {
        // December to January
        newMonth = 1;
        newYear = currentYear + 1;
      } else {
        newMonth = currentMonth + 1;
        newYear = currentYear;
      }
    } else {
      // Go to previous month
      if (currentMonth === 1) {
        // January to December
        newMonth = 12;
        newYear = currentYear - 1;
      } else {
        newMonth = currentMonth - 1;
        newYear = currentYear;
      }
    }

    // Format the new date string directly (avoiding Date object timezone issues)
    const newMonthString = `${newYear}-${newMonth
      .toString()
      .padStart(2, "0")}-01`;

    setSelectedDate(newMonthString);
  };
  const [payListHeight, setPayListHeight] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  // Calculate dynamic height for pay list
  useEffect(() => {
    const calculatePayListHeight = () => {
      if (containerRef.current && headerRef.current) {
        const containerHeight = containerRef.current.offsetHeight;
        const headerHeight = headerRef.current.offsetHeight;
        const availableHeight = containerHeight - headerHeight - 32; // 32px for padding
        setPayListHeight(Math.max(availableHeight, 200)); // Minimum 200px height
      }
    };

    calculatePayListHeight();
    window.addEventListener("resize", calculatePayListHeight);
    return () => window.removeEventListener("resize", calculatePayListHeight);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(amount);
  };

  // Pay Goal Progress Bar Component
  const PayGoalProgressBar: React.FC<{
    current: number;
    goal: number;
    label: string;
  }> = ({ current, goal, label }) => {
    const percentage = Math.min((current / goal) * 100, 100);
    const isOver = current > goal;

    return (
      <div>
        <div className="flex justify-between mb-1">
          <span className="text-xs font-medium text-slate-700">{label}</span>
          <span
            className={`text-xs font-medium ${
              isOver ? "text-green-600" : "text-slate-500"
            }`}
          >
            {formatCurrency(current)} / {formatCurrency(goal)}
          </span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${
              isOver ? "bg-green-500" : "bg-[#003D5B]"
            }`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        {isOver && (
          <p className="text-green-600 text-xs mt-1">Goal achieved! 🎉</p>
        )}
      </div>
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  // Sort pay history by date (newest first)
  const sortedPayHistory = useMemo(() => {
    return [...payHistory].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [payHistory]);

  // Filter pays by selected period
  const filteredPays = useMemo(() => {
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
        return sortedPayHistory.filter((pay) => {
          const payDate = new Date(pay.date);
          // Set time to start of day for accurate comparison
          payDate.setHours(0, 0, 0, 0);
          const weekStartAdjusted = new Date(weekStart);
          weekStartAdjusted.setHours(0, 0, 0, 0);
          const weekEndAdjusted = new Date(weekEnd);
          weekEndAdjusted.setHours(23, 59, 59, 999);
          return payDate >= weekStartAdjusted && payDate <= weekEndAdjusted;
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

        return sortedPayHistory.filter((pay) => {
          const payDate = new Date(pay.date);
          payDate.setHours(0, 0, 0, 0);
          const monthStartAdjusted = new Date(monthStart);
          monthStartAdjusted.setHours(0, 0, 0, 0);
          const monthEndAdjusted = new Date(monthEnd);
          monthEndAdjusted.setHours(23, 59, 59, 999);
          return payDate >= monthStartAdjusted && payDate <= monthEndAdjusted;
        });

      case "all":
        return sortedPayHistory;

      default:
        return sortedPayHistory;
    }
  }, [sortedPayHistory, selectedPeriod, selectedDate, settings.weekStartDay]);

  // Calculate totals for the filtered period
  const periodTotals = useMemo(() => {
    return filteredPays.reduce(
      (totals, pay) => {
        totals.totalPay += pay.totalPay;
        totals.totalHours += pay.standardHours + pay.overtimeHours;
        totals.totalMinutes += pay.standardMinutes + pay.overtimeMinutes;
        if (pay.taxAmount) {
          totals.totalTax += pay.taxAmount;
        }
        if (pay.afterTaxPay) {
          totals.afterTaxPay += pay.afterTaxPay;
        }
        return totals;
      },
      {
        totalPay: 0,
        totalHours: 0,
        totalMinutes: 0,
        totalTax: 0,
        afterTaxPay: 0,
      }
    );
  }, [filteredPays]);

  // Group pays by date
  const paysByDate = useMemo(() => {
    return filteredPays.reduce((groups, pay) => {
      const date = pay.date;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(pay);
      return groups;
    }, {} as Record<string, DailyPay[]>);
  }, [filteredPays]);

  const handleDeletePay = (payId: string) => {
    setPayHistory(payHistory.filter((pay) => pay.id !== payId));
  };

  const getPeriodLabel = () => {
    const date = new Date(selectedDate);
    switch (selectedPeriod) {
      case "week":
        const weekStart = new Date(date);
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
        const weekStartDayName = weekStart.toLocaleDateString("en-GB", {
          weekday: "short",
        });
        return `${weekStartDayName} ${weekStart.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
        })} - ${weekEnd.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
        })}`;
      case "month":
        // For month view, always show the month name based on the selectedDate
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

  const exportToCSV = () => {
    const csvContent = [
      [
        "Date",
        "Standard Hours",
        "Standard Pay",
        "Overtime Hours",
        "Overtime Pay",
        "Total Pay",
        "Tax",
        "After Tax Pay",
      ],
      ...filteredPays.map((pay) => [
        pay.date,
        `${pay.standardHours}:${pay.standardMinutes
          .toString()
          .padStart(2, "0")}`,
        formatCurrency(pay.standardPay),
        `${pay.overtimeHours}:${pay.overtimeMinutes
          .toString()
          .padStart(2, "0")}`,
        formatCurrency(pay.overtimePay),
        formatCurrency(pay.totalPay),
        pay.taxAmount ? formatCurrency(pay.taxAmount) : "N/A",
        pay.afterTaxPay ? formatCurrency(pay.afterTaxPay) : "N/A",
      ]),
    ];

    const csvString = csvContent.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvString], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pay-history-${selectedPeriod}-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const clearPayHistory = () => {
    if (
      window.confirm(
        "Are you sure you want to clear all pay history? This action cannot be undone."
      )
    ) {
      setPayHistory([]);
    }
  };

  return (
    <div
      ref={containerRef}
      className="h-full flex flex-col text-[#003D5B] overflow-hidden"
    >
      {/* Header */}
      <div ref={headerRef} className="flex-shrink-0 p-4 space-y-3">
        {/* Period Selection */}
        <div className="bg-white/50 p-2 rounded-lg border border-gray-200/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold tracking-wider uppercase text-slate-500">
              PERIOD
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => {
                  setSelectedPeriod("week");
                  const currentWeekStart = getCurrentWeekStart();
                  setSelectedDate(currentWeekStart.toISOString().split("T")[0]);
                }}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  selectedPeriod === "week"
                    ? "bg-[#003D5B] text-white"
                    : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                }`}
              >
                Week
              </button>
              <button
                onClick={() => {
                  setSelectedPeriod("month");
                  const currentMonthStart = getCurrentMonthStart();
                  const monthStartString = currentMonthStart
                    .toISOString()
                    .split("T")[0];

                  setSelectedDate(monthStartString);
                }}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  selectedPeriod === "month"
                    ? "bg-[#003D5B] text-white"
                    : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setSelectedPeriod("all")}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  selectedPeriod === "all"
                    ? "bg-[#003D5B] text-white"
                    : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                }`}
              >
                All
              </button>
            </div>
          </div>

          {/* Date Selection */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600">{getPeriodLabel()}</span>
            {selectedPeriod !== "all" && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    selectedPeriod === "week"
                      ? navigateWeek("prev")
                      : navigateMonth("prev")
                  }
                  className="p-1 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                  title={`Previous ${selectedPeriod}`}
                >
                  ←
                </button>
                <button
                  onClick={goToCurrentPeriod}
                  className="px-2 py-1 text-xs bg-slate-200 text-slate-600 hover:bg-slate-300 rounded transition-colors"
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
                  className="p-1 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                  title={`Next ${selectedPeriod}`}
                >
                  →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white/50 p-2 rounded-lg border border-gray-200/80">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-500">Total Pay:</span>
              <div className="font-bold text-[#003D5B]">
                {formatCurrency(periodTotals.totalPay)}
              </div>
            </div>
            <div>
              <span className="text-slate-500">Total Hours:</span>
              <div className="font-bold text-[#003D5B]">
                {Math.floor(
                  periodTotals.totalHours + periodTotals.totalMinutes / 60
                )}
                h {periodTotals.totalMinutes % 60}m
              </div>
            </div>
            {periodTotals.totalTax > 0 && (
              <>
                <div>
                  <span className="text-slate-500">Total Tax:</span>
                  <div className="font-bold text-red-600">
                    {formatCurrency(periodTotals.totalTax)}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">After Tax:</span>
                  <div className="font-bold text-green-600">
                    {formatCurrency(periodTotals.afterTaxPay)}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Pay Goals Progress Bars */}
          {selectedPeriod === "week" && settings.weeklyGoal > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <PayGoalProgressBar
                current={periodTotals.totalPay}
                goal={settings.weeklyGoal}
                label="Weekly Goal"
              />
            </div>
          )}
          {selectedPeriod === "month" && settings.monthlyGoal > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <PayGoalProgressBar
                current={periodTotals.totalPay}
                goal={settings.monthlyGoal}
                label="Monthly Goal"
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={exportToCSV}
            className="flex-1 bg-slate-100 text-slate-700 py-2 px-3 rounded-md hover:bg-slate-200 transition-colors text-xs font-medium"
          >
            Export CSV
          </button>
          <button
            onClick={clearPayHistory}
            className="flex-1 bg-red-100 text-red-700 py-2 px-3 rounded-md hover:bg-red-200 transition-colors text-xs font-medium"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Pay List */}
      <div className="flex-1 px-4 overflow-hidden">
        <div
          className="overflow-y-auto h-full"
          style={{ height: `${payListHeight}px` }}
        >
          {Object.keys(paysByDate).length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500">
                No pay history found for this period.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {Object.entries(paysByDate)
                .sort(
                  ([dateA], [dateB]) =>
                    new Date(dateB).getTime() - new Date(dateA).getTime()
                )
                .map(([date, pays]: [string, DailyPay[]]) => (
                  <div
                    key={date}
                    className="bg-white/50 p-3 rounded-lg border border-gray-200/80"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-slate-700">
                        {formatDate(date)}
                      </span>
                      <span className="text-xs text-slate-500">
                        {pays.length} submission{pays.length > 1 ? "s" : ""}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {pays
                        .sort(
                          (a, b) =>
                            new Date(b.timestamp).getTime() -
                            new Date(a.timestamp).getTime()
                        )
                        .map((pay) => (
                          <div
                            key={pay.id}
                            className="border-l-2 border-slate-200 pl-3"
                          >
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs text-slate-500">
                                {pay.submissionTime}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm text-slate-600">
                                  {formatCurrency(pay.totalPay)}
                                </span>
                                <button
                                  onClick={() => handleDeletePay(pay.id)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>

                            <div
                              className={`text-xs text-slate-600 ${
                                pay.overtimeHours > 0 || pay.overtimeMinutes > 0
                                  ? "grid grid-cols-2 gap-2"
                                  : ""
                              }`}
                            >
                              <div>
                                <span>Standard:</span>
                                <div className="font-mono">
                                  {pay.standardHours}:
                                  {pay.standardMinutes
                                    .toString()
                                    .padStart(2, "0")}{" "}
                                  @ {formatCurrency(pay.standardRate)}
                                </div>
                                <div className="font-mono">
                                  {formatCurrency(pay.standardPay)}
                                </div>
                              </div>
                              {pay.overtimeHours > 0 ||
                              pay.overtimeMinutes > 0 ? (
                                <div>
                                  <span>Overtime:</span>
                                  <div className="font-mono">
                                    {pay.overtimeHours}:
                                    {pay.overtimeMinutes
                                      .toString()
                                      .padStart(2, "0")}{" "}
                                    @ {formatCurrency(pay.overtimeRate)}
                                  </div>
                                  <div className="font-mono text-orange-600">
                                    {formatCurrency(pay.overtimePay)}
                                  </div>
                                </div>
                              ) : null}
                            </div>

                            {settings.enableTaxCalculations &&
                              pay.taxAmount &&
                              pay.taxAmount > 0 && (
                                <div className="mt-1 text-xs text-red-600">
                                  Tax: -{formatCurrency(pay.taxAmount)} | After
                                  Tax: {formatCurrency(pay.afterTaxPay || 0)}
                                </div>
                              )}
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PayHistory;
