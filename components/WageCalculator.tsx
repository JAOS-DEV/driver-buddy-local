import React from "react";
import useLocalStorage from "../hooks/useLocalStorage";

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

  const totalHours = useManualHours ? manualHours : totalMinutes / 60;
  const totalEarnings = totalHours * hourlyRate;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(amount);
  };

  return (
    <div className="space-y-6 text-[#003D5B]">
      {/* Toggle for calculation method */}
      <div className="bg-white/50 p-3 rounded-lg border border-gray-200/80">
        <label className="text-xs font-bold tracking-wider uppercase text-slate-500 block mb-3">
          CALCULATION METHOD
        </label>
        <div className="flex items-center justify-between">
          <span
            className={`text-sm font-medium ${
              !useManualHours ? "text-[#003D5B]" : "text-slate-500"
            }`}
          >
            Time Tracker
          </span>
          <button
            onClick={() => setUseManualHours(!useManualHours)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              useManualHours ? "bg-[#003D5B]" : "bg-slate-300"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                useManualHours ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
          <span
            className={`text-sm font-medium ${
              useManualHours ? "text-[#003D5B]" : "text-slate-500"
            }`}
          >
            Manual Hours
          </span>
        </div>
      </div>

      {/* Hourly Rate Input */}
      <div className="bg-white/50 p-3 rounded-lg border border-gray-200/80">
        <label
          htmlFor="hourly-rate"
          className="text-xs font-bold tracking-wider uppercase text-slate-500"
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
          className="mt-1 w-full p-1.5 text-lg bg-transparent border border-slate-300 rounded-md focus:ring-2 focus:ring-[#003D5B] focus:border-[#003D5B]"
        />
      </div>

      {/* Manual Hours Input (conditional) */}
      {useManualHours && (
        <div className="bg-white/50 p-3 rounded-lg border border-gray-200/80">
          <label
            htmlFor="manual-hours"
            className="text-xs font-bold tracking-wider uppercase text-slate-500"
          >
            HOURS WORKED
          </label>
          <input
            id="manual-hours"
            type="number"
            inputMode="decimal"
            step="0.1"
            min="0"
            value={manualHours || ""}
            onChange={(e) => setManualHours(parseFloat(e.target.value) || 0)}
            placeholder="e.g., 8.5"
            className="mt-1 w-full p-1.5 text-lg bg-transparent border border-slate-300 rounded-md focus:ring-2 focus:ring-[#003D5B] focus:border-[#003D5B]"
          />
        </div>
      )}

      <div className="space-y-4">
        <div className="flex justify-between items-center bg-white/50 p-3 rounded-md border border-gray-200/50">
          <span className="text-slate-600">
            {useManualHours ? "Manual Hours" : "Time Tracker Hours"}
          </span>
          <span className="font-mono text-lg">{totalHours.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center bg-white/50 p-3 rounded-md border border-gray-200/50">
          <span className="text-slate-600">Hourly Rate</span>
          <span className="font-mono text-lg">
            {formatCurrency(hourlyRate)}
          </span>
        </div>
      </div>

      <div className="border-t border-slate-200 pt-4">
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
