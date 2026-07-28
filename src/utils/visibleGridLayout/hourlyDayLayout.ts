import dayjs from "dayjs";
import {
  PaginatedSchedulerData,
  PaginatedSchedulerRow,
  SchedulerProjectData
} from "@/types/global";
import { secondsInHour } from "@/constants";
import { WorkWindow } from "@/utils/holidayRequestHelper";
import { isProjectVisible } from "@/utils/scrollHelpers";
import { isOccupancyProject } from "@/utils/workingDurationHelper";
import { ensureDayArrayEntries, getDayKeysForRange, getFullDayRange } from "./dayCacheHelpers";
import {
  CachedResourceDayMap,
  HourlyDayPlacement,
  HourlyDayPlacementCache,
  ResourceDayCache,
  VisibleRange
} from "./types";

/** Calculates how many seconds a project occupies from its resolved daily start time. */
const calculateProjectOccupancySeconds = <TMeta>(
  project: SchedulerProjectData<TMeta>,
  currentStartTime: dayjs.Dayjs,
  workWindow: WorkWindow
): number => {
  const availableSeconds = Math.max(
    currentStartTime.endOf("day").diff(currentStartTime, "second"),
    0
  );
  if (availableSeconds <= 0) return 0;

  if (isOccupancyProject(project)) {
    return Math.min(project.occupancy, availableSeconds);
  }

  const availableHours = workWindow.end.diff(workWindow.start, "hour", true);
  const projectSeconds = project.throughput * availableHours * secondsInHour;
  return Math.min(projectSeconds, availableSeconds);
};

/**
 * Appends a project after the final cached placement for a resource day.
 *
 * Placements are consequently stored in chronological and row order.
 */
const addHourlyDayPlacement = <TMeta>(
  dayKey: number,
  project: SchedulerProjectData<TMeta>,
  workWindow: WorkWindow,
  hourlyPlacementsByDay: Map<number, HourlyDayPlacement<TMeta>[]>
) => {
  const dayPlacements = hourlyPlacementsByDay.get(dayKey) ?? [];
  const rowIndex = dayPlacements.length;
  const startTime = rowIndex ? dayPlacements[rowIndex - 1].endDateTime : workWindow.start;
  const projectSeconds = calculateProjectOccupancySeconds(project, startTime, workWindow);
  if (projectSeconds <= 0) return;

  dayPlacements.push({
    project,
    rowIndex,
    startDateTime: startTime,
    endDateTime: startTime.add(projectSeconds, "second")
  });
  hourlyPlacementsByDay.set(dayKey, dayPlacements);
};

/**
 * Builds complete hourly layouts for the missing days of one resource.
 *
 * Projects are scanned once and may contribute a sequential placement to each
 * missing day intersecting their date range.
 */
const ensureHourlyResourceDayLayout = <TMeta>(
  missingDayKeys: ReadonlySet<number>,
  hourlyPlacementsByDay: Map<number, HourlyDayPlacement<TMeta>[]>,
  resource: PaginatedSchedulerRow<TMeta>,
  fullDayRange: VisibleRange,
  dayContextsByDay: CachedResourceDayMap
) => {
  for (const row of resource.data) {
    for (const project of row) {
      if (
        !isProjectVisible(
          project.startDate,
          project.endDate,
          fullDayRange.startDate,
          fullDayRange.endDate
        )
      ) {
        continue;
      }

      let currentDate = (
        fullDayRange.startDate.isBefore(project.startDate, "day")
          ? dayjs(project.startDate)
          : fullDayRange.startDate
      ).startOf("day");
      const endDate = (
        fullDayRange.endDate.isAfter(project.endDate, "day")
          ? dayjs(project.endDate)
          : fullDayRange.endDate
      )
        .add(1, "day")
        .startOf("day");

      while (currentDate.isBefore(endDate, "day")) {
        const dayKey = currentDate.valueOf();
        currentDate = currentDate.add(1, "day");

        if (!missingDayKeys.has(dayKey)) continue;

        const workWindow = dayContextsByDay.get(dayKey)?.workWindow;
        if (!workWindow) continue;

        addHourlyDayPlacement(dayKey, project, workWindow, hourlyPlacementsByDay);
      }
    }
  }
};

/**
 * Ensures complete hourly day layouts exist for every resource in a range.
 *
 * The cache is mutated in place. Existing day layouts are reused, including
 * empty layouts, so ordinary hourly scrolling only calculates newly encountered days.
 */
export const ensureHourlyDayLayouts = <TMeta>(
  cache: HourlyDayPlacementCache<TMeta>,
  data: PaginatedSchedulerData<TMeta>,
  visibleRange: VisibleRange,
  dayContextsByResource: ResourceDayCache
) => {
  const fullDayRange = getFullDayRange(visibleRange);
  const requiredDayKeys = getDayKeysForRange(fullDayRange);

  for (const resource of data) {
    let resourceCache = cache.get(resource.id);

    if (!resourceCache) {
      resourceCache = new Map();
      cache.set(resource.id, resourceCache);
    }

    const resourceDayCache = dayContextsByResource.get(resource.id);
    if (!resourceDayCache) continue;

    const missingDayKeys = ensureDayArrayEntries(resourceCache, requiredDayKeys);
    if (!missingDayKeys.size) continue;

    ensureHourlyResourceDayLayout(
      missingDayKeys,
      resourceCache,
      resource,
      fullDayRange,
      resourceDayCache.dayContextsByDay
    );
  }
};
