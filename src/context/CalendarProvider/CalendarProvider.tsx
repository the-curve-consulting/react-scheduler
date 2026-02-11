import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear";
import dayOfYear from "dayjs/plugin/dayOfYear";
import isoWeek from "dayjs/plugin/isoWeek";
import isBetween from "dayjs/plugin/isBetween";
import duration from "dayjs/plugin/duration";
import { Coords, ZoomLevel, allZoomLevel } from "@/types/global";
import { isAvailableZoom } from "@/types/guards";
import { parseDay } from "@/utils/dates";
import { getCols } from "@/utils/getCols";
import { DATA_CONFIG, leftColumnWidth, outsideWrapperId } from "@/constants";
import {
  getScrollConfig,
  getScrollPositionForDate,
  getVisibleRangeFromScroll,
  getCurrentCenterDateFromScroll
} from "@/utils/scrollHelpers";
import { calendarContext } from "./calendarContext";
import { CalendarProviderProps } from "./types";
dayjs.extend(weekOfYear);
dayjs.extend(dayOfYear);
dayjs.extend(isoWeek);
dayjs.extend(isBetween);
dayjs.extend(duration);

type Direction = "back" | "forward" | "middle";

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
  const { zoom: configZoom, maxRecordsPerPage = 50, dataLoading } = config;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const dataConfig = { ...DATA_CONFIG, ...dataLoading };
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

  const [tilesCoords, setTilesCoords] = useState<Coords[]>([{ x: 0, y: 0 }]);

  const previousZoom = useRef(zoom);

  /**
   * Reposition scroll range when threshold crossed
   * Adjusts reference date and scroll position for infinite scroll effect
   */
  const repositionScrollRange = useCallback(
    (direction: "forward" | "backward", currentScrollLeft: number) => {
      const container = document.getElementById(outsideWrapperId);
      if (!container) return;

      const { dateShift, repositionJump, unit } = scrollConfig;

      if (direction === "forward") {
        // Scrolled too far right, shift reference forward
        setReferenceDate((prev) => prev.add(dateShift, unit));
        const newScrollPosition = currentScrollLeft - repositionJump;
        setScrollPosition(newScrollPosition);
        container.scrollTo({ left: newScrollPosition, behavior: "auto" });
      } else {
        // Scrolled too far left, shift reference backward
        setReferenceDate((prev) => prev.subtract(dateShift, unit));
        const newScrollPosition = currentScrollLeft + repositionJump;
        setScrollPosition(newScrollPosition);
        container.scrollTo({ left: newScrollPosition, behavior: "auto" });
      }
    },
    [scrollConfig]
  );

  /**
   * Handle scroll position changes from Grid
   */
  const handleScrollChange = useCallback(
    (newScrollLeft: number) => {
      if (newScrollLeft > scrollConfig.thresholdHigh) {
        repositionScrollRange("forward", newScrollLeft);
      } else if (newScrollLeft < scrollConfig.thresholdLow) {
        repositionScrollRange("backward", newScrollLeft);
      } else {
        setScrollPosition(newScrollLeft);
      }
    },
    [repositionScrollRange, scrollConfig]
  );

  /**
   * Navigate to specific date
   */
  const handleGoToDate = useCallback(
    (targetDate: dayjs.Dayjs) => {
      const scrollLeft = getScrollPositionForDate(targetDate, referenceDate, zoom);
      const container = document.getElementById(outsideWrapperId);

      container?.scrollTo({ left: scrollLeft, behavior: "smooth" });
      setScrollPosition(scrollLeft);
    },
    [referenceDate, zoom]
  );

  /**
   * Go to today
   */
  const handleGoToday = useCallback(() => {
    handleGoToDate(dayjs());
  }, [handleGoToDate]);

  /**
   * Next/Prev buttons
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
    const scrollLeft = getScrollPositionForDate(centerDateBeforeChange, referenceDate, zoom);
    const container = document.getElementById(outsideWrapperId);
    container?.scrollTo({ left: scrollLeft, behavior: "auto" });
    setScrollPosition(scrollLeft);
  }, [zoom, scrollPosition, referenceDate, viewportWidth]);

  // Initialize viewport width after DOM is ready
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

  useEffect(() => {
    if (isInitialized) return;

    const scrollLeft = getScrollPositionForDate(defaultStartDate, referenceDate, zoom);
    const container = document.getElementById(outsideWrapperId);

    container?.scrollTo({ left: scrollLeft, behavior: "auto" });
    setScrollPosition(scrollLeft);
    setIsInitialized(true);
  }, [defaultStartDate, isInitialized, referenceDate, zoom]);

  useEffect(() => {
    const parsedRange = { startDate: range.startDate.toDate(), endDate: range.endDate.toDate() };
    onRangeChange?.(parsedRange);
  }, [onRangeChange, range]);

  const changeZoom = useCallback((zoomLevel: number) => {
    if (!isAvailableZoom(zoomLevel)) return;
    setZoom(zoomLevel);
  }, []);

  // Keep old handlers for backward compatibility (but they just call new ones)
  const handleScrollNext = useCallback(() => handleGoNext(), [handleGoNext]);
  const handleScrollPrev = useCallback(() => handleGoPrev(), [handleGoPrev]);

  const zoomIn = useCallback(() => changeZoom(zoom + 1), [changeZoom, zoom]);
  const zoomOut = useCallback(() => changeZoom(zoom - 1), [changeZoom, zoom]);

  const handleFilterData = useCallback(() => onFilterData?.(), [onFilterData]);
  const updateTilesCoords = useCallback((coords: Coords[]) => setTilesCoords(coords), []);

  const { Provider } = calendarContext;

  const contextValue = useMemo(
    () => ({
      data,
      config,
      handleGoNext,
      handleScrollNext,
      handleGoPrev,
      handleScrollPrev,
      handleGoToday,
      zoomIn,
      zoomOut,
      zoom,
      isNextZoom,
      isPrevZoom,
      date: referenceDate,
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
      tilesCoords,
      updateTilesCoords,
      recordsThreshold: maxRecordsPerPage,
      onClearFilterData,
      dataConfig
    }),
    [
      data,
      config,
      handleGoNext,
      handleScrollNext,
      handleGoPrev,
      handleScrollPrev,
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
      tilesCoords,
      updateTilesCoords,
      maxRecordsPerPage,
      onClearFilterData,
      dataConfig
    ]
  );

  return <Provider value={contextValue}>{children}</Provider>;
};

const useCalendar = () => useContext(calendarContext);

export default CalendarProvider;
export { useCalendar };
