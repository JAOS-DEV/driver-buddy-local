import React from "react";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  featureName?: string;
  darkMode?: boolean;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  open,
  onClose,
  featureName = "this feature",
  darkMode = false,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div
        className={`w-full max-w-sm rounded-xl shadow-2xl border ${
          darkMode
            ? "bg-gray-800 border-gray-600 text-gray-100"
            : "bg-white border-gray-200 text-slate-800"
        }`}
      >
        <div
          className={`px-4 py-3 border-b ${
            darkMode ? "border-gray-600" : "border-gray-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold">Upgrade to Premium</h3>
            <button
              onClick={onClose}
              className={
                darkMode
                  ? "text-gray-400 hover:text-gray-200"
                  : "text-slate-400 hover:text-slate-600"
              }
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>
        <div className="px-4 py-3 space-y-3">
          <p className={darkMode ? "text-gray-300" : "text-slate-600"}>
            Unlock <strong>{featureName}</strong> and more with Premium.
          </p>
          <ul className="list-disc pl-5 text-sm space-y-1">
            <li>Cloud storage across devices</li>
            <li>Tax & NI calculations</li>
            <li>Unlimited pay history</li>
            <li>CSV export</li>
            <li>Multiple pay rates</li>
          </ul>
          <div className="text-xs mt-1">
            <span className={darkMode ? "text-gray-400" : "text-slate-500"}>
              Contact the admin to upgrade your account.
            </span>
          </div>
        </div>
        <div
          className={`px-4 py-3 border-t flex justify-end ${
            darkMode ? "border-gray-600" : "border-gray-200"
          }`}
        >
          <button
            onClick={onClose}
            className={
              darkMode
                ? "bg-gray-700 hover:bg-gray-600 text-gray-100 px-3 py-1.5 rounded-md"
                : "bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-md"
            }
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
