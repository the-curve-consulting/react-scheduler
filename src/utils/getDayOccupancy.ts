import dayjs from "dayjs";
import {
  OccupancyData,
  SchedulerProjectData,
  SchedulerProjectDataOccupancy,
  TimeUnits,
  WorkingDuration
} from "@/types/global";
import { getMaxHoursPerDay, isOccupancyProject } from "@/utils/workingDurationHelper";
import { getDuration } from "./getDuration";
import { getTotalHoursAndMinutes } from "./getTotalHoursAndMinutes";
import { getTimeOccupancy } from "./getTimeOccupancy";

const getHoursAndMinutesForOccupancy = <TMeta>(
  project: SchedulerProjectDataOccupancy<TMeta>,
  focusedDayNum: number,
  includeTakenHoursOnWeekendsInDayView: boolean
): TimeUnits => {
  const { hours: itemHours, minutes: itemMinutes } = getDuration(project.occupancy);

  // if config was set to include free weekends max day num is 5 - friday else is 7 - whole week
  if (focusedDayNum <= (includeTakenHoursOnWeekendsInDayView ? 7 : 5)) {
    return { hours: itemHours, minutes: itemMinutes };
  }
  return { hours: 0, minutes: 0 };
};

const getHoursAndMinutes = <TMeta>(
  occupancy: SchedulerProjectData<TMeta>[],
  focusedDate: dayjs.Dayjs,
  includeTakenHoursOnWeekendsInDayView: boolean,
  maxHoursPerDay: number
): TimeUnits[] => {
  const focusedDayNum = focusedDate.isoWeekday();
  return occupancy.map((item) => {
    if (isOccupancyProject(item)) {
      return getHoursAndMinutesForOccupancy(
        item,
        focusedDayNum,
        includeTakenHoursOnWeekendsInDayView
      );
    }

    const durationSeconds = item.throughput * maxHoursPerDay * 3600;
    return getDuration(durationSeconds);
  });
};

export const getDayOccupancy = <TMeta>(
  occupancy: SchedulerProjectData<TMeta>[],
  focusedDate: dayjs.Dayjs,
  includeTakenHoursOnWeekendsInDayView: boolean,
  workingDuration: WorkingDuration
): OccupancyData => {
  const maxHours = getMaxHoursPerDay(focusedDate, workingDuration);
  const hoursAndMinutes = getHoursAndMinutes(
    occupancy,
    focusedDate,
    includeTakenHoursOnWeekendsInDayView,
    maxHours
  );
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
