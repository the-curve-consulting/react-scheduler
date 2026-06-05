import dayjs from "dayjs";
import { OccupancyData, SchedulerProjectData, TimeUnits, WorkingDuration } from "@/types/global";
import { dayStartHour, secondsInHour } from "@/constants";
import { getDuration } from "@/utils/getDuration";
import { getTimeOccupancy } from "@/utils/getTimeOccupancy";
import { getMaxHoursPerDay, isOccupancyProject } from "@/utils/occupancyUtils";

const getHoursAndMinutes = <TMeta>(
  projectRows: SchedulerProjectData<TMeta>[][],
  focusedDate: dayjs.Dayjs,
  dayStartHour: number,
  workingDuration: WorkingDuration
): TimeUnits => {
  let cumulativeTimeSeconds = 0;
  const dayStart = focusedDate.hour(dayStartHour).minute(0);
  if (focusedDate.isBefore(dayStart)) {
    return { hours: 0, minutes: 0 };
  }

  let projectsEndTimeDiff = 0;
  for (const row of projectRows) {
    const currentDayProject = row.find((item) =>
      dayjs(focusedDate).isBetween(item.startDate, item.endDate, "day", "[]")
    );

    if (!currentDayProject) continue;

    let occupancy = 0;
    if (isOccupancyProject(currentDayProject)) {
      occupancy = currentDayProject.occupancy;
    } else {
      const maxHoursPerDay = getMaxHoursPerDay(focusedDate, workingDuration);
      occupancy = currentDayProject.throughput * maxHoursPerDay * 3600;
    }

    const projectEndHour = dayStart.add(occupancy + cumulativeTimeSeconds, "second");
    projectsEndTimeDiff = projectEndHour.diff(focusedDate, "second");

    if (projectsEndTimeDiff >= secondsInHour) {
      return { hours: 1, minutes: 0 };
    }

    cumulativeTimeSeconds += occupancy;
  }

  return getDuration(Math.max(projectsEndTimeDiff, 0));
};

export const getHourOccupancy = <TMeta>(
  projectRows: SchedulerProjectData<TMeta>[][],
  focusedDate: dayjs.Dayjs,
  workingDuration: WorkingDuration,
  defaultStartHour?: number
): OccupancyData => {
  const startHour = defaultStartHour ?? dayStartHour;

  const maxHours = getMaxHoursPerDay(focusedDate, workingDuration);
  const workStart = focusedDate.hour(startHour).minute(0);
  const maxEndTime = workStart.add(maxHours, "hour");
  const focusedHourEndTimeDiff = maxEndTime.diff(focusedDate, "hour", true);
  const allowedWorkingDuration = focusedDate.isBefore(workStart)
    ? 0
    : Math.min(Math.max(0, focusedHourEndTimeDiff), 1);

  const hoursAndMinutes = getHoursAndMinutes(projectRows, focusedDate, startHour, workingDuration);
  const { free, overtime } = getTimeOccupancy(allowedWorkingDuration, hoursAndMinutes);

  return {
    taken: hoursAndMinutes,
    free,
    overtime
  };
};
