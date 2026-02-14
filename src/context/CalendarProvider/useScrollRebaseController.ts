import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useRef } from "react";
import { Dayjs } from "dayjs";
import { outsideWrapperId, SCROLL_REBASE_CONFIG } from "@/constants";
import { getScrollConfig } from "@/utils/scrollHelpers";

type RebaseDirection = "forward" | "backward";

type RebaseLock = {
  anchor: number;
  pinnedScrollLeft: number;
};

type ScrollConfig = ReturnType<typeof getScrollConfig>;

type UseScrollRebaseControllerParams = {
  scrollConfig: ScrollConfig;
  viewportWidth: number;
  setReferenceDate: Dispatch<SetStateAction<Dayjs>>;
  setScrollPosition: Dispatch<SetStateAction<number>>;
};

type UseScrollRebaseControllerResult = {
  clampScrollLeft: (value: number, container?: HTMLElement | null) => number;
  handleScrollChange: (newScrollLeft: number) => void;
};

/**
 * Creates an empty lock map for both scroll directions.
 *
 * @returns A fresh lock record with `null` values for `forward` and `backward`.
 */
const createEmptyLocks = (): Record<RebaseDirection, RebaseLock | null> => ({
  forward: null,
  backward: null
});

/**
 * Creates initial streak counters for both scroll directions.
 *
 * @returns A fresh streak record initialized to `0` for each direction.
 */
const createEmptyStreaks = (): Record<RebaseDirection, number> => ({
  forward: 0,
  backward: 0
});

/**
 * Returns the opposite scroll direction.
 *
 * @param direction Current direction.
 * @returns `backward` for `forward`, and `forward` for `backward`.
 */
const getOppositeDirection = (direction: RebaseDirection): RebaseDirection =>
  direction === "forward" ? "backward" : "forward";

/**
 * Computes the base "rearm" distance in pixels from viewport width.
 *
 * @param viewportWidth Current viewport width in pixels.
 * @returns Base distance required before a same-direction rebase can happen again.
 */
const getRearmDistancePx = (viewportWidth: number): number => {
  // During initial render viewport width may be unavailable, so use a stable fallback.
  if (viewportWidth <= 0) return SCROLL_REBASE_CONFIG.rearmFallbackPx;

  // Scale with viewport size and clamp to keep behavior predictable across screens.
  const proportionalDistance = Math.round(viewportWidth * SCROLL_REBASE_CONFIG.rearmViewportRatio);
  return Math.max(
    SCROLL_REBASE_CONFIG.rearmMinPx,
    Math.min(SCROLL_REBASE_CONFIG.rearmMaxPx, proportionalDistance)
  );
};

/**
 * Expands the rearm distance for consecutive rebases in the same direction.
 *
 * @param baseRearmDistancePx Base rearm distance derived from viewport width.
 * @param rebaseStreak Number of consecutive rebases in the same direction.
 * @param viewportWidth Current viewport width in pixels.
 * @returns Adaptive rearm distance in pixels for the current streak.
 */
const getAdaptiveRearmDistancePx = (
  baseRearmDistancePx: number,
  rebaseStreak: number,
  viewportWidth: number
): number => {
  // Increase required drag distance after each consecutive rebase to prevent drag loops.
  const growthMultiplier = 1 + rebaseStreak * SCROLL_REBASE_CONFIG.rearmStreakGrowth;

  // Cap growth so rearming remains possible and does not effectively lock scrolling forever.
  const maxRearmDistance =
    viewportWidth > 0
      ? Math.round(viewportWidth * SCROLL_REBASE_CONFIG.rearmMaxViewportMultiplier)
      : SCROLL_REBASE_CONFIG.rearmMaxFallbackPx;
  return Math.min(maxRearmDistance, Math.round(baseRearmDistancePx * growthMultiplier));
};

/**
 * Checks whether the user moved far enough from the last rebase anchor.
 *
 * @param direction Scroll direction for the active lock.
 * @param currentScrollLeft Current horizontal scroll position.
 * @param anchor Scroll position where the last rebase in this direction occurred.
 * @param rearmDistancePx Required distance to rearm.
 * @returns `true` when movement passes the rearm threshold for the direction.
 */
const hasPassedRearmPoint = (
  direction: RebaseDirection,
  currentScrollLeft: number,
  anchor: number,
  rearmDistancePx: number
): boolean =>
  direction === "forward"
    ? currentScrollLeft >= anchor + rearmDistancePx
    : currentScrollLeft <= anchor - rearmDistancePx;

/**
 * Handles threshold-based virtual-scroll rebasing with directional locks.
 *
 * @param scrollConfig Scroll geometry and thresholds for current zoom level.
 * @param viewportWidth Current viewport width in pixels.
 * @param setReferenceDate State setter for scheduler reference date.
 * @param setScrollPosition State setter for horizontal scroll position.
 * @returns Utility methods for clamping and handling scroll updates.
 */
