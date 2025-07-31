import React, { useState, useEffect, useRef } from "react";
import useLocalStorage from "../hooks/useLocalStorage";
import {
  decimalHoursToDuration,
  formatDurationWithMinutes,
} from "../hooks/useTimeCalculations";
import { DailyPay, Settings } from "../types";
import PayHistory from "./PayHistory";

interface PayCalculatorProps {
  totalMinutes: number;
  hourlyRate: number;
  setHourlyRate: (rate: number) => void;
  settings: Settings;
  payHistory: DailyPay[];
  setPayHistory: (history: DailyPay[]) => void;
}

const PayCalculator: React.FC<PayCalculatorProps> = ({
  totalMinutes,
  hourlyRate,
  setHourlyRate,
  settings,
  payHistory,
  setPayHistory,
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
  const [showBreakdownModal, setShowBreakdownModal] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [payDate, setPayDate] = useLocalStorage<string>(
    "payDate",
    new Date().toISOString().split("T")[0]
  );

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
    : {
        hours: Math.floor(totalMinutes / 60),
        minutes: totalMinutes % 60,
        totalMinutes: totalMinutes,
      };

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

  // Tax calculations
  const taxAmount = settings.enableTaxCalculations
    ? totalEarnings * settings.taxRate
    : 0;
  const afterTaxEarnings = totalEarnings - taxAmount;

  // Get submissions for the selected date
  const submissionsForDate = payHistory.filter((pay) => pay.date === payDate);

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleSavePay = () => {
    if (totalEarnings <= 0) return;

    const newPay: DailyPay = {
      id: `${Date.now()}`,
      date: payDate,
      timestamp: new Date().toISOString(),
      submissionTime: getCurrentTime(),
      standardHours: Math.floor(duration.totalMinutes / 60),
      standardMinutes: duration.totalMinutes % 60,
      standardRate: hourlyRate,
      standardPay: standardEarnings,
      overtimeHours: Math.floor(overtimeDuration.totalMinutes / 60),
      overtimeMinutes: overtimeDuration.totalMinutes % 60,
      overtimeRate: overtimeRate || hourlyRate,
      overtimePay: overtimeEarnings,
      totalPay: totalEarnings,
      calculationMethod: useManualHours ? "manualHours" : "timeTracker",
      taxAmount,
      afterTaxPay: afterTaxEarnings,
      taxRate: settings.taxRate,
    };

    setPayHistory([...payHistory, newPay]);
    setShowSaveSuccess(true);

    setTimeout(() => {
      setShowSaveSuccess(false);
    }, 3000);
  };

  // Calculate available space for breakdown
  useEffect(() => {
    const calculateBreakdownHeight = () => {
      if (
        containerRef.current &&
        inputSectionRef.current &&
        totalSectionRef.current
      ) {
        const viewportHeight = window.innerHeight;
        const containerRect = containerRef.current.getBoundingClientRect();
        const containerTop = containerRect.top;
        const availableViewportHeight = viewportHeight - containerTop;

        const inputHeight = inputSectionRef.current.offsetHeight;
        const totalHeight = totalSectionRef.current.offsetHeight;
        const navBarHeight = 64;
        const padding = 16;

        const availableHeight =
          availableViewportHeight -
          inputHeight -
          totalHeight -
          navBarHeight -
          padding;

        const finalHeight = Math.max(availableHeight, 100);
        // We don't need this anymore since we're using a modal
      }
    };

    calculateBreakdownHeight();
    const timeoutId = setTimeout(calculateBreakdownHeight, 100);

    window.addEventListener("resize", calculateBreakdownHeight);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", calculateBreakdownHeight);
    };
  }, [activeTab]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: settings.currency || "GBP",
    }).format(amount);
  };

  // Breakdown Modal Component
  const BreakdownModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800">Pay Breakdown</h3>
            <button
              onClick={() => setShowBreakdownModal(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {/* Standard Pay */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">Standard Pay:</span>
            <span className="font-mono text-base font-medium text-slate-800">
              {formatCurrency(standardEarnings)}
            </span>
          </div>

          {/* Overtime Section - only show if overtime hours > 0 */}
          {overtimeDuration.totalMinutes > 0 && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-sm text-orange-600">Overtime Hours:</span>
                <span className="font-mono text-base font-medium text-orange-600">
                  {formatDurationWithMinutes(overtimeDuration)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-orange-600">Overtime Rate:</span>
                <span className="font-mono text-base font-medium text-orange-600">
                  {formatCurrency(overtimeRate || hourlyRate)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-orange-600">Overtime Pay:</span>
                <span className="font-mono text-base font-medium text-orange-600">
                  {formatCurrency(overtimeEarnings)}
                </span>
              </div>
            </>
          )}

          {/* Tax Section - only show if tax calculations are enabled */}
          {settings.enableTaxCalculations && taxAmount > 0 && (
            <div className="pt-2 border-t border-red-200 mt-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-red-600">
                  Tax ({Math.round(settings.taxRate * 100)}%)
                </span>
                <span className="font-mono text-base font-medium text-red-700">
                  -{formatCurrency(taxAmount)}
                </span>
              </div>
            </div>
          )}

          {/* Total Pay */}
          <div className="pt-2 border-t border-slate-200 mt-2">
            <div className="flex justify-between items-center">
              <span className="text-base font-bold text-slate-700">
                Total Pay:
              </span>
              <span className="font-mono text-xl font-bold text-slate-800">
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
  );

  return (
    <div
      ref={containerRef}
      className="h-full flex flex-col text-[#003D5B] overflow-hidden relative"
    >
      {/* Success Toast */}
      {showSaveSuccess && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
            <span className="text-sm font-medium">
              ✅ Pay saved successfully!
            </span>
          </div>
        </div>
      )}

      {/* Breakdown Modal */}
      {showBreakdownModal && <BreakdownModal />}

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
            Pay History
          </button>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === "calculator" ? (
        <>
          <div ref={inputSectionRef} className="flex-shrink-0 space-y-1 p-3">
            {/* Toggle Section */}
            <div className="bg-white/50 p-1.5 rounded-lg border border-gray-200/80">
              <label className="text-xs font-bold tracking-wider uppercase text-slate-500 block mb-1">
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
                  className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${
                    useManualHours ? "bg-[#003D5B]" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      useManualHours ? "translate-x-4" : "translate-x-0.5"
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
            <div className="grid grid-cols-1 gap-1">
              {/* Standard Hours Section */}
              <div
                className={`grid ${
                  useManualHours ? "grid-cols-2" : "grid-cols-1"
                } gap-1`}
              >
                {/* Hourly Rate Input */}
                <div className="bg-white/50 p-1.5 rounded-lg border border-gray-200/80">
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
                    className="mt-1 w-full p-1 text-sm bg-transparent border border-slate-300 rounded-md focus:ring-2 focus:ring-[#003D5B] focus:border-[#003D5B]"
                  />
                </div>

                {/* Manual Hours Input */}
                {useManualHours && (
                  <div className="bg-white/50 p-1.5 rounded-lg border border-gray-200/80">
                    <label
                      htmlFor="manual-hours"
                      className="text-xs font-bold tracking-wider uppercase text-slate-500 block mb-1"
                    >
                      MANUAL HOURS
                    </label>
                    <div className="grid grid-cols-2 gap-1">
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
                        className="mt-1 w-full p-1 text-sm bg-transparent border border-slate-300 rounded-md focus:ring-2 focus:ring-[#003D5B] focus:border-[#003D5B]"
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
                        className="mt-1 w-full p-1 text-sm bg-transparent border border-slate-300 rounded-md focus:ring-2 focus:ring-[#003D5B] focus:border-[#003D5B]"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Overtime Section */}
              <div className="bg-white/50 p-1.5 rounded-lg border border-gray-200/80">
                <label className="text-xs font-bold tracking-wider uppercase text-slate-500 block mb-1">
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
                  className="w-full p-1 text-sm bg-transparent border border-slate-300 rounded-md focus:ring-2 focus:ring-[#003D5B] focus:border-[#003D5B]"
                />
              </div>

              <div className="bg-white/50 p-1.5 rounded-lg border border-gray-200/80">
                <label className="text-xs font-bold tracking-wider uppercase text-slate-500 block mb-1">
                  OVERTIME HOURS
                </label>
                <div className="grid grid-cols-2 gap-1">
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    value={overtimeHours || ""}
                    onChange={(e) =>
                      setOvertimeHours(parseInt(e.target.value) || 0)
                    }
                    placeholder="Hours"
                    className="w-full p-1 text-sm bg-transparent border border-slate-300 rounded-md focus:ring-2 focus:ring-[#003D5B] focus:border-[#003D5B]"
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
                    className="w-full p-1 text-sm bg-transparent border border-slate-300 rounded-md focus:ring-2 focus:ring-[#003D5B] focus:border-[#003D5B]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Total Pay Display */}
          <div className="flex-1 px-4 flex items-center justify-center min-h-0">
            <div className="bg-white/80 p-4 rounded-lg border shadow-sm w-full max-w-sm flex flex-col justify-center min-h-[120px]">
              <div className="text-center">
                <h3 className="text-sm font-bold text-slate-700 mb-2">
                  Total Pay
                </h3>
                <p className="text-2xl font-bold text-[#003D5B] font-mono mb-3">
                  {formatCurrency(
                    settings.enableTaxCalculations
                      ? afterTaxEarnings
                      : totalEarnings
                  )}
                </p>
                <button
                  onClick={() => setShowBreakdownModal(true)}
                  className="w-full bg-slate-100 text-slate-700 py-2 px-3 rounded-md hover:bg-slate-200 transition-colors text-sm font-medium"
                >
                  View Breakdown
                </button>
              </div>
            </div>
          </div>

          {/* Save Section */}
          <div
            ref={totalSectionRef}
            className="flex-shrink-0 p-3 space-y-1.5 pb-6"
          >
            {/* Date Picker */}
            <div className="bg-white/50 p-1.5 rounded-lg border border-gray-200/80">
              <label className="text-xs font-medium text-slate-600 block mb-1">
                Select date ({submissionsForDate.length} submissions)
              </label>
              <input
                type="date"
                value={payDate}
                onChange={(e) => setPayDate(e.target.value)}
                className="w-full p-1 text-sm bg-transparent border border-slate-300 rounded-md focus:ring-2 focus:ring-[#003D5B] focus:border-[#003D5B]"
              />
            </div>

            {/* Save Button */}
            <button
              onClick={handleSavePay}
              disabled={totalEarnings <= 0}
              className={`w-full py-2 px-4 rounded-lg font-bold transition-colors text-sm ${
                totalEarnings > 0
                  ? "bg-[#003D5B] text-white hover:bg-[#002D4B]"
                  : "bg-slate-300 text-slate-500 cursor-not-allowed"
              }`}
            >
              Save Pay
            </button>
          </div>
        </>
      ) : (
        <div className="flex-1">
          <PayHistory
            payHistory={payHistory}
            setPayHistory={setPayHistory}
            settings={settings}
          />
        </div>
      )}
    </div>
  );
};

export default PayCalculator;
