import dayjs from "dayjs";
import { DATA_CONFIG } from "@/constants";
import { Config, SchedulerData, SchedulerProjectData } from "@/types/global";
import { ParsedDatesRange } from "@/utils/getDatesRange";
import { FetchDataDirection } from "./types";

export type DayjsRange = {
  startDate: dayjs.Dayjs;
  endDate: dayjs.Dayjs;
};

export type NormalizedDataLoadingConfig = {
  prefetchDays: number;
  prefetchTriggerDays: number;
  prefetchTriggerRatio: number;
  maxCachedDays: number;
};

const normalizePositiveInt = (value: number | undefined, fallback: number): number => {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  return Math.max(1, Math.floor(value));
};

const normalizeNonNegativeInt = (value: number | undefined, fallback: number): number => {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  return Math.max(0, Math.floor(value));
};

const normalizeTriggerRatio = (value: number | undefined): number => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return DATA_CONFIG.prefetchTriggerRatio;
  }

  return Math.min(0.99, Math.max(0.01, value));
};

export const getNormalizedDataLoadingConfig = (
  dataLoading?: Config["dataLoading"]
): NormalizedDataLoadingConfig => ({
  prefetchDays: normalizePositiveInt(dataLoading?.prefetchDays, DATA_CONFIG.prefetchDays),
  prefetchTriggerDays: normalizeNonNegativeInt(
    dataLoading?.prefetchTriggerDays,
    DATA_CONFIG.prefetchTriggerDays
  ),
  prefetchTriggerRatio: normalizeTriggerRatio(dataLoading?.prefetchTriggerRatio),
  maxCachedDays: normalizePositiveInt(dataLoading?.maxCachedDays, DATA_CONFIG.maxCachedDays)
});

const isProjectInRange = (project: SchedulerProjectData, range: DayjsRange): boolean => {
  const start = dayjs(project.startDate);
  const end = dayjs(project.endDate);

  return (
    (start.isBefore(range.endDate) || start.isSame(range.endDate)) &&
    (end.isAfter(range.startDate) || end.isSame(range.startDate))
  );
};

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

export const getRetentionRange = (
  visibleRange: ParsedDatesRange,
  maxCachedDays: number
): DayjsRange => {
  const visibleStart = dayjs(visibleRange.startDate);
  const visibleEnd = dayjs(visibleRange.endDate);
  const center = visibleStart.add(visibleEnd.diff(visibleStart) / 2, "millisecond");

  return {
    startDate: center.subtract(maxCachedDays, "day"),
    endDate: center.add(maxCachedDays, "day")
  };
};

export const getPrefetchFlags = (
  visibleRange: ParsedDatesRange,
  dataRange: DayjsRange,
  config: Pick<NormalizedDataLoadingConfig, "prefetchTriggerRatio" | "prefetchTriggerDays">
): { backward: boolean; forward: boolean } => {
  const visibleStart = dayjs(visibleRange.startDate);
  const visibleEnd = dayjs(visibleRange.endDate);
  const totalSpanMs = Math.max(dataRange.endDate.diff(dataRange.startDate), 1);

  const lowerThreshold = 1 - config.prefetchTriggerRatio;
  const startRatio = visibleStart.diff(dataRange.startDate) / totalSpanMs;
  const endRatio = visibleEnd.diff(dataRange.startDate) / totalSpanMs;
  const daysFromStart = visibleStart.diff(dataRange.startDate, "day", true);
  const daysToEnd = dataRange.endDate.diff(visibleEnd, "day", true);

  return {
    backward:
      visibleStart.isBefore(dataRange.startDate) ||
      startRatio <= lowerThreshold ||
      daysFromStart <= config.prefetchTriggerDays,
    forward:
      visibleEnd.isAfter(dataRange.endDate) ||
      endRatio >= config.prefetchTriggerRatio ||
      daysToEnd <= config.prefetchTriggerDays
  };
};

export const getPrefetchRequest = (
  direction: FetchDataDirection,
  dataRange: DayjsRange,
  prefetchDays: number
): { range: DayjsRange; edgeValue: number } => {
  if (direction === "backward") {
    return {
      range: {
        startDate: dataRange.startDate.subtract(prefetchDays, "day"),
        endDate: dataRange.startDate.subtract(1, "millisecond")
      },
      edgeValue: dataRange.startDate.valueOf()
    };
  }

  return {
    range: {
      startDate: dataRange.endDate.add(1, "millisecond"),
      endDate: dataRange.endDate.add(prefetchDays, "day")
    },
    edgeValue: dataRange.endDate.valueOf()
  };
};
