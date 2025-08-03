import { useMemo } from "react";
import { Settings } from "../types";

export const usePeriodFilter = <T extends { date: string }>(
  data: T[],
  selectedPeriod: "week" | "month" | "all",
  selectedDate: string,
  settings: Settings
) => {
  const filteredData = useMemo(() => {
    if (selectedPeriod === "all") {
      return data;
    }

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

    if (selectedPeriod === "week") {
      // Calculate week start based on the selected date and settings
      const weekStartDay = weekStartDayMap[settings.weekStartDay];
      const currentDay = selectedDateObj.getDay();

      // Calculate days to subtract to get to the start of the current week
      let daysToSubtract = currentDay - weekStartDay;
      if (daysToSubtract < 0) {
        daysToSubtract += 7;
      }

      const weekStart = new Date(selectedDateObj);
      weekStart.setDate(weekStart.getDate() - daysToSubtract);
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      return data.filter((item) => {
        const itemDate = new Date(item.date);
        return itemDate >= weekStart && itemDate <= weekEnd;
      });
    }

    if (selectedPeriod === "month") {
      const year = selectedDateObj.getFullYear();
      const month = selectedDateObj.getMonth();

      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);

      return data.filter((item) => {
        const itemDate = new Date(item.date);
        return itemDate >= monthStart && itemDate <= monthEnd;
      });
    }

    return data;
  }, [data, selectedPeriod, selectedDate, settings]);

  return filteredData;
};
