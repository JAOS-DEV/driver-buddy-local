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

    // Calculate days to subtract to get to the start of the current week
    let daysToSubtract = currentDay - weekStartDay;
    if (daysToSubtract < 0) {
      daysToSubtract += 7;
    }

    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - daysToSubtract);
    return weekStart.toISOString().split("T")[0];
  });

  // Edit modal state
  const [editingPay, setEditingPay] = useState<DailyPay | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

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

    // Calculate days to subtract to get to the start of the current week
    let daysToSubtract = currentDay - weekStartDay;
    if (daysToSubtract < 0) {
      daysToSubtract += 7;
    }

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

    // Calculate days to subtract to get to the start of the current week
    let daysToSubtract = currentDay - weekStartDay;
    if (daysToSubtract < 0) {
      daysToSubtract += 7;
    }

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
        // Calculate the week start based on the selected date and week start day setting
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

        // Calculate days to subtract to get to the start of the current week
        let daysToSubtract = currentDay - weekStartDay;
        if (daysToSubtract < 0) {
          daysToSubtract += 7;
        }

        const weekStart = new Date(selectedDateObj);
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

        // Calculate tax for existing entries if tax calculations are enabled
        if (settings.enableTaxCalculations) {
          const taxAmount = pay.taxAmount || pay.totalPay * settings.taxRate;
          // Always recalculate after-tax amount when tax calculations are enabled
          const afterTaxPay = pay.totalPay - taxAmount;
          totals.totalTax += taxAmount;
          totals.afterTaxPay += afterTaxPay;
        } else {
          // Use stored values if tax calculations are disabled
          if (pay.taxAmount) {
            totals.totalTax += pay.taxAmount;
          }
          if (pay.afterTaxPay) {
            totals.afterTaxPay += pay.afterTaxPay;
          }
        }

        // Calculate NI for existing entries if NI calculations are enabled
        if (settings.enableNiCalculations) {
          const calculateNI = (earnings: number): number => {
            // For daily pay calculations, we need to adjust the threshold
            // £12,570 / 365 ≈ £34.44 per day threshold
            const dailyNiThreshold = 34.44; // Daily equivalent of annual threshold
            const niRate = 0.12; // 12% for earnings above threshold

            if (earnings <= dailyNiThreshold) return 0;

            const taxableEarnings = earnings - dailyNiThreshold;
            const niAmount = taxableEarnings * niRate;

            return niAmount;
          };

          const niAmount = pay.niAmount || calculateNI(pay.totalPay);
          // Always recalculate after-NI amount when NI calculations are enabled
          const afterNiPay = pay.totalPay - niAmount;
          totals.totalNI += niAmount;
          totals.afterNiPay += afterNiPay;
        } else {
          // Use stored values if NI calculations are disabled
          if (pay.niAmount) {
            totals.totalNI += pay.niAmount;
          }
          if (pay.afterNiPay) {
            totals.afterNiPay += pay.afterNiPay;
          }
        }

        return totals;
      },
      {
        totalPay: 0,
        totalHours: 0,
        totalMinutes: 0,
        totalTax: 0,
        afterTaxPay: 0,
        totalNI: 0,
        afterNiPay: 0,
      }
    );
  }, [
    filteredPays,
    settings.enableTaxCalculations,
    settings.taxRate,
    settings.enableNiCalculations,
  ]);

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

  const handleEditPay = (pay: DailyPay) => {
    setEditingPay(pay);
    setShowEditModal(true);
  };

  const handleSaveEdit = (updatedPay: DailyPay) => {
    setPayHistory(
      payHistory.map((pay) => (pay.id === updatedPay.id ? updatedPay : pay))
    );
    setShowEditModal(false);
    setEditingPay(null);
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingPay(null);
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

        // Calculate days to subtract to get to the start of the current week
        let daysToSubtract = currentDay - weekStartDay;
        if (daysToSubtract < 0) {
          daysToSubtract += 7;
        }

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

  // Edit Modal Component
  const EditPayModal = () => {
    if (!editingPay) return null;

    const [formData, setFormData] = useState({
      date: editingPay.date,
      standardHours: editingPay.standardHours,
      standardMinutes: editingPay.standardMinutes,
      standardRate: editingPay.standardRate,
      overtimeHours: editingPay.overtimeHours,
      overtimeMinutes: editingPay.overtimeMinutes,
      overtimeRate: editingPay.overtimeRate,
      notes: editingPay.notes || "",
    });

    const handleInputChange = (field: string, value: string | number) => {
      // For number fields, allow empty string but convert to 0 for calculations
      if (
        typeof value === "string" &&
        (field.includes("Hours") ||
          field.includes("Minutes") ||
          field.includes("Rate"))
      ) {
        const numValue = value === "" ? 0 : parseFloat(value) || 0;
        setFormData((prev) => ({
          ...prev,
          [field]: value === "" ? "" : numValue,
        }));
      } else {
        setFormData((prev) => ({ ...prev, [field]: value }));
      }
    };

    const handleSave = () => {
      // Calculate totals - handle empty strings by converting to 0
      const standardHours =
        typeof formData.standardHours === "string"
          ? 0
          : formData.standardHours || 0;
      const standardMinutes =
        typeof formData.standardMinutes === "string"
          ? 0
          : formData.standardMinutes || 0;
      const standardRate =
        typeof formData.standardRate === "string"
          ? 0
          : formData.standardRate || 0;
      const overtimeHours =
        typeof formData.overtimeHours === "string"
          ? 0
          : formData.overtimeHours || 0;
      const overtimeMinutes =
        typeof formData.overtimeMinutes === "string"
          ? 0
          : formData.overtimeMinutes || 0;
      const overtimeRate =
        typeof formData.overtimeRate === "string"
          ? 0
          : formData.overtimeRate || 0;

      const standardTotalMinutes = standardHours * 60 + standardMinutes;
      const overtimeTotalMinutes = overtimeHours * 60 + overtimeMinutes;

      const standardPay = (standardTotalMinutes / 60) * standardRate;
      const overtimePay = (overtimeTotalMinutes / 60) * overtimeRate;
      const totalPay = standardPay + overtimePay;

      // Calculate tax and NI if enabled
      const taxAmount = settings.enableTaxCalculations
        ? totalPay * settings.taxRate
        : 0;
      const afterTaxPay = totalPay - taxAmount;

      const calculateNI = (earnings: number): number => {
        const dailyNiThreshold = 34.44;
        const niRate = 0.12;
        if (earnings <= dailyNiThreshold) return 0;
        const taxableEarnings = earnings - dailyNiThreshold;
        return taxableEarnings * niRate;
      };

      const niAmount = settings.enableNiCalculations
        ? calculateNI(totalPay)
        : 0;
      const afterNiPay = totalPay - niAmount;

      const updatedPay: DailyPay = {
        ...editingPay,
        date: formData.date,
        standardHours,
        standardMinutes,
        standardRate,
        standardPay,
        overtimeHours,
        overtimeMinutes,
        overtimeRate,
        overtimePay,
        totalPay,
        taxAmount,
        afterTaxPay,
        niAmount,
        afterNiPay,
        notes: formData.notes,
      };

      handleSaveEdit(updatedPay);
    };

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2">
        <div className="bg-white rounded-lg w-full max-w-sm mx-auto max-h-[80vh] overflow-y-auto">
          <div className="p-3 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">
                Edit Pay Entry
              </h3>
              <button
                onClick={handleCancelEdit}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="p-3 space-y-3">
            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange("date", e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#003D5B] focus:border-[#003D5B] text-xs min-w-0 max-w-full"
              />
            </div>

            {/* Standard Hours */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Standard Hours
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  max="24"
                  value={formData.standardHours}
                  onChange={(e) =>
                    handleInputChange("standardHours", e.target.value)
                  }
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#003D5B] focus:border-[#003D5B]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Minutes
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  max="59"
                  value={formData.standardMinutes}
                  onChange={(e) =>
                    handleInputChange("standardMinutes", e.target.value)
                  }
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#003D5B] focus:border-[#003D5B]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Rate (£)
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  step="0.01"
                  min="0"
                  value={formData.standardRate}
                  onChange={(e) =>
                    handleInputChange("standardRate", e.target.value)
                  }
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#003D5B] focus:border-[#003D5B]"
                />
              </div>
            </div>

            {/* Overtime Hours */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Overtime Hours
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  max="24"
                  value={formData.overtimeHours}
                  onChange={(e) =>
                    handleInputChange("overtimeHours", e.target.value)
                  }
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#003D5B] focus:border-[#003D5B]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Minutes
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  max="59"
                  value={formData.overtimeMinutes}
                  onChange={(e) =>
                    handleInputChange("overtimeMinutes", e.target.value)
                  }
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#003D5B] focus:border-[#003D5B]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Rate (£)
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  step="0.01"
                  min="0"
                  value={formData.overtimeRate}
                  onChange={(e) =>
                    handleInputChange("overtimeRate", e.target.value)
                  }
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#003D5B] focus:border-[#003D5B]"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                rows={3}
                className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#003D5B] focus:border-[#003D5B]"
                placeholder="Add any notes about this pay entry..."
              />
            </div>

            {/* Preview */}
            <div className="bg-slate-50 p-3 rounded-md">
              <h4 className="text-sm font-medium text-slate-700 mb-2">
                Preview
              </h4>
              <div className="text-sm text-slate-600 space-y-1">
                <div>
                  Standard: {formData.standardHours || 0}h{" "}
                  {formData.standardMinutes || 0}m @ £
                  {formData.standardRate || 0} = £
                  {(
                    ((formData.standardHours || 0) +
                      (formData.standardMinutes || 0) / 60) *
                    (formData.standardRate || 0)
                  ).toFixed(2)}
                </div>
                {(formData.overtimeHours || 0) > 0 ||
                (formData.overtimeMinutes || 0) > 0 ? (
                  <div>
                    Overtime: {formData.overtimeHours || 0}h{" "}
                    {formData.overtimeMinutes || 0}m @ £
                    {formData.overtimeRate || 0} = £
                    {(
                      ((formData.overtimeHours || 0) +
                        (formData.overtimeMinutes || 0) / 60) *
                      (formData.overtimeRate || 0)
                    ).toFixed(2)}
                  </div>
                ) : null}
                <div className="font-medium">
                  Total: £
                  {(
                    ((formData.standardHours || 0) +
                      (formData.standardMinutes || 0) / 60) *
                      (formData.standardRate || 0) +
                    ((formData.overtimeHours || 0) +
                      (formData.overtimeMinutes || 0) / 60) *
                      (formData.overtimeRate || 0)
                  ).toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 border-t border-gray-200 flex gap-2">
            <button
              onClick={handleCancelEdit}
              className="flex-1 py-2 px-4 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-2 px-4 bg-[#003D5B] text-white rounded-md hover:bg-[#002D4B] transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className="h-full flex flex-col text-[#003D5B] overflow-hidden"
    >
      {/* Edit Modal */}
      {showEditModal && <EditPayModal />}
      {/* Header */}
      <div ref={headerRef} className="flex-shrink-0 p-3 space-y-2">
        {/* Period Selection */}
        <div className="bg-white/50 p-1.5 rounded-lg border border-gray-200/80">
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
        <div className="bg-white/50 p-1.5 rounded-lg border border-gray-200/80">
          <div className="grid grid-cols-2 gap-1.5 text-xs">
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
            {/* Show individual breakdowns when only one is enabled */}
            {periodTotals.totalTax > 0 && periodTotals.totalNI === 0 && (
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
            {periodTotals.totalNI > 0 && periodTotals.totalTax === 0 && (
              <>
                <div>
                  <span className="text-slate-500">Total NI:</span>
                  <div className="font-bold text-orange-600">
                    {formatCurrency(periodTotals.totalNI)}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">After NI:</span>
                  <div className="font-bold text-green-600">
                    {formatCurrency(periodTotals.afterNiPay)}
                  </div>
                </div>
              </>
            )}
            {/* Show simplified breakdown when both are enabled */}
            {periodTotals.totalTax > 0 && periodTotals.totalNI > 0 && (
              <>
                <div>
                  <span className="text-slate-500">Total Tax:</span>
                  <div className="font-bold text-red-600">
                    {formatCurrency(periodTotals.totalTax)}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Total NI:</span>
                  <div className="font-bold text-orange-600">
                    {formatCurrency(periodTotals.totalNI)}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Final Total:</span>
                  <div className="font-bold text-green-600">
                    {formatCurrency(
                      periodTotals.totalPay -
                        periodTotals.totalTax -
                        periodTotals.totalNI
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Pay Goals Progress Bars */}
          {selectedPeriod === "week" && settings.weeklyGoal > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <PayGoalProgressBar
                current={periodTotals.totalPay}
                goal={settings.weeklyGoal}
                label="Weekly Goal"
              />
            </div>
          )}
          {selectedPeriod === "month" && settings.monthlyGoal > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <PayGoalProgressBar
                current={periodTotals.totalPay}
                goal={settings.monthlyGoal}
                label="Monthly Goal"
              />
            </div>
          )}
        </div>
      </div>

      {/* Pay List */}
      <div className="flex-1 px-3 overflow-hidden">
        <div
          className="overflow-y-auto h-full"
          style={{ height: `${payListHeight}px` }}
        >
          {Object.keys(paysByDate).length === 0 ? (
            <div className="text-center py-6">
              <p className="text-slate-500">
                No pay history found for this period.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {Object.entries(paysByDate)
                .sort(
                  ([dateA], [dateB]) =>
                    new Date(dateB).getTime() - new Date(dateA).getTime()
                )
                .map(([date, pays]: [string, DailyPay[]]) => (
                  <div
                    key={date}
                    className="bg-white/50 p-2 rounded-lg border border-gray-200/80"
                  >
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="font-medium text-slate-700">
                        {formatDate(date)}
                      </span>
                      <span className="text-xs text-slate-500">
                        {pays.length} submission{pays.length > 1 ? "s" : ""}
                      </span>
                    </div>

                    <div className="space-y-1.5">
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
                                  onClick={() => handleEditPay(pay)}
                                  className="text-slate-500 hover:text-slate-700"
                                  title="Edit pay entry"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => handleDeletePay(pay.id)}
                                  className="text-red-500 hover:text-red-700"
                                  title="Delete pay entry"
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

                            {/* Show individual breakdowns when only one is enabled */}
                            {settings.enableTaxCalculations &&
                              !settings.enableNiCalculations &&
                              (() => {
                                const taxAmount =
                                  pay.taxAmount ||
                                  pay.totalPay * settings.taxRate;
                                const afterTaxPay = pay.totalPay - taxAmount;
                                return taxAmount > 0 ? (
                                  <div className="mt-1 text-xs text-red-600">
                                    Tax: -{formatCurrency(taxAmount)} | After
                                    Tax: {formatCurrency(afterTaxPay)}
                                  </div>
                                ) : null;
                              })()}
                            {settings.enableNiCalculations &&
                              !settings.enableTaxCalculations &&
                              (() => {
                                const calculateNI = (
                                  earnings: number
                                ): number => {
                                  const dailyNiThreshold = 34.44;
                                  const niRate = 0.12;
                                  if (earnings <= dailyNiThreshold) return 0;
                                  const taxableEarnings =
                                    earnings - dailyNiThreshold;
                                  const niAmount = taxableEarnings * niRate;
                                  return niAmount;
                                };
                                const niAmount =
                                  pay.niAmount || calculateNI(pay.totalPay);
                                const afterNiPay = pay.totalPay - niAmount;
                                return niAmount > 0 ? (
                                  <div className="mt-1 text-xs text-orange-600">
                                    NI: -{formatCurrency(niAmount)} | After NI:{" "}
                                    {formatCurrency(afterNiPay)}
                                  </div>
                                ) : null;
                              })()}
                            {/* Show simplified breakdown when both are enabled */}
                            {settings.enableTaxCalculations &&
                              settings.enableNiCalculations &&
                              (() => {
                                const taxAmount =
                                  pay.taxAmount ||
                                  pay.totalPay * settings.taxRate;
                                const calculateNI = (
                                  earnings: number
                                ): number => {
                                  const dailyNiThreshold = 34.44;
                                  const niRate = 0.12;
                                  if (earnings <= dailyNiThreshold) return 0;
                                  const taxableEarnings =
                                    earnings - dailyNiThreshold;
                                  return taxableEarnings * niRate;
                                };
                                const niAmount =
                                  pay.niAmount || calculateNI(pay.totalPay);
                                const finalTotal =
                                  pay.totalPay - taxAmount - niAmount;
                                return taxAmount > 0 && niAmount > 0 ? (
                                  <>
                                    <div className="mt-1 text-xs text-red-600">
                                      Tax: -{formatCurrency(taxAmount)}
                                    </div>
                                    <div className="mt-1 text-xs text-orange-600">
                                      NI: -{formatCurrency(niAmount)}
                                    </div>
                                    <div className="mt-1 text-xs text-green-600">
                                      Final Total: {formatCurrency(finalTotal)}
                                    </div>
                                  </>
                                ) : null;
                              })()}

                            {/* Show notes if they exist */}
                            {pay.notes && pay.notes.trim() !== "" && (
                              <div className="mt-1 text-xs text-slate-500 italic">
                                💬 {pay.notes}
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
