import dayjs from "dayjs";
import {
  HolidayRequest,
  PaginatedSchedulerData,
  PaginatedSchedulerRow,
  SchedulerProjectData,
  WorkingDuration
} from "@/types/global";
import { isProjectVisible } from "@/utils/scrollHelpers";
import {
  getAvailableWorkWindowFromKinds,
  getHolidayKind,
  getHolidayWindow,
  HolidayKind,
  WorkWindow
} from "@/utils/holidayRequestHelper";
import { getWorkingHoursForDate } from "@/utils/workingDurationHelper";

type ResourceDayContext = {
  workWindow: WorkWindow | null;
  availableHours: number;
};
export type CachedResourceDayMap = Map<number, ResourceDayContext>;
type HolidayKindsByDay = Map<number, HolidayKind[]>;
type ResourceAvailabilityCache = {
  dayContextsByDay: CachedResourceDayMap;
  holidayKindsByDay: HolidayKindsByDay;
};
export type ResourceDayCache = Map<string, ResourceAvailabilityCache>;

type HourlyDayPlacement<TMeta> = {
  project: SchedulerProjectData<TMeta>;
  sourceRowIndex: number;
  startDateTime: dayjs.Dayjs;
  endDateTime: dayjs.Dayjs;
};

export type VisibleRange = { startDate: dayjs.Dayjs; endDate: dayjs.Dayjs };

export type HolidayPlacement = {
  holidayRequest: HolidayRequest;
  kind: HolidayKind;
  startDate: dayjs.Dayjs;
  endDate: dayjs.Dayjs;
};

type VisibleLayoutResourceBase = {
  resourceId: string;
  visibleRowsCount: number;
  holidayPlacements: HolidayPlacement[];
};

type RangeVisibleLayoutResource<TMeta> = VisibleLayoutResourceBase & {
  mode: "range";
  visibleProjectRows: SchedulerProjectData<TMeta>[][];
  dayContextsByDay: ReadonlyMap<number, ResourceDayContext>;
};

type HourlyVisibleLayoutResource<TMeta> = VisibleLayoutResourceBase & {
  mode: "hourly";
  visibleHourlyPlacements: HourlyDayPlacement<TMeta>[];
};

export type VisibleLayoutResource<TMeta> =
  | RangeVisibleLayoutResource<TMeta>
  | HourlyVisibleLayoutResource<TMeta>;

const ensureHolidayKindsForRange = (
  holidayRequests: HolidayRequest[],
  holidayKindsByDay: HolidayKindsByDay,
  rangeStart: dayjs.Dayjs,
  rangeEnd: dayjs.Dayjs
) => {
  const unresolvedDayKeys = new Set<number>();
  let currentDate = rangeStart.startOf("day");
  const lastDate = rangeEnd.startOf("day");

  while (!currentDate.isAfter(lastDate, "day")) {
    const dayKey = currentDate.valueOf();

    if (!holidayKindsByDay.has(dayKey)) {
      holidayKindsByDay.set(dayKey, []);
      unresolvedDayKeys.add(dayKey);
    }

    currentDate = currentDate.add(1, "day");
  }

  if (!unresolvedDayKeys.size) return;

  for (const holidayRequest of holidayRequests) {
    const leaveStart = dayjs(holidayRequest.leave_from).startOf("day");
    const leaveEnd = dayjs(holidayRequest.leave_to).startOf("day");

    if (leaveStart.isAfter(lastDate, "day") || leaveEnd.isBefore(rangeStart, "day")) {
      continue;
    }

    const kind = getHolidayKind(holidayRequest);
    currentDate = leaveStart.isBefore(rangeStart, "day") ? rangeStart : leaveStart;
    const holidayEnd = leaveEnd.isAfter(lastDate, "day") ? lastDate : leaveEnd;

    while (!currentDate.isAfter(holidayEnd, "day")) {
      const dayKey = currentDate.valueOf();

      if (unresolvedDayKeys.has(dayKey)) {
        holidayKindsByDay.get(dayKey)!.push(kind);
      }

      currentDate = currentDate.add(1, "day");
    }
  }
};

const calculateDayContext = (
  holidayKindsByDay: ReadonlyMap<number, HolidayKind[]>,
  sortedWorkingDurations: WorkingDuration[],
  defaultWorkDayHours: number,
  defaultStartHour: number,
  date: dayjs.Dayjs
): ResourceDayContext => {
  const dayKey = date.startOf("day").valueOf();
  const workingHours = getWorkingHoursForDate(date, sortedWorkingDurations);
  const holidayKinds = holidayKindsByDay.get(dayKey) ?? [];
  const halfDayHours = defaultWorkDayHours / 2;
  const workWindow = getAvailableWorkWindowFromKinds(
    date,
    workingHours,
    holidayKinds,
    defaultStartHour,
    halfDayHours
  );

  return {
    workWindow,
    availableHours: workWindow ? workWindow.end.diff(workWindow.start, "hour", true) : 0
  };
};

