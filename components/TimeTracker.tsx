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
  clearEntries?: () => void;
}

const TimeTracker: React.FC<TimeTrackerProps> = ({
  entries,
  addEntry,
  removeEntry,
  onDailySubmit,
  clearEntries,
}) => {
  const [activeTab, setActiveTab] = useState<"tracker" | "history">("tracker");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [startTimeError, setStartTimeError] = useState("");
  const [endTimeError, setEndTimeError] = useState("");
  const [entriesHeight, setEntriesHeight] = useState(200); // Default fallback
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({
    message: "",
    visible: false,
  });
  const [showTimeFormatModal, setShowTimeFormatModal] = useState(false);

  // Edit modal state
  const [editingSubmission, setEditingSubmission] =
    useState<DailySubmission | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTimeErrors, setEditTimeErrors] = useState<{
    [key: string]: string;
  }>({});

  const [submitDate, setSubmitDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

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
      if (containerRef.current && entriesHeaderRef.current) {
        // Get the actual viewport height
        const viewportHeight = window.innerHeight;

        // Get the container's position and height
        const containerRect = containerRef.current.getBoundingClientRect();
        const containerTop = containerRect.top;

        // Calculate the available height from container top to viewport bottom
        const availableViewportHeight = viewportHeight - containerTop;

        // Get the header height
        const entriesHeaderHeight = entriesHeaderRef.current.offsetHeight;

        // Account for navigation bar height and padding
        const navBarHeight = 80;
        const bottomPadding = 32;

        if (activeTab === "tracker") {
          // For tracker view, account for form, total, and submit sections
          if (formRef.current && totalRef.current) {
            const formHeight = formRef.current.offsetHeight;
            const totalHeight = totalRef.current.offsetHeight;

            // Account for submit day section (approximate height)
            const submitSectionHeight = 120; // Date picker + button + padding

            const availableHeight =
              availableViewportHeight -
              formHeight -
              totalHeight -
              submitSectionHeight -
              entriesHeaderHeight -
              navBarHeight -
              bottomPadding;

            const finalHeight = Math.max(availableHeight, 100);
            setEntriesHeight(finalHeight);
          }
        } else {
          // For history view, only account for header and navigation
          const availableHeight =
            availableViewportHeight -
            entriesHeaderHeight -
            navBarHeight -
            bottomPadding;

          const finalHeight = Math.max(availableHeight, 100);
          setEntriesHeight(finalHeight);
        }
      }
    };

    calculateEntriesHeight();
    const timeoutId = setTimeout(calculateEntriesHeight, 100);

    window.addEventListener("resize", calculateEntriesHeight);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", calculateEntriesHeight);
    };
  }, [activeTab]); // Recalculate when tab changes

  const isValidTime = (time: string, allow24: boolean = false): boolean => {
    if (!time) return false;

    // Handle both HHMM and HH:MM formats
    let timeStr = time;
    if (time.includes(":")) {
      timeStr = time.replace(":", "");
    }

    if (timeStr.length !== 4) return false;
    const hours = parseInt(timeStr.substring(0, 2));
    const minutes = parseInt(timeStr.substring(2, 4));
    if (isNaN(hours) || isNaN(minutes)) return false;
    if (minutes < 0 || minutes > 59) return false;
    if (allow24) {
      return hours >= 0 && hours <= 24;
    }
    return hours >= 0 && hours <= 23;
  };

  const formatTimeInput = (value: string): string => {
    // Remove all non-numeric characters
    const numbers = value.replace(/[^0-9]/g, "");

    // Limit to 4 digits
    const limited = numbers.substring(0, 4);

    // Add colon after 2 digits if we have more than 2 digits
    if (limited.length > 2) {
      return `${limited.substring(0, 2)}:${limited.substring(2)}`;
    }

    return limited;
  };

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = formatTimeInput(e.target.value);
    setStartTime(value);
    setStartTimeError("");

    // Only validate when the input is complete (5 characters with colon format)
    if (value.length === 5 && value.includes(":")) {
      if (!isValidTime(value)) {
        setStartTimeError("Invalid time format (HH:MM)");
      } else {
        // Auto-focus end time input
        setTimeout(() => {
          endTimeRef.current?.focus();
        }, 100);
      }
    }
  };

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = formatTimeInput(e.target.value);
    setEndTime(value);
    setEndTimeError("");

    // Only validate when the input is complete (5 characters with colon format)
    if (value.length === 5 && value.includes(":")) {
      if (!isValidTime(value, true)) {
        setEndTimeError("Invalid time format (HH:MM)");
      }
    }
  };

  const isFormValid =
    startTime.length === 5 &&
    endTime.length === 5 &&
    startTime.includes(":") &&
    endTime.includes(":") &&
    !startTimeError &&
    !endTimeError;

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    // Convert formatted times back to HHMM format for storage
    const formatForStorage = (time: string) => {
      return time.replace(":", "");
    };

    addEntry(formatForStorage(startTime), formatForStorage(endTime));
    setStartTime("");
    setEndTime("");
    setStartTimeError("");
    setEndTimeError("");
  };

  // Count submissions for the selected date
  const submissionsForDate = dailySubmissions.filter(
    (submission) => submission.date === submitDate
  );

  const handleSubmitDay = () => {
    if (entries.length === 0) return;

    const submission: DailySubmission = {
      date: submitDate,
      timestamp: new Date().toISOString(),
      entries: [...entries],
      totalMinutes: totalDuration.totalMinutes,
    };

    setDailySubmissions((prev) => [...prev, submission]);
    clearEntries?.();
    setToast({
      message: `Day submitted! Total: ${formatDurationWithMinutes(
        totalDuration
      )}`,
      visible: true,
    });
    onDailySubmit?.(submission);
  };

  const handleClearDay = (timestamp: string) => {
    setDailySubmissions((prev) =>
      prev.filter((submission) => submission.timestamp !== timestamp)
    );
  };

  const handleEditSubmission = (submission: DailySubmission) => {
    setEditingSubmission(submission);
    setShowEditModal(true);
  };

  const handleSaveEdit = (updatedSubmission: DailySubmission) => {
    setDailySubmissions(
      dailySubmissions.map((sub) =>
        sub.timestamp === updatedSubmission.timestamp ? updatedSubmission : sub
      )
    );
    setShowEditModal(false);
    setEditingSubmission(null);
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingSubmission(null);
    setEditTimeErrors({});
  };

  // Edit modal validation functions
  const validateEditTimeInput = (
    time: string,
    entryIndex: number,
    field: "startTime" | "endTime"
  ): boolean => {
    if (!time) return false;

    // Handle both HHMM and HH:MM formats
    let timeStr = time;
    if (time.includes(":")) {
      timeStr = time.replace(":", "");
    }

    if (timeStr.length !== 4) return false;
    const hours = parseInt(timeStr.substring(0, 2));
    const minutes = parseInt(timeStr.substring(2, 4));
    if (isNaN(hours) || isNaN(minutes)) return false;
    if (minutes < 0 || minutes > 59) return false;

    const allow24 = field === "endTime";
    if (allow24) {
      return hours >= 0 && hours <= 24;
    }
    return hours >= 0 && hours <= 23;
  };

  const formatEditTimeInput = (value: string): string => {
    // Remove all non-numeric characters
    const numbers = value.replace(/[^0-9]/g, "");

    // Limit to 4 digits
    const limited = numbers.substring(0, 4);

    // Add colon after 2 digits if we have more than 2 digits
    if (limited.length > 2) {
      return `${limited.substring(0, 2)}:${limited.substring(2)}`;
    }

    return limited;
  };

  // Helper function to calculate total duration from entries
  const calculateTotalDuration = (entries: TimeEntry[]) => {
    const totalMinutes = entries.reduce((total, entry) => {
      const startTime =
        entry.startTime.length === 4
          ? `${entry.startTime.substring(0, 2)}:${entry.startTime.substring(
              2,
              4
            )}`
          : entry.startTime;
      const endTime =
        entry.endTime.length === 4
          ? `${entry.endTime.substring(0, 2)}:${entry.endTime.substring(2, 4)}`
          : entry.endTime;
      return total + calculateDuration(startTime, endTime).totalMinutes;
    }, 0);

    return {
      hours: Math.floor(totalMinutes / 60),
      minutes: totalMinutes % 60,
      totalMinutes,
    };
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

      {/* Internal Navigation Tabs */}
      <div className="flex-shrink-0 bg-white/50 border-b border-gray-200/80">
        <div className="flex">
          <button
            onClick={() => setActiveTab("tracker")}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors duration-200 ${
              activeTab === "tracker"
                ? "text-[#003D5B] border-b-2 border-[#003D5B]"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Tracker
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors duration-200 ${
              activeTab === "history"
                ? "text-[#003D5B] border-b-2 border-[#003D5B]"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            History
          </button>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === "tracker" ? (
        <>
          {/* Fixed form section */}
          <div ref={formRef} className="flex-shrink-0 p-3">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-1">
                <h2 className="text-xs font-bold tracking-wider uppercase text-slate-500">
                  TODAY'S ENTRIES
                </h2>
                <button
                  onClick={() => setShowTimeFormatModal(true)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                  title="How to enter time format"
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
            </div>

            <form
              onSubmit={handleAddEntry}
              className="bg-white/50 p-1.5 rounded-lg border border-gray-200/80 mb-2"
            >
              <div className="grid grid-cols-2 gap-2 mb-1.5">
                <div className="min-h-[2rem]">
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
                    title="Enter time in HH:MM format (e.g., 09:30)"
                    placeholder="HH:MM"
                    maxLength={5}
                    value={startTime}
                    onChange={handleStartTimeChange}
                    className={`mt-0.5 w-full p-0.5 text-base bg-transparent border rounded-md focus:ring-2 focus:ring-[#003D5B] focus:border-[#003D5B] ${
                      startTimeError ? "border-red-500" : "border-slate-300"
                    }`}
                  />
                  {startTimeError && (
                    <p className="mt-0.5 text-xs text-red-500">
                      {startTimeError}
                    </p>
                  )}
                </div>
                <div className="min-h-[2rem]">
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
                    title="Enter time in HH:MM format (e.g., 17:00 or 24:00)"
                    placeholder="HH:MM"
                    maxLength={5}
                    value={endTime}
                    onChange={handleEndTimeChange}
                    className={`mt-0.5 w-full p-0.5 text-base bg-transparent border rounded-md focus:ring-2 focus:ring-[#003D5B] focus:border-[#003D5B] ${
                      endTimeError ? "border-red-500" : "border-slate-300"
                    }`}
                  />
                  {endTimeError && (
                    <p className="mt-0.5 text-xs text-red-500">
                      {endTimeError}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="submit"
                disabled={!isFormValid}
                className="w-full flex items-center justify-center gap-2 bg-[#003D5B] text-white font-bold py-1 px-2 rounded-md hover:bg-sky-800 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed text-sm"
              >
                <PlusIcon className="h-3 w-3" />
                Add Entry
              </button>
            </form>
          </div>

          {/* Entries section with calculated height */}
          <div className="flex-1 overflow-hidden px-3">
            <div>
              <h2
                ref={entriesHeaderRef}
                className="text-xs font-bold tracking-wider uppercase text-slate-500 mb-1.5"
              >
                ENTRIES
              </h2>
              <div
                className="overflow-y-auto"
                style={{ height: `${entriesHeight}px` }}
              >
                <div className="space-y-1.5">
                  {entries.length === 0 ? (
                    <p className="text-center text-slate-500 py-3">
                      No entries yet.
                    </p>
                  ) : (
                    entries.map((entry) => {
                      // Format the times for display (HHMM to HH:MM)
                      const formatTimeForDisplay = (time: string) => {
                        if (time.length === 4) {
                          return `${time.substring(0, 2)}:${time.substring(
                            2,
                            4
                          )}`;
                        }
                        return time;
                      };

                      const displayStartTime = formatTimeForDisplay(
                        entry.startTime
                      );
                      const displayEndTime = formatTimeForDisplay(
                        entry.endTime
                      );

                      const duration = calculateDuration(
                        displayStartTime,
                        displayEndTime
                      );
                      return (
                        <div
                          key={entry.id}
                          className="flex items-center justify-between bg-white/50 p-1.5 rounded-md border border-gray-200/50"
                        >
                          <div className="flex items-center space-x-2 text-sm">
                            <span>{displayStartTime}</span>
                            <span className="text-slate-400">&mdash;</span>
                            <span>{displayEndTime}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-sm text-slate-600">
                              {formatDurationWithMinutes(duration)}
                            </span>
                            <button
                              onClick={() => removeEntry(entry.id)}
                              className="text-red-500 hover:text-red-700 text-sm"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Fixed total section - guaranteed to be visible */}
          <div
            ref={totalRef}
            className="flex-shrink-0 border-t border-slate-200 pt-1.5 mt-1.5 pb-2 px-4 mb-1.5"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold tracking-wider uppercase text-slate-500">
                TOTAL
              </h2>
              <p className="text-xl font-bold text-[#003D5B] font-mono">
                {formatDurationWithMinutes(totalDuration)}
              </p>
            </div>
          </div>

          {/* Submit Day Section */}
          <div className="flex-shrink-0 px-4 pb-3 space-y-1.5">
            {/* Date Picker */}
            <div className="bg-white/50 p-1 rounded-lg border border-gray-200/80">
              <label className="text-xs font-medium text-slate-600 block mb-0.5 text-center">
                Select date ({submissionsForDate.length} submissions)
              </label>
              <input
                type="date"
                value={submitDate}
                onChange={(e) => setSubmitDate(e.target.value)}
                className="w-5/6 p-0.5 text-sm bg-transparent border border-slate-300 rounded-md focus:ring-2 focus:ring-[#003D5B] focus:border-[#003D5B] mx-auto block"
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmitDay}
              disabled={entries.length === 0}
              className={`w-full py-1.5 px-3 rounded-lg font-bold transition-colors text-sm ${
                entries.length > 0
                  ? "bg-[#003D5B] text-white hover:bg-[#002D4B]"
                  : "bg-slate-300 text-slate-500 cursor-not-allowed"
              }`}
            >
              Submit Day
            </button>
          </div>
        </>
      ) : (
        <>
          {/* History View */}
          <div className="flex-1 overflow-hidden p-4">
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
                                      {formatDurationWithMinutes(
                                        calculateTotalDuration(
                                          submission.entries
                                        )
                                      )}
                                    </span>
                                    <button
                                      onClick={() =>
                                        handleEditSubmission(submission)
                                      }
                                      className="text-slate-500 hover:text-slate-700"
                                      title="Edit submission"
                                    >
                                      ✏️
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleClearDay(submission.timestamp)
                                      }
                                      className="text-red-500 hover:text-red-700"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  {submission.entries.map((entry) => {
                                    // Format the times for display (HHMM to HH:MM)
                                    const formatTimeForDisplay = (
                                      time: string
                                    ) => {
                                      if (time.length === 4) {
                                        return `${time.substring(
                                          0,
                                          2
                                        )}:${time.substring(2, 4)}`;
                                      }
                                      return time;
                                    };

                                    const displayStartTime =
                                      formatTimeForDisplay(entry.startTime);
                                    const displayEndTime = formatTimeForDisplay(
                                      entry.endTime
                                    );

                                    const duration = calculateDuration(
                                      displayStartTime,
                                      displayEndTime
                                    );
                                    return (
                                      <div
                                        key={entry.id}
                                        className="flex justify-between items-center text-xs text-slate-600"
                                      >
                                        <span>
                                          {displayStartTime} - {displayEndTime}
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
        </>
      )}

      {/* Edit Modal */}
      {showEditModal && editingSubmission && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2">
          <div className="bg-white rounded-lg w-full max-w-sm mx-auto max-h-[80vh] overflow-y-auto">
            <div className="p-3 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800">
                  Edit Time Submission
                </h3>
                <button
                  onClick={handleCancelEdit}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-3 space-y-3">
              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={editingSubmission.date}
                  onChange={(e) => {
                    const updatedSubmission = {
                      ...editingSubmission,
                      date: e.target.value,
                    };
                    setEditingSubmission(updatedSubmission);
                  }}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#003D5B] focus:border-[#003D5B] text-xs bg-white min-w-0 text-slate-700 max-w-full"
                />
              </div>

              {/* Time Entries */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Time Entries
                </label>
                <div className="space-y-2">
                  {editingSubmission.entries.map((entry, index) => (
                    <div
                      key={entry.id}
                      className="border border-slate-200 rounded-md p-3"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-slate-700">
                          Entry {index + 1}
                        </span>
                        <button
                          onClick={() => {
                            const updatedEntries =
                              editingSubmission.entries.filter(
                                (_, i) => i !== index
                              );
                            const updatedSubmission = {
                              ...editingSubmission,
                              entries: updatedEntries,
                              totalMinutes:
                                calculateTotalDuration(updatedEntries)
                                  .totalMinutes,
                            };
                            setEditingSubmission(updatedSubmission);
                          }}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-slate-600 mb-1">
                            Start Time
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={
                              entry.startTime.length === 4
                                ? `${entry.startTime.substring(
                                    0,
                                    2
                                  )}:${entry.startTime.substring(2, 4)}`
                                : entry.startTime
                            }
                            onChange={(e) => {
                              const formattedValue = formatEditTimeInput(
                                e.target.value
                              );
                              const formattedTime = formattedValue.replace(
                                /:/g,
                                ""
                              );

                              // Validate the time input
                              const errorKey = `startTime-${index}`;
                              if (
                                formattedValue.length === 5 &&
                                formattedValue.includes(":")
                              ) {
                                if (
                                  !validateEditTimeInput(
                                    formattedValue,
                                    index,
                                    "startTime"
                                  )
                                ) {
                                  setEditTimeErrors((prev) => ({
                                    ...prev,
                                    [errorKey]: "Invalid time format (HH:MM)",
                                  }));
                                } else {
                                  setEditTimeErrors((prev) => ({
                                    ...prev,
                                    [errorKey]: "",
                                  }));
                                }
                              } else {
                                setEditTimeErrors((prev) => ({
                                  ...prev,
                                  [errorKey]: "",
                                }));
                              }

                              const updatedEntries = [
                                ...editingSubmission.entries,
                              ];
                              updatedEntries[index] = {
                                ...entry,
                                startTime: formattedTime,
                              };
                              const updatedSubmission = {
                                ...editingSubmission,
                                entries: updatedEntries,
                                totalMinutes: updatedEntries.reduce(
                                  (total, e) => {
                                    const startTime =
                                      e.startTime.length === 4
                                        ? `${e.startTime.substring(
                                            0,
                                            2
                                          )}:${e.startTime.substring(2, 4)}`
                                        : e.startTime;
                                    const endTime =
                                      e.endTime.length === 4
                                        ? `${e.endTime.substring(
                                            0,
                                            2
                                          )}:${e.endTime.substring(2, 4)}`
                                        : e.endTime;
                                    return (
                                      total +
                                      calculateDuration(startTime, endTime)
                                    );
                                  },
                                  0
                                ),
                              };
                              setEditingSubmission(updatedSubmission);
                            }}
                            className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-[#003D5B] focus:border-[#003D5B] ${
                              editTimeErrors[`startTime-${index}`]
                                ? "border-red-300 bg-red-50"
                                : "border-slate-300"
                            }`}
                            placeholder="HH:MM"
                          />
                          {editTimeErrors[`startTime-${index}`] && (
                            <p className="text-xs text-red-600 mt-1">
                              {editTimeErrors[`startTime-${index}`]}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs text-slate-600 mb-1">
                            End Time
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={
                              entry.endTime.length === 4
                                ? `${entry.endTime.substring(
                                    0,
                                    2
                                  )}:${entry.endTime.substring(2, 4)}`
                                : entry.endTime
                            }
                            onChange={(e) => {
                              const formattedValue = formatEditTimeInput(
                                e.target.value
                              );
                              const formattedTime = formattedValue.replace(
                                /:/g,
                                ""
                              );

                              // Validate the time input
                              const errorKey = `endTime-${index}`;
                              if (
                                formattedValue.length === 5 &&
                                formattedValue.includes(":")
                              ) {
                                if (
                                  !validateEditTimeInput(
                                    formattedValue,
                                    index,
                                    "endTime"
                                  )
                                ) {
                                  setEditTimeErrors((prev) => ({
                                    ...prev,
                                    [errorKey]: "Invalid time format (HH:MM)",
                                  }));
                                } else {
                                  setEditTimeErrors((prev) => ({
                                    ...prev,
                                    [errorKey]: "",
                                  }));
                                }
                              } else {
                                setEditTimeErrors((prev) => ({
                                  ...prev,
                                  [errorKey]: "",
                                }));
                              }

                              const updatedEntries = [
                                ...editingSubmission.entries,
                              ];
                              updatedEntries[index] = {
                                ...entry,
                                endTime: formattedTime,
                              };
                              const updatedSubmission = {
                                ...editingSubmission,
                                entries: updatedEntries,
                                totalMinutes:
                                  calculateTotalDuration(updatedEntries)
                                    .totalMinutes,
                              };
                              setEditingSubmission(updatedSubmission);
                            }}
                            className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-[#003D5B] focus:border-[#003D5B] ${
                              editTimeErrors[`endTime-${index}`]
                                ? "border-red-300 bg-red-50"
                                : "border-slate-300"
                            }`}
                            placeholder="HH:MM"
                          />
                          {editTimeErrors[`endTime-${index}`] && (
                            <p className="text-xs text-red-600 mt-1">
                              {editTimeErrors[`endTime-${index}`]}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add New Entry */}
              <div>
                <button
                  onClick={() => {
                    const newEntry: TimeEntry = {
                      id: Date.now(),
                      startTime: "",
                      endTime: "",
                    };
                    const updatedSubmission = {
                      ...editingSubmission,
                      entries: [...editingSubmission.entries, newEntry],
                    };
                    setEditingSubmission(updatedSubmission);
                  }}
                  className="w-full py-2 px-4 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors"
                >
                  + Add Entry
                </button>
              </div>

              {/* Preview */}
              <div className="bg-slate-50 p-3 rounded-md">
                <h4 className="text-sm font-medium text-slate-700 mb-2">
                  Preview
                </h4>
                <div className="text-sm text-slate-600 space-y-1">
                  {editingSubmission.entries.map((entry, index) => {
                    const startTime =
                      entry.startTime.length === 4
                        ? `${entry.startTime.substring(
                            0,
                            2
                          )}:${entry.startTime.substring(2, 4)}`
                        : entry.startTime;
                    const endTime =
                      entry.endTime.length === 4
                        ? `${entry.endTime.substring(
                            0,
                            2
                          )}:${entry.endTime.substring(2, 4)}`
                        : entry.endTime;
                    const duration = calculateDuration(startTime, endTime);
                    return (
                      <div key={index} className="flex justify-between">
                        <span>
                          {startTime} - {endTime}
                        </span>
                        <span className="font-mono">
                          {formatDurationWithMinutes(duration)}
                        </span>
                      </div>
                    );
                  })}
                  <div className="font-medium pt-1 border-t border-slate-200">
                    Total:{" "}
                    {formatDurationWithMinutes(
                      calculateTotalDuration(editingSubmission.entries)
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 border-t border-gray-200 flex gap-2">
              <button
                onClick={handleCancelEdit}
                className="flex-1 py-2 px-4 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Check if there are any validation errors
                  const hasErrors = Object.values(editTimeErrors).some(
                    (error) => error !== ""
                  );
                  if (hasErrors) {
                    return; // Don't save if there are validation errors
                  }

                  // Check if all entries have complete, valid times
                  const hasIncompleteEntries = editingSubmission.entries.some(
                    (entry) => {
                      const startTimeFormatted =
                        entry.startTime.length === 4
                          ? `${entry.startTime.substring(
                              0,
                              2
                            )}:${entry.startTime.substring(2, 4)}`
                          : entry.startTime;
                      const endTimeFormatted =
                        entry.endTime.length === 4
                          ? `${entry.endTime.substring(
                              0,
                              2
                            )}:${entry.endTime.substring(2, 4)}`
                          : entry.endTime;

                      return (
                        !validateEditTimeInput(
                          startTimeFormatted,
                          0,
                          "startTime"
                        ) ||
                        !validateEditTimeInput(
                          endTimeFormatted,
                          0,
                          "endTime"
                        ) ||
                        startTimeFormatted.length !== 5 ||
                        endTimeFormatted.length !== 5
                      );
                    }
                  );

                  if (hasIncompleteEntries) {
                    return; // Don't save if any entries are incomplete
                  }

                  handleSaveEdit(editingSubmission);
                }}
                disabled={
                  Object.values(editTimeErrors).some((error) => error !== "") ||
                  editingSubmission.entries.some((entry) => {
                    const startTimeFormatted =
                      entry.startTime.length === 4
                        ? `${entry.startTime.substring(
                            0,
                            2
                          )}:${entry.startTime.substring(2, 4)}`
                        : entry.startTime;
                    const endTimeFormatted =
                      entry.endTime.length === 4
                        ? `${entry.endTime.substring(
                            0,
                            2
                          )}:${entry.endTime.substring(2, 4)}`
                        : entry.endTime;

                    return (
                      !validateEditTimeInput(
                        startTimeFormatted,
                        0,
                        "startTime"
                      ) ||
                      !validateEditTimeInput(endTimeFormatted, 0, "endTime") ||
                      startTimeFormatted.length !== 5 ||
                      endTimeFormatted.length !== 5
                    );
                  })
                }
                className="flex-1 py-2 px-4 bg-[#003D5B] text-white rounded-md hover:bg-[#002D4B] transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Time Format Modal */}
      {showTimeFormatModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2">
          <div className="bg-white rounded-lg w-full max-w-sm mx-auto">
            <div className="p-3 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800">
                  Time Input Format
                </h3>
                <button
                  onClick={() => setShowTimeFormatModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-3 space-y-3">
              <div>
                <h4 className="font-medium text-slate-700 mb-2">
                  24-Hour Format
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Enter times using 24-hour format (HH:MM). This means 1:00 PM
                  is 13:00, 2:30 PM is 14:30, and midnight is 00:00.
                </p>
              </div>

              <div>
                <h4 className="font-medium text-slate-700 mb-2">
                  Valid Examples
                </h4>
                <div className="text-sm text-slate-600 space-y-1">
                  <p>
                    • <strong>09:30</strong> - 9:30 AM
                  </p>
                  <p>
                    • <strong>13:45</strong> - 1:45 PM
                  </p>
                  <p>
                    • <strong>17:00</strong> - 5:00 PM
                  </p>
                  <p>
                    • <strong>00:00</strong> - Midnight
                  </p>
                  <p>
                    • <strong>23:59</strong> - 11:59 PM
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-slate-700 mb-2">
                  Common Mistakes
                </h4>
                <div className="text-sm text-slate-600 space-y-1">
                  <p>• Don't use AM/PM (use 13:00, not 1:00 PM)</p>
                  <p>• Always use two digits (09:30, not 9:30)</p>
                  <p>• Use colon separator (09:30, not 0930)</p>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-200">
                <p className="text-xs text-slate-500">
                  💡 <strong>Tip:</strong> For overnight shifts, end time can be
                  after midnight (e.g., 06:00 for 6 AM the next day).
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeTracker;
