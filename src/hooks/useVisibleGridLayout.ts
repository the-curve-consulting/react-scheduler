import { useMemo } from "react";
import { PaginatedSchedulerData, WorkingDuration } from "@/types/global";
import visibleGridLayout, {
  ensureDayContextsForRange,
  ResourceDayCache,
  VisibleLayoutResource,
  VisibleRange
} from "@/utils/visibleGridLayout";
import { sortWorkingDurations } from "@/utils/workingDurationHelper";

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
    [data, defaultStartHour, defaultWorkDayHours, sortedWorkingDurationsPerResource]
  );

  const layout = useMemo(() => {
    ensureDayContextsForRange(
      data,
      resourceDayCache,
      sortedWorkingDurationsPerResource,
      defaultWorkDayHours,
      defaultStartHour,
      visibleRange
    );

    return visibleGridLayout(
      zoom,
      data,
      resourceDayCache,
      visibleRange,
      defaultWorkDayHours,
      defaultStartHour
    );
  }, [
    data,
    defaultStartHour,
    defaultWorkDayHours,
    resourceDayCache,
    sortedWorkingDurationsPerResource,
    visibleRange,
    zoom
  ]);

  return layout;
};

export default useVisibleGridLayout;
