import dayjs from "dayjs";
import {
  SchedulerProjectData,
  SchedulerProjectDataOccupancy,
  WorkingDay,
  WorkingDuration
} from "@/types/global";
import { DaysOfWeekMap } from "@/constants";

export const isOccupancyProject = <TMeta>(
  project: SchedulerProjectData<TMeta>
): project is SchedulerProjectDataOccupancy<TMeta> => {
  return "occupancy" in project;
};

export const getMaxHoursPerDay = (
  focusedDate: dayjs.Dayjs,
  workingDuration: WorkingDuration
): number => {
  const focusedDayNum = focusedDate.isoWeekday();
  const day = Object.keys(DaysOfWeekMap)[focusedDayNum - 1];
  const hoursPerDay = workingDuration.workingDays.find(
    (workingDay: WorkingDay) => workingDay.day === day
  )?.hours;

  return hoursPerDay ?? 0;
};
