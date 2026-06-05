import dayjs from "dayjs";
import { businessDays, DaysOfWeekMap } from "@/constants";
import {
  OccupancyData,
  SchedulerProjectData,
  SchedulerProjectDataOccupancy,
  SchedulerProjectDataThroughput,
  TimeUnits,
  WorkingDuration
} from "@/types/global";
import { isOccupancyProject } from "@/utils/occupancyUtils";
import { getDuration } from "./getDuration";
import { getTotalHoursAndMinutes } from "./getTotalHoursAndMinutes";
import { getTimeOccupancy } from "./getTimeOccupancy";

const getHoursAndMinutesForOccupancy = <TMeta>(
  project: SchedulerProjectDataOccupancy<TMeta>,
  focusedDate: dayjs.Dayjs
): TimeUnits => {
  const focusedWeek = focusedDate.isoWeek();
  const startWeekNum = dayjs(project.startDate).isoWeek();
  const startDateDayNum = dayjs(project.startDate).isoWeekday();

  const endWeekNum = dayjs(project.endDate).isoWeek();
  const endDateDayNum = dayjs(project.endDate).isoWeekday();

  const { hours: itemHours, minutes: itemMinutes } = getDuration(project.occupancy);

  if (focusedWeek === startWeekNum) {
    const daysToCount = Math.max(0, businessDays + 1 - startDateDayNum);
    const hours = daysToCount * itemHours;
    const minutes = daysToCount * itemMinutes;
    return { hours, minutes };
  } else if (focusedWeek === endWeekNum) {
    const daysToCount = endDateDayNum > businessDays ? businessDays : endDateDayNum;
    const hours = daysToCount * itemHours;
    const minutes = daysToCount * itemMinutes;
    return { hours, minutes };
  } else if (dayjs(focusedDate).isBetween(project.startDate, project.endDate)) {
    return { hours: businessDays * itemHours, minutes: businessDays * itemMinutes };
  }
  return { hours: 0, minutes: 0 };
};

const getHoursAndMinutesForThroughput = <TMeta>(
  project: SchedulerProjectDataThroughput<TMeta>,
  focusedDate: dayjs.Dayjs,
  workingDuration: WorkingDuration
): TimeUnits => {
  const weekStart = focusedDate.startOf("isoWeek");

  const totalHours = workingDuration.workingDays.reduce((sum, workingDay) => {
    const date = weekStart.isoWeekday(DaysOfWeekMap[workingDay.day]);
    const isActive = date.isBetween(project.startDate, project.endDate, "day", "[]");

    return sum + (isActive ? project.throughput * workingDay.hours : 0);
  }, 0);

  return getDuration(totalHours * 3600);
};

const getHoursAndMinutes = <TMeta>(
  projects: SchedulerProjectData<TMeta>[],
  focusedDate: dayjs.Dayjs,
  workingDuration: WorkingDuration
): TimeUnits[] => {
  return projects.map((item) => {
    if (isOccupancyProject(item)) {
      return getHoursAndMinutesForOccupancy(item, focusedDate);
    }

    return getHoursAndMinutesForThroughput(item, focusedDate, workingDuration);
  });
};

export const getWeekOccupancy = <TMeta>(
  occupancy: SchedulerProjectData<TMeta>[],
  focusedDate: dayjs.Dayjs,
  workingDuration: WorkingDuration
): OccupancyData => {
  const maxHours = workingDuration.workingDays.reduce((sum, day) => sum + day.hours, 0);
  const hoursAndMinutes = getHoursAndMinutes(occupancy, focusedDate, workingDuration);

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
