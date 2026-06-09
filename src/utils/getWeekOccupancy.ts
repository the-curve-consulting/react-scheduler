import dayjs from "dayjs";
import {
  OccupancyData,
  SchedulerProjectData,
  SchedulerProjectDataOccupancy,
  SchedulerProjectDataThroughput,
  TimeUnits,
  WorkingDuration
} from "@/types/global";
import { getWorkingHoursForDate, isOccupancyProject } from "@/utils/workingDurationHelper";
import { getDuration } from "./getDuration";
import { getTotalHoursAndMinutes } from "./getTotalHoursAndMinutes";
import { getTimeOccupancy } from "./getTimeOccupancy";

const getMaxHoursForWeek = (
  focusedDate: dayjs.Dayjs,
  workingDurations: WorkingDuration[]
): number => {
  let currentDate = focusedDate.startOf("isoWeek");
  const weekEnd = focusedDate.endOf("isoWeek");
  let totalHours = 0;

  while (!currentDate.isAfter(weekEnd, "day")) {
    totalHours += getWorkingHoursForDate(currentDate, workingDurations);
    currentDate = currentDate.add(1, "day");
  }

  return totalHours;
};

const getHoursAndMinutesForOccupancy = <TMeta>(
  project: SchedulerProjectDataOccupancy<TMeta>,
  focusedDate: dayjs.Dayjs,
  workingDurations: WorkingDuration[]
): TimeUnits => {
  let currentDate = focusedDate.startOf("isoWeek");
  const weekEnd = focusedDate.endOf("isoWeek");
  let totalOccupancy = 0;

  while (!currentDate.isAfter(weekEnd, "day")) {
    const isActive = currentDate.isBetween(project.startDate, project.endDate, "day", "[]");

    if (isActive) {
      const workingHours = getWorkingHoursForDate(currentDate, workingDurations);
      totalOccupancy += workingHours > 0 ? project.occupancy : 0;
    }

    currentDate = currentDate.add(1, "day");
  }

  return getDuration(totalOccupancy);
};

const getHoursAndMinutesForThroughput = <TMeta>(
  project: SchedulerProjectDataThroughput<TMeta>,
  focusedDate: dayjs.Dayjs,
  workingDurations: WorkingDuration[]
): TimeUnits => {
  let currentDate = focusedDate.startOf("isoWeek");
  const weekEnd = focusedDate.endOf("isoWeek");
  let totalHours = 0;

  while (!currentDate.isAfter(weekEnd, "day")) {
    const isActive = currentDate.isBetween(project.startDate, project.endDate, "day", "[]");

    if (isActive) {
      totalHours += project.throughput * getWorkingHoursForDate(currentDate, workingDurations);
    }

    currentDate = currentDate.add(1, "day");
  }

  return getDuration(totalHours * 3600);
};

const getHoursAndMinutes = <TMeta>(
  projects: SchedulerProjectData<TMeta>[],
  focusedDate: dayjs.Dayjs,
  workingDurations: WorkingDuration[]
): TimeUnits[] => {
  return projects.map((item) => {
    if (isOccupancyProject(item)) {
      return getHoursAndMinutesForOccupancy(item, focusedDate, workingDurations);
    }

    return getHoursAndMinutesForThroughput(item, focusedDate, workingDurations);
  });
};

export const getWeekOccupancy = <TMeta>(
  occupancy: SchedulerProjectData<TMeta>[],
  focusedDate: dayjs.Dayjs,
  workingDurations: WorkingDuration[]
): OccupancyData => {
  const maxHours = getMaxHoursForWeek(focusedDate, workingDurations);
  const hoursAndMinutes = getHoursAndMinutes(occupancy, focusedDate, workingDurations);

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
