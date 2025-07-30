import React from 'react';

interface LawLimitsProps {
  totalMinutes: number;
}

const ProgressBar: React.FC<{ value: number; max: number; label: string }> = ({ value, max, label }) => {
  const percentage = Math.min((value / max) * 100, 100);
  const isOver = value > max;
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-base font-medium text-slate-700">{label}</span>
        <span className={`text-sm font-medium ${isOver ? 'text-red-600' : 'text-slate-500'}`}>
          {value.toFixed(2)} / {max} hours
        </span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full ${isOver ? 'bg-red-500' : 'bg-[#003D5B]'}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      {isOver && (
        <p className="text-red-600 text-xs mt-1">You have exceeded the legal limit.</p>
      )}
    </div>
  );
};

const LawLimits: React.FC<LawLimitsProps> = ({ totalMinutes }) => {
  const dailyHours = totalMinutes / 60;

  // These would typically come from a more persistent state
  const weeklyHours = dailyHours + 35; // Example: 35 hours already worked this week
  const fortnightlyHours = weeklyHours + 48; // Example: 48 hours from last week

  const UK_DAILY_LIMIT = 9; // Can be extended to 10 twice a week
  const UK_WEEKLY_LIMIT = 56;
  const UK_FORTNIGHTLY_LIMIT = 90;

  return (
    <div className="space-y-8 text-[#003D5B]">
      <div>
        <h2 className="text-lg font-bold mb-4">Driving Time Limits (UK Standard)</h2>
        <div className="space-y-6">
          <ProgressBar value={dailyHours} max={UK_DAILY_LIMIT} label="Daily Driving" />
          <ProgressBar value={weeklyHours} max={UK_WEEKLY_LIMIT} label="Weekly Driving" />
          <ProgressBar value={fortnightlyHours} max={UK_FORTNIGHTLY_LIMIT} label="Fortnightly Driving" />
        </div>
      </div>
      <div className="text-xs text-slate-500 text-center p-4 bg-slate-100/50 rounded-lg">
        Disclaimer: This is for informational purposes only and not legal advice. Always refer to official documentation and your contract.
      </div>
    </div>
  );
};

export default LawLimits;
