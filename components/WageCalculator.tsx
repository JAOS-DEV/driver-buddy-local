import React, { useState, useEffect, useRef } from "react";
import useLocalStorage from "../hooks/useLocalStorage";
import {
  decimalHoursToDuration,
  formatDurationWithMinutes,
} from "../hooks/useTimeCalculations";
import { DailyWage, Settings } from "../types";
import WageHistory from "./WageHistory";

interface WageCalculatorProps {
  totalMinutes: number;
  hourlyRate: number;
  setHourlyRate: (rate: number) => void;
  settings: Settings;
  wageHistory: DailyWage[];
  setWageHistory: (history: DailyWage[]) => void;
}

const WageCalculator: React.FC<WageCalculatorProps> = ({
  totalMinutes,
  hourlyRate,
  setHourlyRate,
  settings,
  wageHistory,
  setWageHistory,
}) => {
  const [activeTab, setActiveTab] = useState<"calculator" | "history">(
    "calculator"
  );
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

  // Dynamic height calculation for breakdown section
  useEffect(() => {
    const calculateBreakdownHeight = () => {
      if (
        containerRef.current &&
        inputSectionRef.current &&
        totalSectionRef.current
      ) {
        const containerHeight = containerRef.current.offsetHeight;
        const inputHeight = inputSectionRef.current.offsetHeight;
        const totalHeight = totalSectionRef.current.offsetHeight;
        const availableHeight =
          containerHeight - inputHeight - totalHeight - 48; // 48px for padding and margins
        setBreakdownHeight(Math.max(availableHeight, 150)); // Minimum 150px height
      }
    };

    calculateBreakdownHeight();
    const timeoutId = setTimeout(calculateBreakdownHeight, 100);
    window.addEventListener("resize", calculateBreakdownHeight);

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

      {/* Internal Navigation Tabs */}
      <div className="flex-shrink-0 bg-white/50 border-b border-gray-200/80">
        <div className="flex">
          <button
            onClick={() => setActiveTab("calculator")}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors duration-200 ${
              activeTab === "calculator"
                ? "text-[#003D5B] border-b-2 border-[#003D5B]"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Calculator
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors duration-200 ${
              activeTab === "history"
                ? "text-[#003D5B] border-b-2 border-[#003D5B]"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            History
          </button>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === "calculator" ? (
        <>
          <div ref={inputSectionRef} className="flex-shrink-0 space-y-2 p-4">
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
                    onChange={(e) =>
                      setHourlyRate(parseFloat(e.target.value) || 0)
                    }
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
                      MANUAL HOURS
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        id="manual-hours"
                        type="number"
                        inputMode="numeric"
                        min="0"
                        value={manualHours || ""}
                        onChange={(e) =>
                          setManualHours(parseInt(e.target.value) || 0)
                        }
                        placeholder="Hours"
                        className="mt-1 w-full p-1.5 text-base bg-transparent border border-slate-300 rounded-md focus:ring-2 focus:ring-[#003D5B] focus:border-[#003D5B]"
                      />
                      <input
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
                )}
              </div>

              {/* Overtime Section */}
              <div className="bg-white/50 p-2 rounded-lg border border-gray-200/80">
                <label className="text-xs font-bold tracking-wider uppercase text-slate-500 block mb-2">
                  OVERTIME RATE (£)
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  value={overtimeRate || ""}
                  onChange={(e) =>
                    setOvertimeRate(parseFloat(e.target.value) || 0)
                  }
                  placeholder="e.g., 27.75"
                  className="w-full p-1.5 text-base bg-transparent border border-slate-300 rounded-md focus:ring-2 focus:ring-[#003D5B] focus:border-[#003D5B]"
                />
              </div>

              <div className="bg-white/50 p-2 rounded-lg border border-gray-200/80">
                <label className="text-xs font-bold tracking-wider uppercase text-slate-500 block mb-1">
                  OVERTIME HOURS
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    value={overtimeHours || ""}
                    onChange={(e) =>
                      setOvertimeHours(parseInt(e.target.value) || 0)
                    }
                    placeholder="Hours"
                    className="w-full p-1.5 text-base bg-transparent border border-slate-300 rounded-md focus:ring-2 focus:ring-[#003D5B] focus:border-[#003D5B]"
                  />
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    max="59"
                    value={overtimeMinutes || ""}
                    onChange={(e) =>
                      setOvertimeMinutes(parseInt(e.target.value) || 0)
                    }
                    placeholder="Minutes"
                    className="w-full p-1.5 text-base bg-transparent border border-slate-300 rounded-md focus:ring-2 focus:ring-[#003D5B] focus:border-[#003D5B]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Wage Breakdown */}
          <div
            className="flex-1 px-4 overflow-y-auto"
            style={{ height: `${breakdownHeight}px` }}
          >
            <div className="bg-white/80 p-3 rounded-lg border shadow-sm">
              <div className="text-center mb-3">
                <h3 className="text-sm font-bold text-slate-700">
                  Wage Breakdown
                </h3>
              </div>

              <div className="space-y-1">
                {/* Standard Pay */}
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-600">Standard Pay:</span>
                  <span className="font-mono text-sm font-medium text-slate-800">
                    {formatCurrency(standardEarnings)}
                  </span>
                </div>

                {/* Overtime Section - only show if overtime hours > 0 */}
                {overtimeDuration.totalMinutes > 0 && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-orange-600">
                        Overtime Hours:
                      </span>
                      <span className="font-mono text-sm font-medium text-orange-600">
                        {formatDurationWithMinutes(overtimeDuration)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-orange-600">
                        Overtime Rate:
                      </span>
                      <span className="font-mono text-sm font-medium text-orange-600">
                        {formatCurrency(overtimeRate || hourlyRate)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-orange-600">
                        Overtime Pay:
                      </span>
                      <span className="font-mono text-sm font-medium text-orange-600">
                        {formatCurrency(overtimeEarnings)}
                      </span>
                    </div>
                  </>
                )}

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
                  </div>
                )}

                {/* Total Wage */}
                <div className="pt-2 border-t border-slate-200 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-700">
                      Total Wage:
                    </span>
                    <span className="font-mono text-lg font-bold text-slate-800">
                      {formatCurrency(
                        settings.enableTaxCalculations
                          ? afterTaxEarnings
                          : totalEarnings
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Save Section */}
          <div ref={totalSectionRef} className="flex-shrink-0 p-4 space-y-3">
            {/* Date Input Toggle */}
            <div className="bg-white/50 p-2 rounded-lg border border-gray-200/80">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600">
                  Save for specific date
                </span>
                <button
                  onClick={() => setShowDateInput(!showDateInput)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    showDateInput ? "bg-[#003D5B]" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      showDateInput ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              {showDateInput && (
                <div className="mt-2">
                  <input
                    type="date"
                    value={wageDate}
                    onChange={(e) => setWageDate(e.target.value)}
                    className="w-full p-1.5 text-sm bg-transparent border border-slate-300 rounded-md focus:ring-2 focus:ring-[#003D5B] focus:border-[#003D5B]"
                  />
                </div>
              )}

              <div className="mt-2 text-xs text-slate-500">
                {showDateInput ? (
                  <span>
                    Saving for {new Date(wageDate).toLocaleDateString("en-GB")}(
                    {submissionsForDate.length} submission
                    {submissionsForDate.length !== 1 ? "s" : ""} today)
                  </span>
                ) : (
                  <span>
                    Saving for today ({submissionsForDate.length} submission
                    {submissionsForDate.length !== 1 ? "s" : ""} today)
                  </span>
                )}
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSaveWage}
              disabled={totalEarnings <= 0}
              className={`w-full py-3 px-4 rounded-lg font-bold transition-colors ${
                totalEarnings > 0
                  ? "bg-[#003D5B] text-white hover:bg-[#002D4B]"
                  : "bg-slate-300 text-slate-500 cursor-not-allowed"
              }`}
            >
              Save Wage (Current Time)
            </button>
          </div>
        </>
      ) : (
        <div className="flex-1">
          <WageHistory
            wageHistory={wageHistory}
            setWageHistory={setWageHistory}
            settings={settings}
          />
        </div>
      )}
    </div>
  );
};

export default WageCalculator;
