import { useMemo } from "react";
import { PaginatedSchedulerData, WorkingDuration } from "@/types/global";
import visibleGridLayout, {
  ensureDayContextsForRange,
  ensureHourlyDayLayouts,
  getRangeLayoutRange,
  HourlyDayPlacementCache,
  ResourceDayCache,
  VisibleLayoutResource,
  VisibleRange
} from "@/utils/visibleGridLayout";
import { sortWorkingDurations } from "@/utils/workingDurationHelper";

/**
 * Builds render-ready scheduler layouts while retaining availability and hourly
 * day calculations across discrete visible-range changes.
 *
 * Availability caches are invalidated when resource, holiday, or working-time
 * inputs change. Hourly placement caches share that lifetime and lazily populate
 * only the days encountered in hourly view.
 */
const useVisibleGridLayout = <TMeta>(
  zoom: number,
  data: PaginatedSchedulerData<TMeta>,
  visibleRange: VisibleRange,
  defaultWorkingDurations: WorkingDuration[],
  defaultWorkDayHours: number,
  defaultStartHour: number
): VisibleLayoutResource<TMeta>[] => {
  const sortedWorkingDurationsPerResource = useMemo(
    () =>
      new Map(
        data.map(
          (resource) =>
            [
              resource.id,
              sortWorkingDurations(resource.workingDurations ?? defaultWorkingDurations)
            ] as const
        )
      ),
    [data, defaultWorkingDurations]
  );

  const resourceDayCache = useMemo(
    (): ResourceDayCache => new Map(),
    // These inputs intentionally define the cache's invalidation lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, defaultStartHour, defaultWorkDayHours, sortedWorkingDurationsPerResource]
  );

  const hourlyDayPlacementCache = useMemo(
    (): HourlyDayPlacementCache<TMeta> => new Map(),
    // Hourly placements must be invalidated with their availability contexts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [resourceDayCache]
  );

  const layout = useMemo(() => {
    const contextRange = getRangeLayoutRange(zoom, visibleRange);

    ensureDayContextsForRange(
      data,
      resourceDayCache,
      sortedWorkingDurationsPerResource,
      defaultWorkDayHours,
      defaultStartHour,
      contextRange
    );

    if (zoom === 2) {
      ensureHourlyDayLayouts(hourlyDayPlacementCache, data, visibleRange, resourceDayCache);
    }

    return visibleGridLayout(
      zoom,
      data,
      resourceDayCache,
      hourlyDayPlacementCache,
      visibleRange,
      defaultWorkDayHours,
      defaultStartHour
    );
  }, [
    data,
    defaultStartHour,
    defaultWorkDayHours,
    hourlyDayPlacementCache,
    resourceDayCache,
    sortedWorkingDurationsPerResource,
    visibleRange,
    zoom
  ]);

  return layout;
};

export default useVisibleGridLayout;
