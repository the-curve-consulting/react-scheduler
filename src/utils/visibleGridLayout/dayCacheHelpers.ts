import { VisibleRange } from "./types";

/** Expands a timeline range to complete calendar-day boundaries. */
export const getFullDayRange = (range: VisibleRange): VisibleRange => ({
  startDate: range.startDate.startOf("day"),
  endDate: range.endDate.endOf("day")
});

/**
 * Returns start-of-day timestamps for every calendar day intersecting a range.
 *
 * The returned keys are ordered chronologically and include both boundary days.
 */
export const getDayKeysForRange = (range: VisibleRange): number[] => {
  const dayKeys: number[] = [];
  let currentDate = range.startDate.startOf("day");
  const endDate = range.endDate.startOf("day");

  while (!currentDate.isAfter(endDate, "day")) {
    dayKeys.push(currentDate.valueOf());
    currentDate = currentDate.add(1, "day");
  }

  return dayKeys;
};

/**
 * Initializes missing array-valued day entries and returns the keys added.
 *
 * Empty entries are completion markers. They prevent days with no calculated
 * values from being treated as unresolved during a later scroll.
 */
export const ensureDayArrayEntries = <T>(
  cache: Map<number, T[]>,
  requiredDayKeys: readonly number[]
): Set<number> => {
  const missingDayKeys = new Set<number>();

  for (const dayKey of requiredDayKeys) {
    if (cache.has(dayKey)) continue;

    cache.set(dayKey, []);
    missingDayKeys.add(dayKey);
  }

  return missingDayKeys;
};
