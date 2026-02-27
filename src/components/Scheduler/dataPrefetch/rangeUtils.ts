import dayjs from "dayjs";
import { SchedulerData, SchedulerProjectData } from "@/types/global";
import { ParsedDatesRange } from "@/utils/getDatesRange";
import { DayjsRange } from "./types";

/**
 * Checks whether project dates overlap a target range.
 *
 * @param project Project entry to test.
 * @param range Inclusive range for overlap.
 * @returns `true` when project intersects range.
 */
const isProjectInRange = (project: SchedulerProjectData, range: DayjsRange): boolean => {
  const start = dayjs(project.startDate);
  const end = dayjs(project.endDate);

  return (
    (start.isBefore(range.endDate) || start.isSame(range.endDate)) &&
    (end.isAfter(range.startDate) || end.isSame(range.startDate))
  );
};

/**
 * Converts scheduler range with native dates to dayjs range.
 *
 * @param range Range expressed with JavaScript `Date`.
 * @returns Equivalent dayjs range.
 */
export const toDayjsRange = (range: ParsedDatesRange): DayjsRange => ({
  startDate: dayjs(range.startDate),
  endDate: dayjs(range.endDate)
});

/**
 * Converts dayjs range back to scheduler callback format.
 *
 * @param range Dayjs-based range.
 * @returns Equivalent range expressed with JavaScript `Date`.
 */
export const toParsedRange = (range: DayjsRange): ParsedDatesRange => ({
  startDate: range.startDate.toDate(),
  endDate: range.endDate.toDate()
});

/**
 * Calculates center timestamp of a range.
 *
 * @param range Input range.
 * @returns Center point of the range.
 */
export const getRangeCenter = (range: DayjsRange): dayjs.Dayjs =>
  range.startDate.add(range.endDate.diff(range.startDate) / 2, "millisecond");

/**
 * Calculates range size in days with a minimum of one day.
 *
 * @param range Input range.
 * @returns Span in fractional days.
 */
export const getRangeSpanDays = (range: DayjsRange): number =>
  Math.max(range.endDate.diff(range.startDate, "day", true), 1);

/**
 * Unions two ranges into a single envelope range.
 *
 * @param current Existing range (or `null`).
 * @param incoming New range to include.
 * @returns Expanded range containing both inputs.
 */
export const mergeRanges = (current: DayjsRange | null, incoming: DayjsRange): DayjsRange => {
  if (!current) return incoming;

  return {
    startDate: current.startDate.isBefore(incoming.startDate)
      ? current.startDate
      : incoming.startDate,
    endDate: current.endDate.isAfter(incoming.endDate) ? current.endDate : incoming.endDate
  };
};

/**
 * Intersects a range with a limiting boundary.
 *
 * @param current Existing range (or `null`).
 * @param limit Boundary range that should be kept.
 * @returns Intersected range or `null` if disjoint/empty.
 */
export const intersectRanges = (
  current: DayjsRange | null,
  limit: DayjsRange
): DayjsRange | null => {
  if (!current) return null;

  const startDate = current.startDate.isAfter(limit.startDate)
    ? current.startDate
    : limit.startDate;
  const endDate = current.endDate.isBefore(limit.endDate) ? current.endDate : limit.endDate;

  if (startDate.isAfter(endDate)) return null;
  return { startDate, endDate };
};

/**
 * Scans scheduler rows to derive min/max covered dates.
 *
 * @param rows Cached scheduler rows.
 * @returns Global data range or `null` when cache is empty.
 */
export const getDataRangeFromProjects = (rows: SchedulerData): DayjsRange | null => {
  let minStartDate: dayjs.Dayjs | null = null;
  let maxEndDate: dayjs.Dayjs | null = null;

  for (const row of rows) {
    for (const project of row.data) {
      const start = dayjs(project.startDate);
      const end = dayjs(project.endDate);

      if (!minStartDate || start.isBefore(minStartDate)) {
        minStartDate = start;
      }

      if (!maxEndDate || end.isAfter(maxEndDate)) {
        maxEndDate = end;
      }
    }
  }

  if (!minStartDate || !maxEndDate) return null;
  return { startDate: minStartDate, endDate: maxEndDate };
};

/**
 * Merges incoming rows into cache, preserving row order and de-duplicating by project id.
 *
 * @param currentData Existing cached rows.
 * @param incomingData Newly fetched rows.
 * @returns Merged scheduler data.
 */
export const mergeSchedulerData = (
  currentData: SchedulerData,
  incomingData: SchedulerData
): SchedulerData => {
  if (!incomingData.length) return currentData;

  const rowsById = new Map<
    string,
    { label: SchedulerData[number]["label"]; projects: Map<string, SchedulerProjectData> }
  >();
  const rowOrder: string[] = [];

  for (const row of currentData) {
    rowOrder.push(row.id);
    rowsById.set(row.id, {
      label: row.label,
      projects: new Map(row.data.map((project) => [project.id, project]))
    });
  }

  for (const row of incomingData) {
    const existingRow = rowsById.get(row.id);

    if (!existingRow) {
      rowOrder.push(row.id);
      rowsById.set(row.id, {
        label: row.label,
        projects: new Map(row.data.map((project) => [project.id, project]))
      });
      continue;
    }

    existingRow.label = row.label;
    for (const project of row.data) {
      existingRow.projects.set(project.id, project);
    }
  }

  const mergedRows: SchedulerData = [];

  for (const rowId of rowOrder) {
    const row = rowsById.get(rowId);
    if (!row) continue;

    mergedRows.push({
      id: rowId,
      label: row.label,
      data: Array.from(row.projects.values())
    });
  }

  return mergedRows;
};

/**
 * Trims cached rows to projects that intersect a retention range.
 *
 * @param rows Cached scheduler rows.
 * @param range Retention range to keep in memory.
 * @returns Trimmed rows (or original array if unchanged).
 */
export const trimDataToRange = (rows: SchedulerData, range: DayjsRange): SchedulerData => {
  let changed = false;

  const trimmedRows = rows.map((row) => {
    const filteredProjects = row.data.filter((project) => isProjectInRange(project, range));

    if (filteredProjects.length === row.data.length) {
      return row;
    }

    changed = true;
    return { ...row, data: filteredProjects };
  });

  return changed ? trimmedRows : rows;
};

/**
 * Builds symmetric retention range around current visible center.
 *
 * @param visibleRange Currently visible range from calendar.
 * @param maxCachedDays Number of days to keep before/after center.
 * @returns Range used to trim in-memory cache.
 */
export const getRetentionRange = (
  visibleRange: ParsedDatesRange,
  maxCachedDays: number
): DayjsRange => {
  const visibleDayjsRange = toDayjsRange(visibleRange);
  const center = getRangeCenter(visibleDayjsRange);

  return {
    startDate: center.subtract(maxCachedDays, "day"),
    endDate: center.add(maxCachedDays, "day")
  };
};
