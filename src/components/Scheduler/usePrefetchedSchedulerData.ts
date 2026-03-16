import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Config, SchedulerData, SchedulerFetchLoadingState } from "@/types/global";
import { ParsedDatesRange } from "@/utils/getDatesRange";
import { FetchDataParams } from "./types";
import { getNormalisedDataLoadingConfig } from "./dataPrefetch/config";
import { createFetchPlan, isAbortError } from "./dataPrefetch/planner";
import {
  getDataRangeFromProjects,
  getRangeSpanDays,
  getRetentionRange,
  intersectRanges,
  mergeSchedulerData,
  mergeRanges,
  toDayjsRange,
  toParsedRange,
  trimDataToRange
} from "./dataPrefetch/rangeUtils";
import {
  emptyFetchLoadingState,
  getFetchLoadingStateForRequest
} from "./dataPrefetch/loadingState";
import { DayjsRange, FetchPlan } from "./dataPrefetch/types";

type UsePrefetchedSchedulerDataParams = {
  data: SchedulerData;
  dataLoading?: Config["dataLoading"];
  dataSourceKey?: string;
  onFetchData?: (params: FetchDataParams) => Promise<SchedulerData>;
  onRangeChange?: (range: ParsedDatesRange) => void;
};

type UsePrefetchedSchedulerDataResult = {
  schedulerData: SchedulerData;
  fetchLoadingState: SchedulerFetchLoadingState;
  handleRangeChange: (range: ParsedDatesRange) => void;
  invalidate: () => void;
  setSchedulerData: Dispatch<SetStateAction<SchedulerData>>;
};

type ActiveRequestState = {
  key: string;
  controller: AbortController;
};

/**
 * Checks whether a fetch plan has already been handled in current lifecycle.
 *
 * @param plan Candidate plan.
 * @param activePlan Currently active request.
 * @param pendingPlan Debounced queued request.
 * @param settledPlanKey Last settled request key.
 * @returns `true` when candidate should be skipped.
 */
const isPlanAlreadyHandled = (
  plan: FetchPlan,
  activePlan: ActiveRequestState | null,
  pendingPlan: FetchPlan | null,
  settledPlanKey: string | null
) => {
  return (
    plan.key === settledPlanKey || plan.key === activePlan?.key || plan.key === pendingPlan?.key
  );
};

/**
 * Resolves retention half-range so cache always covers visible width plus prefetch margin.
 *
 * @param visibleRange Current visible range.
 * @param maxCachedDays Configured minimum cache half-range.
 * @param prefetchDays Prefetch chunk size used as coverage margin.
 * @returns Effective cache half-range in days.
 */
const getEffectiveMaxCachedDays = (
  visibleRange: ParsedDatesRange,
  maxCachedDays: number,
  prefetchDays: number
): number => {
  const visibleSpanDays = getRangeSpanDays(toDayjsRange(visibleRange));
  const minRequiredForCoverage = Math.ceil(visibleSpanDays / 2) + prefetchDays;
  return Math.max(maxCachedDays, minRequiredForCoverage);
};

/**
 * Orchestrates scheduler data prefetch lifecycle for edge-scroll and hard-jump scenarios.
 *
 * @param params Hook inputs with source data, config and optional fetch callback.
 * @returns Cached scheduler data, fetch loading state and range-change handler.
 */
