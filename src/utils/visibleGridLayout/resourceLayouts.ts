import { PaginatedSchedulerRow } from "@/types/global";
import { isProjectVisible } from "@/utils/scrollHelpers";
import { getDayKeysForRange } from "./dayCacheHelpers";
import { getHolidayPlacements } from "./holidayLayout";
import {
  CachedResourceDayMap,
  HourlyDayPlacement,
  HourlyVisibleLayoutResource,
  RangeVisibleLayoutResource,
  VisibleRange
} from "./types";

/** Aligns weekly calculations to the complete ISO-week columns shown by the grid. */
export const getRangeLayoutRange = (zoom: number, visibleRange: VisibleRange): VisibleRange =>
  zoom === 0
    ? {
        startDate: visibleRange.startDate.startOf("isoWeek"),
        endDate: visibleRange.endDate.endOf("isoWeek")
      }
    : visibleRange;

/**
 * Projects complete cached hourly days onto an exact visible time range.
 *
 * Visible placements receive compact row indexes per day. Cached placements are
 * copied rather than mutated, preserving their complete-day row indexes.
 */
const getVisibleHourlyLayout = <TMeta>(
  visibleRange: VisibleRange,
  hourlyPlacementsByDay: ReadonlyMap<number, readonly HourlyDayPlacement<TMeta>[]>
): { hourlyPlacements: HourlyDayPlacement<TMeta>[]; visibleRows: number } => {
  const hourlyPlacements: HourlyDayPlacement<TMeta>[] = [];
  let visibleRows = 1;

  for (const dayKey of getDayKeysForRange(visibleRange)) {
    let rowIndex = 0;
    const dayPlacements = hourlyPlacementsByDay.get(dayKey) ?? [];

    for (const placement of dayPlacements) {
      if (!placement.startDateTime.isBefore(visibleRange.endDate)) break;
      if (!placement.endDateTime.isAfter(visibleRange.startDate)) continue;

      hourlyPlacements.push({ ...placement, rowIndex });
      rowIndex++;
    }

    visibleRows = Math.max(visibleRows, rowIndex);
  }

  return { hourlyPlacements, visibleRows };
};

/** Creates render-ready hourly layout data for one scheduler resource. */
export const getHourlyVisibleLayoutResource = <TMeta>(
  resource: PaginatedSchedulerRow<TMeta>,
  hourlyPlacementsByDay: ReadonlyMap<number, readonly HourlyDayPlacement<TMeta>[]>,
  visibleRange: VisibleRange,
  defaultWorkDayHours: number,
  defaultStartHour: number
): HourlyVisibleLayoutResource<TMeta> => {
  const { hourlyPlacements, visibleRows } = getVisibleHourlyLayout(
    visibleRange,
    hourlyPlacementsByDay
  );

  return {
    resourceId: resource.id,
    mode: "hourly",
    visibleHourlyPlacements: hourlyPlacements,
    visibleRowsCount: visibleRows,
    holidayPlacements: getHolidayPlacements(
      2,
      resource.holidayRequests,
      visibleRange,
      defaultWorkDayHours,
      defaultStartHour
    )
  };
};

/** Creates render-ready weekly or daily layout data for one scheduler resource. */
export const getRangeVisibleLayoutResource = <TMeta>(
  zoom: number,
  resource: PaginatedSchedulerRow<TMeta>,
  dayContextsByDay: CachedResourceDayMap,
  visibleRange: VisibleRange,
  defaultWorkDayHours: number,
  defaultStartHour: number
): RangeVisibleLayoutResource<TMeta> => {
  const layoutRange = getRangeLayoutRange(zoom, visibleRange);
  const visibleProjectRows = resource.data.flatMap((row) => {
    const visibleProjects = row.filter((project) =>
      isProjectVisible(
        project.startDate,
        project.endDate,
        layoutRange.startDate,
        layoutRange.endDate
      )
    );

    return visibleProjects.length ? [visibleProjects] : [];
  });

  return {
    resourceId: resource.id,
    mode: "range",
    visibleRowsCount: Math.max(visibleProjectRows.length, 1),
    visibleProjectRows,
    holidayPlacements: getHolidayPlacements(
      zoom,
      resource.holidayRequests,
      layoutRange,
      defaultWorkDayHours,
      defaultStartHour
    ),
    dayContextsByDay
  };
};
