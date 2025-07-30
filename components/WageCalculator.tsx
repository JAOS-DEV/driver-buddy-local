import React, { useState, useEffect, useRef } from "react";
import useLocalStorage from "../hooks/useLocalStorage";
import {
  decimalHoursToDuration,
  formatDurationWithMinutes,
} from "../hooks/useTimeCalculations";
import { DailyWage, Settings } from "../types";

interface WageCalculatorProps {
  totalMinutes: number;
  hourlyRate: number;
  setHourlyRate: (rate: number) => void;
  settings: Settings;
}

const WageCalculator: React.FC<WageCalculatorProps> = ({
  totalMinutes,
  hourlyRate,
  setHourlyRate,
  settings,
}) => {
  const [useManualHours, setUseManualHours] = useLocalStorage<boolean>(
    "useManualHours",
    false
  );
  const [manualHours, setManualHours] = useLocalStorage<number>(
    "manualHours",
    0
  );
  const [manualMinutes, setManualMinutes] = useLocalStorage<number>(
    "manualMinutes",
    0
  );
  const [overtimeHours, setOvertimeHours] = useLocalStorage<number>(
    "overtimeHours",
    0
  );
  const [overtimeMinutes, setOvertimeMinutes] = useLocalStorage<number>(
    "overtimeMinutes",
    0
  );
  const [overtimeRate, setOvertimeRate] = useLocalStorage<number>(
    "overtimeRate",
    0
  );
  const [breakdownHeight, setBreakdownHeight] = useState(200); // Default fallback
  const [wageHistory, setWageHistory] = useLocalStorage<DailyWage[]>(
    "wageHistory",
    []
  );
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [wageDate, setWageDate] = useLocalStorage<string>(
    "wageDate",
    new Date().toISOString().split("T")[0]
  );
  const [showDateInput, setShowDateInput] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputSectionRef = useRef<HTMLDivElement>(null);
  const totalSectionRef = useRef<HTMLDivElement>(null);

  // Apply default rates from settings
  useEffect(() => {
    if (settings.defaultHourlyRate > 0 && hourlyRate === 0) {
      setHourlyRate(settings.defaultHourlyRate);
    }
    if (settings.defaultOvertimeRate > 0 && overtimeRate === 0) {
      setOvertimeRate(settings.defaultOvertimeRate);
    }
  }, [
    settings.defaultHourlyRate,
    settings.defaultOvertimeRate,
    hourlyRate,
    overtimeRate,
    setHourlyRate,
  ]);

  const duration = useManualHours
    ? {
        hours: manualHours,
        minutes: manualMinutes,
        totalMinutes: manualHours * 60 + manualMinutes,
      }
    : decimalHoursToDuration(totalMinutes / 60);

  const overtimeDuration = {
    hours: overtimeHours,
    minutes: overtimeMinutes,
    totalMinutes: overtimeHours * 60 + overtimeMinutes,
  };

  // Calculate earnings breakdown
  const standardEarnings = (duration.totalMinutes / 60) * hourlyRate;
  const overtimeEarnings =
    (overtimeDuration.totalMinutes / 60) * (overtimeRate || hourlyRate);
  const totalEarnings = standardEarnings + overtimeEarnings;

  // Calculate tax if enabled
  const taxAmount = settings.enableTaxCalculations
    ? totalEarnings * settings.taxRate
    : 0;
  const afterTaxEarnings = totalEarnings - taxAmount;

  // Get current time for submission timestamp
  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Save today's wage
  const handleSaveWage = () => {
    if (totalEarnings <= 0) return;

    const dailyWage: DailyWage = {
      id: `${wageDate}-${Date.now()}`, // Unique ID combining date and timestamp
      date: wageDate,
      timestamp: new Date().toISOString(),
      submissionTime: getCurrentTime(),
      standardHours: duration.hours,
      standardMinutes: duration.minutes,
      standardRate: hourlyRate,
      standardPay: standardEarnings,
      overtimeHours: overtimeDuration.hours,
      overtimeMinutes: overtimeDuration.minutes,
      overtimeRate: overtimeRate || hourlyRate,
      overtimePay: overtimeEarnings,
      totalWage: totalEarnings,
      calculationMethod: useManualHours ? "manualHours" : "timeTracker",
      // Include tax information if tax calculations are enabled
      ...(settings.enableTaxCalculations && {
        taxAmount,
        afterTaxWage: afterTaxEarnings,
        taxRate: settings.taxRate,
      }),
    };

    setWageHistory((prev) => [...prev, dailyWage]);

    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 3000);
  };

  // Count submissions for the selected date
  const submissionsForDate = wageHistory.filter(
    (wage) => wage.date === wageDate
  );
  const submissionCount = submissionsForDate.length;

  // Calculate available space for breakdown
  useEffect(() => {
    const calculateBreakdownHeight = () => {
      if (
        containerRef.current &&
        inputSectionRef.current &&
        totalSectionRef.current
      ) {
        // Get the actual viewport height
        const viewportHeight = window.innerHeight;

        // Get the container's position and height
        const containerRect = containerRef.current.getBoundingClientRect();
        const containerTop = containerRect.top;

        // Calculate the available height from container top to viewport bottom
        const availableViewportHeight = viewportHeight - containerTop;

        // Get the heights of fixed elements
        const inputSectionHeight = inputSectionRef.current.offsetHeight;
        const totalSectionHeight = totalSectionRef.current.offsetHeight;

        // Account for navigation bar height (64px) and some padding
        const navBarHeight = 64;
        const padding = 16;

        // Calculate available space for breakdown
        const availableHeight =
          availableViewportHeight -
          inputSectionHeight -
          totalSectionHeight -
          navBarHeight -
          padding;

        // Ensure minimum height and set the height
        const finalHeight = Math.max(availableHeight, 100);
        setBreakdownHeight(finalHeight);
      }
    };

    // Use setTimeout to ensure DOM is fully rendered
    const timeoutId = setTimeout(calculateBreakdownHeight, 100);

    // Recalculate on window resize
    window.addEventListener("resize", calculateBreakdownHeight);

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", calculateBreakdownHeight);
    };
  }, [useManualHours, overtimeDuration.totalMinutes]); // Recalculate when relevant values change

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(amount);
  };

  return (
    <div
      ref={containerRef}
      className="h-full flex flex-col text-[#003D5B] overflow-hidden relative"
    >
      {/* Save Success Toast */}
      {showSaveSuccess && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
            <span className="text-sm font-medium">
              ✅ Wage saved for today!
            </span>
          </div>
        </div>
      )}

      <div ref={inputSectionRef} className="flex-shrink-0 space-y-2">
        {/* Toggle Section */}
        <div className="bg-white/50 p-2 rounded-lg border border-gray-200/80">
          <label className="text-xs font-bold tracking-wider uppercase text-slate-500 block mb-2">
            CALCULATION METHOD
          </label>
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-medium ${
                !useManualHours ? "text-[#003D5B]" : "text-slate-500"
              }`}
            >
              Time Tracker
            </span>
            <button
              onClick={() => setUseManualHours(!useManualHours)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                useManualHours ? "bg-[#003D5B]" : "bg-slate-300"
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                  useManualHours ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
            <span
              className={`text-xs font-medium ${
                useManualHours ? "text-[#003D5B]" : "text-slate-500"
              }`}
            >
              Manual Hours
            </span>
          </div>
        </div>

        {/* Input Fields Grid */}
        <div className="grid grid-cols-1 gap-2">
          {/* Standard Hours Section */}
          <div
            className={`grid ${
              useManualHours ? "grid-cols-2" : "grid-cols-1"
            } gap-2`}
          >
            {/* Hourly Rate Input */}
            <div className="bg-white/50 p-2 rounded-lg border border-gray-200/80">
              <label
                htmlFor="hourly-rate"
                className="text-xs font-bold tracking-wider uppercase text-slate-500 block mb-1"
              >
                HOURLY RATE (£)
              </label>
              <input
                id="hourly-rate"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={hourlyRate || ""}
                onChange={(e) => setHourlyRate(parseFloat(e.target.value) || 0)}
                placeholder="e.g., 18.50"
                className="mt-1 w-full p-1.5 text-base bg-transparent border border-slate-300 rounded-md focus:ring-2 focus:ring-[#003D5B] focus:border-[#003D5B]"
              />
            </div>

            {/* Manual Hours Input */}
            {useManualHours && (
              <div className="bg-white/50 p-2 rounded-lg border border-gray-200/80">
                <label
                  htmlFor="manual-hours"
                  className="text-xs font-bold tracking-wider uppercase text-slate-500 block mb-1"
                >
                  HOURS & MINUTES
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <input
                      id="manual-hours"
                      type="number"
                      inputMode="numeric"
                      min="0"
                      max="23"
                      value={manualHours || ""}
                      onChange={(e) =>
                        setManualHours(parseInt(e.target.value) || 0)
                      }
                      placeholder="Hours"
                      className="mt-1 w-full p-1.5 text-base bg-transparent border border-slate-300 rounded-md focus:ring-2 focus:ring-[#003D5B] focus:border-[#003D5B]"
                    />
                  </div>
                  <div>
                    <input
                      id="manual-minutes"
                      type="number"
                      inputMode="numeric"
                      min="0"
                      max="59"
                      value={manualMinutes || ""}
                      onChange={(e) =>
                        setManualMinutes(parseInt(e.target.value) || 0)
                      }
                      placeholder="Minutes"
                      className="mt-1 w-full p-1.5 text-base bg-transparent border border-slate-300 rounded-md focus:ring-2 focus:ring-[#003D5B] focus:border-[#003D5B]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Overtime Section */}
          <div className="grid grid-cols-2 gap-2">
            {/* Overtime Rate Input */}
            <div className="bg-white/50 p-2 rounded-lg border border-gray-200/80">
              <label
                htmlFor="overtime-rate"
                className="text-xs font-bold tracking-wider uppercase text-slate-500 block mb-1"
              >
                OVERTIME RATE (£)
              </label>
              <input
                id="overtime-rate"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={overtimeRate || ""}
                onChange={(e) =>
                  setOvertimeRate(parseFloat(e.target.value) || 0)
                }
                placeholder="e.g., 27.75"
                className="mt-1 w-full p-1.5 text-base bg-transparent border border-slate-300 rounded-md focus:ring-2 focus:ring-[#003D5B] focus:border-[#003D5B]"
              />
            </div>

            {/* Overtime Hours Input */}
            <div className="bg-white/50 p-2 rounded-lg border border-gray-200/80">
              <label
                htmlFor="overtime-hours"
                className="text-xs font-bold tracking-wider uppercase text-slate-500 block mb-1"
              >
                OVERTIME HOURS
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <input
                    id="overtime-hours"
                    type="number"
                    inputMode="numeric"
                    min="0"
                    max="23"
                    value={overtimeHours || ""}
                    onChange={(e) =>
                      setOvertimeHours(parseInt(e.target.value) || 0)
                    }
                    placeholder="Hours"
                    className="mt-1 w-full p-1.5 text-base bg-transparent border border-slate-300 rounded-md focus:ring-2 focus:ring-[#003D5B] focus:border-[#003D5B]"
                  />
                </div>
                <div>
                  <input
                    id="overtime-minutes"
                    type="number"
                    inputMode="numeric"
                    min="0"
                    max="59"
                    value={overtimeMinutes || ""}
                    onChange={(e) =>
                      setOvertimeMinutes(parseInt(e.target.value) || 0)
                    }
                    placeholder="Minutes"
                    className="mt-1 w-full p-1.5 text-base bg-transparent border border-slate-300 rounded-md focus:ring-2 focus:ring-[#003D5B] focus:border-[#003D5B]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown section with calculated height */}
      <div className="flex-1 overflow-hidden">
        <div
          className="overflow-y-auto"
          style={{ height: `${breakdownHeight}px` }}
        >
          <div className="bg-white/80 rounded-lg border border-gray-200/80 p-3 shadow-sm">
            {/* Header */}
            <div className="text-center mb-3 pb-2 border-b border-gray-200">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                Wage Breakdown
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {useManualHours ? "Manual Hours" : "Time Tracker"}
              </p>
            </div>

            {/* Standard Hours Section */}
            <div className="space-y-2 mb-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-600">Hours Worked</span>
                <span className="font-mono text-sm font-medium text-slate-800">
                  {formatDurationWithMinutes(duration)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-600">Hourly Rate</span>
                <span className="font-mono text-sm font-medium text-slate-800">
                  {formatCurrency(hourlyRate)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-gray-100">
                <span className="text-sm font-semibold text-slate-700">
                  Standard Pay
                </span>
                <span className="font-mono text-base font-bold text-slate-800">
                  {formatCurrency(standardEarnings)}
                </span>
              </div>
            </div>

            {/* Overtime Section */}
            {overtimeDuration.totalMinutes > 0 && (
              <div className="space-y-2 mb-3 pt-2 border-t border-orange-200">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-orange-600">
                    Overtime Hours
                  </span>
                  <span className="font-mono text-sm font-medium text-orange-700">
                    {formatDurationWithMinutes(overtimeDuration)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-orange-600">Overtime Rate</span>
                  <span className="font-mono text-sm font-medium text-orange-700">
                    {formatCurrency(overtimeRate || hourlyRate)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-orange-100">
                  <span className="text-sm font-semibold text-orange-700">
                    Overtime Pay
                  </span>
                  <span className="font-mono text-base font-bold text-orange-700">
                    {formatCurrency(overtimeEarnings)}
                  </span>
                </div>
              </div>
            )}

            {/* Total Section */}
            <div className="pt-2 border-t-2 border-slate-300">
              <div className="flex justify-between items-center">
                <span className="text-base font-bold text-slate-800 uppercase tracking-wide">
                  Total Wage
                </span>
                <span className="font-mono text-lg font-bold text-[#003D5B]">
                  {formatCurrency(totalEarnings)}
                </span>
              </div>
            </div>

            {/* Tax Section - only show if tax calculations are enabled */}
            {settings.enableTaxCalculations && taxAmount > 0 && (
              <div className="pt-2 border-t border-red-200 mt-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-red-600">
                    Tax ({Math.round(settings.taxRate * 100)}%)
                  </span>
                  <span className="font-mono text-sm font-medium text-red-700">
                    -{formatCurrency(taxAmount)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-red-100">
                  <span className="text-sm font-semibold text-red-700">
                    After Tax
                  </span>
                  <span className="font-mono text-base font-bold text-red-700">
                    {formatCurrency(afterTaxEarnings)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fixed total section - guaranteed to be visible */}
      <div
        ref={totalSectionRef}
        className="flex-shrink-0 border-t border-slate-200 pt-3 pb-3 mt-3"
      >
        {/* Date Input Section */}
        <div className="mb-2">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold tracking-wider uppercase text-slate-500">
              WAGE DATE
            </label>
            <button
              onClick={() => setShowDateInput(!showDateInput)}
              className="text-xs text-slate-500 hover:text-slate-700"
            >
              {showDateInput ? "Hide" : "Change"}
            </button>
          </div>
          {showDateInput ? (
            <input
              type="date"
              value={wageDate}
              onChange={(e) => setWageDate(e.target.value)}
              className="w-full p-1.5 text-sm bg-transparent border border-slate-300 rounded-md focus:ring-2 focus:ring-[#003D5B] focus:border-[#003D5B]"
            />
          ) : (
            <div className="text-sm text-slate-600 bg-slate-50 p-1.5 rounded-md border border-slate-200">
              {new Date(wageDate).toLocaleDateString("en-GB", {
                weekday: "short",
                day: "numeric",
                month: "short",
              })}
              {submissionCount > 0 && (
                <span className="text-xs text-slate-500 ml-2">
                  ({submissionCount} submission{submissionCount > 1 ? "s" : ""})
                </span>
              )}
            </div>
          )}
        </div>

        {/* Save Button */}
        <button
          onClick={handleSaveWage}
          disabled={totalEarnings <= 0}
          className="w-full bg-green-500 text-white font-bold py-2 px-3 rounded-md hover:bg-green-600 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed text-sm"
        >
          Save Wage ({getCurrentTime()})
        </button>
      </div>
    </div>
  );
};

export default WageCalculator;
