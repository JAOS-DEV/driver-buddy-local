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
  const [entriesHeight, setEntriesHeight] = useState(200); // Default fallback
  const { totalDuration, formatDuration, calculateDuration } =
    useTimeCalculations(entries);
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
    const regex2359 = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;
    if (regex2359.test(time)) return true;
    if (allow24 && time === "24:00") return true;
    return false;
  };

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValidTime(startTime) && isValidTime(endTime, true)) {
      addEntry(startTime, endTime);
      setStartTime("");
      setEndTime("");
    }
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

    const digitsOnly = e.target.value.replace(/\D/g, "");
    if (digitsOnly.length === 4 && isValidTime(formatted)) {
      endTimeRef.current?.focus();
    }
  };

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatTimeInput(e.target.value);
    setEndTime(formatted);
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
          className="bg-white/50 p-4 rounded-lg border border-gray-200/80 mb-6"
        >
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs font-bold tracking-wider uppercase text-slate-500">
                START TIME
              </label>
              <input
                type="text"
                title="Enter time in HHMM format (e.g., 0930)"
                placeholder="HHMM"
                maxLength={5}
                value={startTime}
                onChange={handleStartTimeChange}
                className="mt-1 w-full p-2 text-xl bg-transparent border border-slate-300 rounded-md focus:ring-2 focus:ring-[#003D5B] focus:border-[#003D5B]"
              />
            </div>
            <div>
              <label className="text-xs font-bold tracking-wider uppercase text-slate-500">
                END TIME
              </label>
              <input
                ref={endTimeRef}
                type="text"
                title="Enter time in HHMM format (e.g., 1700 or 2400)"
                placeholder="HHMM"
                maxLength={5}
                value={endTime}
                onChange={handleEndTimeChange}
                className="mt-1 w-full p-2 text-xl bg-transparent border border-slate-300 rounded-md focus:ring-2 focus:ring-[#003D5B] focus:border-[#003D5B]"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={!isFormValid}
            className="w-full flex items-center justify-center gap-2 bg-[#003D5B] text-white font-bold py-3 px-4 rounded-md hover:bg-sky-800 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
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
                    className="flex items-center justify-between bg-white/50 p-3 rounded-md border border-gray-200/50"
                  >
                    <div className="flex items-center space-x-4 text-lg">
                      <span>{entry.startTime}</span>
                      <span className="text-slate-400">&mdash;</span>
                      <span>{entry.endTime}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-lg text-slate-600">
                        {formatDuration(duration)}
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
          <p className="text-5xl font-bold text-[#003D5B]">
            {formatDuration(totalDuration)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TimeTracker;
