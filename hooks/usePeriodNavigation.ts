import { useState } from "react";
import { Settings } from "../types";

export const usePeriodNavigation = (settings: Settings) => {
  const [selectedPeriod, setSelectedPeriod] = useState<
    "week" | "month" | "all"
  >("week");

  const [selectedDate, setSelectedDate] = useState<string>(() => {
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

    let daysToSubtract = currentDay - weekStartDay;
    if (daysToSubtract < 0) {
      daysToSubtract += 7;
    }

    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - daysToSubtract);
    return weekStart.toISOString().split("T")[0];
  });

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

    let daysToSubtract = currentDay - weekStartDay;
    if (daysToSubtract < 0) {
      daysToSubtract += 7;
    }

    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - daysToSubtract);
    return weekStart;
  };

  const getCurrentMonthStart = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1; // 1-indexed
    return new Date(`${year}-${month.toString().padStart(2, "0")}-01`);
  };

  const goToCurrentPeriod = () => {
    if (selectedPeriod === "week") {
      const currentWeekStart = getCurrentWeekStart();
      setSelectedDate(currentWeekStart.toISOString().split("T")[0]);
    } else if (selectedPeriod === "month") {
      const currentMonthStart = getCurrentMonthStart();
      setSelectedDate(currentMonthStart.toISOString().split("T")[0]);
    }
  };

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

  // ✅ Fixed: clean month navigation using string manipulation
  const navigateMonth = (direction: "next" | "prev") => {
    const [yearStr, monthStr] = selectedDate.split("-");
    let year = parseInt(yearStr, 10);
    let month = parseInt(monthStr, 10); // 1-indexed

    if (direction === "next") {
      month += 1;
      if (month > 12) {
        month = 1;
        year += 1;
      }
    } else {
      month -= 1;
      if (month < 1) {
        month = 12;
        year -= 1;
      }
    }

    const newDateString = `${year}-${month.toString().padStart(2, "0")}-01`;
    setSelectedDate(newDateString);
  };

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

        let daysToSubtract = currentDay - weekStartDay;
        if (daysToSubtract < 0) {
          daysToSubtract += 7;
        }

        weekStart.setDate(weekStart.getDate() - daysToSubtract);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

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
        return date.toLocaleDateString("en-GB", {
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
