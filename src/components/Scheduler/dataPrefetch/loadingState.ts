import { SchedulerFetchLoadingState } from "@/types/global";
import { FetchDataDirection, FetchDataReason } from "../types";

/**
 * Neutral loading-state baseline used when no request is active.
 */
export const emptyFetchLoadingState: SchedulerFetchLoadingState = {
  any: false,
  blocking: false,
  forward: false,
  backward: false
};

/**
 * Maps fetch reason/direction to UI loading indicators.
 *
 * @param reason Fetch reason (`initial`, `jump`, `prefetch`).
 * @param direction Request direction.
 * @returns Loading-state flags for scheduler UI.
 */
export const getFetchLoadingStateForRequest = (
  reason: FetchDataReason,
  direction: FetchDataDirection
): SchedulerFetchLoadingState => {
  if (reason === "prefetch") {
    return {
      any: true,
      blocking: false,
      forward: direction === "forward",
      backward: direction === "backward"
    };
  }

  return {
    any: true,
    blocking: true,
    forward: false,
    backward: false
  };
};
