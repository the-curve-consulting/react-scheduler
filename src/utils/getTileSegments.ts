import dayjs from "dayjs";
import { SchedulerProjectData } from "@/types/global";
import { ResourceDayContext, VisibleRange } from "@/utils/visibleGridLayout";

export type DayRun = {
  startDate: dayjs.Dayjs;
  endDate: dayjs.Dayjs;
};

export type TileSegment<TMeta = unknown> = {
  data: SchedulerProjectData<TMeta>;
  startDate: dayjs.Dayjs;
  endDate: dayjs.Dayjs;
  working: boolean;
  /** Days inside the segment that the resource does not work, for the tile to mark. */
  nonWorkingRuns: DayRun[];
};

/**
 * Checks whether at least one day in the inclusive date range has working hours.
 *
 * @param startDate First day to check.
 * @param endDate Last day to check.
 * @param dayContextsByDay Map keyed by start-of-day timestamp with ResourceDayContext as value.
 * @returns True when any day in the range has more than zero working hours.
 */
const hasWorkingHoursInRange = (
  startDate: dayjs.Dayjs,
  endDate: dayjs.Dayjs,
  dayContextsByDay: ReadonlyMap<number, ResourceDayContext>
): boolean => {
  let currentDate = startDate.startOf("day");
  const rangeEnd = endDate.startOf("day");

  while (!currentDate.isAfter(rangeEnd, "day")) {
    if ((dayContextsByDay.get(currentDate.valueOf())?.availableHours ?? 0) > 0) {
      return true;
    }

    currentDate = currentDate.add(1, "day");
  }

  return false;
};

/**
 * Builds one tile segment for a project across the visible range.
 *
 * A block of work that covers a weekend is one bar, and the days that the
 * resource does not work are marked inside it. Separate tiles each side of a
 * weekend read as two shorter blocks, and repeat the title of the project.
 *
 * @param project Project tile data to place.
 * @param visibleRange Start and end dates of the visible viewport.
 * @param dayContextsByDay Map keyed by start-of-day timestamp with ResourceDayContext as value.
 * @returns One segment clipped to the project and visible date range, or none.
 */
export const getDailyTileSegments = <TMeta>(
  project: SchedulerProjectData<TMeta>,
  visibleRange: VisibleRange,
  dayContextsByDay: ReadonlyMap<number, ResourceDayContext>
): TileSegment<TMeta>[] => {
  const projectStartDate = dayjs(project.startDate).startOf("day");
  const projectEndDate = dayjs(project.endDate).startOf("day");
  const visibleStartDateDay = visibleRange.startDate.startOf("day");
  const visibleEndDateDay = visibleRange.endDate.startOf("day");

  const startDate = visibleStartDateDay.isAfter(projectStartDate)
    ? visibleStartDateDay
    : projectStartDate;
  const endDate = visibleEndDateDay.isBefore(projectEndDate) ? visibleEndDateDay : projectEndDate;

  if (startDate.isAfter(endDate, "day")) {
    return [];
  }

  const nonWorkingRuns: DayRun[] = [];
  let currentDate = startDate;
  let runStartDate: dayjs.Dayjs | null = null;
  let anyWorkingDay = false;

  while (!currentDate.isAfter(endDate, "day")) {
    const working = (dayContextsByDay.get(currentDate.valueOf())?.availableHours ?? 0) > 0;

    if (working) {
      anyWorkingDay = true;

      if (runStartDate) {
        nonWorkingRuns.push({ startDate: runStartDate, endDate: currentDate.subtract(1, "day") });
        runStartDate = null;
      }
    } else if (!runStartDate) {
      runStartDate = currentDate;
    }

    currentDate = currentDate.add(1, "day");
  }

  if (runStartDate) {
    nonWorkingRuns.push({ startDate: runStartDate, endDate });
  }

  return [
    {
      data: project,
      startDate,
      endDate,
      working: anyWorkingDay,
      // A bar with no working day at all keeps the plain non-working tile.
      nonWorkingRuns: anyWorkingDay ? nonWorkingRuns : []
    }
  ];
};

/**
 * Splits a project into weekly working and non-working tile segments within the visible range.
 *
 * Each week is checked only over the clipped project dates, so a project that covers only
 * non-working days in a week is marked as non-working even if the person works earlier in that week.
 *
 * @param project Project tile data to split.
 * @param visibleRange Start and end dates of the visible viewport.
 * @param dayContextsByDay Map keyed by start-of-day timestamp with ResourceDayContext as value.
 * @returns Contiguous week-level segments clipped to the project and visible date range.
 */
export const getWeeklyTileSegments = <TMeta>(
  project: SchedulerProjectData<TMeta>,
  visibleRange: VisibleRange,
  dayContextsByDay: ReadonlyMap<number, ResourceDayContext>
): TileSegment<TMeta>[] => {
  const projectStartDate = dayjs(project.startDate).startOf("day");
  const projectEndDate = dayjs(project.endDate).startOf("day");
  const visibleStartDateDay = visibleRange.startDate.startOf("isoWeek");
  const visibleEndDateDay = visibleRange.endDate.endOf("isoWeek").startOf("day");

  const startDate = visibleStartDateDay.isAfter(projectStartDate)
    ? visibleStartDateDay
    : projectStartDate;
  const endDate = visibleEndDateDay.isBefore(projectEndDate) ? visibleEndDateDay : projectEndDate;

  if (startDate.isAfter(endDate, "day")) {
    return [];
  }

  let currentWeek = startDate.startOf("isoWeek");
  const endWeek = endDate.startOf("isoWeek");

  const segments: TileSegment<TMeta>[] = [];
  let segmentStartDate = startDate;
  let segmentWorking = hasWorkingHoursInRange(
    startDate,
    currentWeek.endOf("isoWeek").isAfter(endDate, "day") ? endDate : currentWeek.endOf("isoWeek"),
    dayContextsByDay
  );

  while (!currentWeek.isAfter(endWeek, "week")) {
    const weekStart = currentWeek.isBefore(startDate, "day") ? startDate : currentWeek;
    const weekEnd = currentWeek.endOf("isoWeek").isAfter(endDate, "day")
      ? endDate
      : currentWeek.endOf("isoWeek");
    const working = hasWorkingHoursInRange(weekStart, weekEnd, dayContextsByDay);

    if (working !== segmentWorking) {
      segments.push({
        data: project,
        startDate: segmentStartDate,
        endDate: weekStart.subtract(1, "day"),
        working: segmentWorking,
        nonWorkingRuns: []
      });

      segmentStartDate = weekStart;
      segmentWorking = working;
    }

    currentWeek = currentWeek.add(1, "week");
  }

  segments.push({
    data: project,
    startDate: segmentStartDate,
    endDate,
    working: segmentWorking,
    nonWorkingRuns: []
  });

  return segments;
};
