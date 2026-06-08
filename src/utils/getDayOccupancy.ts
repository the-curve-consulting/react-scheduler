import dayjs from "dayjs";
import { OccupancyData, SchedulerProjectData, TimeUnits, WorkingDuration } from "@/types/global";
import { getMaxHoursPerDay, isOccupancyProject } from "@/utils/workingDurationHelper";
import { getDuration } from "./getDuration";
import { getTotalHoursAndMinutes } from "./getTotalHoursAndMinutes";
import { getTimeOccupancy } from "./getTimeOccupancy";

const getHoursAndMinutes = <TMeta>(
  occupancy: SchedulerProjectData<TMeta>[],
  maxHoursPerDay: number
): TimeUnits[] => {
  return occupancy.map((item) => {
    if (isOccupancyProject(item)) {
      return maxHoursPerDay > 0 ? getDuration(item.occupancy) : { hours: 0, minutes: 0 };
    }

    const durationSeconds = item.throughput * maxHoursPerDay * 3600;
    return getDuration(durationSeconds);
  });
};

export const getDayOccupancy = <TMeta>(
  occupancy: SchedulerProjectData<TMeta>[],
  focusedDate: dayjs.Dayjs,
  workingDuration: WorkingDuration
): OccupancyData => {
  const maxHours = getMaxHoursPerDay(focusedDate, workingDuration);
  const hoursAndMinutes = getHoursAndMinutes(occupancy, maxHours);
  const { hours: totalHours, minutes: totalMinutes } = getTotalHoursAndMinutes(hoursAndMinutes);

  const { free, overtime } = getTimeOccupancy(maxHours, {
    hours: totalHours,
    minutes: totalMinutes
  });

  return {
    taken: { hours: Math.max(0, totalHours), minutes: Math.max(0, totalMinutes) },
    free,
    overtime
  };
};
