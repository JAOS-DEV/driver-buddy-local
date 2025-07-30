import React from "react";
import useLocalStorage from "../hooks/useLocalStorage";
import {
  decimalHoursToDuration,
  formatDurationWithMinutes,
} from "../hooks/useTimeCalculations";

interface WageCalculatorProps {
  totalMinutes: number;
  hourlyRate: number;
  setHourlyRate: (rate: number) => void;
}

const WageCalculator: React.FC<WageCalculatorProps> = ({
  totalMinutes,
  hourlyRate,
  setHourlyRate,
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

  const duration = useManualHours
    ? {
        hours: manualHours,
        minutes: manualMinutes,
        totalMinutes: manualHours * 60 + manualMinutes,
      }
    : decimalHoursToDuration(totalMinutes / 60);

  const totalEarnings = (duration.totalMinutes / 60) * hourlyRate;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(amount);
  };

  return (
    <div className="h-full flex flex-col text-[#003D5B]">
      <div className="flex-shrink-0 space-y-2">
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
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        <div className="flex justify-between items-center bg-white/50 p-2 rounded-md border border-gray-200/50">
          <span className="text-sm text-slate-600">
            {useManualHours ? "Manual Hours" : "Time Tracker Hours"}
          </span>
          <span className="font-mono text-base">
            {formatDurationWithMinutes(duration)}
          </span>
        </div>
        <div className="flex justify-between items-center bg-white/50 p-2 rounded-md border border-gray-200/50">
          <span className="text-sm text-slate-600">Hourly Rate</span>
          <span className="font-mono text-base">
            {formatCurrency(hourlyRate)}
          </span>
        </div>
      </div>

      <div className="flex-shrink-0 border-t border-slate-200 pt-3 mt-3">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-bold tracking-wider uppercase text-slate-500">
            ESTIMATED WAGE
          </h2>
          <p className="text-3xl font-bold text-[#003D5B]">
            {formatCurrency(totalEarnings)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default WageCalculator;
