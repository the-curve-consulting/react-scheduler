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

export const sortWorkingDurations = (workingDurations: WorkingDuration[]): WorkingDuration[] =>
  [...workingDurations].sort(
    (a, b) =>
      dayjs(a.effectiveFrom).startOf("day").valueOf() -
      dayjs(b.effectiveFrom).startOf("day").valueOf()
  );

export const getWorkingDurationsForDateRange = (
  startDate: dayjs.Dayjs,
  endDate: dayjs.Dayjs,
  sortedWorkingDurations: WorkingDuration[]
): WorkingDuration[] => {
  const rangeStart = startDate.startOf("day");
  const rangeEnd = endDate.endOf("day");

  const activeAtStartIndex = sortedWorkingDurations.findLastIndex(
    ({ effectiveFrom }) => !dayjs(effectiveFrom).startOf("day").isAfter(rangeStart)
  );

  return sortedWorkingDurations.filter(({ effectiveFrom }, index) => {
    const effectiveDate = dayjs(effectiveFrom).startOf("day");

    return (
      index === activeAtStartIndex || effectiveDate.isBetween(rangeStart, rangeEnd, "day", "[]")
    );
  });
};

export const getWorkingDurationForDate = (
  focusedDate: dayjs.Dayjs,
  sortedWorkingDurations: WorkingDuration[]
): WorkingDuration => {
  const focusedDay = focusedDate.startOf("day");

  return (
    sortedWorkingDurations.findLast(
      ({ effectiveFrom }) => !dayjs(effectiveFrom).startOf("day").isAfter(focusedDay)
    ) ?? sortedWorkingDurations[0]
  );
};

export const getWorkingHoursForDate = (
  focusedDate: dayjs.Dayjs,
  workingDurations: WorkingDuration[]
): number => {
  const workingDuration = getWorkingDurationForDate(focusedDate, workingDurations);
  const focusedDayNum = focusedDate.isoWeekday();
  const day = Object.keys(DaysOfWeekMap)[focusedDayNum - 1];
  return (
    workingDuration.workingDays.find((workingDay: WorkingDay) => workingDay.day === day)?.hours ?? 0
  );
};
