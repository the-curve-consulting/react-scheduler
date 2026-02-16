import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear";
import dayOfYear from "dayjs/plugin/dayOfYear";
import isoWeek from "dayjs/plugin/isoWeek";
import isBetween from "dayjs/plugin/isBetween";
import duration from "dayjs/plugin/duration";
import { ZoomLevel, allZoomLevel } from "@/types/global";
import { isAvailableZoom } from "@/types/guards";
import { parseDay } from "@/utils/dates";
import { getCols } from "@/utils/getCols";
import { leftColumnWidth, outsideWrapperId } from "@/constants";
import {
  getScrollConfig,
  getScrollPositionForDate,
  getVisibleRangeFromScroll,
  getCurrentCenterDateFromScroll
} from "@/utils/scrollHelpers";
import { calendarContext } from "./calendarContext";
import { CalendarProviderProps } from "./types";
import { useScrollRebaseController } from "./useScrollRebaseController";
dayjs.extend(weekOfYear);
dayjs.extend(dayOfYear);
dayjs.extend(isoWeek);
dayjs.extend(isBetween);
dayjs.extend(duration);

/**
 * Provides scheduler calendar state and navigation handlers to descendants.
 *
 * @param props Calendar provider properties including data, callbacks and configuration.
 * @returns Context provider wrapping scheduler UI.
 */