export const ensureDayContextsForRange = <TMeta>(
  data: PaginatedSchedulerData<TMeta>,
  resourceDayCache: ResourceDayCache,
  sortedWorkingDurationsPerResource: ReadonlyMap<string, WorkingDuration[]>,
  defaultWorkDayHours: number,
  defaultStartHour: number,
  visibleRange: VisibleRange
) => {
  for (const resource of data) {
    let resourceCache = resourceDayCache.get(resource.id);

    if (!resourceCache) {
      resourceCache = {
        dayContextsByDay: new Map(),
        holidayKindsByDay: new Map()
      };
      resourceDayCache.set(resource.id, resourceCache);
    }

    const { dayContextsByDay, holidayKindsByDay } = resourceCache;
    const sortedWorkingDurations = sortedWorkingDurationsPerResource.get(resource.id);
    if (!sortedWorkingDurations) continue;

    const startDate = visibleRange.startDate.startOf("day");
    const endDate = visibleRange.endDate.startOf("day");
    ensureHolidayKindsForRange(resource.holidayRequests, holidayKindsByDay, startDate, endDate);

    let currentDate = startDate;
    while (!currentDate.isAfter(endDate, "day")) {
      const dayKey = currentDate.valueOf();
      if (dayContextsByDay.has(dayKey)) {
        currentDate = currentDate.add(1, "day");
        continue;
      }

      const dayContext = calculateDayContext(
        holidayKindsByDay,
        sortedWorkingDurations,
        defaultWorkDayHours,
        defaultStartHour,
        currentDate
      );
      dayContextsByDay.set(dayKey, dayContext);

      currentDate = currentDate.add(1, "day");
    }
  }
};

const getHolidayPlacement = (
  zoom: number,
  holidayRequests: HolidayRequest[],
  visibleRange: VisibleRange,
  defaultWorkDayHours: number,
  defaultStartHour: number
): HolidayPlacement[] => {
  const visibleStart = visibleRange.startDate.startOf("day");
  const visibleEnd = visibleRange.endDate.startOf("day");

  return holidayRequests.flatMap((holidayRequest) => {
    const leaveStart = dayjs(holidayRequest.leave_from).startOf("day");
    const leaveEnd = dayjs(holidayRequest.leave_to).startOf("day");

    if (leaveStart.isAfter(visibleEnd, "day") || leaveEnd.isBefore(visibleStart, "day")) {
      return [];
    }

    const holidayStart = leaveStart.isBefore(visibleStart, "day") ? visibleStart : leaveStart;
    const holidayEnd = leaveEnd.isAfter(visibleEnd, "day") ? visibleEnd : leaveEnd;
    const kind = getHolidayKind(holidayRequest);
    const holidayWindow = getHolidayWindow(
      holidayStart,
      holidayEnd,
      defaultStartHour,
      kind,
      defaultWorkDayHours / 2,
      zoom
    );

    return holidayWindow
      ? [
          {
            holidayRequest,
            kind,
            startDate: holidayWindow.startDate,
            endDate: holidayWindow.endDate
          }
        ]
      : [];
  });
};

//TODO [Jakub]
const getHourlyDayLayout = <TMeta>(
  data: SchedulerProjectData<TMeta>[][],
  date: dayjs.Dayjs,
  dayContext: ResourceDayContext = { workWindow: null, availableHours: 0 }
): HourlyDayPlacement<TMeta>[] => {
  const startDate = date.startOf("day");
  const endDate = date.endOf("day");
  const hourlyDayLayout: HourlyDayPlacement<TMeta>[] = [];

  const dailyData = data.flatMap((row, index) => {
    row.forEach((project) => {
      if (!isProjectVisible(project.startDate, project.endDate, startDate, endDate)) return;
    });
  });

  return [];
};

//TODO [Jakub]
const getHourlyVisibleLayoutResource = <TMeta>(
  resource: PaginatedSchedulerRow<TMeta>,
  dayContextsByDay: CachedResourceDayMap,
  visibleRange: VisibleRange,
  defaultWorkDayHours: number,
  defaultStartHour: number
): HourlyVisibleLayoutResource<TMeta> => {
  return {
    resourceId: resource.id,
    mode: "hourly",
    visibleHourlyPlacements: [],
    visibleRowsCount: 0,
    holidayPlacements: getHolidayPlacement(
      2,
      resource.holidayRequests,
      visibleRange,
      defaultWorkDayHours,
      defaultStartHour
    )
  };
};

const getRangeVisibleLayoutResource = <TMeta>(
  zoom: number,
  resource: PaginatedSchedulerRow<TMeta>,
  dayContextsByDay: CachedResourceDayMap,
  visibleRange: VisibleRange,
  defaultWorkDayHours: number,
  defaultStartHour: number
): RangeVisibleLayoutResource<TMeta> => {
  const visibleProjectRows = resource.data.flatMap((row) => {
    const visibleProjects = row.filter((project) =>
      isProjectVisible(
        project.startDate,
        project.endDate,
        visibleRange.startDate,
        visibleRange.endDate
      )
    );

    return visibleProjects.length ? [visibleProjects] : [];
  });

  return {
    resourceId: resource.id,
    mode: "range",
    visibleRowsCount: visibleProjectRows.length,
    visibleProjectRows,
    holidayPlacements: getHolidayPlacement(
      zoom,
      resource.holidayRequests,
      visibleRange,
      defaultWorkDayHours,
      defaultStartHour
    ),
    dayContextsByDay
  };
};

const visibleGridLayout = <TMeta>(
  zoom: number,
  data: PaginatedSchedulerData<TMeta>,
  dayContextsByResource: ResourceDayCache,
  visibleRange: VisibleRange,
  defaultWorkDayHours: number,
  defaultStartHour: number
): VisibleLayoutResource<TMeta>[] => {
  return data.map((resource) => {
    let resourceCache = dayContextsByResource.get(resource.id);

    if (!resourceCache) {
      resourceCache = {
        dayContextsByDay: new Map(),
        holidayKindsByDay: new Map()
      };
      dayContextsByResource.set(resource.id, resourceCache);
    }

    if (zoom !== 2) {
      return getRangeVisibleLayoutResource(
        zoom,
        resource,
        resourceCache.dayContextsByDay,
        visibleRange,
        defaultWorkDayHours,
        defaultStartHour
      );
    }

    return getHourlyVisibleLayoutResource(
      resource,
      resourceCache.dayContextsByDay,
      visibleRange,
      defaultWorkDayHours,
      defaultStartHour
    );
  });
};

export default visibleGridLayout;
