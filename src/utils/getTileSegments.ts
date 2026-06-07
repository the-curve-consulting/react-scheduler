import dayjs from "dayjs";
import { SchedulerProjectData } from "@/types/global";

export type TileSegment<TMeta = unknown> = {
  data: SchedulerProjectData<TMeta>;
  startDate: dayjs.Dayjs;
  endDate: dayjs.Dayjs;
  working: boolean;
};

/**
 * Checks whether at least one day in the inclusive date range has working hours.
 *
 * @param startDate First day to check.
 * @param endDate Last day to check.
 * @param hoursByDay Map keyed by start-of-day timestamp with working hours as value.
 * @returns True when any day in the range has more than zero working hours.
 */
const hasWorkingHoursInRange = (
  startDate: dayjs.Dayjs,
  endDate: dayjs.Dayjs,
  hoursByDay: ReadonlyMap<number, number>
): boolean => {
  let currentDate = startDate.startOf("day");
  const rangeEnd = endDate.startOf("day");

  while (!currentDate.isAfter(rangeEnd, "day")) {
    if ((hoursByDay.get(currentDate.valueOf()) ?? 0) > 0) {
      return true;
    }

    currentDate = currentDate.add(1, "day");
  }

  return false;
};

/**
 * Splits a project into daily working and non-working tile segments within the visible range.
 *
 * @param project Project tile data to split.
 * @param visibleStartDate Start timestamp of the visible viewport.
 * @param visibleEndDate End timestamp of the visible viewport.
 * @param hoursByDay Map keyed by start-of-day timestamp with working hours as value.
 * @returns Contiguous day-level segments clipped to the project and visible date range.
 */
export const getDailyTileSegments = <TMeta>(
  project: SchedulerProjectData<TMeta>,
  visibleStartDate: number,
  visibleEndDate: number,
  hoursByDay: ReadonlyMap<number, number>
): TileSegment<TMeta>[] => {
  const projectStartDate = dayjs(project.startDate).startOf("day");
  const projectEndDate = dayjs(project.endDate).startOf("day");
  const visibleStartDateDay = dayjs(visibleStartDate).startOf("day");
  const visibleEndDateDay = dayjs(visibleEndDate).startOf("day");

  let currentDate = visibleStartDateDay.isAfter(projectStartDate)
    ? visibleStartDateDay
    : projectStartDate;

  const endDate = visibleEndDateDay.isBefore(projectEndDate) ? visibleEndDateDay : projectEndDate;

  if (currentDate.isAfter(endDate, "day")) {
    return [];
  }

  const segments: TileSegment<TMeta>[] = [];
  let segmentStartDate = currentDate;
  let segmentWorking = (hoursByDay.get(currentDate.valueOf()) ?? 0) > 0;

  while (!currentDate.isAfter(endDate, "day")) {
    const working = (hoursByDay.get(currentDate.valueOf()) ?? 0) > 0;

    if (working !== segmentWorking) {
      segments.push({
        data: project,
        startDate: segmentStartDate,
        endDate: currentDate.subtract(1, "day"),
        working: segmentWorking
      });

      segmentStartDate = currentDate;
      segmentWorking = working;
    }

    currentDate = currentDate.add(1, "day");
  }

  segments.push({
    data: project,
    startDate: segmentStartDate,
    endDate,
    working: segmentWorking
  });

  return segments;
};

/**
 * Splits a project into weekly working and non-working tile segments within the visible range.
 *
 * Each week is checked only over the clipped project dates, so a project that covers only
 * non-working days in a week is marked as non-working even if the person works earlier in that week.
 *
 * @param project Project tile data to split.
 * @param visibleStartDate Start timestamp of the visible viewport.
 * @param visibleEndDate End timestamp of the visible viewport.
 * @param hoursByDay Map keyed by start-of-day timestamp with working hours as value.
 * @returns Contiguous week-level segments clipped to the project and visible date range.
 */
export const getWeeklyTileSegments = <TMeta>(
  project: SchedulerProjectData<TMeta>,
  visibleStartDate: number,
  visibleEndDate: number,
  hoursByDay: ReadonlyMap<number, number>
): TileSegment<TMeta>[] => {
  const projectStartDate = dayjs(project.startDate).startOf("day");
  const projectEndDate = dayjs(project.endDate).startOf("day");
  const visibleStartDateDay = dayjs(visibleStartDate).startOf("day");
  const visibleEndDateDay = dayjs(visibleEndDate).startOf("day");

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
    hoursByDay
  );

  while (!currentWeek.isAfter(endWeek, "week")) {
    const weekStart = currentWeek.isBefore(startDate, "day") ? startDate : currentWeek;
    const weekEnd = currentWeek.endOf("isoWeek").isAfter(endDate, "day")
      ? endDate
      : currentWeek.endOf("isoWeek");
    const working = hasWorkingHoursInRange(weekStart, weekEnd, hoursByDay);

    if (working !== segmentWorking) {
      segments.push({
        data: project,
        startDate: segmentStartDate,
        endDate: weekStart.subtract(1, "day"),
        working: segmentWorking
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
    working: segmentWorking
  });

  return segments;
};
