import React, { useState, useRef, useEffect } from "react";
import { TimeEntry, DailySubmission } from "../types";
import { useTimeCalculations } from "../hooks/useTimeCalculations";
import { PlusIcon, TrashIcon } from "./icons";
import useLocalStorage from "../hooks/useLocalStorage";

interface TimeTrackerProps {
  entries: TimeEntry[];
  addEntry: (startTime: string, endTime: string) => void;
  removeEntry: (id: number) => void;
  onDailySubmit?: (submission: DailySubmission) => void;
}

const TimeTracker: React.FC<TimeTrackerProps> = ({
  entries,
  addEntry,
  removeEntry,
  onDailySubmit,
}) => {
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [startTimeError, setStartTimeError] = useState("");
  const [endTimeError, setEndTimeError] = useState("");
  const [entriesHeight, setEntriesHeight] = useState(200); // Default fallback
  const [showHistory, setShowHistory] = useState(false);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({
    message: "",
    visible: false,
  });

  const [dailySubmissions, setDailySubmissions] = useLocalStorage<
    DailySubmission[]
  >("dailySubmissions", []);
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

  // Toast effect
  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => {
        setToast({ message: "", visible: false });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.visible]);

  // Calculate available space for entries
  useEffect(() => {
    const calculateEntriesHeight = () => {
      if (
        containerRef.current &&
        formRef.current &&
        totalRef.current &&
        entriesHeaderRef.current
      ) {
        // Get the actual viewport height
        const viewportHeight = window.innerHeight;

        // Get the container's position and height
        const containerRect = containerRef.current.getBoundingClientRect();
        const containerTop = containerRect.top;

        // Calculate the available height from container top to viewport bottom
        const availableViewportHeight = viewportHeight - containerTop;

        // Get the heights of fixed elements
        const formHeight = formRef.current.offsetHeight;
        const totalHeight = totalRef.current.offsetHeight;
        const entriesHeaderHeight = entriesHeaderRef.current.offsetHeight;

        // Account for navigation bar height (64px) and some padding
        const navBarHeight = 64;
        const padding = 16;

        // Calculate available space for entries
        const availableHeight =
          availableViewportHeight -
          formHeight -
          totalHeight -
          entriesHeaderHeight -
          navBarHeight -
          padding;

        // Ensure minimum height and set the height
        const finalHeight = Math.max(availableHeight, 100);
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

  // Get today's date
  const today = new Date().toISOString().split("T")[0];

  // Get all submissions for today
  const todaySubmissions = dailySubmissions.filter((sub) => sub.date === today);
  const canSubmitToday = entries.length > 0;

  const handleSubmitDay = () => {
    if (entries.length === 0) return;

    const submission: DailySubmission = {
      date: today,
      timestamp: new Date().toISOString(),
      entries: [...entries],
      totalMinutes: totalDuration.totalMinutes,
    };

    setDailySubmissions((prev) => [...prev, submission]);

    // Show toast notification
    const newCount = todaySubmissions.length + 1;
    setToast({
      message: `${newCount} submission${newCount > 1 ? "s" : ""} for today`,
      visible: true,
    });

    // Clear current entries after submission
    entries.forEach((entry) => removeEntry(entry.id));

    // Notify parent component
    onDailySubmit?.(submission);
  };

  const handleClearDay = (timestamp: string) => {
    setDailySubmissions((prev) =>
      prev.filter((sub) => sub.timestamp !== timestamp)
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div
      ref={containerRef}
      className="h-full flex flex-col text-[#003D5B] overflow-hidden relative"
    >
      {/* Toast Notification */}
      {toast.visible && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
            <span className="text-sm font-medium">✅ {toast.message}</span>
          </div>
        </div>
      )}

      {/* Fixed form section */}
      <div ref={formRef} className="flex-shrink-0">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xs font-bold tracking-wider uppercase text-slate-500">
            TODAY'S ENTRIES
          </h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className="text-xs bg-slate-500 text-white px-3 py-1 rounded-md hover:bg-slate-600 transition-colors"
            >
              {showHistory ? "Hide History" : "Show History"}
            </button>
            {canSubmitToday && (
              <button
                type="button"
                onClick={handleSubmitDay}
                className="text-xs bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600 transition-colors"
              >
                Submit Day
              </button>
            )}
          </div>
        </div>

        <form
          onSubmit={handleAddEntry}
          className="bg-white/50 p-2 rounded-lg border border-gray-200/80 mb-3"
        >
          <div className="grid grid-cols-2 gap-3 mb-2">
            <div className="min-h-[4rem]">
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
                className={`mt-1 w-full p-1 text-base bg-transparent border rounded-md focus:ring-2 focus:ring-[#003D5B] focus:border-[#003D5B] ${
                  startTimeError ? "border-red-500" : "border-slate-300"
                }`}
              />
              {startTimeError && (
                <p className="mt-1 text-xs text-red-500">{startTimeError}</p>
              )}
            </div>
            <div className="min-h-[4rem]">
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
                className={`mt-1 w-full p-1 text-base bg-transparent border rounded-md focus:ring-2 focus:ring-[#003D5B] focus:border-[#003D5B] ${
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
            className="w-full flex items-center justify-center gap-2 bg-[#003D5B] text-white font-bold py-1.5 px-3 rounded-md hover:bg-sky-800 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed text-sm"
          >
            <PlusIcon className="h-4 w-4" />
            Add Entry
          </button>
        </form>
      </div>

      {/* Entries section with calculated height */}
      <div className="flex-1 overflow-hidden">
        {showHistory ? (
          // History View
          <div>
            <h2
              ref={entriesHeaderRef}
              className="text-xs font-bold tracking-wider uppercase text-slate-500 mb-2"
            >
              SUBMITTED DAYS
            </h2>
            <div
              className="overflow-y-auto"
              style={{ height: `${entriesHeight}px` }}
            >
              <div className="space-y-2">
                {dailySubmissions.length === 0 ? (
                  <p className="text-center text-slate-500 py-4">
                    No submitted days yet.
                  </p>
                ) : (
                  // Group submissions by date
                  Object.entries(
                    dailySubmissions.reduce<Record<string, DailySubmission[]>>(
                      (groups, submission) => {
                        const date = submission.date;
                        if (!groups[date]) {
                          groups[date] = [];
                        }
                        groups[date].push(submission);
                        return groups;
                      },
                      {}
                    )
                  )
                    .sort(
                      ([dateA], [dateB]) =>
                        new Date(dateB).getTime() - new Date(dateA).getTime()
                    )
                    .map(([date, submissions]: [string, DailySubmission[]]) => (
                      <div
                        key={date}
                        className="bg-white/50 p-3 rounded-md border border-gray-200/50"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-slate-700">
                            {formatDate(date)}
                          </span>
                          <span className="text-xs text-slate-500">
                            {submissions.length} submission
                            {submissions.length > 1 ? "s" : ""}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {submissions
                            .sort(
                              (a, b) =>
                                new Date(b.timestamp).getTime() -
                                new Date(a.timestamp).getTime()
                            )
                            .map((submission) => (
                              <div
                                key={submission.timestamp}
                                className="border-l-2 border-slate-200 pl-3"
                              >
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-xs text-slate-500">
                                    Submitted at{" "}
                                    {formatTimestamp(submission.timestamp)}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-sm text-slate-600">
                                      {formatDurationWithMinutes({
                                        hours: Math.floor(
                                          submission.totalMinutes / 60
                                        ),
                                        minutes: submission.totalMinutes % 60,
                                        totalMinutes: submission.totalMinutes,
                                      })}
                                    </span>
                                    <button
                                      onClick={() =>
                                        handleClearDay(submission.timestamp)
                                      }
                                      className="text-red-500 hover:text-red-700"
                                    >
                                      <TrashIcon className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  {submission.entries.map((entry) => {
                                    const duration = calculateDuration(
                                      entry.startTime,
                                      entry.endTime
                                    );
                                    return (
                                      <div
                                        key={entry.id}
                                        className="flex justify-between items-center text-xs text-slate-600"
                                      >
                                        <span>
                                          {entry.startTime} - {entry.endTime}
                                        </span>
                                        <span className="font-mono">
                                          {formatDurationWithMinutes(duration)}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        ) : (
          // Current Entries View
          <div>
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
                  <p className="text-center text-slate-500 py-4">
                    No entries yet.
                  </p>
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
        )}
      </div>

      {/* Fixed total section - guaranteed to be visible */}
      <div
        ref={totalRef}
        className="flex-shrink-0 border-t border-slate-200 pt-2 mt-2 pb-4"
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
