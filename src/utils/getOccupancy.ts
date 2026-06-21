import dayjs from "dayjs";
import {
  SchedulerProjectData,
  OccupancyData,
  ZoomLevel,
  Config,
  WorkingDuration,
  HolidayRequest
} from "@/types/global";
import { getHourOccupancy } from "@/utils/getHourOccupancy";
import {
  getWorkingDurationForDate,
  getWorkingDurationsForDateRange,
  sortWorkingDurations
} from "@/utils/workingDurationHelper";
import {
  getHolidayRequestsForDateRange,
  getHolidayRequestsForDay
} from "@/utils/holidayRequestHelper";
import { businessDays, dayStartHour, maxHoursPerWeek } from "@/constants";
import { getWeekOccupancy } from "./getWeekOccupancy";
import { getDayOccupancy } from "./getDayOccupancy";

export const getOccupancy = <TMeta>(
  config: Config,
  resource: SchedulerProjectData<TMeta>[][],
  resourceIndex: number,
  focusedDate: dayjs.Dayjs,
  zoom: ZoomLevel,
  workingDurations: WorkingDuration[],
  holidayRequests: HolidayRequest[]
): OccupancyData => {
  if (resourceIndex < 0)
    return {
      taken: { hours: 0, minutes: 0 },
      free: { hours: 0, minutes: 0 },
      overtime: { hours: 0, minutes: 0 }
    };

  const occupancy = resource.flat(2).filter((item) => {
    if (zoom === 1) {
      return dayjs(focusedDate).isBetween(item.startDate, item.endDate, "day", "[]");
    } else if (zoom === 2) {
      return [];
    } else {
      return (
        dayjs(item.startDate).isBetween(
          dayjs(focusedDate),
          dayjs(focusedDate).add(6, "days"),
          "day",
          "[]"
        ) || dayjs(focusedDate).isBetween(dayjs(item.startDate), dayjs(item.endDate), "day", "[]")
      );
    }
  });

  const halfDayHours = ((config.maxHoursPerWeek ?? maxHoursPerWeek) / businessDays) * 0.5;
  const startHour = config.defaultStartHour ?? dayStartHour;

  const sortedWorkingDurations = sortWorkingDurations(workingDurations);
  switch (zoom) {
    case 1: {
      const workingDuration = getWorkingDurationForDate(focusedDate, sortedWorkingDurations);
      const filteredHolidayRequests = getHolidayRequestsForDay(focusedDate, holidayRequests);
      return getDayOccupancy(
        occupancy,
        focusedDate,
        workingDuration,
        filteredHolidayRequests,
        halfDayHours,
        startHour
      );
    }
    case 2: {
      const workingDuration = getWorkingDurationForDate(focusedDate, sortedWorkingDurations);
      const filteredHolidayRequests = getHolidayRequestsForDay(focusedDate, holidayRequests);
      return getHourOccupancy(
        resource,
        focusedDate,
        workingDuration,
        filteredHolidayRequests,
        halfDayHours,
        startHour
      );
    }
    default: {
      const weekEndDate = focusedDate.add(6, "days");
      const weeklyWorkingDurations = getWorkingDurationsForDateRange(
        focusedDate,
        weekEndDate,
        sortedWorkingDurations
      );
      const filteredHolidayRequests = getHolidayRequestsForDateRange(
        focusedDate,
        weekEndDate,
        holidayRequests
      );
      return getWeekOccupancy(
        occupancy,
        focusedDate,
        weekEndDate,
        weeklyWorkingDurations,
        filteredHolidayRequests,
        halfDayHours,
        startHour
      );
    }
  }
};
