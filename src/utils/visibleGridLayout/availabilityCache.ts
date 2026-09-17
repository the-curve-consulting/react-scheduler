import dayjs from "dayjs";
import { HolidayRequest, PaginatedSchedulerData, WorkingDuration } from "@/types/global";
import {
  getAvailableWorkWindowFromKinds,
  getHolidayKind,
  HolidayKind
} from "@/utils/holidayRequestHelper";
import { getWorkingHoursForDate } from "@/utils/workingDurationHelper";
import { ensureDayArrayEntries, getDayKeysForRange, getFullDayRange } from "./dayCacheHelpers";
import {
  HolidayKindsByDay,
  ResourceDayCache,
  ResourceDayContext,
  VisibleRange,
  WorkingDurationsByResource
} from "./types";

/**
 * Populates holiday-kind entries for previously unresolved days in a range.
 *
 * Existing days are never recalculated. Cache invalidation is owned by the
 * caller and must occur whenever the resource's holiday requests change.
 */
const ensureHolidayKindsForRange = (
  holidayRequests: HolidayRequest[],
  holidayKindsByDay: HolidayKindsByDay,
  fullDayRange: VisibleRange,
  requiredDayKeys: readonly number[]
) => {
  const missingDayKeys = ensureDayArrayEntries(holidayKindsByDay, requiredDayKeys);
  if (!missingDayKeys.size) return;

  const rangeStart = fullDayRange.startDate;
  const rangeEnd = fullDayRange.endDate;

  for (const holidayRequest of holidayRequests) {
    const leaveStart = dayjs(holidayRequest.leave_from).startOf("day");
    const leaveEnd = dayjs(holidayRequest.leave_to).startOf("day");

    if (leaveStart.isAfter(rangeEnd, "day") || leaveEnd.isBefore(rangeStart, "day")) {
      continue;
    }

    const kind = getHolidayKind(holidayRequest);
    let currentDate = leaveStart.isBefore(rangeStart, "day") ? rangeStart : leaveStart;
    const holidayEnd = leaveEnd.isAfter(rangeEnd, "day") ? rangeEnd : leaveEnd;

    while (!currentDate.isAfter(holidayEnd, "day")) {
      const dayKey = currentDate.valueOf();

      if (missingDayKeys.has(dayKey)) {
        holidayKindsByDay.get(dayKey)!.push(kind);
      }

      currentDate = currentDate.add(1, "day");
    }
  }
};

/** Calculates working availability for a single resource day. */
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

/**
 * Ensures availability contexts exist for every resource and day in a range.
 *
 * The function mutates `resourceDayCache` and calculates only missing entries.
 * Callers must recreate the cache when holiday or working-duration inputs change.
 */
export const ensureDayContextsForRange = <TMeta>(
  data: PaginatedSchedulerData<TMeta>,
  resourceDayCache: ResourceDayCache,
  sortedWorkingDurationsPerResource: WorkingDurationsByResource,
  defaultWorkDayHours: number,
  defaultStartHour: number,
  visibleRange: VisibleRange
) => {
  const fullDayRange = getFullDayRange(visibleRange);
  const requiredDayKeys = getDayKeysForRange(fullDayRange);

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

    ensureHolidayKindsForRange(
      resource.holidayRequests,
      holidayKindsByDay,
      fullDayRange,
      requiredDayKeys
    );

    for (const dayKey of requiredDayKeys) {
      if (dayContextsByDay.has(dayKey)) continue;

      const dayContext = calculateDayContext(
        holidayKindsByDay,
        sortedWorkingDurations,
        defaultWorkDayHours,
        defaultStartHour,
        dayjs(dayKey)
      );
      dayContextsByDay.set(dayKey, dayContext);
    }
  }
};
