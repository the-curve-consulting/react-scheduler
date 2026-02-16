import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Config, SchedulerData } from "@/types/global";
import { ParsedDatesRange } from "@/utils/getDatesRange";
import { FetchDataDirection, FetchDataParams } from "./types";
import {
  DayjsRange,
  getDataRangeFromProjects,
  getNormalizedDataLoadingConfig,
  getPrefetchFlags,
  getPrefetchRequest,
  getRetentionRange,
  mergeSchedulerData,
  trimDataToRange
} from "./dataPrefetchUtils";

type UsePrefetchedSchedulerDataParams = {
  data: SchedulerData;
  dataLoading?: Config["dataLoading"];
  onFetchData?: (params: FetchDataParams) => Promise<SchedulerData>;
  onRangeChange?: (range: ParsedDatesRange) => void;
};

type UsePrefetchedSchedulerDataResult = {
  schedulerData: SchedulerData;
  handleRangeChange: (range: ParsedDatesRange) => void;
};

export const usePrefetchedSchedulerData = ({
  data,
  dataLoading,
  onFetchData,
  onRangeChange
}: UsePrefetchedSchedulerDataParams): UsePrefetchedSchedulerDataResult => {
  const prefetchConfig = useMemo(() => getNormalizedDataLoadingConfig(dataLoading), [dataLoading]);
  const [cachedData, setCachedData] = useState<SchedulerData>(data);

  const previousExternalDataRef = useRef<SchedulerData>(data);
  const hasPrunedInitialCacheRef = useRef(false);
  const visibleRangeRef = useRef<ParsedDatesRange | null>(null);
  const requestSessionRef = useRef(0);
  const inFlightRef = useRef<Record<FetchDataDirection, boolean>>({
    backward: false,
    forward: false
  });
  const lastRequestedEdgeRef = useRef<Record<FetchDataDirection, number | null>>({
    backward: null,
    forward: null
  });

  const schedulerData = onFetchData ? cachedData : data;
  const dataRange = useMemo(
    () => (onFetchData ? getDataRangeFromProjects(schedulerData) : null),
    [onFetchData, schedulerData]
  );

  useEffect(() => {
    const resetPrefetchState = () => {
      requestSessionRef.current += 1;
      hasPrunedInitialCacheRef.current = false;
      visibleRangeRef.current = null;
      inFlightRef.current = { backward: false, forward: false };
      lastRequestedEdgeRef.current = { backward: null, forward: null };
    };

    if (!onFetchData) {
      setCachedData(data);
      previousExternalDataRef.current = data;
      resetPrefetchState();
      return;
    }

    if (previousExternalDataRef.current !== data) {
      previousExternalDataRef.current = data;
      setCachedData(data);
      resetPrefetchState();
    }
  }, [data, onFetchData]);

  const fetchAndMergeData = useCallback(
    async (direction: FetchDataDirection, requestRange: DayjsRange, edgeValue: number) => {
      if (!onFetchData || inFlightRef.current[direction]) return;
      if (lastRequestedEdgeRef.current[direction] === edgeValue) return;

      inFlightRef.current[direction] = true;
      lastRequestedEdgeRef.current[direction] = edgeValue;
      const currentSession = requestSessionRef.current;

      try {
        const fetchedRows = await onFetchData({
          direction,
          range: {
            startDate: requestRange.startDate.toDate(),
            endDate: requestRange.endDate.toDate()
          }
        });

        if (!fetchedRows.length || currentSession !== requestSessionRef.current) {
          return;
        }

        const latestVisibleRange = visibleRangeRef.current;
        setCachedData((previousData) => {
          const mergedData = mergeSchedulerData(previousData, fetchedRows);
          if (!latestVisibleRange) return mergedData;

          const retentionRange = getRetentionRange(
            latestVisibleRange,
            prefetchConfig.maxCachedDays
          );
          return trimDataToRange(mergedData, retentionRange);
        });
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error("[Scheduler] Failed to prefetch data", error);
        }
      } finally {
        inFlightRef.current[direction] = false;
      }
    },
    [onFetchData, prefetchConfig.maxCachedDays]
  );

  const handleRangeChange = useCallback(
    (range: ParsedDatesRange) => {
      onRangeChange?.(range);

      if (!onFetchData) return;
      visibleRangeRef.current = range;

      if (!hasPrunedInitialCacheRef.current) {
        hasPrunedInitialCacheRef.current = true;
        const initialRetentionRange = getRetentionRange(range, prefetchConfig.maxCachedDays);
        setCachedData((previousData) => trimDataToRange(previousData, initialRetentionRange));
      }

      if (!dataRange) return;

      const prefetchFlags = getPrefetchFlags(range, dataRange, {
        prefetchTriggerRatio: prefetchConfig.prefetchTriggerRatio,
        prefetchTriggerDays: prefetchConfig.prefetchTriggerDays
      });

      if (prefetchFlags.backward) {
        const backwardRequest = getPrefetchRequest(
          "backward",
          dataRange,
          prefetchConfig.prefetchDays
        );

        void fetchAndMergeData("backward", backwardRequest.range, backwardRequest.edgeValue);
      }

      if (prefetchFlags.forward) {
        const forwardRequest = getPrefetchRequest(
          "forward",
          dataRange,
          prefetchConfig.prefetchDays
        );

        void fetchAndMergeData("forward", forwardRequest.range, forwardRequest.edgeValue);
      }
    },
    [dataRange, fetchAndMergeData, onFetchData, onRangeChange, prefetchConfig]
  );

  return { schedulerData, handleRangeChange };
};
