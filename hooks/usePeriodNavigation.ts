import { useState } from "react";
import { Settings } from "../types";

export const usePeriodNavigation = (settings: Settings) => {
  const [selectedPeriod, setSelectedPeriod] = useState<
    "week" | "month" | "all"
  >("week");
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // Initialize to current week start based on settings
    const today = new Date();
    const weekStartDayMap: Record<string, number> = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    };
    const weekStartDay = weekStartDayMap[settings.weekStartDay];
    const currentDay = today.getDay();

    // Calculate days to subtract to get to the start of the current week
    let daysToSubtract = currentDay - weekStartDay;
    if (daysToSubtract < 0) {
      daysToSubtract += 7;
    }

    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - daysToSubtract);
    return weekStart.toISOString().split("T")[0];
  });

  // Get the current week start date based on settings
  const getCurrentWeekStart = () => {
    const today = new Date();
    const weekStartDayMap: Record<string, number> = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    };
    const weekStartDay = weekStartDayMap[settings.weekStartDay];
    const currentDay = today.getDay();

    // Calculate days to subtract to get to the start of the current week
    let daysToSubtract = currentDay - weekStartDay;
    if (daysToSubtract < 0) {
      daysToSubtract += 7;
    }

    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - daysToSubtract);
    return weekStart;
  };

  // Get the current month start date
  const getCurrentMonthStart = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1; // Convert to 1-indexed
    const monthStartString = `${year}-${month.toString().padStart(2, "0")}-01`;

    // Return a Date object for compatibility with existing code
    return new Date(monthStartString);
  };

  // Navigate to current period
  const goToCurrentPeriod = () => {
    if (selectedPeriod === "week") {
      const currentWeekStart = getCurrentWeekStart();
      setSelectedDate(currentWeekStart.toISOString().split("T")[0]);
    } else if (selectedPeriod === "month") {
      const currentMonthStart = getCurrentMonthStart();
      setSelectedDate(currentMonthStart.toISOString().split("T")[0]);
    }
  };

  // Navigate to next/previous week
  const navigateWeek = (direction: "next" | "prev") => {
    const selectedDateObj = new Date(selectedDate);
    const weekStartDayMap: Record<string, number> = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    };
    const weekStartDay = weekStartDayMap[settings.weekStartDay];
    const currentDay = selectedDateObj.getDay();

    // Calculate days to subtract to get to the start of the current week
    let daysToSubtract = currentDay - weekStartDay;
    if (daysToSubtract < 0) {
      daysToSubtract += 7;
    }

    const weekStart = new Date(selectedDateObj);
    weekStart.setDate(weekStart.getDate() - daysToSubtract);

    if (direction === "next") {
      weekStart.setDate(weekStart.getDate() + 7);
    } else {
      weekStart.setDate(weekStart.getDate() - 7);
    }

    setSelectedDate(weekStart.toISOString().split("T")[0]);
  };

  // Navigate to next/previous month
  const navigateMonth = (direction: "next" | "prev") => {
    const selectedDateObj = new Date(selectedDate);
    const year = selectedDateObj.getFullYear();
    const month = selectedDateObj.getMonth();

    let newYear = year;
    let newMonth = month;

    if (direction === "next") {
      if (month === 11) {
        newYear = year + 1;
        newMonth = 0;
      } else {
        newMonth = month + 1;
      }
    } else {
      if (month === 0) {
        newYear = year - 1;
        newMonth = 11;
      } else {
        newMonth = month - 1;
      }
    }

    const newMonthStart = new Date(newYear, newMonth, 1);
    setSelectedDate(newMonthStart.toISOString().split("T")[0]);
  };

  // Get period label for display
  const getPeriodLabel = () => {
    const date = new Date(selectedDate);
    switch (selectedPeriod) {
      case "week":
        const weekStart = new Date(date);
        const weekStartDayMap: Record<string, number> = {
          sunday: 0,
          monday: 1,
          tuesday: 2,
          wednesday: 3,
          thursday: 4,
          friday: 5,
          saturday: 6,
        };
        const weekStartDay = weekStartDayMap[settings.weekStartDay];
        const currentDay = weekStart.getDay();

        // Calculate days to subtract to get to the start of the current week
        let daysToSubtract = currentDay - weekStartDay;
        if (daysToSubtract < 0) {
          daysToSubtract += 7;
        }

        weekStart.setDate(weekStart.getDate() - daysToSubtract);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        const weekStartDayName = weekStart.toLocaleDateString("en-GB", {
          weekday: "short",
        });
        return `${weekStartDayName} ${weekStart.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
        })} - ${weekEnd.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
        })}`;
      case "month":
        // For month view, always show the month name based on the selectedDate
        const monthDate = new Date(selectedDate);
        return monthDate.toLocaleDateString("en-GB", {
          month: "long",
          year: "numeric",
        });
      case "all":
        return "All Time";
      default:
        return "";
    }
  };

  return {
    selectedPeriod,
    setSelectedPeriod,
    selectedDate,
    setSelectedDate,
    getCurrentWeekStart,
    getCurrentMonthStart,
    goToCurrentPeriod,
    navigateWeek,
    navigateMonth,
    getPeriodLabel,
  };
};
