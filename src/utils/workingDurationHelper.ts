import dayjs from "dayjs";
import {
  SchedulerProjectData,
  SchedulerProjectDataOccupancy,
  WorkingDay,
  WorkingDuration
} from "@/types/global";
import { DaysOfWeekMap } from "@/constants";

/**
 * Checks whether a scheduler project uses legacy fixed occupancy seconds.
 *
 * @param project Scheduler project data to check.
 * @returns True when the project has an occupancy field.
 */
export const isOccupancyProject = <TMeta>(
  project: SchedulerProjectData<TMeta>
): project is SchedulerProjectDataOccupancy<TMeta> => {
  return "occupancy" in project;
};

/**
 * Reads configured working hours for the weekday of a specific date.
 *
 * @param focusedDate Date whose weekday should be resolved.
 * @param workingDuration Working-duration definition to read from.
 * @returns Configured hours for that weekday, or 0 when the day is not configured.
 */
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

/**
 * Sorts working-duration definitions by their effective start date.
 *
 * @param workingDurations Working-duration definitions to sort.
 * @returns A new array sorted by effectiveFrom in ascending day order.
 */
export const sortWorkingDurations = (workingDurations: WorkingDuration[]): WorkingDuration[] =>
  [...workingDurations].sort(
    (a, b) =>
      dayjs(a.effectiveFrom).startOf("day").valueOf() -
      dayjs(b.effectiveFrom).startOf("day").valueOf()
  );

/**
 * Extracts the working-duration definitions needed to resolve a visible date range.
 *
 * Includes the duration active at the range start and any duration changes inside the range.
 *
 * @param startDate First date in the range.
 * @param endDate Last date in the range.
 * @param sortedWorkingDurations Working durations sorted by effectiveFrom ascending.
 * @returns Relevant working-duration definitions for the inclusive range.
 */
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

/**
 * Finds the working-duration definition active on a specific date.
 *
 * @param focusedDate Date to resolve.
 * @param sortedWorkingDurations Working durations sorted by effectiveFrom ascending.
 * @returns The active working-duration definition, falling back to the first item.
 */
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

/**
 * Resolves the number of working hours configured for a specific date.
 *
 * @param focusedDate Date to resolve.
 * @param workingDurations Working durations sorted by effectiveFrom ascending.
 * @returns Working hours for the date's weekday, or 0 when the day is not worked.
 */
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
