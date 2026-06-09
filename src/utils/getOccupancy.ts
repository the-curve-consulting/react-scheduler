import dayjs from "dayjs";
import {
  SchedulerProjectData,
  OccupancyData,
  ZoomLevel,
  Config,
  WorkingDuration
} from "@/types/global";
import { getHourOccupancy } from "@/utils/getHourOccupancy";
import {
  getWorkingDurationForDate,
  getWorkingDurationsForDateRange,
  sortWorkingDurations
} from "@/utils/workingDurationHelper";
import { getWeekOccupancy } from "./getWeekOccupancy";
import { getDayOccupancy } from "./getDayOccupancy";

export const getOccupancy = <TMeta>(
  config: Config,
  resource: SchedulerProjectData<TMeta>[][],
  resourceIndex: number,
  focusedDate: dayjs.Dayjs,
  zoom: ZoomLevel,
  workingDurations: WorkingDuration[]
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

  const sortedWorkingDurations = sortWorkingDurations(workingDurations);
  switch (zoom) {
    case 1: {
      const workingDuration = getWorkingDurationForDate(focusedDate, sortedWorkingDurations);
      return getDayOccupancy(occupancy, focusedDate, workingDuration);
    }
    case 2: {
      const workingDuration = getWorkingDurationForDate(focusedDate, sortedWorkingDurations);
      return getHourOccupancy(resource, focusedDate, workingDuration, config.defaultStartHour);
    }
    default: {
      const weeklyWorkingDurations = getWorkingDurationsForDateRange(
        focusedDate,
        focusedDate.add(6, "days"),
        sortedWorkingDurations
      );
      return getWeekOccupancy(occupancy, focusedDate, weeklyWorkingDurations);
    }
  }
};