export const useScrollRebaseController = ({
  scrollConfig,
  viewportWidth,
  setReferenceDate,
  setScrollPosition
}: UseScrollRebaseControllerParams): UseScrollRebaseControllerResult => {
  const locksRef = useRef<Record<RebaseDirection, RebaseLock | null>>(createEmptyLocks());
  const streakRef = useRef<Record<RebaseDirection, number>>(createEmptyStreaks());
  const idleResetTimerRef = useRef<number | null>(null);
  const baseRearmDistancePx = useMemo(() => getRearmDistancePx(viewportWidth), [viewportWidth]);

  /**
   * Clears all direction locks and streak counters.
   *
   * @returns void
   */
  const resetRebaseState = useCallback(() => {
    locksRef.current = createEmptyLocks();
    streakRef.current = createEmptyStreaks();
  }, []);

  /**
   * Clears pending idle-reset timeout, if any.
   *
   * @returns void
   */
  const clearIdleResetTimer = useCallback(() => {
    if (idleResetTimerRef.current === null) return;
    window.clearTimeout(idleResetTimerRef.current);
    idleResetTimerRef.current = null;
  }, []);

  /**
   * Schedules state reset after user stops scrolling for a short period.
   *
   * @returns void
   */
  const scheduleIdleReset = useCallback(() => {
    clearIdleResetTimer();
    idleResetTimerRef.current = window.setTimeout(() => {
      resetRebaseState();
      idleResetTimerRef.current = null;
    }, SCROLL_REBASE_CONFIG.idleResetMs);
  }, [clearIdleResetTimer, resetRebaseState]);

  /**
   * Clamps horizontal scroll position to available container boundaries.
   *
   * @param value Requested scroll position.
   * @param container Optional scroll container used for max boundary calculation.
   * @returns Clamped `scrollLeft` value.
   */
  const clampScrollLeft = useCallback(
    (value: number, container?: HTMLElement | null) => {
      const maxScrollLeft = container
        ? Math.max(container.scrollWidth - container.clientWidth, 0)
        : scrollConfig.containerWidth;
      return Math.min(Math.max(value, 0), maxScrollLeft);
    },
    [scrollConfig.containerWidth]
  );

  /**
   * Forces scroll back to the lock's pinned position while waiting for rearm.
   *
   * @param direction Active lock direction.
   * @returns `true` when lock exists and pinning was applied, otherwise `false`.
   */
  const keepPinnedPosition = useCallback(
    (direction: RebaseDirection) => {
      const lock = locksRef.current[direction];
      if (!lock) return false;

      const container = document.getElementById(outsideWrapperId);
      const pinnedScrollLeft = clampScrollLeft(lock.pinnedScrollLeft, container);

      if (container && Math.abs(container.scrollLeft - pinnedScrollLeft) > 0.5) {
        container.scrollTo({ left: pinnedScrollLeft, behavior: "auto" });
      }

      setScrollPosition(pinnedScrollLeft);
      return true;
    },
    [clampScrollLeft, setScrollPosition]
  );

  /**
   * Repositions virtual scroll and reference date when threshold is crossed.
   *
   * @param direction Direction in which threshold was crossed.
   * @param currentScrollLeft Current container `scrollLeft`.
   * @returns void
   */
  const repositionScrollRange = useCallback(
    (direction: RebaseDirection, currentScrollLeft: number) => {
      const container = document.getElementById(outsideWrapperId);
      if (!container) return;

      const { dateShift, repositionJump, thresholdHigh, thresholdLow, unit } = scrollConfig;
      if (repositionJump <= 0) return;

      const repositionSteps =
        direction === "forward"
          ? Math.max(1, Math.ceil((currentScrollLeft - thresholdHigh) / repositionJump))
          : Math.max(1, Math.ceil((thresholdLow - currentScrollLeft) / repositionJump));

      const totalDateShift = dateShift * repositionSteps;
      const totalScrollShift = repositionJump * repositionSteps;
      const nextScrollLeft =
        direction === "forward"
          ? currentScrollLeft - totalScrollShift
          : currentScrollLeft + totalScrollShift;
      const pinnedScrollLeft = clampScrollLeft(nextScrollLeft, container);

      setReferenceDate((prev) =>
        direction === "forward"
          ? prev.add(totalDateShift, unit)
          : prev.subtract(totalDateShift, unit)
      );
      setScrollPosition(pinnedScrollLeft);
      container.scrollTo({ left: pinnedScrollLeft, behavior: "auto" });

      locksRef.current[direction] = { anchor: currentScrollLeft, pinnedScrollLeft };
      locksRef.current[getOppositeDirection(direction)] = null;
      streakRef.current[direction] += 1;
      streakRef.current[getOppositeDirection(direction)] = 0;
    },
    [clampScrollLeft, scrollConfig, setReferenceDate, setScrollPosition]
  );

  /**
   * Main scroll handler with lock/rearm protection against drag-induced rebase loops.
   *
   * @param newScrollLeft Latest horizontal scroll position.
   * @returns void
   */
  const handleScrollChange = useCallback(
    (newScrollLeft: number) => {
      scheduleIdleReset();
      const { thresholdHigh, thresholdLow } = scrollConfig;

      if (newScrollLeft >= thresholdLow && newScrollLeft <= thresholdHigh) {
        resetRebaseState();
        setScrollPosition(newScrollLeft);
        return;
      }

      const direction: RebaseDirection = newScrollLeft > thresholdHigh ? "forward" : "backward";
      const lock = locksRef.current[direction];
      const adaptiveRearmDistancePx = getAdaptiveRearmDistancePx(
        baseRearmDistancePx,
        streakRef.current[direction],
        viewportWidth
      );

      if (
        lock &&
        !hasPassedRearmPoint(direction, newScrollLeft, lock.anchor, adaptiveRearmDistancePx) &&
        keepPinnedPosition(direction)
      ) {
        return;
      }

      repositionScrollRange(direction, newScrollLeft);
    },
    [
      baseRearmDistancePx,
      keepPinnedPosition,
      repositionScrollRange,
      resetRebaseState,
      scheduleIdleReset,
      scrollConfig,
      setScrollPosition,
      viewportWidth
    ]
  );

  useEffect(() => {
    resetRebaseState();
  }, [resetRebaseState, scrollConfig]);

  useEffect(
    () => () => {
      clearIdleResetTimer();
    },
    [clearIdleResetTimer]
  );

  return { clampScrollLeft, handleScrollChange };
};
