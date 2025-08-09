import React, { useMemo, useState } from "react";
import { Settings as SettingsType, StandardRate, OvertimeRate } from "../types";
import type { User } from "firebase/auth";
import { signOutUser } from "../services/firebase";

interface SettingsProps {
  settings: SettingsType;
  setSettings: (settings: SettingsType) => void;
  user?: User | null;
}

const Settings: React.FC<SettingsProps> = ({ settings, setSettings, user }) => {
  const [showTaxSection, setShowTaxSection] = useState(
    settings.enableTaxCalculations
  );

  const updateSettings = (updates: Partial<SettingsType>) => {
    setSettings({ ...settings, ...updates });
  };

  const lastSyncedDisplay = useMemo(() => {
    if (!settings.lastSyncAt) return "Never";
    try {
      const d = new Date(settings.lastSyncAt);
      if (isNaN(d.getTime())) return String(settings.lastSyncAt);
      return d.toLocaleString("en-GB", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return String(settings.lastSyncAt);
    }
  }, [settings.lastSyncAt]);

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

          {/* Account */}
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
            {user ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="avatar"
                      className="w-8 h-8 rounded-full"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-300" />
                  )}
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">
                      {user.displayName || "Signed in user"}
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {user.email || ""}
                    </div>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    try {
                      await signOutUser();
                    } catch (e) {
                      alert("Failed to sign out. Please try again.");
                    }
                  }}
                  className="text-sm bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Not signed in</p>
            )}
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

          {/* Storage Mode */}
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
              Storage
            </h3>
            <div className="space-y-2">
              <p className="text-xs text-slate-500">
                When Cloud Storage is ON, your data auto-syncs to your account
                so you can access it on any device. You can also run manual
                syncs below.
              </p>
              <div className="flex items-center justify-between text-xs">
                <span>
                  <span
                    className={`px-2 py-0.5 rounded-full border ${
                      settings.storageMode === "cloud"
                        ? "border-emerald-400 text-emerald-700 bg-emerald-50"
                        : "border-slate-300 text-slate-700 bg-slate-50"
                    }`}
                  >
                    Storage mode:{" "}
                    {settings.storageMode === "cloud" ? "Cloud" : "Local"}
                  </span>
                </span>
                <span className="text-slate-500">
                  Last synced: {lastSyncedDisplay}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-slate-700">
                    Use Cloud Storage
                  </span>
                  <p className="text-xs text-slate-500">
                    Automatically syncs your data when signed in
                  </p>
                </div>
                <button
                  onClick={async () => {
                    if (!user) {
                      alert("Sign in to use cloud storage.");
                      return;
                    }
                    const switchingToCloud = settings.storageMode !== "cloud";
                    if (switchingToCloud) {
                      // Check if cloud data exists first
                      const { readCloudSnapshot } = await import(
                        "../services/firestoreStorage"
                      );
                      try {
                        const cloudData = await readCloudSnapshot(user.uid);
                        const hasCloudData =
                          cloudData &&
                          (cloudData.settings ||
                            (cloudData.timeEntries &&
                              cloudData.timeEntries.length > 0) ||
                            (cloudData.dailySubmissions &&
                              cloudData.dailySubmissions.length > 0) ||
                            (cloudData.payHistory &&
                              cloudData.payHistory.length > 0));

                        if (hasCloudData) {
                          // Ask user what to do with existing cloud data
                          const choice = confirm(
                            "Cloud data exists. Do you want to:\n\n" +
                              "• OK: Use cloud data (downloads to this device)\n" +
                              "• Cancel: Upload local data (replaces cloud data)\n\n" +
                              "Choose OK to keep cloud data, Cancel to overwrite with local data."
                          );

                          if (choice) {
                            // Download cloud data to local
                            const { downloadCloudData } = await import(
                              "../services/firestoreStorage"
                            );
                            await downloadCloudData(user.uid);
                            const nowIso = new Date().toISOString();
                            updateSettings({
                              storageMode: "cloud",
                              lastSyncAt: nowIso,
                            });
                          } else {
                            // Upload local data to cloud
                            const local = {
                              settings: JSON.parse(
                                localStorage.getItem("settings") || "null"
                              ),
                              timeEntries: JSON.parse(
                                localStorage.getItem("timeEntries") || "[]"
                              ),
                              dailySubmissions: JSON.parse(
                                localStorage.getItem("dailySubmissions") || "[]"
                              ),
                              payHistory: JSON.parse(
                                localStorage.getItem("payHistory") || "[]"
                              ),
                            };
                            const { writeCloudSnapshot } = await import(
                              "../services/firestoreStorage"
                            );
                            await writeCloudSnapshot(user.uid, local);
                            const nowIso = new Date().toISOString();
                            updateSettings({
                              storageMode: "cloud",
                              lastSyncAt: nowIso,
                            });
                          }
                        } else {
                          // No cloud data exists, upload local data
                          const local = {
                            settings: JSON.parse(
                              localStorage.getItem("settings") || "null"
                            ),
                            timeEntries: JSON.parse(
                              localStorage.getItem("timeEntries") || "[]"
                            ),
                            dailySubmissions: JSON.parse(
                              localStorage.getItem("dailySubmissions") || "[]"
                            ),
                            payHistory: JSON.parse(
                              localStorage.getItem("payHistory") || "[]"
                            ),
                          };
                          const { writeCloudSnapshot } = await import(
                            "../services/firestoreStorage"
                          );
                          await writeCloudSnapshot(user.uid, local);
                          const nowIso = new Date().toISOString();
                          updateSettings({
                            storageMode: "cloud",
                            lastSyncAt: nowIso,
                          });
                        }
                      } catch (e) {
                        alert("Failed to enable cloud mode. Please try again.");
                        return;
                      }
                    } else {
                      updateSettings({ storageMode: "local" });
                    }
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.storageMode === "cloud"
                      ? "bg-[#003D5B]"
                      : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.storageMode === "cloud"
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    if (!user) return alert("Sign in first");
                    const confirmMsg =
                      "Upload local data to cloud? Existing cloud data will be replaced.";
                    if (!confirm(confirmMsg)) return;
                    const local = {
                      settings: JSON.parse(
                        localStorage.getItem("settings") || "null"
                      ),
                      timeEntries: JSON.parse(
                        localStorage.getItem("timeEntries") || "[]"
                      ),
                      dailySubmissions: JSON.parse(
                        localStorage.getItem("dailySubmissions") || "[]"
                      ),
                      payHistory: JSON.parse(
                        localStorage.getItem("payHistory") || "[]"
                      ),
                    };
                    import("../services/firestoreStorage").then(async (m) => {
                      await m.writeCloudSnapshot(user.uid, local);
                      alert("Synced to cloud.");
                    });
                  }}
                  className="w-full bg-slate-100 text-slate-700 py-1 px-2 rounded border border-slate-300 hover:bg-slate-200 transition-colors text-xs"
                >
                  Upload local data to cloud
                </button>
                <button
                  onClick={() => {
                    if (!user) return alert("Sign in first");
                    const confirmMsg =
                      "Download cloud data to this device? Local data will be replaced.";
                    if (!confirm(confirmMsg)) return;
                    import("../services/firestoreStorage").then(async (m) => {
                      const snap = await m.readCloudSnapshot(user.uid);
                      if (snap.settings)
                        localStorage.setItem(
                          "settings",
                          JSON.stringify(snap.settings)
                        );
                      localStorage.setItem(
                        "timeEntries",
                        JSON.stringify(snap.timeEntries || [])
                      );
                      localStorage.setItem(
                        "dailySubmissions",
                        JSON.stringify(snap.dailySubmissions || [])
                      );
                      localStorage.setItem(
                        "payHistory",
                        JSON.stringify(snap.payHistory || [])
                      );
                      alert("Synced to local. Reloading…");
                      setTimeout(() => window.location.reload(), 500);
                    });
                  }}
                  className="w-full bg-slate-100 text-slate-700 py-1 px-2 rounded border border-slate-300 hover:bg-slate-200 transition-colors text-xs"
                >
                  Download cloud data to this device
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                • Upload replaces your cloud data with what’s on this device. •
                Download replaces this device’s data with what’s in the cloud.
              </p>
              <button
                onClick={() => {
                  if (!user) return alert("Sign in first");
                  if (
                    !confirm("This will delete all your cloud data. Continue?")
                  )
                    return;
                  import("../services/firestoreStorage").then(async (m) => {
                    await m.clearCloudData(user.uid);
                    alert("Cloud data cleared.");
                  });
                }}
                className="w-full bg-red-700 text-white font-bold py-1.5 px-3 rounded-md hover:bg-red-800 transition-colors text-sm"
              >
                Delete all cloud data
              </button>
              <p className="text-[11px] text-slate-500">
                Permanently removes your cloud data for this app. Does not
                affect data on this device.
              </p>
            </div>
          </div>

          {/* Data Management (Local device only) */}
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
              Local data (this device)
            </h3>
            <div className="space-y-2">
              <button
                onClick={exportPayHistory}
                className="w-full bg-blue-500 text-white font-bold py-1.5 px-3 rounded-md hover:bg-blue-600 transition-colors text-sm"
              >
                Export Pay History (CSV)
              </button>
              <p className="text-[11px] text-slate-500 -mt-1">
                Exports the pay history currently stored on this device.
              </p>
              <button
                onClick={clearPayHistory}
                className="w-full bg-red-500 text-white font-bold py-1.5 px-3 rounded-md hover:bg-red-600 transition-colors text-sm"
              >
                Clear local pay history
              </button>
              <p className="text-[11px] text-slate-500 -mt-1">
                Removes pay history from this device only. Cloud data is not
                affected.
              </p>
              <button
                onClick={clearAllData}
                className="w-full bg-red-700 text-white font-bold py-1.5 px-3 rounded-md hover:bg-red-800 transition-colors text-sm"
              >
                Clear all local data
              </button>
              <p className="text-xs text-slate-500">
                Export your data for tax purposes or clear the data stored on
                this device.
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
              <p>Beta version 1.0.0</p>
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
