import React, { useMemo, useState, useEffect } from "react";
import { Settings as SettingsType, StandardRate, OvertimeRate } from "../types";
import type { User } from "firebase/auth";
import { signOutUser } from "../services/firebase";
import { isPremium } from "../services/firestoreStorage";
import { UserProfile } from "../types";
import UpgradeModal from "./UpgradeModal";

interface SettingsProps {
  settings: SettingsType;
  setSettings: (settings: SettingsType) => void;
  user?: User | null;
  userProfile?: UserProfile | null;
}

const Settings: React.FC<SettingsProps> = ({
  settings,
  setSettings,
  user,
  userProfile,
}) => {
  const [showTaxSection, setShowTaxSection] = useState(
    settings.enableTaxCalculations
  );
  const [hasCloudData, setHasCloudData] = useState(false);
  const [freeDownloadConsumed, setFreeDownloadConsumedState] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState<string | undefined>(
    undefined
  );
  const [showCloudInfo, setShowCloudInfo] = useState(false);

  const updateSettings = (updates: Partial<SettingsType>) => {
    setSettings({ ...settings, ...updates });
  };

  // Reusable premium badge
  const PremiumBadge: React.FC<{ text?: string }> = ({
    text = "Premium feature",
  }) => (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[10px] font-semibold bg-amber-100 text-amber-800 border-amber-200">
      {text}
    </span>
  );

  // Premium status checks
  const userIsPremium = isPremium(userProfile);
  const canAddStandardRate =
    userIsPremium || (settings.standardRates?.length || 0) < 1;
  const canAddOvertimeRate =
    userIsPremium || (settings.overtimeRates?.length || 0) < 1;
  const canUseCloudStorage = userIsPremium;
  const canUseTaxCalculations = userIsPremium;
  const canExportCSV = userIsPremium;

  const openUpgrade = (feature: string) => {
    setUpgradeFeature(feature);
    setUpgradeOpen(true);
  };

  // Normalize settings if user loses premium
  useEffect(() => {
    if (userIsPremium) return;
    const updates: Partial<SettingsType> = {};
    let changed = false;

    if (settings.enableTaxCalculations) {
      updates.enableTaxCalculations = false;
      changed = true;
      setShowTaxSection(false);
    }
    if (settings.enableNiCalculations) {
      updates.enableNiCalculations = false;
      changed = true;
    }
    if ((settings.standardRates?.length || 0) > 1) {
      updates.standardRates = [settings.standardRates![0]];
      changed = true;
    }
    if ((settings.overtimeRates?.length || 0) > 1) {
      updates.overtimeRates = [settings.overtimeRates![0]];
      changed = true;
    }
    if (settings.storageMode === "cloud") {
      updates.storageMode = "local";
      changed = true;
    }

    if (changed) updateSettings(updates);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userIsPremium]);

  // For downgraded free users: allow one-time download if cloud data exists
  useEffect(() => {
    const run = async () => {
      if (!user || userIsPremium) return;
      try {
        const { cloudDataExists, getFreeDownloadConsumed } = await import(
          "../services/firestoreStorage"
        );
        const [exists, consumed] = await Promise.all([
          cloudDataExists(user.uid),
          getFreeDownloadConsumed(user.uid),
        ]);
        setHasCloudData(exists);
        setFreeDownloadConsumedState(consumed);
      } catch (e) {
        // silent fail
      }
    };
    run();
  }, [user, userIsPremium]);

  const lastSyncedDisplay = useMemo(() => {
    if (!settings.lastSyncAt) return "—";
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

  const roleBadge = (() => {
    const role = userProfile?.role;
    if (role === "admin")
      return {
        label: "Admin",
        classes: "bg-red-100 text-red-800 border-red-200",
      };
    if (role === "premium")
      return {
        label: "Premium",
        classes: "bg-green-100 text-green-800 border-green-200",
      };
    if (role === "beta")
      return {
        label: "Beta Tester",
        classes: "bg-indigo-100 text-indigo-800 border-indigo-200",
      };
    return {
      label: "Free",
      classes: "bg-gray-100 text-gray-800 border-gray-200",
    };
  })();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(amount);
  };

  return (
    <div
      className={`h-full flex flex-col ${
        settings.darkMode
          ? "text-gray-100 bg-gray-800"
          : "text-[#003D5B] bg-[#FAF7F0]"
      }`}
    >
      {/* Upgrade Modal */}
      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        featureName={upgradeFeature}
        darkMode={settings.darkMode}
        supportEmail="jaosullivan0@gmail.com"
        userUid={user?.uid}
        userRole={userProfile?.role}
      />

      {/* Cloud Info Modal */}
      {showCloudInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div
            className={`w-full max-w-sm rounded-xl shadow-2xl border ${
              settings.darkMode
                ? "bg-gray-800 border-gray-600 text-gray-100"
                : "bg-white border-gray-200 text-slate-800"
            }`}
          >
            <div
              className={`px-4 py-3 border-b ${
                settings.darkMode ? "border-gray-600" : "border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold">How Cloud Sync works</h3>
                <button
                  onClick={() => setShowCloudInfo(false)}
                  className={
                    settings.darkMode
                      ? "text-gray-400 hover:text-gray-200"
                      : "text-slate-400 hover:text-slate-600"
                  }
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="px-4 py-3 space-y-2 text-sm">
              <p>
                - When Cloud Sync is ON, your data auto-syncs to your account
                and is available on any signed-in device.
              </p>
              <p>
                - Turning Cloud Sync OFF keeps your data on this device only.
              </p>
              <p>
                - Free users: Cloud is a premium feature. If you used Cloud
                before, you can download your data once to this device.
              </p>
            </div>
            <div
              className={`px-4 py-3 border-t ${
                settings.darkMode ? "border-gray-600" : "border-gray-200"
              } flex justify-end`}
            >
              <button
                onClick={() => setShowCloudInfo(false)}
                className={
                  settings.darkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-gray-100 px-3 py-1.5 rounded-md"
                    : "bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-md"
                }
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

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
            <div className="flex items-center justify-between">
              <h3
                className={`text-sm font-bold mb-2 ${
                  settings.darkMode ? "text-gray-100" : "text-slate-700"
                }`}
              >
                Account
              </h3>
              <span
                className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${roleBadge.classes}`}
                title={`Account role: ${roleBadge.label}`}
              >
                {roleBadge.label}
              </span>
            </div>
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
                    <div className="text-sm font-medium truncate flex items-center gap-2">
                      <span>{user.displayName || "Signed in user"}</span>
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
                  if (!canAddStandardRate) {
                    openUpgrade("multiple pay rates");
                    return;
                  }
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
                className={`w-full py-1 px-2 rounded border transition-colors text-xs ${
                  canAddStandardRate
                    ? "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
                    : "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed"
                }`}
              >
                + Add Standard Rate
              </button>
              {!canAddStandardRate && (
                <div className="flex items-center gap-1 mt-1">
                  <PremiumBadge text="Premium required" />
                  <span className="text-[11px] text-slate-500">
                    More than 1 standard rate requires Premium.
                  </span>
                </div>
              )}
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
                  if (!canAddOvertimeRate) {
                    openUpgrade("multiple pay rates");
                    return;
                  }
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
                className={`w-full py-1 px-2 rounded border transition-colors text-xs ${
                  canAddOvertimeRate
                    ? "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
                    : "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed"
                }`}
              >
                + Add Overtime Rate
              </button>
              {!canAddOvertimeRate && (
                <div className="flex items-center gap-1 mt-1">
                  <PremiumBadge text="Premium required" />
                  <span className="text-[11px] text-slate-500">
                    More than 1 overtime rate requires Premium.
                  </span>
                </div>
              )}
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
                  {!canUseTaxCalculations && (
                    <div className="mt-1">
                      <PremiumBadge />
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    if (!canUseTaxCalculations) {
                      openUpgrade("tax calculations");
                      return;
                    }
                    const newValue = !settings.enableTaxCalculations;
                    updateSettings({ enableTaxCalculations: newValue });
                    setShowTaxSection(newValue);
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.enableTaxCalculations
                      ? "bg-[#003D5B]"
                      : "bg-slate-300"
                  } ${
                    !canUseTaxCalculations
                      ? "opacity-60 cursor-not-allowed"
                      : ""
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
                    disabled={!canUseTaxCalculations}
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
                  {!canUseTaxCalculations && (
                    <div className="mt-1">
                      <PremiumBadge />
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    if (!canUseTaxCalculations) {
                      openUpgrade("NI calculations");
                      return;
                    }
                    const newValue = !settings.enableNiCalculations;
                    updateSettings({ enableNiCalculations: newValue });
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.enableNiCalculations
                      ? "bg-[#003D5B]"
                      : "bg-slate-300"
                  } ${
                    !canUseTaxCalculations
                      ? "opacity-60 cursor-not-allowed"
                      : ""
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
            <div className="flex items-center justify-between mb-2">
              <h3
                className={`text-sm font-bold ${
                  settings.darkMode ? "text-gray-100" : "text-slate-700"
                }`}
              >
                Cloud Sync
              </h3>
              <button
                onClick={() => setShowCloudInfo(true)}
                className={`transition-colors ${
                  settings.darkMode
                    ? "text-gray-400 hover:text-gray-200"
                    : "text-slate-400 hover:text-slate-600"
                }`}
                title="How Cloud Sync works"
                aria-label="How Cloud Sync works"
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
            <div className="space-y-2">
              <p className="text-xs text-slate-500">
                Cloud OFF: data stays on this device. Cloud ON: data auto-syncs
                to your account.
              </p>
              <div className="flex items-center justify-between text-[10px]">
                <span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full border ${
                      settings.storageMode === "cloud"
                        ? "border-emerald-400 text-emerald-700 bg-emerald-50"
                        : "border-slate-300 text-slate-700 bg-slate-50"
                    }`}
                  >
                    {settings.storageMode === "cloud"
                      ? "Cloud ON"
                      : "Cloud OFF"}
                  </span>
                </span>
                <span className="text-slate-500">
                  Last synced: {lastSyncedDisplay}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-slate-700">
                    Cloud Sync
                  </span>
                  <p className="text-xs text-slate-500">
                    Automatically syncs your data when signed in
                  </p>
                  {!canUseCloudStorage && (
                    <div className="mt-1">
                      <PremiumBadge />
                    </div>
                  )}
                </div>
                <button
                  onClick={async () => {
                    if (!user) {
                      alert("Sign in to use cloud sync.");
                      return;
                    }
                    if (!canUseCloudStorage) {
                      openUpgrade("Cloud Sync");
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
                              "• Cancel: Upload this device's data (replaces cloud data)\n\n" +
                              "Choose OK to keep cloud data, Cancel to overwrite with this device's data."
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
                        alert("Failed to enable cloud sync. Please try again.");
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
                  } ${
                    !canUseCloudStorage ? "opacity-60 cursor-not-allowed" : ""
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
                    if (!canUseCloudStorage) {
                      openUpgrade("Cloud Sync");
                      return;
                    }
                    const confirmMsg =
                      "Upload this device's data to cloud? Existing cloud data will be replaced.";
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
                  className={`w-full py-1 px-2 rounded border transition-colors text-xs ${
                    canUseCloudStorage
                      ? "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
                      : "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed"
                  }`}
                >
                  Upload this device's data to cloud
                </button>
                <button
                  onClick={() => {
                    if (!user) return alert("Sign in first");
                    const allowDownload =
                      canUseCloudStorage ||
                      (hasCloudData && !freeDownloadConsumed);
                    if (!allowDownload) {
                      openUpgrade("Cloud Sync");
                      return;
                    }
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

                      if (
                        !canUseCloudStorage &&
                        hasCloudData &&
                        !freeDownloadConsumed
                      ) {
                        try {
                          await m.setFreeDownloadConsumed(user.uid);
                          setFreeDownloadConsumedState(true);
                          updateSettings({
                            storageMode: "local",
                            enableTaxCalculations: false,
                            enableNiCalculations: false,
                          });
                        } catch {}
                      }

                      alert("Synced to local. Reloading…");
                      setTimeout(() => window.location.reload(), 500);
                    });
                  }}
                  className={`w-full py-1 px-2 rounded border transition-colors text-xs ${
                    canUseCloudStorage ||
                    (hasCloudData && !freeDownloadConsumed)
                      ? "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
                      : "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed"
                  }`}
                >
                  Download cloud data to this device
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                • Upload replaces your cloud data with this device's data. •
                Download replaces this device’s data with what’s in the cloud.
              </p>
              <button
                onClick={() => {
                  if (!user) return alert("Sign in first");
                  if (!canUseCloudStorage) {
                    openUpgrade("Cloud Sync");
                    return;
                  }
                  if (!confirm("This will delete your cloud data. Continue?"))
                    return;
                  import("../services/firestoreStorage").then(async (m) => {
                    await m.clearCloudData(user.uid);
                    alert("Cloud data cleared.");
                  });
                }}
                className={`w-full font-bold py-1.5 px-3 rounded-md transition-colors text-sm ${
                  canUseCloudStorage
                    ? "bg-red-700 text-white hover:bg-red-800"
                    : "bg-red-200 text-white cursor-not-allowed"
                }`}
              >
                Delete cloud data (keeps this device's data)
              </button>
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
              Data on this device
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => setUpgradeOpen(true)}
                className={`w-full font-bold py-1.5 px-3 rounded-md transition-colors text-sm ${
                  canExportCSV
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "bg-blue-200 text-white cursor-not-allowed"
                }`}
              >
                Export Pay History (CSV){" "}
                {canExportCSV ? "" : "(Premium required)"}
              </button>
              {!canExportCSV && (
                <div className="mt-1">
                  <PremiumBadge text="Premium required" />
                </div>
              )}
              <p className="text-[11px] text-slate-500 -mt-1">
                Exports the pay history currently stored on this device.
              </p>
              <button
                onClick={() => {
                  if (
                    !confirm(
                      "This will permanently delete all saved pay on this device. Continue?"
                    )
                  )
                    return;
                  localStorage.removeItem("payHistory");
                  alert("All pay history has been cleared.");
                }}
                className="w-full bg-red-500 text-white font-bold py-1.5 px-3 rounded-md hover:bg-red-600 transition-colors text-sm"
              >
                Clear local pay history
              </button>
              <p className="text-[11px] text-slate-500 -mt-1">
                Removes pay history from this device only. Cloud data is not
                affected.
              </p>
              <button
                onClick={() => {
                  if (
                    !confirm(
                      "This will permanently delete ALL local data (entries, pay history, settings). Continue?"
                    )
                  )
                    return;
                  localStorage.clear();
                  alert("All local data has been cleared. Reloading…");
                  setTimeout(() => window.location.reload(), 500);
                }}
                className="w-full bg-red-700 text-white font-bold py-1.5 px-3 rounded-md hover:bg-red-800 transition-colors text-sm"
              >
                Clear all local data
              </button>
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

          {/* Support / Contact */}
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
              Support
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <a
                href={`mailto:${encodeURIComponent(
                  "jaosullivan0@gmail.com"
                )}?subject=${encodeURIComponent(
                  "Driver Buddy - Premium access request"
                )}&body=${encodeURIComponent(
                  `Hi,\n\nI'd like premium access.\n\nDiagnostics:\nUID: ${
                    user?.uid || "n/a"
                  }\nRole: ${userProfile?.role || "n/a"}\n\nThanks!`
                )}`}
                className="block w-full text-center bg-slate-100 text-slate-700 py-1 px-2 rounded border border-slate-300 hover:bg-slate-200 transition-colors text-xs"
              >
                Request Premium Access
              </a>
              <a
                href={`mailto:${encodeURIComponent(
                  "jaosullivan0@gmail.com"
                )}?subject=${encodeURIComponent(
                  "Driver Buddy - Bug report / feedback"
                )}&body=${encodeURIComponent(
                  `Hi,\n\nI found a bug / have feedback:\n\n(Describe here)\n\nDiagnostics:\nUID: ${
                    user?.uid || "n/a"
                  }\nRole: ${userProfile?.role || "n/a"}\n\nThanks!`
                )}`}
                className="block w-full text-center bg-slate-100 text-slate-700 py-1 px-2 rounded border border-slate-300 hover:bg-slate-200 transition-colors text-xs"
              >
                Report a Bug / Feedback
              </a>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              We’ll reply as soon as possible.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
