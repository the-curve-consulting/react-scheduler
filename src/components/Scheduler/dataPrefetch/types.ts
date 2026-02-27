import dayjs from "dayjs";
import { ParsedDatesRange } from "@/utils/getDatesRange";
import { FetchDataDirection, FetchDataReason } from "../types";

export type DayjsRange = {
  startDate: dayjs.Dayjs;
  endDate: dayjs.Dayjs;
};

export type NormalisedDataLoadingConfig = {
  prefetchDays: number;
  prefetchTriggerDays: number;
  prefetchTriggerRatio: number;
  maxCachedDays: number;
  requestDebounceMs: number;
  jumpWindowMultiplier: number;
  minJumpWindowDays: number;
};

export type FetchPlan = {
  key: string;
  direction: FetchDataDirection;
  reason: FetchDataReason;
  range: DayjsRange;
};

export type VisibleRangeInput = ParsedDatesRange;