export const usePrefetchedSchedulerData = ({
  data,
  dataLoading,
  dataSourceKey,
  onFetchData,
  onRangeChange
}: UsePrefetchedSchedulerDataParams): UsePrefetchedSchedulerDataResult => {
  const prefetchConfig = useMemo(() => getNormalisedDataLoadingConfig(dataLoading), [dataLoading]);
  const [cachedData, setCachedData] = useState<SchedulerData>(data);
  const [fetchLoadingState, setFetchLoadingState] =
    useState<SchedulerFetchLoadingState>(emptyFetchLoadingState);

  const previousExternalDataRef = useRef<SchedulerData>(data);
  const loadedRangeRef = useRef<DayjsRange | null>(
    onFetchData ? getDataRangeFromProjects(data) : null
  );
  const hasPrunedInitialCacheRef = useRef(false);
  const visibleRangeRef = useRef<ParsedDatesRange | null>(null);
  const requestSessionRef = useRef(0);
  const requestTimerRef = useRef<number | null>(null);
  const pendingPlanRef = useRef<FetchPlan | null>(null);
  const activeRequestRef = useRef<ActiveRequestState | null>(null);
  const lastSettledPlanKeyRef = useRef<string | null>(null);
  const prevDataSourceKeyRef = useRef<string | null>(dataSourceKey ?? null);

  const schedulerData = onFetchData ? cachedData : data;

  /**
   * Builds retention range for a visible window using adaptive cache sizing.
   *
   * @param visibleRange Current visible range.
   * @returns Retention range for cache pruning and loaded-range bounds.
   */
  const getRetentionRangeForVisible = useCallback(
    (visibleRange: ParsedDatesRange) =>
      getRetentionRange(
        visibleRange,
        getEffectiveMaxCachedDays(
          visibleRange,
          prefetchConfig.maxCachedDays,
          prefetchConfig.prefetchDays
        )
      ),
    [prefetchConfig.maxCachedDays, prefetchConfig.prefetchDays]
  );

  /**
   * Clears pending request debounce timer.
   *
   * @returns void
   */
  const clearRequestTimer = useCallback(() => {
    if (requestTimerRef.current === null) return;
    window.clearTimeout(requestTimerRef.current);
    requestTimerRef.current = null;
  }, []);

  /**
   * Aborts currently running fetch request.
   *
   * @returns void
   */
  const abortActiveRequest = useCallback(() => {
    if (!activeRequestRef.current) return;
    activeRequestRef.current.controller.abort();
    activeRequestRef.current = null;
  }, []);

  /**
   * Resets prefetch state when source data changes or prefetch is disabled.
   *
   * @param nextData Fresh cache baseline.
   * @returns void
   */
  const resetPrefetchState = useCallback(
    (nextData: SchedulerData) => {
      requestSessionRef.current += 1;
      hasPrunedInitialCacheRef.current = false;
      visibleRangeRef.current = null;
      pendingPlanRef.current = null;
      lastSettledPlanKeyRef.current = null;
      loadedRangeRef.current = onFetchData ? getDataRangeFromProjects(nextData) : null;
      clearRequestTimer();
      abortActiveRequest();
      setFetchLoadingState(emptyFetchLoadingState);
      setCachedData(nextData);
    },
    [abortActiveRequest, clearRequestTimer, onFetchData]
  );

  useEffect(() => {
    if (!onFetchData) {
      previousExternalDataRef.current = data;
      resetPrefetchState(data);
      return;
    }

    if (previousExternalDataRef.current !== data) {
      previousExternalDataRef.current = data;
      resetPrefetchState(data);
    }
  }, [data, onFetchData, resetPrefetchState]);

  /**
   * Executes request plan with cancellation/session guards and merges fetched rows.
   *
   * @param plan Planned request payload.
   * @returns Promise resolved when request lifecycle completes.
   */
  const executeFetchPlan = useCallback(
    async (plan: FetchPlan) => {
      if (!onFetchData) return;

      const currentSession = requestSessionRef.current;
      const controller = new AbortController();

      abortActiveRequest();
      activeRequestRef.current = { key: plan.key, controller };
      setFetchLoadingState(getFetchLoadingStateForRequest(plan.reason, plan.direction));

      let settled = false;

      try {
        const fetchedRows = await onFetchData({
          direction: plan.direction,
          reason: plan.reason,
          signal: controller.signal,
          range: toParsedRange(plan.range)
        });

        if (controller.signal.aborted || currentSession !== requestSessionRef.current) {
          return;
        }

        settled = true;
        loadedRangeRef.current = mergeRanges(loadedRangeRef.current, plan.range);
        const latestVisibleRange = visibleRangeRef.current;
        const retentionRange = latestVisibleRange
          ? getRetentionRangeForVisible(latestVisibleRange)
          : null;

        if (retentionRange) {
          loadedRangeRef.current = intersectRanges(loadedRangeRef.current, retentionRange);
        }

        if (!fetchedRows.length) return;

        setCachedData((previousData) => {
          const mergedData = mergeSchedulerData(previousData, fetchedRows);
          if (!retentionRange) return mergedData;

          return trimDataToRange(mergedData, retentionRange);
        });
      } catch (error) {
        if (isAbortError(error)) return;
        settled = true;
        if (import.meta.env.DEV) {
          console.error("[Scheduler] Failed to prefetch data", error);
        }
      } finally {
        if (activeRequestRef.current?.key === plan.key) {
          activeRequestRef.current = null;
          setFetchLoadingState(emptyFetchLoadingState);
        }

        if (settled) {
          lastSettledPlanKeyRef.current = plan.key;
        }
      }
    },
    [abortActiveRequest, getRetentionRangeForVisible, onFetchData]
  );

  /**
   * Queues plan for execution and applies debounce for prefetch requests.
   *
   * @param plan Planned request payload.
   * @returns void
   */
  const scheduleFetchPlan = useCallback(
    (plan: FetchPlan) => {
      if (!onFetchData) return;
      if (
        isPlanAlreadyHandled(
          plan,
          activeRequestRef.current,
          pendingPlanRef.current,
          lastSettledPlanKeyRef.current
        )
      ) {
        return;
      }

      pendingPlanRef.current = plan;
      clearRequestTimer();

      const debounceMs = plan.reason === "prefetch" ? prefetchConfig.requestDebounceMs : 0;
      requestTimerRef.current = window.setTimeout(() => {
        const nextPlan = pendingPlanRef.current;
        pendingPlanRef.current = null;
        requestTimerRef.current = null;

        if (!nextPlan) return;
        void executeFetchPlan(nextPlan);
      }, debounceMs);
    },
    [clearRequestTimer, executeFetchPlan, onFetchData, prefetchConfig.requestDebounceMs]
  );

  /**
   * Handles visible-range updates and schedules data fetch when needed.
   *
   * @param range Current visible range.
   * @returns void
   */
  const fetchForRange = useCallback(
    (range: ParsedDatesRange) => {
      if (!hasPrunedInitialCacheRef.current) {
        hasPrunedInitialCacheRef.current = true;
        const initialRetentionRange = getRetentionRangeForVisible(range);
        setCachedData((previousData) => trimDataToRange(previousData, initialRetentionRange));
        loadedRangeRef.current = intersectRanges(loadedRangeRef.current, initialRetentionRange);
      }

      const plan = createFetchPlan(range, loadedRangeRef.current, prefetchConfig);
      if (!plan) return;

      scheduleFetchPlan(plan);
    },
    [prefetchConfig, scheduleFetchPlan, getRetentionRangeForVisible]
  );

  /**
   * Invalidates cache and triggers init data fetch.
   * @returns void
   */
  const invalidate = useCallback(() => {
    const visibleRange = visibleRangeRef.current;

    if (!onFetchData || !visibleRange) return;
    resetPrefetchState(data);
    visibleRangeRef.current = visibleRange;
    fetchForRange(visibleRange);
  }, [fetchForRange, resetPrefetchState, onFetchData, data]);

  /**
   * Invalidates cache when data source key changes.
   */
  useEffect(() => {
    if (!dataSourceKey || prevDataSourceKeyRef.current === dataSourceKey) return;
    prevDataSourceKeyRef.current = dataSourceKey;
    invalidate();
  }, [dataSourceKey, invalidate]);

  /**
   * Handles visible-range updates and schedules data fetch when needed.
   *
   * @param range Visible range emitted by calendar.
   * @returns void
   */
  const handleRangeChange = useCallback(
    (range: ParsedDatesRange) => {
      onRangeChange?.(range);

      if (!onFetchData) return;
      visibleRangeRef.current = range;

      fetchForRange(range);
    },
    [onFetchData, onRangeChange, fetchForRange]
  );

  useEffect(
    () => () => {
      clearRequestTimer();
      abortActiveRequest();
    },
    [abortActiveRequest, clearRequestTimer]
  );

  return {
    schedulerData,
    fetchLoadingState,
    handleRangeChange,
    invalidate,
    setSchedulerData: setCachedData
  };
};
