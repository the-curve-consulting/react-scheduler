import { FetchDataDirection } from "../types";
import { DayjsRange, FetchPlan, NormalisedDataLoadingConfig, VisibleRangeInput } from "./types";
import { getRangeCenter, getRangeSpanDays, toDayjsRange } from "./rangeUtils";

const coverageToleranceMs = 1000;

/**
 * Builds fetch plan for initial load or hard jumps far outside cached range.
 *
 * @param visibleRange Current visible range (dayjs).
 * @param loadedRange Current loaded date coverage range.
 * @param config Normalised prefetch configuration.
 * @param reason Planning reason (`initial` or `jump`).
 * @returns Fetch plan centered around visible range.
 */
const getHardMissPlan = (
  visibleRange: DayjsRange,
  loadedRange: DayjsRange | null,
  config: NormalisedDataLoadingConfig,
  reason: "initial" | "jump"
): FetchPlan => {
  const visibleCenter = getRangeCenter(visibleRange);
  const visibleSpanDays = getRangeSpanDays(visibleRange);
  const windowDays = Math.max(
    config.minJumpWindowDays,
    Math.ceil(visibleSpanDays * config.jumpWindowMultiplier)
  );

  const startDate = visibleCenter.subtract(windowDays, "day");
  const endDate = visibleCenter.add(windowDays, "day");

  const direction: FetchDataDirection = loadedRange
    ? visibleCenter.isBefore(getRangeCenter(loadedRange))
      ? "backward"
      : "forward"
    : "forward";

  return {
    key: `${reason}:${startDate.valueOf()}:${endDate.valueOf()}`,
    direction,
    reason,
    range: { startDate, endDate }
  };
};

/**
 * Builds one-sided jump request for partially uncovered visible range.
 *
 * @param direction Missing side direction.
 * @param visibleRange Current visible range.
 * @param loadedRange Current loaded date coverage range.
 * @param prefetchDays Number of extra buffer days to include.
 * @returns Jump fetch plan for the uncovered side.
 */
const getOneSidedJumpPlan = (
  direction: FetchDataDirection,
  visibleRange: DayjsRange,
  loadedRange: DayjsRange,
  prefetchDays: number
): FetchPlan => {
  if (direction === "backward") {
    const startDate = visibleRange.startDate.subtract(prefetchDays, "day");
    const endDate = loadedRange.startDate.subtract(1, "millisecond");
    return {
      key: `jump:backward:${startDate.valueOf()}:${endDate.valueOf()}`,
      direction,
      reason: "jump",
      range: { startDate, endDate }
    };
  }

  const startDate = loadedRange.endDate.add(1, "millisecond");
  const endDate = visibleRange.endDate.add(prefetchDays, "day");
  return {
    key: `jump:forward:${startDate.valueOf()}:${endDate.valueOf()}`,
    direction,
    reason: "jump",
    range: { startDate, endDate }
  };
};

/**
 * Determines whether loaded range fully covers visible range within tolerance.
 *
 * @param visibleRange Current visible range.
 * @param loadedRange Current loaded date coverage range.
 * @returns Coverage flags for full and side-specific misses.
 */
const getCoverageState = (visibleRange: DayjsRange, loadedRange: DayjsRange) => {
  const loadedStartWithTolerance = loadedRange.startDate.subtract(
    coverageToleranceMs,
    "millisecond"
  );
  const loadedEndWithTolerance = loadedRange.endDate.add(coverageToleranceMs, "millisecond");

  const missingLeft = visibleRange.startDate.isBefore(loadedStartWithTolerance);
  const missingRight = visibleRange.endDate.isAfter(loadedEndWithTolerance);

  return {
    hasFullCoverage: !missingLeft && !missingRight,
    missingLeft,
    missingRight
  };
};

/**
 * Selects direction to prefetch when one or both edges are close.
 *
 * @param backward Whether backward edge is eligible.
 * @param forward Whether forward edge is eligible.
 * @param daysFromStart Distance from visible start to data start.
 * @param daysToEnd Distance from visible end to data end.
 * @returns Direction to fetch or `null` when no prefetch is needed.
 */
