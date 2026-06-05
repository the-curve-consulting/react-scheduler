import dayjs from "dayjs";
import {
  SchedulerProjectData,
  OccupancyData,
  ZoomLevel,
  Config,
  WorkingDuration
} from "@/types/global";
import { getHourOccupancy } from "@/utils/getHourOccupancy";
import { getWeekOccupancy } from "./getWeekOccupancy";
import { getDayOccupancy } from "./getDayOccupancy";

export const getOccupancy = <TMeta>(
  config: Config,
  resource: SchedulerProjectData<TMeta>[][],
  resourceIndex: number,
  focusedDate: dayjs.Dayjs,
  zoom: ZoomLevel,
  includeTakenHoursOnWeekendsInDayView = false,
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

  // Extract the working duration which should be applied for given focusedDate
  const focusedDay = focusedDate.startOf("day");
  const sortedWorkingDurations = [...workingDurations].sort(
    (a, b) =>
      dayjs(b.effectiveFrom).startOf("day").valueOf() -
      dayjs(a.effectiveFrom).startOf("day").valueOf()
  );
  const workingDuration =
    sortedWorkingDurations.find(
      ({ effectiveFrom }) => !dayjs(effectiveFrom).startOf("day").isAfter(focusedDay)
    ) ?? sortedWorkingDurations[0];

  switch (zoom) {
    case 1:
      return getDayOccupancy(
        occupancy,
        focusedDate,
        includeTakenHoursOnWeekendsInDayView,
        workingDuration
      );
    case 2:
      return getHourOccupancy(resource, focusedDate, workingDuration, config.defaultStartHour);
    default:
      return getWeekOccupancy(occupancy, focusedDate, workingDuration);
  }
};
