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
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showDateInfoModal, setShowDateInfoModal] = useState(false);
  const [showTaxInfoModal, setShowTaxInfoModal] = useState(false);
  const [payDate, setPayDate] = useLocalStorage<string>(
    "payDate",
    new Date().toISOString().split("T")[0]
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const inputSectionRef = useRef<HTMLDivElement>(null);
  const totalSectionRef = useRef<HTMLDivElement>(null);

  // Apply default rates from settings
  useEffect(() => {
    if (settings.standardRates) {
      const defaultStandardRate = settings.standardRates.find(
        (rate) => rate.isDefault
      );
      if (
        defaultStandardRate &&
        defaultStandardRate.rate > 0 &&
        hourlyRate === 0
      ) {
        setHourlyRate(defaultStandardRate.rate);
      }
    }
    if (settings.overtimeRates) {
      const defaultOvertimeRate = settings.overtimeRates.find(
        (rate) => rate.isDefault
      );
      if (
        defaultOvertimeRate &&
        defaultOvertimeRate.rate > 0 &&
        overtimeRate === 0
      ) {
        setOvertimeRate(defaultOvertimeRate.rate);
      }
    }
  }, [
    settings.standardRates,
    settings.overtimeRates,
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

  // NI calculations (UK National Insurance)
  const calculateNI = (earnings: number): number => {
    if (!settings.enableNiCalculations) return 0;

    // For daily pay calculations, we need to adjust the threshold
    // Assuming this is daily pay, we'll use a daily threshold
    // £12,570 / 365 ≈ £34.44 per day threshold
    const dailyNiThreshold = 34.44; // Daily equivalent of annual threshold
    const niRate = 0.12; // 12% for earnings above threshold

    if (earnings <= dailyNiThreshold) return 0;

    const taxableEarnings = earnings - dailyNiThreshold;
    const niAmount = taxableEarnings * niRate;

    return niAmount;
  };

  const niAmount = calculateNI(totalEarnings);
  const afterNiEarnings = totalEarnings - niAmount;

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
      niAmount,
      afterNiPay: afterNiEarnings,
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2">
      <div className="bg-white rounded-lg w-full max-w-sm mx-auto max-h-[90vh] overflow-y-auto">
        <div className="p-3 border-b border-gray-200">
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

        <div className="p-3 space-y-3">
          {/* Standard Hours */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">Standard Hours:</span>
            <span className="font-mono text-base font-medium text-slate-800">
              {duration.hours}:{duration.minutes.toString().padStart(2, "0")} @{" "}
              {formatCurrency(hourlyRate)}
            </span>
          </div>

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
                  {overtimeDuration.hours}:
                  {overtimeDuration.minutes.toString().padStart(2, "0")} @{" "}
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

          {/* NI Section - only show if NI calculations are enabled */}
          {settings.enableNiCalculations && niAmount > 0 && (
            <div className="pt-2 border-t border-orange-200 mt-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-orange-600">NI (12%/2%)</span>
                <span className="font-mono text-base font-medium text-orange-700">
                  -{formatCurrency(niAmount)}
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
                  settings.enableTaxCalculations &&
                    settings.enableNiCalculations
                    ? totalEarnings - taxAmount - niAmount
                    : settings.enableTaxCalculations
                    ? afterTaxEarnings
                    : settings.enableNiCalculations
                    ? afterNiEarnings
                    : totalEarnings
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Info Modal Component
  const InfoModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2">
      <div className="bg-white rounded-lg w-full max-w-sm mx-auto">
        <div className="p-3 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800">
              Calculation Methods
            </h3>
            <button
              onClick={() => setShowInfoModal(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-3 space-y-3">
          <div>
            <h4 className="font-medium text-slate-700 mb-2">
              Time Tracker Mode
            </h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              Automatically calculates your pay based on the total time tracked
              in the Time Tracker. This uses the accumulated hours and minutes
              from your time entries.
            </p>
          </div>

          <div>
            <h4 className="font-medium text-slate-700 mb-2">
              Manual Hours Mode
            </h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              Manually enter your hours and minutes worked. Useful when you want
              to calculate pay for a specific period or when you have your hours
              from another source.
            </p>
          </div>

          <div className="pt-2 border-t border-gray-200">
            <p className="text-xs text-slate-500">
              💡 <strong>Tip:</strong> Use Time Tracker for automatic
              calculations from your tracked time, or Manual Hours when you have
              specific hours to calculate.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // Date Info Modal Component
  const DateInfoModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2">
      <div className="bg-white rounded-lg w-full max-w-sm mx-auto">
        <div className="p-3 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800">
              Pay Date Selection
            </h3>
            <button
              onClick={() => setShowDateInfoModal(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-3 space-y-3">
          <div>
            <h4 className="font-medium text-slate-700 mb-2">
              What is the Pay Date?
            </h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              This is the date that the pay calculation represents. It's the day
              you worked, not when you're saving the calculation.
            </p>
          </div>

          <div>
            <h4 className="font-medium text-slate-700 mb-2">
              Why is it Important?
            </h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              The date helps organize your pay history and ensures you don't
              accidentally save multiple pay calculations for the same day.
            </p>
          </div>

          <div>
            <h4 className="font-medium text-slate-700 mb-2">
              Submissions Counter
            </h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              The number in parentheses shows how many pay calculations you've
              already saved for this date. This helps you avoid duplicates.
            </p>
          </div>

          <div className="pt-2 border-t border-gray-200">
            <p className="text-xs text-slate-500">
              💡 <strong>Tip:</strong> Use today's date for current work, or
              select a past date if you're catching up on previous pay
              calculations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // Tax Info Modal Component
  const TaxInfoModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2">
      <div className="bg-white rounded-lg w-full max-w-sm mx-auto">
        <div className="p-3 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800">
              Tax & NI Calculations
            </h3>
            <button
              onClick={() => setShowTaxInfoModal(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-3 space-y-3">
          <div>
            <h4 className="font-medium text-slate-700 mb-2">Income Tax</h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              UK standard rate of 20% applied to your total earnings. This gives
              you an estimate of your take-home pay after tax deductions.
            </p>
          </div>

          <div>
            <h4 className="font-medium text-slate-700 mb-2">
              National Insurance
            </h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              NI is calculated at 12% on earnings above £34.44 per day
              (equivalent to the annual threshold). This is simplified for daily
              calculations.
            </p>
          </div>

          <div>
            <h4 className="font-medium text-slate-700 mb-2">
              Combined Calculations
            </h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              When both tax and NI are enabled, you'll see the final total after
              both deductions. This gives you the most accurate take-home pay
              estimate.
            </p>
          </div>

          <div>
            <h4 className="font-medium text-slate-700 mb-2">How to Enable</h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              Go to <strong>Settings</strong> →{" "}
              <strong>Tax Calculations </strong>
              and <strong>NI Calculations</strong> sections. Toggle the switches
              to enable tax and NI calculations for your pay history.
            </p>
          </div>

          <div className="pt-2 border-t border-gray-200">
            <p className="text-xs text-slate-500">
              💡 <strong>Note:</strong> These are estimates for planning
              purposes. Actual tax and NI may vary based on your specific
              circumstances.
            </p>
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

      {/* Info Modal */}
      {showInfoModal && <InfoModal />}

      {/* Date Info Modal */}
      {showDateInfoModal && <DateInfoModal />}

      {/* Tax Info Modal */}
      {showTaxInfoModal && <TaxInfoModal />}

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
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold tracking-wider uppercase text-slate-500">
                  CALCULATION METHOD
                </label>
                <button
                  onClick={() => setShowInfoModal(true)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                  title="How calculation methods work"
                >
                  <svg
                    className="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
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
                  <div className="flex gap-1">
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
                      className="flex-1 mt-1 p-1 text-sm bg-transparent border border-slate-300 rounded-md focus:ring-2 focus:ring-[#003D5B] focus:border-[#003D5B] min-w-0"
                    />
                    {settings.standardRates &&
                      settings.standardRates.length > 1 && (
                        <select
                          onChange={(e) => {
                            const selectedRate = settings.standardRates.find(
                              (rate) => rate.id === e.target.value
                            );
                            if (selectedRate) {
                              setHourlyRate(selectedRate.rate);
                            }
                          }}
                          className="mt-1 p-1 text-xs bg-transparent border border-slate-300 rounded-md focus:ring-2 focus:ring-[#003D5B] focus:border-[#003D5B] w-20 flex-shrink-0"
                        >
                          <option value="">Select...</option>
                          {settings.standardRates.map((rate) => (
                            <option key={rate.id} value={rate.id}>
                              {rate.name}
                            </option>
                          ))}
                        </select>
                      )}
                  </div>
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
              <div className="grid grid-cols-2 gap-1">
                {/* Overtime Rate Input */}
                <div className="bg-white/50 p-1.5 rounded-lg border border-gray-200/80">
                  <label className="text-xs font-bold tracking-wider uppercase text-slate-500 block mb-1">
                    OVERTIME RATE (£)
                  </label>
                  <div className="flex gap-1">
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
                      className="flex-1 p-1 text-sm bg-transparent border border-slate-300 rounded-md focus:ring-2 focus:ring-[#003D5B] focus:border-[#003D5B] min-w-0"
                    />
                    {settings.overtimeRates &&
                      settings.overtimeRates.length > 1 && (
                        <select
                          onChange={(e) => {
                            const selectedRate = settings.overtimeRates.find(
                              (rate) => rate.id === e.target.value
                            );
                            if (selectedRate) {
                              setOvertimeRate(selectedRate.rate);
                            }
                          }}
                          className="p-1 text-xs bg-transparent border border-slate-300 rounded-md focus:ring-2 focus:ring-[#003D5B] focus:border-[#003D5B] w-20 flex-shrink-0"
                        >
                          <option value="">Select...</option>
                          {settings.overtimeRates.map((rate) => (
                            <option key={rate.id} value={rate.id}>
                              {rate.name}
                            </option>
                          ))}
                        </select>
                      )}
                  </div>
                </div>

                {/* Overtime Hours Input */}
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
          </div>

          {/* Total Pay Display */}
          <div className="flex-1 px-3 flex items-center justify-center min-h-0">
            <div className="bg-white/80 p-3 rounded-lg border shadow-sm w-full max-w-sm flex flex-col justify-center min-h-[100px]">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1.5">
                  <h3 className="text-sm font-bold text-slate-700">
                    Total Pay
                  </h3>
                  {(settings.enableTaxCalculations ||
                    settings.enableNiCalculations) && (
                    <button
                      onClick={() => setShowTaxInfoModal(true)}
                      className="text-slate-400 hover:text-slate-600 transition-colors"
                      title="About tax and NI calculations"
                    >
                      <svg
                        className="w-3 h-3"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  )}
                </div>
                <p className="text-xl font-bold text-[#003D5B] font-mono mb-2">
                  {formatCurrency(
                    settings.enableTaxCalculations &&
                      settings.enableNiCalculations
                      ? totalEarnings - taxAmount - niAmount
                      : settings.enableTaxCalculations
                      ? afterTaxEarnings
                      : settings.enableNiCalculations
                      ? afterNiEarnings
                      : totalEarnings
                  )}
                </p>
                <button
                  onClick={() => setShowBreakdownModal(true)}
                  className="w-full bg-slate-100 text-slate-700 py-1.5 px-3 rounded-md hover:bg-slate-200 transition-colors text-sm font-medium"
                >
                  View Breakdown
                </button>
              </div>
            </div>
          </div>

          {/* Save Section */}
          <div
            ref={totalSectionRef}
            className="flex-shrink-0 p-3 space-y-1.5 pb-4"
          >
            {/* Date Picker */}
            <div className="bg-white/50 p-1 rounded-lg border border-gray-200/80">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <label className="text-xs font-medium text-slate-600 text-center">
                  Select date ({submissionsForDate.length} submissions)
                </label>
                <button
                  onClick={() => setShowDateInfoModal(true)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                  title="About pay date selection"
                >
                  <svg
                    className="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
              <input
                type="date"
                value={payDate}
                onChange={(e) => setPayDate(e.target.value)}
                className="w-5/6 p-0.5 text-sm bg-transparent border border-slate-300 rounded-md focus:ring-2 focus:ring-[#003D5B] focus:border-[#003D5B] mx-auto block"
              />
            </div>

            {/* Save Button */}
            <button
              onClick={handleSavePay}
              disabled={totalEarnings <= 0}
              className={`w-full py-1.5 px-3 rounded-lg font-bold transition-colors text-sm ${
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
