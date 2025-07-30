import React, { useState, useRef, useEffect } from "react";
import { TimeEntry } from "../types";
import { useTimeCalculations } from "../hooks/useTimeCalculations";
import { PlusIcon, TrashIcon } from "./icons";

interface TimeTrackerProps {
  entries: TimeEntry[];
  addEntry: (startTime: string, endTime: string) => void;
  removeEntry: (id: number) => void;
}

const TimeTracker: React.FC<TimeTrackerProps> = ({
  entries,
  addEntry,
  removeEntry,
}) => {
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [startTimeError, setStartTimeError] = useState("");
  const [endTimeError, setEndTimeError] = useState("");
  const [entriesHeight, setEntriesHeight] = useState(200); // Default fallback
  const {
    totalDuration,
    formatDuration,
    formatDurationWithMinutes,
    calculateDuration,
  } = useTimeCalculations(entries);
  const endTimeRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const totalRef = useRef<HTMLDivElement>(null);
  const entriesHeaderRef = useRef<HTMLHeadingElement>(null);

  // Calculate available space for entries
  useEffect(() => {
    const calculateEntriesHeight = () => {
      if (
        containerRef.current &&
        formRef.current &&
        totalRef.current &&
        entriesHeaderRef.current
      ) {
        const containerHeight = containerRef.current.clientHeight;
        const formHeight = formRef.current.offsetHeight;
        const totalHeight = totalRef.current.offsetHeight;
        const entriesHeaderHeight = entriesHeaderRef.current.offsetHeight;

        // Calculate available space: container - form - total - header - margins/padding
        const availableHeight =
          containerHeight - formHeight - totalHeight - entriesHeaderHeight - 50; // Increased margins for safety

        // More aggressive constraints for very small screens (iPhone SE)
        let minHeight, maxHeight;

        if (window.innerHeight <= 667) {
          // iPhone SE and smaller
          minHeight = 60; // Very small minimum
          maxHeight = Math.min(availableHeight, 120); // Max 120px on tiny screens
        } else if (window.innerHeight < 700) {
          // Small screens
          minHeight = 80;
          maxHeight = Math.min(availableHeight, window.innerHeight * 0.25); // Max 25% of viewport
        } else {
          // Normal screens
          minHeight = 120;
          maxHeight = Math.min(availableHeight, window.innerHeight * 0.4); // Max 40% of viewport
        }

        const calculatedHeight = Math.max(
          minHeight,
          Math.min(maxHeight, availableHeight)
        );

        // Final safety check - ensure we never exceed 30% of viewport height on very small screens
        const finalHeight =
          window.innerHeight <= 667
            ? Math.min(calculatedHeight, window.innerHeight * 0.3)
            : calculatedHeight;

        setEntriesHeight(finalHeight);
      }
    };

    // Use setTimeout to ensure DOM is fully rendered
    const timeoutId = setTimeout(calculateEntriesHeight, 100);

    // Recalculate on window resize
    window.addEventListener("resize", calculateEntriesHeight);

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", calculateEntriesHeight);
    };
  }, [entries]); // Recalculate when entries change

  const isValidTime = (time: string, allow24: boolean = false): boolean => {
    if (!time) return false;

    const digits = time.replace(/\D/g, "");
    if (digits.length === 4) {
      const hours = parseInt(digits.slice(0, 2));
      const minutes = parseInt(digits.slice(2));

      if (allow24) {
        return hours <= 24 && (hours < 24 || minutes === 0) && minutes <= 59;
      }
      return hours <= 23 && minutes <= 59;
    }

    return false;
  };

  const formatTimeInput = (value: string): string => {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length > 2) {
      return `${digits.slice(0, 2)}:${digits.slice(2)}`;
    }
    return digits;
  };

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatTimeInput(e.target.value);
    setStartTime(formatted);
    setStartTimeError(""); // Clear error while typing

    const digitsOnly = e.target.value.replace(/\D/g, "");
    if (digitsOnly.length === 4) {
      const hours = parseInt(digitsOnly.slice(0, 2));
      const minutes = parseInt(digitsOnly.slice(2));

      if (hours <= 23 && minutes <= 59) {
        endTimeRef.current?.focus();
      } else {
        if (hours > 23) {
          setStartTimeError("Hours must be between 00-23");
        } else if (minutes > 59) {
          setStartTimeError("Minutes must be between 00-59");
        }
      }
    }
  };

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatTimeInput(e.target.value);
    setEndTime(formatted);
    setEndTimeError(""); // Clear error while typing

    const digitsOnly = e.target.value.replace(/\D/g, "");
    if (digitsOnly.length === 4) {
      const hours = parseInt(digitsOnly.slice(0, 2));
      const minutes = parseInt(digitsOnly.slice(2));

      if (hours > 24 || (hours === 24 && minutes > 0)) {
        setEndTimeError(
          hours === 24
            ? "24:00 is the only valid time for hour 24"
            : "Hours must be between 00-24"
        );
      } else if (minutes > 59) {
        setEndTimeError("Minutes must be between 00-59");
      }
    }
  };

  // Remove blur handlers entirely

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValidTime(startTime) && isValidTime(endTime, true)) {
      addEntry(startTime, endTime);
      setStartTime("");
      setEndTime("");
      setStartTimeError("");
      setEndTimeError("");
    }
  };

  const isFormValid = isValidTime(startTime) && isValidTime(endTime, true);

  return (
    <div
      ref={containerRef}
      className="h-full flex flex-col text-[#003D5B] overflow-hidden"
    >
      {/* Fixed form section */}
      <div ref={formRef} className="flex-shrink-0">
        <form
          onSubmit={handleAddEntry}
          className="bg-white/50 p-3 rounded-lg border border-gray-200/80 mb-4"
        >
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="min-h-[5.5rem]">
              <label
                htmlFor="start-time"
                className="text-xs font-bold tracking-wider uppercase text-slate-500"
              >
                START TIME
              </label>
              <input
                id="start-time"
                name="start-time"
                type="text"
                inputMode="numeric"
                title="Enter time in HHMM format (e.g., 0930)"
                placeholder="HHMM"
                maxLength={5}
                value={startTime}
                onChange={handleStartTimeChange}
                className={`mt-1 w-full p-1.5 text-lg bg-transparent border rounded-md focus:ring-2 focus:ring-[#003D5B] focus:border-[#003D5B] ${
                  startTimeError ? "border-red-500" : "border-slate-300"
                }`}
              />
              {startTimeError && (
                <p className="mt-1 text-xs text-red-500">{startTimeError}</p>
              )}
            </div>
            <div className="min-h-[5.5rem]">
              <label
                htmlFor="end-time"
                className="text-xs font-bold tracking-wider uppercase text-slate-500"
              >
                END TIME
              </label>
              <input
                ref={endTimeRef}
                id="end-time"
                name="end-time"
                type="text"
                inputMode="numeric"
                title="Enter time in HHMM format (e.g., 1700 or 2400)"
                placeholder="HHMM"
                maxLength={5}
                value={endTime}
                onChange={handleEndTimeChange}
                className={`mt-1 w-full p-1.5 text-lg bg-transparent border rounded-md focus:ring-2 focus:ring-[#003D5B] focus:border-[#003D5B] ${
                  endTimeError ? "border-red-500" : "border-slate-300"
                }`}
              />
              {endTimeError && (
                <p className="mt-1 text-xs text-red-500">{endTimeError}</p>
              )}
            </div>
          </div>
          <button
            type="submit"
            disabled={!isFormValid}
            className="w-full flex items-center justify-center gap-2 bg-[#003D5B] text-white font-bold py-2 px-3 rounded-md hover:bg-sky-800 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed text-sm"
          >
            <PlusIcon className="h-5 w-5" />
            Add Entry
          </button>
        </form>
      </div>

      {/* Entries section with calculated height */}
      <div className="flex-shrink-0">
        <h2
          ref={entriesHeaderRef}
          className="text-xs font-bold tracking-wider uppercase text-slate-500 mb-2"
        >
          ENTRIES
        </h2>
        <div
          className="overflow-y-auto"
          style={{ height: `${entriesHeight}px` }}
        >
          <div className="space-y-2">
            {entries.length === 0 ? (
              <p className="text-center text-slate-500 py-4">No entries yet.</p>
            ) : (
              entries.map((entry) => {
                const duration = calculateDuration(
                  entry.startTime,
                  entry.endTime
                );
                return (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between bg-white/50 p-2 rounded-md border border-gray-200/50"
                  >
                    <div className="flex items-center space-x-3 text-base">
                      <span>{entry.startTime}</span>
                      <span className="text-slate-400">&mdash;</span>
                      <span>{entry.endTime}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-base text-slate-600">
                        {formatDurationWithMinutes(duration)}
                      </span>
                      <button
                        onClick={() => removeEntry(entry.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Fixed total section - guaranteed to be visible */}
      <div
        ref={totalRef}
        className="flex-shrink-0 border-t border-slate-200 pt-4 mt-4"
      >
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-bold tracking-wider uppercase text-slate-500">
            TOTAL
          </h2>
          <p className="text-2xl font-bold text-[#003D5B] font-mono">
            {formatDurationWithMinutes(totalDuration)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TimeTracker;
