import React, { useState } from "react";
import { Settings as SettingsType, StandardRate, OvertimeRate } from "../types";
import { useAuth } from "../hooks/useAuth";
import { importLocalDataToCloud } from "../services/firestoreClient";
import { db } from "../services/firebase";
import { collection, getDocs } from "firebase/firestore";

interface SettingsProps {
  settings: SettingsType;
  setSettings: (settings: SettingsType) => void;
}

const Settings: React.FC<SettingsProps> = ({ settings, setSettings }) => {
  const { signOut, user } = useAuth();
  const [showTaxSection, setShowTaxSection] = useState(
    settings.enableTaxCalculations
  );

  const updateSettings = (updates: Partial<SettingsType>) => {
    setSettings({ ...settings, ...updates });
  };

  const storageMode = settings.storageMode ?? "local";

  const handleImportToCloud = async () => {
    if (!user) {
      alert("Please sign in to import data to cloud.");
      return;
    }

    try {
      const snapshot = {
        settings,
        timeEntries: JSON.parse(localStorage.getItem("timeEntries") || "[]"),
        payHistory: JSON.parse(localStorage.getItem("payHistory") || "[]"),
        dailySubmissions: JSON.parse(
          localStorage.getItem("dailySubmissions") || "[]"
        ),
        hourlyRate: parseFloat(localStorage.getItem("hourlyRate") || "0") || 0,
      };
      await importLocalDataToCloud(user.uid, snapshot);
      alert("Local data has been imported to cloud successfully.");
    } catch (e) {
      console.error(e);
      alert("Failed to import data to cloud. Check console for details.");
    }
  };

  const handleDownloadCloudToLocal = async () => {
    if (!user) {
      alert("Please sign in to download from cloud.");
      return;
    }
    if (
      !confirm(
        "This will REPLACE your local data with what's in the cloud (for entries, pay history, submissions, hourly rate, and settings). Continue?"
      )
    ) {
      return;
    }
    try {
      const userId = user.uid;
      // entries
      const entriesSnap = await getDocs(
        collection(db, "users", userId, "entries")
      );
      const entries = entriesSnap.docs.map((d) => d.data());
      // payHistory
      const paySnap = await getDocs(
        collection(db, "users", userId, "payHistory")
      );
      const payHistory = paySnap.docs.map((d) => d.data());
      // dailySubmissions
      const subsSnap = await getDocs(
        collection(db, "users", userId, "dailySubmissions")
      );
      const dailySubmissions = subsSnap.docs.map((d) => d.data());

      localStorage.setItem("timeEntries", JSON.stringify(entries));
      localStorage.setItem("payHistory", JSON.stringify(payHistory));
      localStorage.setItem(
        "dailySubmissions",
        JSON.stringify(dailySubmissions)
      );
      alert("Cloud data downloaded to local successfully.");
    } catch (e) {
      console.error(e);
      alert("Failed to download from cloud. Check console for details.");
    }
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
    <div
      className={`h-full flex flex-col ${
        settings.darkMode
          ? "text-gray-100 bg-gray-800"
          : "text-[#003D5B] bg-[#FAF7F0]"
      }`}
    >
      <div className="flex-1 overflow-y-auto pb-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center">
            <h2
              className={`text-lg font-bold ${
                settings.darkMode ? "text-gray-100" : "text-slate-800"
              }`}
            >
              Settings
            </h2>
            <p
              className={`text-xs mt-1 ${
                settings.darkMode ? "text-gray-400" : "text-slate-500"
              }`}
            >
              Configure your preferences
            </p>
          </div>

          {/* Week Start Day */}
          <div
            className={`p-2 rounded-lg border ${
              settings.darkMode
                ? "bg-gray-700/50 border-gray-600"
                : "bg-white/50 border-gray-200/80"
            }`}
          >
            <h3
              className={`text-sm font-bold mb-2 ${
                settings.darkMode ? "text-gray-100" : "text-slate-700"
              }`}
            >
              Week Configuration
            </h3>
            <div className="space-y-2">
              <div>
                <label
                  htmlFor="week-start-day"
                  className="text-xs font-bold tracking-wider uppercase text-slate-500 block mb-0.5"
                >
                  WEEK START DAY
                </label>
                <select
                  id="week-start-day"
                  value={settings.weekStartDay}
                  onChange={(e) =>
                    updateSettings({ weekStartDay: e.target.value as any })
                  }
                  className="w-full p-1 text-sm bg-transparent border border-slate-300 rounded-md focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
                >
                  <option value="monday">Monday</option>
                  <option value="tuesday">Tuesday</option>
                  <option value="wednesday">Wednesday</option>
                  <option value="thursday">Thursday</option>
                  <option value="friday">Friday</option>
                  <option value="saturday">Saturday</option>
                  <option value="sunday">Sunday</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  This affects how weekly totals are calculated in pay history.
                </p>
              </div>
            </div>
          </div>

          {/* Dark Mode Toggle */}
          <div
            className={`p-2 rounded-lg border ${
              settings.darkMode
                ? "bg-gray-700/50 border-gray-600"
                : "bg-white/50 border-gray-200/80"
            }`}
          >
            <h3
              className={`text-sm font-bold mb-2 ${
                settings.darkMode ? "text-gray-100" : "text-slate-700"
              }`}
            >
              Appearance
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <label
                    className={`text-xs font-bold tracking-wider uppercase block mb-0.5 ${
                      settings.darkMode ? "text-gray-400" : "text-slate-500"
                    }`}
                  >
                    DARK MODE
                  </label>
                  <p
                    className={`text-xs ${
                      settings.darkMode ? "text-gray-400" : "text-slate-500"
                    }`}
                  >
                    Switch between light and dark themes
                  </p>
                </div>
                <button
                  onClick={() =>
                    updateSettings({ darkMode: !settings.darkMode })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.darkMode ? "bg-gray-700" : "bg-slate-200"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.darkMode ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Standard Rates */}
          <div
            className={`p-2 rounded-lg border ${
              settings.darkMode
                ? "bg-gray-700/50 border-gray-600"
                : "bg-white/50 border-gray-200/80"
            }`}
          >
            <h3
              className={`text-sm font-bold mb-2 ${
                settings.darkMode ? "text-gray-100" : "text-slate-700"
              }`}
            >
              Standard Rates
            </h3>
            <div className="space-y-2">
              {settings.standardRates?.map((rate, index) => (
                <div
                  key={rate.id}
                  className="border border-slate-200 rounded p-2"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-slate-700">
                      {rate.name}
                    </span>
                    <button
                      onClick={() => {
                        const newRates =
                          settings.standardRates?.filter(
                            (_, i) => i !== index
                          ) || [];
                        updateSettings({ standardRates: newRates });
                      }}
                      className="text-red-500 hover:text-red-700 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={rate.rate || ""}
                      onChange={(e) => {
                        const newRates = [...(settings.standardRates || [])];
                        newRates[index].rate = parseFloat(e.target.value) || 0;
                        updateSettings({ standardRates: newRates });
                      }}
                      className="flex-1 p-0.5 text-xs bg-transparent border border-slate-300 rounded focus:ring-1 focus:ring-gray-600"
                      placeholder="0.00"
                    />
                  </div>
                  <input
                    type="text"
                    value={rate.name}
                    onChange={(e) => {
                      const newRates = [...(settings.standardRates || [])];
                      newRates[index].name = e.target.value;
                      updateSettings({ standardRates: newRates });
                    }}
                    className="w-full mt-1 p-0.5 text-xs bg-transparent border border-slate-300 rounded focus:ring-1 focus:ring-gray-600"
                    placeholder="Rate name"
                  />
                </div>
              ))}
              <button
                onClick={() => {
                  const newRate: StandardRate = {
                    id: Date.now().toString(),
                    name: `Standard Rate ${
                      (settings.standardRates?.length || 0) + 1
                    }`,
                    rate: 0,
                  };
                  updateSettings({
                    standardRates: [...(settings.standardRates || []), newRate],
                  });
                }}
                className="w-full bg-slate-100 text-slate-700 py-1 px-2 rounded border border-slate-300 hover:bg-slate-200 transition-colors text-xs"
              >
                + Add Standard Rate
              </button>
            </div>
          </div>

          {/* Overtime Rates */}
          <div
            className={`p-2 rounded-lg border ${
              settings.darkMode
                ? "bg-gray-700/50 border-gray-600"
                : "bg-white/50 border-gray-200/80"
            }`}
          >
            <h3
              className={`text-sm font-bold mb-2 ${
                settings.darkMode ? "text-gray-100" : "text-slate-700"
              }`}
            >
              Overtime Rates
            </h3>
            <div className="space-y-2">
              {settings.overtimeRates?.map((rate, index) => (
                <div
                  key={rate.id}
                  className="border border-slate-200 rounded p-2"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-slate-700">
                      {rate.name}
                    </span>
                    <button
                      onClick={() => {
                        const newRates =
                          settings.overtimeRates?.filter(
                            (_, i) => i !== index
                          ) || [];
                        updateSettings({ overtimeRates: newRates });
                      }}
                      className="text-red-500 hover:text-red-700 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={rate.rate || ""}
                      onChange={(e) => {
                        const newRates = [...(settings.overtimeRates || [])];
                        newRates[index].rate = parseFloat(e.target.value) || 0;
                        updateSettings({ overtimeRates: newRates });
                      }}
                      className="flex-1 p-0.5 text-xs bg-transparent border border-slate-300 rounded focus:ring-1 focus:ring-gray-600"
                      placeholder="0.00"
                    />
                  </div>
                  <input
                    type="text"
                    value={rate.name}
                    onChange={(e) => {
                      const newRates = [...(settings.overtimeRates || [])];
                      newRates[index].name = e.target.value;
                      updateSettings({ overtimeRates: newRates });
                    }}
                    className="w-full mt-1 p-0.5 text-xs bg-transparent border border-slate-300 rounded focus:ring-1 focus:ring-gray-600"
                    placeholder="Rate name"
                  />
                </div>
              ))}
              <button
                onClick={() => {
                  const newRate: OvertimeRate = {
                    id: Date.now().toString(),
                    name: `Overtime Rate ${
                      (settings.overtimeRates?.length || 0) + 1
                    }`,
                    rate: 0,
                  };
                  updateSettings({
                    overtimeRates: [...(settings.overtimeRates || []), newRate],
                  });
                }}
                className="w-full bg-slate-100 text-slate-700 py-1 px-2 rounded border border-slate-300 hover:bg-slate-200 transition-colors text-xs"
              >
                + Add Overtime Rate
              </button>
            </div>
          </div>

          {/* Tax Calculations */}
          <div
            className={`p-2 rounded-lg border ${
              settings.darkMode
                ? "bg-gray-700/50 border-gray-600"
                : "bg-white/50 border-gray-200/80"
            }`}
          >
            <h3
              className={`text-sm font-bold mb-2 ${
                settings.darkMode ? "text-gray-100" : "text-slate-700"
              }`}
            >
              Tax Calculations
            </h3>
            <div className="space-y-2">
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
                <div className="pt-2 border-t border-gray-200">
                  <label
                    htmlFor="tax-rate"
                    className="text-xs font-bold tracking-wider uppercase text-slate-500 block mb-0.5"
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
                    className="w-full p-1 text-sm bg-transparent border border-slate-300 rounded-md focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
                  />
                  <p className="text-xs text-slate-500 mt-0.5">
                    Standard UK tax rate is 20%. This will show after-tax
                    earnings.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* NI Calculations */}
          <div
            className={`p-2 rounded-lg border ${
              settings.darkMode
                ? "bg-gray-700/50 border-gray-600"
                : "bg-white/50 border-gray-200/80"
            }`}
          >
            <h3
              className={`text-sm font-bold mb-2 ${
                settings.darkMode ? "text-gray-100" : "text-slate-700"
              }`}
            >
              National Insurance
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-slate-700">
                    Enable NI Calculations
                  </span>
                  <p className="text-xs text-slate-500">
                    Show after-NI earnings in pay breakdown
                  </p>
                </div>
                <button
                  onClick={() => {
                    const newValue = !settings.enableNiCalculations;
                    updateSettings({ enableNiCalculations: newValue });
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.enableNiCalculations
                      ? "bg-[#003D5B]"
                      : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.enableNiCalculations
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              <div className="pt-2 border-t border-gray-200">
                <p className="text-xs text-slate-500">
                  UK NI rates: 12% on earnings between £12,570-£50,270, 2% above
                  £50,270. This will show after-NI earnings.
                </p>
              </div>
            </div>
          </div>

          {/* Earning Goals */}
          <div
            className={`p-2 rounded-lg border ${
              settings.darkMode
                ? "bg-gray-700/50 border-gray-600"
                : "bg-white/50 border-gray-200/80"
            }`}
          >
            <h3
              className={`text-sm font-bold mb-2 ${
                settings.darkMode ? "text-gray-100" : "text-slate-700"
              }`}
            >
              Earning Goals
            </h3>
            <div className="space-y-2">
              <div>
                <label
                  htmlFor="weekly-goal"
                  className="text-xs font-bold tracking-wider uppercase text-slate-500 block mb-0.5"
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
                  className="w-full p-1 text-sm bg-transparent border border-slate-300 rounded-md focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
                />
              </div>
              <div>
                <label
                  htmlFor="monthly-goal"
                  className="text-xs font-bold tracking-wider uppercase text-slate-500 block mb-0.5"
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
                  className="w-full p-1 text-sm bg-transparent border border-slate-300 rounded-md focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
                />
              </div>
              <p className="text-xs text-slate-500">
                Set goals to track your progress in the pay history view.
              </p>
            </div>
          </div>

          {/* Data Management */}
          <div
            className={`p-2 rounded-lg border ${
              settings.darkMode
                ? "bg-gray-700/50 border-gray-600"
                : "bg-white/50 border-gray-200/80"
            }`}
          >
            <h3
              className={`text-sm font-bold mb-2 ${
                settings.darkMode ? "text-gray-100" : "text-slate-700"
              }`}
            >
              Data Management
            </h3>
            <div className="space-y-2">
              <div className="p-2 border border-slate-300 rounded">
                <label className="text-xs font-bold tracking-wider uppercase text-slate-500 block mb-1">
                  Storage Mode
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateSettings({ storageMode: "local" })}
                    className={`flex-1 py-1 px-2 rounded border ${
                      storageMode === "local"
                        ? "bg-slate-800 text-white border-slate-800"
                        : "bg-white text-slate-700 border-slate-300"
                    }`}
                  >
                    Local
                  </button>
                  <button
                    onClick={() => updateSettings({ storageMode: "cloud" })}
                    className={`flex-1 py-1 px-2 rounded border ${
                      storageMode === "cloud"
                        ? "bg-slate-800 text-white border-slate-800"
                        : "bg-white text-slate-700 border-slate-300"
                    }`}
                  >
                    Cloud
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Choose where your data is saved. Switching does not migrate
                  data automatically.
                </p>
                <button
                  onClick={handleImportToCloud}
                  className="mt-2 w-full bg-green-600 text-white font-bold py-1.5 px-3 rounded-md hover:bg-green-700 transition-colors text-sm"
                >
                  Import Local Data to Cloud
                </button>
                <button
                  onClick={handleDownloadCloudToLocal}
                  className="mt-2 w-full bg-indigo-600 text-white font-bold py-1.5 px-3 rounded-md hover:bg-indigo-700 transition-colors text-sm"
                >
                  Download Cloud Data to Local
                </button>
                {!user && (
                  <p className="text-[11px] text-red-600 mt-1">
                    Sign in to use Cloud storage and import data.
                  </p>
                )}
              </div>
              <button
                onClick={exportPayHistory}
                className="w-full bg-blue-500 text-white font-bold py-1.5 px-3 rounded-md hover:bg-blue-600 transition-colors text-sm"
              >
                Export Pay History (CSV)
              </button>
              <button
                onClick={clearPayHistory}
                className="w-full bg-red-500 text-white font-bold py-1.5 px-3 rounded-md hover:bg-red-600 transition-colors text-sm"
              >
                Clear All Pay History
              </button>
              <button
                onClick={clearAllData}
                className="w-full bg-red-700 text-white font-bold py-1.5 px-3 rounded-md hover:bg-red-800 transition-colors text-sm"
              >
                Clear All Data
              </button>
              <p className="text-xs text-slate-500">
                Export your data for tax purposes or clear all saved data.
              </p>
            </div>
          </div>

          {/* Account Management */}
          <div
            className={`p-2 rounded-lg border ${
              settings.darkMode
                ? "bg-gray-700/50 border-gray-600"
                : "bg-white/50 border-gray-200/80"
            }`}
          >
            <h3
              className={`text-sm font-bold mb-2 ${
                settings.darkMode ? "text-gray-100" : "text-slate-700"
              }`}
            >
              Account
            </h3>
            <div className="space-y-2">
              <button
                onClick={signOut}
                className="w-full bg-gray-500 text-white font-bold py-1.5 px-3 rounded-md hover:bg-gray-600 transition-colors text-sm"
              >
                Sign Out
              </button>
              <p className="text-xs text-slate-500">
                Sign out of your account. Your data will remain stored locally.
              </p>
            </div>
          </div>

          {/* App Info */}
          <div
            className={`p-2 rounded-lg border ${
              settings.darkMode
                ? "bg-gray-700/50 border-gray-600"
                : "bg-white/50 border-gray-200/80"
            }`}
          >
            <h3
              className={`text-sm font-bold mb-2 ${
                settings.darkMode ? "text-gray-100" : "text-slate-700"
              }`}
            >
              About Driver Buddy
            </h3>
            <div className="space-y-1.5 text-xs text-slate-600">
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