const CalendarProvider = ({
  data,
  children,
  isLoading,
  config,
  defaultStartDate = dayjs(),
  onRangeChange,
  onFilterData,
  onClearFilterData
}: CalendarProviderProps) => {
  const { zoom: configZoom, maxRecordsPerPage = 50 } = config;
  const [zoom, setZoom] = useState<ZoomLevel>(configZoom);
  const scrollConfig = useMemo(() => getScrollConfig(zoom), [zoom]);

  const [referenceDate, setReferenceDate] = useState(defaultStartDate);
  const [scrollPosition, setScrollPosition] = useState(() => scrollConfig.center);
  const [isInitialized, setIsInitialized] = useState(false);
  const [cols, setCols] = useState(getCols(zoom));
  const [viewportWidth, setViewportWidth] = useState(0);

  const isNextZoom = allZoomLevel[zoom] !== allZoomLevel[allZoomLevel.length - 1];
  const isPrevZoom = zoom !== 0;

  const visibleRange = useMemo(() => {
    return getVisibleRangeFromScroll(scrollPosition, referenceDate, zoom, viewportWidth);
  }, [scrollPosition, referenceDate, zoom, viewportWidth]);

  const currentCenterDate = useMemo(() => {
    // Calculate center date directly from scroll position using continuous pixel-to-time mapping
    // This ensures accurate alignment between viewport center and date without discretization
    return getCurrentCenterDateFromScroll(scrollPosition, referenceDate, zoom);
  }, [scrollPosition, referenceDate, zoom]);

  const range = useMemo(
    () => ({ startDate: visibleRange.startDate, endDate: visibleRange.endDate }),
    [visibleRange]
  );

  const startDate = visibleRange.startDate;
  const dayOfYear = startDate.dayOfYear();
  const parsedStartDate = parseDay(startDate);

  const previousZoom = useRef(zoom);
  const { clampScrollLeft, handleScrollChange } = useScrollRebaseController({
    scrollConfig,
    viewportWidth,
    setReferenceDate,
    setScrollPosition
  });

  /**
   * Scrolls viewport to a target date while clamping to container boundaries.
   *
   * @param targetDate Date that should become visible in the current zoom.
   * @returns void
   */
  const handleGoToDate = useCallback(
    (targetDate: dayjs.Dayjs) => {
      const container = document.getElementById(outsideWrapperId);
      const rawScrollLeft = getScrollPositionForDate(targetDate, referenceDate, zoom);
      const scrollLeft = clampScrollLeft(rawScrollLeft, container);

      container?.scrollTo({ left: scrollLeft, behavior: "smooth" });
      setScrollPosition(scrollLeft);
    },
    [clampScrollLeft, referenceDate, zoom]
  );

  /**
   * Navigates viewport to current date/time.
   *
   * @returns void
   */
  const handleGoToday = useCallback(() => {
    handleGoToDate(dayjs());
  }, [handleGoToDate]);

  /**
   * Moves the visible window forward by one logical step for current zoom.
   *
   * @returns void
   */
  const handleGoNext = useCallback(() => {
    if (isLoading) return;

    const currentCenter = visibleRange.startDate.add(
      visibleRange.endDate.diff(visibleRange.startDate) / 2,
      "milliseconds"
    );

    let nextDate: dayjs.Dayjs;
    switch (zoom) {
      case 0:
        nextDate = currentCenter.add(1, "month");
        break;
      case 1:
        nextDate = currentCenter.add(1, "day");
        break;
      case 2:
        nextDate = currentCenter.add(1, "hour");
        break;
      default:
        nextDate = currentCenter.add(1, "week");
    }

    handleGoToDate(nextDate);
  }, [isLoading, visibleRange, zoom, handleGoToDate]);

  /**
   * Moves the visible window backward by one logical step for current zoom.
   *
   * @returns void
   */
  const handleGoPrev = useCallback(() => {
    if (isLoading) return;

    const currentCenter = visibleRange.startDate.add(
      visibleRange.endDate.diff(visibleRange.startDate) / 2,
      "milliseconds"
    );

    let prevDate: dayjs.Dayjs;
    switch (zoom) {
      case 0:
        prevDate = currentCenter.subtract(1, "month");
        break;
      case 1:
        prevDate = currentCenter.subtract(1, "week");
        break;
      case 2:
        prevDate = currentCenter.subtract(1, "day");
        break;
      default:
        prevDate = currentCenter.subtract(1, "week");
    }

    handleGoToDate(prevDate);
  }, [isLoading, zoom, visibleRange, handleGoToDate]);

  /**
   * Preserves center date when zoom changes by recalculating target scroll offset.
   *
   * @returns Cleanup-free effect.
   */
  useEffect(() => {
    if (previousZoom.current === zoom) return;

    // Calculate center date using the OLD zoom (before it changed)
    const oldVisibleRange = getVisibleRangeFromScroll(
      scrollPosition,
      referenceDate,
      previousZoom.current, // Use the OLD zoom
      viewportWidth
    );
    const centerDateBeforeChange = oldVisibleRange.startDate.add(
      oldVisibleRange.endDate.diff(oldVisibleRange.startDate) / 2,
      "milliseconds"
    );

    previousZoom.current = zoom;

    // Now scroll to that date with the NEW zoom
    const rawScrollLeft = getScrollPositionForDate(centerDateBeforeChange, referenceDate, zoom);
    const container = document.getElementById(outsideWrapperId);
    const scrollLeft = clampScrollLeft(rawScrollLeft, container);
    container?.scrollTo({ left: scrollLeft, behavior: "auto" });
    setScrollPosition(scrollLeft);
  }, [clampScrollLeft, zoom, scrollPosition, referenceDate, viewportWidth]);

  /**
   * Initializes viewport width once DOM wrapper is available.
   *
   * @returns Cleanup function for delayed width initialization.
   */
  useEffect(() => {
    const updateViewportWidth = () => {
      const wrapperWidth = document.getElementById(outsideWrapperId)?.clientWidth || 0;
      if (wrapperWidth > 0) {
        setViewportWidth(wrapperWidth - leftColumnWidth);
      }
    };
    updateViewportWidth();

    // Also try after a small delay in case DOM isn't ready
    const timeout = setTimeout(updateViewportWidth, 0);

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    setCols(getCols(zoom));
  }, [zoom]);

  useEffect(() => {
    const handleResize = () => {
      const wrapperWidth = document.getElementById(outsideWrapperId)?.clientWidth || 0;
      setViewportWidth(wrapperWidth - leftColumnWidth);
      setCols(getCols(zoom));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [zoom]);

  /**
   * Performs one-time initial scroll positioning based on provided start date.
   *
   * @returns void
   */
  useEffect(() => {
    if (isInitialized) return;

    const container = document.getElementById(outsideWrapperId);
    const rawScrollLeft = getScrollPositionForDate(defaultStartDate, referenceDate, zoom);
    const scrollLeft = clampScrollLeft(rawScrollLeft, container);

    container?.scrollTo({ left: scrollLeft, behavior: "auto" });
    setScrollPosition(scrollLeft);
    setIsInitialized(true);
  }, [clampScrollLeft, defaultStartDate, isInitialized, referenceDate, zoom]);

  /**
   * Emits the currently visible date range through external callback.
   *
   * @returns void
   */
  useEffect(() => {
    const parsedRange = { startDate: range.startDate.toDate(), endDate: range.endDate.toDate() };
    onRangeChange?.(parsedRange);
  }, [onRangeChange, range]);

  /**
   * Updates zoom level when provided value is supported.
   *
   * @param zoomLevel Numeric zoom level candidate.
   * @returns void
   */
  const changeZoom = useCallback((zoomLevel: number) => {
    if (!isAvailableZoom(zoomLevel)) return;
    setZoom(zoomLevel);
  }, []);

  const zoomIn = useCallback(() => changeZoom(zoom + 1), [changeZoom, zoom]);
  const zoomOut = useCallback(() => changeZoom(zoom - 1), [changeZoom, zoom]);

  const handleFilterData = useCallback(() => onFilterData?.(), [onFilterData]);

  const { Provider } = calendarContext;

  const contextValue = useMemo(
    () => ({
      data,
      config,
      handleGoNext,
      handleGoPrev,
      handleGoToday,
      zoomIn,
      zoomOut,
      zoom,
      isNextZoom,
      isPrevZoom,
      currentCenterDate,
      viewportWidth,
      referenceDate,
      scrollPosition,
      visibleRange,
      handleScrollChange,
      isLoading,
      cols,
      startDate: parsedStartDate,
      dayOfYear,
      handleFilterData,
      recordsThreshold: maxRecordsPerPage,
      onClearFilterData
    }),
    [
      data,
      config,
      handleGoNext,
      handleGoPrev,
      handleGoToday,
      zoomIn,
      zoomOut,
      zoom,
      isNextZoom,
      isPrevZoom,
      currentCenterDate,
      viewportWidth,
      referenceDate,
      scrollPosition,
      visibleRange,
      handleScrollChange,
      isLoading,
      cols,
      parsedStartDate,
      dayOfYear,
      handleFilterData,
      maxRecordsPerPage,
      onClearFilterData
    ]
  );

  return <Provider value={contextValue}>{children}</Provider>;
};

/**
 * Accessor hook for scheduler calendar context.
 *
 * @returns Calendar context value exposed by `CalendarProvider`.
 */
const useCalendar = () => useContext(calendarContext);

export default CalendarProvider;
export { useCalendar };
