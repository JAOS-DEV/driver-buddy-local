import React, { useState } from "react";
import { Settings as SettingsType } from "../types";

interface SettingsProps {
  settings: SettingsType;
  setSettings: (settings: SettingsType) => void;
}

const Settings: React.FC<SettingsProps> = ({ settings, setSettings }) => {
  const [showTaxSection, setShowTaxSection] = useState(
    settings.enableTaxCalculations
  );

  const updateSettings = (updates: Partial<SettingsType>) => {
    setSettings({ ...settings, ...updates });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(amount);
  };

  // Export pay history to CSV
  const exportPayHistory = () => {
    // Get pay history from localStorage
    const payHistory = JSON.parse(localStorage.getItem("payHistory") || "[]");

    if (payHistory.length === 0) {
      alert("No pay history to export.");
      return;
    }

    // Create CSV header
    const headers = [
      "Date",
      "Submission Time",
      "Calculation Method",
      "Standard Hours",
      "Standard Minutes",
      "Standard Rate",
      "Standard Pay",
      "Overtime Hours",
      "Overtime Minutes",
      "Overtime Rate",
      "Overtime Pay",
      "Total Pay",
      "Tax Amount",
      "After Tax Pay",
      "Tax Rate",
      "Notes",
    ];

    // Create CSV rows
    const rows = payHistory.map((pay: any) => [
      pay.date,
      pay.submissionTime,
      pay.calculationMethod,
      pay.standardHours,
      pay.standardMinutes,
      pay.standardRate,
      pay.standardPay,
      pay.overtimeHours,
      pay.overtimeMinutes,
      pay.overtimeRate,
      pay.overtimePay,
      pay.totalPay,
      pay.taxAmount || "",
      pay.afterTaxPay || "",
      pay.taxRate || "",
      pay.notes || "",
    ]);

    // Combine header and rows
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `pay_history_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Clear all pay history
  const clearPayHistory = () => {
    if (confirm("This will permanently delete all saved pay. Are you sure?")) {
      localStorage.removeItem("payHistory");
      alert("All pay history has been cleared.");
    }
  };

  // Clear all data (entries, pay history, settings, etc.)
  const clearAllData = () => {
    if (
      confirm(
        "This will permanently delete ALL data including time entries, pay history, and settings. This action cannot be undone. Are you sure?"
      )
    ) {
      localStorage.clear();
      alert("All data has been cleared. The page will reload.");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  return (
    <div className="h-full flex flex-col text-[#003D5B]">
      <div className="flex-1 overflow-y-auto pb-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center">
            <h2 className="text-lg font-bold">Settings</h2>
            <p className="text-xs text-slate-500 mt-1">
              Configure your preferences
            </p>
          </div>

          {/* Week Start Day */}
          <div className="bg-white/50 p-4 rounded-lg border border-gray-200/80">
            <h3 className="text-sm font-bold mb-3 text-slate-700">
              Week Configuration
            </h3>
            <div className="space-y-3">
              <div>
                <label
                  htmlFor="week-start-day"
                  className="text-xs font-bold tracking-wider uppercase text-slate-500 block mb-1"
                >
                  WEEK START DAY
                </label>
                <select
                  id="week-start-day"
                  value={settings.weekStartDay}
                  onChange={(e) =>
                    updateSettings({ weekStartDay: e.target.value as any })
                  }
                  className="w-full p-2 text-sm bg-transparent border border-slate-300 rounded-md focus:ring-2 focus:ring-[#003D5B] focus:border-[#003D5B]"
                >
                  <option value="monday">Monday</option>
                  <option value="tuesday">Tuesday</option>
                  <option value="wednesday">Wednesday</option>
                  <option value="thursday">Thursday</option>
                  <option value="friday">Friday</option>
                  <option value="saturday">Saturday</option>
                  <option value="sunday">Sunday</option>
                </select>
                <p className="text-xs text-slate-500 mt-2">
                  This affects how weekly totals are calculated in pay history.
                </p>
              </div>
            </div>
          </div>

          {/* Default Rates */}
          <div className="bg-white/50 p-4 rounded-lg border border-gray-200/80">
            <h3 className="text-sm font-bold mb-3 text-slate-700">
              Default Rates
            </h3>
            <div className="space-y-3">
              <div>
                <label
                  htmlFor="default-hourly-rate"
                  className="text-xs font-bold tracking-wider uppercase text-slate-500 block mb-1"
                >
                  DEFAULT HOURLY RATE (£)
                </label>
                <input
                  id="default-hourly-rate"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  value={settings.defaultHourlyRate || ""}
                  onChange={(e) =>
                    updateSettings({
                      defaultHourlyRate: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="e.g., 18.50"
                  className="w-full p-2 text-sm bg-transparent border border-slate-300 rounded-md focus:ring-2 focus:ring-[#003D5B] focus:border-[#003D5B]"
                />
                <p className="text-xs text-slate-500 mt-1">
                  This will auto-fill the hourly rate in the Pay Calculator.
                </p>
              </div>
              <div>
                <label
                  htmlFor="default-overtime-rate"
                  className="text-xs font-bold tracking-wider uppercase text-slate-500 block mb-1"
                >
                  DEFAULT OVERTIME RATE (£)
                </label>
                <input
                  id="default-overtime-rate"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  value={settings.defaultOvertimeRate || ""}
                  onChange={(e) =>
                    updateSettings({
                      defaultOvertimeRate: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="e.g., 27.75"
                  className="w-full p-2 text-sm bg-transparent border border-slate-300 rounded-md focus:ring-2 focus:ring-[#003D5B] focus:border-[#003D5B]"
                />
                <p className="text-xs text-slate-500 mt-1">
                  This will auto-fill the overtime rate in the Pay Calculator.
                </p>
              </div>
            </div>
          </div>

          {/* Tax Calculations */}
          <div className="bg-white/50 p-4 rounded-lg border border-gray-200/80">
            <h3 className="text-sm font-bold mb-3 text-slate-700">
              Tax Calculations
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-slate-700">
                    Enable Tax Calculations
                  </span>
                  <p className="text-xs text-slate-500">
                    Show after-tax earnings in pay breakdown
                  </p>
                </div>
                <button
                  onClick={() => {
                    const newValue = !settings.enableTaxCalculations;
                    updateSettings({ enableTaxCalculations: newValue });
                    setShowTaxSection(newValue);
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.enableTaxCalculations
                      ? "bg-[#003D5B]"
                      : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.enableTaxCalculations
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              {showTaxSection && (
                <div className="pt-3 border-t border-gray-200">
                  <label
                    htmlFor="tax-rate"
                    className="text-xs font-bold tracking-wider uppercase text-slate-500 block mb-1"
                  >
                    TAX RATE (%)
                  </label>
                  <input
                    id="tax-rate"
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    min="0"
                    max="100"
                    value={Math.round(settings.taxRate * 100) || ""}
                    onChange={(e) =>
                      updateSettings({
                        taxRate: (parseFloat(e.target.value) || 0) / 100,
                      })
                    }
                    placeholder="e.g., 20"
                    className="w-full p-2 text-sm bg-transparent border border-slate-300 rounded-md focus:ring-2 focus:ring-[#003D5B] focus:border-[#003D5B]"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Standard UK tax rate is 20%. This will show after-tax
                    earnings.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Earning Goals */}
          <div className="bg-white/50 p-4 rounded-lg border border-gray-200/80">
            <h3 className="text-sm font-bold mb-3 text-slate-700">
              Earning Goals
            </h3>
            <div className="space-y-3">
              <div>
                <label
                  htmlFor="weekly-goal"
                  className="text-xs font-bold tracking-wider uppercase text-slate-500 block mb-1"
                >
                  WEEKLY GOAL (£)
                </label>
                <input
                  id="weekly-goal"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  value={settings.weeklyGoal || ""}
                  onChange={(e) =>
                    updateSettings({
                      weeklyGoal: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="e.g., 800"
                  className="w-full p-2 text-sm bg-transparent border border-slate-300 rounded-md focus:ring-2 focus:ring-[#003D5B] focus:border-[#003D5B]"
                />
              </div>
              <div>
                <label
                  htmlFor="monthly-goal"
                  className="text-xs font-bold tracking-wider uppercase text-slate-500 block mb-1"
                >
                  MONTHLY GOAL (£)
                </label>
                <input
                  id="monthly-goal"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  value={settings.monthlyGoal || ""}
                  onChange={(e) =>
                    updateSettings({
                      monthlyGoal: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="e.g., 3200"
                  className="w-full p-2 text-sm bg-transparent border border-slate-300 rounded-md focus:ring-2 focus:ring-[#003D5B] focus:border-[#003D5B]"
                />
              </div>
              <p className="text-xs text-slate-500">
                Set goals to track your progress in the pay history view.
              </p>
            </div>
          </div>

          {/* Data Management */}
          <div className="bg-white/50 p-4 rounded-lg border border-gray-200/80">
            <h3 className="text-sm font-bold mb-3 text-slate-700">
              Data Management
            </h3>
            <div className="space-y-3">
              <button
                onClick={exportPayHistory}
                className="w-full bg-blue-500 text-white font-bold py-2 px-3 rounded-md hover:bg-blue-600 transition-colors text-sm"
              >
                Export Pay History (CSV)
              </button>
              <button
                onClick={clearPayHistory}
                className="w-full bg-red-500 text-white font-bold py-2 px-3 rounded-md hover:bg-red-600 transition-colors text-sm"
              >
                Clear All Pay History
              </button>
              <button
                onClick={clearAllData}
                className="w-full bg-red-700 text-white font-bold py-2 px-3 rounded-md hover:bg-red-800 transition-colors text-sm"
              >
                Clear All Data
              </button>
              <p className="text-xs text-slate-500">
                Export your data for tax purposes or clear all saved data.
              </p>
            </div>
          </div>

          {/* App Info */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200/80">
            <h3 className="text-sm font-bold mb-3 text-slate-700">
              About Driver Buddy
            </h3>
            <div className="space-y-2 text-xs text-slate-600">
              <p>Version: 1.0.0</p>
              <p>Designed for UK professional drivers</p>
              <p>Data is stored locally on your device</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
