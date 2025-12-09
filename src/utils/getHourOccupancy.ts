import dayjs from "dayjs";
import { OccupancyData, SchedulerProjectData } from "@/types/global";
import { dayStartHour, minutesInHour } from "@/constants";

const SECONDS_IN_HOUR = 3600;

export const getHourOccupancy = (
  resource: SchedulerProjectData[][],
  focusedDate: dayjs.Dayjs,
  defaultStartHour?: number
): OccupancyData => {
  const hourStart = focusedDate;
  const hourEnd = focusedDate.add(1, "hour");

  let cumulativeEndTime = focusedDate.hour(defaultStartHour || dayStartHour).minute(0);
  let totalOccupancySeconds = 0;

  for (const row of resource) {
    const currentDayProject = row.find((item) =>
      dayjs(focusedDate).isBetween(item.startDate, item.endDate, "day", "[]")
    );

    if (!currentDayProject) continue;

    const projectStart = cumulativeEndTime;
    const projectEnd = projectStart.add(currentDayProject.occupancy, "second");
    cumulativeEndTime = projectEnd;

    // Check if project overlaps with the focused hour
    if (projectEnd.isAfter(hourStart) && projectStart.isBefore(hourEnd)) {
      // Calculate the overlap using min/max to find intersection
      const overlapStart = projectStart.isBefore(hourStart) ? hourStart : projectStart;
      const overlapEnd = projectEnd.isAfter(hourEnd) ? hourEnd : projectEnd;
      const overlapSeconds = overlapEnd.diff(overlapStart, "second");

      totalOccupancySeconds += overlapSeconds;

      // If the entire hour is occupied, we can stop early
      if (totalOccupancySeconds >= SECONDS_IN_HOUR) {
        totalOccupancySeconds = SECONDS_IN_HOUR;
        break;
      }
    }
  }

  const totalMinutes = Math.floor(totalOccupancySeconds / 60);
  const takenHours = Math.floor(totalMinutes / minutesInHour);
  const takenMinutes = totalMinutes % minutesInHour;

  const totalFreeMinutes = Math.max(minutesInHour - totalMinutes, 0);
  const freeHours = Math.floor(totalFreeMinutes / minutesInHour);
  const freeMinutes = totalFreeMinutes % minutesInHour;

  return {
    taken: { hours: takenHours, minutes: takenMinutes },
    free: { hours: freeHours, minutes: freeMinutes },
    overtime: { hours: 0, minutes: 0 }
  };
};
