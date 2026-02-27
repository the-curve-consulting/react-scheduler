import { DATA_CONFIG } from "@/constants";
import { Config } from "@/types/global";
import { NormalisedDataLoadingConfig } from "./types";

/**
 * Normalises integer config values that must stay positive.
 *
 * @param value Runtime value from user config.
 * @param fallback Default when value is missing/invalid.
 * @returns Positive integer.
 */
const normalisePositiveInt = (value: number | undefined, fallback: number): number => {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  return Math.max(1, Math.floor(value));
};

/**
 * Normalises floating-point config values that must stay positive.
 *
 * @param value Runtime value from user config.
 * @param fallback Default when value is missing/invalid.
 * @returns Positive float.
 */
const normalisePositiveFloat = (value: number | undefined, fallback: number): number => {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  return Math.max(0.1, value);
};

/**
 * Normalises integer config values that can be zero.
 *
 * @param value Runtime value from user config.
 * @param fallback Default when value is missing/invalid.
 * @returns Non-negative integer.
 */
const normaliseNonNegativeInt = (value: number | undefined, fallback: number): number => {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  return Math.max(0, Math.floor(value));
};

/**
 * Normalises prefetch trigger ratio into a safe `[0.01, 0.99]` interval.
 *
 * @param value Runtime value from user config.
 * @returns Safe trigger ratio.
 */
const normaliseTriggerRatio = (value: number | undefined): number => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return DATA_CONFIG.prefetchTriggerRatio;
  }

  return Math.min(0.99, Math.max(0.01, value));
};

/**
 * Produces validated prefetch configuration with defaults applied.
 *
 * @param dataLoading Optional data-loading block from scheduler config.
 * @returns Fully normalised config used by prefetch planner/request flow.
 */
export const getNormalisedDataLoadingConfig = (
  dataLoading?: Config["dataLoading"]
): NormalisedDataLoadingConfig => ({
  prefetchDays: normalisePositiveInt(dataLoading?.prefetchDays, DATA_CONFIG.prefetchDays),
  prefetchTriggerDays: normaliseNonNegativeInt(
    dataLoading?.prefetchTriggerDays,
    DATA_CONFIG.prefetchTriggerDays
  ),
  prefetchTriggerRatio: normaliseTriggerRatio(dataLoading?.prefetchTriggerRatio),
  maxCachedDays: normalisePositiveInt(dataLoading?.maxCachedDays, DATA_CONFIG.maxCachedDays),
  requestDebounceMs: normaliseNonNegativeInt(
    dataLoading?.requestDebounceMs,
    DATA_CONFIG.requestDebounceMs
  ),
  jumpWindowMultiplier: normalisePositiveFloat(
    dataLoading?.jumpWindowMultiplier,
    DATA_CONFIG.jumpWindowMultiplier
  ),
  minJumpWindowDays: normalisePositiveInt(
    dataLoading?.minJumpWindowDays,
    DATA_CONFIG.minJumpWindowDays
  )
});
