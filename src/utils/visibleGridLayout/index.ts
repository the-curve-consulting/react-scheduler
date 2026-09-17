import { PaginatedSchedulerData } from "@/types/global";
import { getHourlyVisibleLayoutResource, getRangeVisibleLayoutResource } from "./resourceLayouts";
import {
  HourlyDayPlacementCache,
  ResourceAvailabilityCache,
  ResourceDayCache,
  VisibleLayoutResource,
  VisibleRange
} from "./types";

/** Returns an existing resource availability cache or creates an empty one. */
const getOrCreateResourceAvailability = (
  cache: ResourceDayCache,
  resourceId: string
): ResourceAvailabilityCache => {
  let resourceCache = cache.get(resourceId);

  if (!resourceCache) {
    resourceCache = {
      dayContextsByDay: new Map(),
      holidayKindsByDay: new Map()
    };
    cache.set(resourceId, resourceCache);
  }

  return resourceCache;
};

/**
 * Creates render-ready layouts for the resources in the current scheduler page.
 *
 * Weekly and daily views receive compact project rows and availability contexts.
 * Hourly views receive exact-time-filtered placements from complete cached day layouts.
 */
const visibleGridLayout = <TMeta>(
  zoom: number,
  data: PaginatedSchedulerData<TMeta>,
  dayContextsByResource: ResourceDayCache,
  hourlyDayPlacementCache: HourlyDayPlacementCache<TMeta>,
  visibleRange: VisibleRange,
  defaultWorkDayHours: number,
  defaultStartHour: number
): VisibleLayoutResource<TMeta>[] => {
  return data.map((resource) => {
    const resourceAvailability = getOrCreateResourceAvailability(
      dayContextsByResource,
      resource.id
    );

    if (zoom !== 2) {
      return getRangeVisibleLayoutResource(
        zoom,
        resource,
        resourceAvailability.dayContextsByDay,
        visibleRange,
        defaultWorkDayHours,
        defaultStartHour
      );
    }

    const hourlyPlacementsByDay = hourlyDayPlacementCache.get(resource.id) ?? new Map();
    return getHourlyVisibleLayoutResource(
      resource,
      hourlyPlacementsByDay,
      visibleRange,
      defaultWorkDayHours,
      defaultStartHour
    );
  });
};

export { ensureDayContextsForRange } from "./availabilityCache";
export { ensureHourlyDayLayouts } from "./hourlyDayLayout";
export { getRangeLayoutRange } from "./resourceLayouts";
export type {
  CachedResourceDayMap,
  HolidayPlacement,
  HourlyDayPlacement,
  HourlyDayPlacementCache,
  ResourceDayCache,
  ResourceDayContext,
  VisibleLayoutResource,
  VisibleRange
} from "./types";

export default visibleGridLayout;