const getEdgeDirection = (
  backward: boolean,
  forward: boolean,
  daysFromStart: number,
  daysToEnd: number
): FetchDataDirection | null => {
  if (backward && !forward) return "backward";
  if (forward && !backward) return "forward";
  if (!backward && !forward) return null;
  return daysFromStart <= daysToEnd ? "backward" : "forward";
};

/**
 * Builds edge-prefetch request range from current data boundaries.
 *
 * @param direction Requested prefetch direction.
 * @param loadedRange Current loaded date coverage range.
 * @param prefetchDays Number of days to fetch.
 * @returns Fetch plan targeting the next edge chunk.
 */
const getPrefetchPlan = (
  direction: FetchDataDirection,
  loadedRange: DayjsRange,
  prefetchDays: number
): FetchPlan => {
  if (direction === "backward") {
    const startDate = loadedRange.startDate.subtract(prefetchDays, "day");
    const endDate = loadedRange.startDate.subtract(1, "millisecond");
    return {
      key: `prefetch:backward:${loadedRange.startDate.valueOf()}:${prefetchDays}`,
      direction,
      reason: "prefetch",
      range: { startDate, endDate }
    };
  }

  const startDate = loadedRange.endDate.add(1, "millisecond");
  const endDate = loadedRange.endDate.add(prefetchDays, "day");
  return {
    key: `prefetch:forward:${loadedRange.endDate.valueOf()}:${prefetchDays}`,
    direction,
    reason: "prefetch",
    range: { startDate, endDate }
  };
};

/**
 * Decides whether to issue no fetch, edge prefetch, or hard-miss jump fetch.
 *
 * @param visibleRangeInput Latest visible range from calendar.
 * @param loadedRange Current loaded date coverage range.
 * @param config Normalised prefetch configuration.
 * @returns Planned fetch request or `null` if nothing should be fetched.
 */
export const createFetchPlan = (
  visibleRangeInput: VisibleRangeInput,
  loadedRange: DayjsRange | null,
  config: NormalisedDataLoadingConfig
): FetchPlan | null => {
  const visibleRange = toDayjsRange(visibleRangeInput);

  if (!loadedRange) {
    return getHardMissPlan(visibleRange, null, config, "initial");
  }

  const coverageState = getCoverageState(visibleRange, loadedRange);
  const { hasFullCoverage, missingLeft, missingRight } = coverageState;

  if (!hasFullCoverage) {
    if (missingLeft && !missingRight) {
      return getOneSidedJumpPlan("backward", visibleRange, loadedRange, config.prefetchDays);
    }

    if (missingRight && !missingLeft) {
      return getOneSidedJumpPlan("forward", visibleRange, loadedRange, config.prefetchDays);
    }

    return getHardMissPlan(visibleRange, loadedRange, config, "jump");
  }

  const totalSpanMs = Math.max(loadedRange.endDate.diff(loadedRange.startDate), 1);
  const lowerThreshold = 1 - config.prefetchTriggerRatio;
  const startRatio = visibleRange.startDate.diff(loadedRange.startDate) / totalSpanMs;
  const endRatio = visibleRange.endDate.diff(loadedRange.startDate) / totalSpanMs;
  const daysFromStart = visibleRange.startDate.diff(loadedRange.startDate, "day", true);
  const daysToEnd = loadedRange.endDate.diff(visibleRange.endDate, "day", true);

  const backward = startRatio <= lowerThreshold || daysFromStart <= config.prefetchTriggerDays;
  const forward =
    endRatio >= config.prefetchTriggerRatio || daysToEnd <= config.prefetchTriggerDays;

  const direction = getEdgeDirection(backward, forward, daysFromStart, daysToEnd);
  if (!direction) return null;

  return getPrefetchPlan(direction, loadedRange, config.prefetchDays);
};

/**
 * Identifies fetch abort errors so callers can ignore expected cancellations.
 *
 * @param error Unknown error value.
 * @returns `true` when error is an `AbortError`.
 */
export const isAbortError = (error: unknown): boolean =>
  error instanceof DOMException && error.name === "AbortError";
