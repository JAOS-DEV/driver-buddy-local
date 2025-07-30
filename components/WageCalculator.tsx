import React from 'react';

interface WageCalculatorProps {
  totalMinutes: number;
  hourlyRate: number;
  setHourlyRate: (rate: number) => void;
}

const WageCalculator: React.FC<WageCalculatorProps> = ({ totalMinutes, hourlyRate, setHourlyRate }) => {
  const totalHours = totalMinutes / 60;
  const totalEarnings = totalHours * hourlyRate;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount);
  };

  return (
    <div className="space-y-6 text-[#003D5B]">
      <div className="bg-white/50 p-4 rounded-lg border border-gray-200/80">
        <label htmlFor="hourly-rate" className="text-xs font-bold tracking-wider uppercase text-slate-500">
          HOURLY RATE (£)
        </label>
        <input
          id="hourly-rate"
          type="number"
          value={hourlyRate || ''}
          onChange={(e) => setHourlyRate(parseFloat(e.target.value) || 0)}
          placeholder="e.g., 18.50"
          className="mt-1 w-full p-2 text-xl bg-transparent border border-slate-300 rounded-md focus:ring-2 focus:ring-[#003D5B] focus:border-[#003D5B]"
        />
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center bg-white/50 p-3 rounded-md border border-gray-200/50">
          <span className="text-slate-600">Total Hours Worked</span>
          <span className="font-mono text-lg">{totalHours.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center bg-white/50 p-3 rounded-md border border-gray-200/50">
          <span className="text-slate-600">Hourly Rate</span>
          <span className="font-mono text-lg">{formatCurrency(hourlyRate)}</span>
        </div>
      </div>

      <div className="border-t border-slate-200 pt-4">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-bold tracking-wider uppercase text-slate-500">ESTIMATED WAGE</h2>
          <p className="text-5xl font-bold text-[#003D5B]">{formatCurrency(totalEarnings)}</p>
        </div>
      </div>
    </div>
  );
};

export default WageCalculator;
