import dayjs from "dayjs";
import {
  dayWidth,
  SCROLL_CONFIG_DAYS,
  weekWidth,
  zoom2ColumnWidth
} from "@/constants";

/**
 * Get cell width for zoom level
 */
export const getCellWidth = (zoom: number): number => {
  switch (zoom) {
    case 0:
      return weekWidth;
    case 1:
      return dayWidth;
    case 2:
      return zoom2ColumnWidth;
    default:
      return dayWidth;
  }
};

export const getScrollConfig = (
  zoom: number
): {
  containerWidth: number;
  center: number;
  repositionJump: number;
  thresholdHigh: number;
  thresholdLow: number;
  dateShift: number;
  unit: "weeks" | "days" | "hours";
} => {
  const cellWidth = getCellWidth(zoom);

  switch (zoom) {
    case 0: {
      const weeksInContainer = Math.floor(SCROLL_CONFIG_DAYS.containerDays / 7);
      const weeksToJump = Math.floor(SCROLL_CONFIG_DAYS.repositionJumpDays / 7);
      const containerWidthPx = weeksInContainer * cellWidth;

      return {
        containerWidth: containerWidthPx,
        center: containerWidthPx / 2,
        repositionJump: weeksToJump * cellWidth,
        thresholdHigh: containerWidthPx * SCROLL_CONFIG_DAYS.repositionThreshold,
        thresholdLow: containerWidthPx * (1 - SCROLL_CONFIG_DAYS.repositionThreshold),
        dateShift: weeksToJump,
        unit: "weeks" as const
      };
    }

    case 1: {
      const containerWidthPx = SCROLL_CONFIG_DAYS.containerDays * cellWidth;

      return {
        containerWidth: containerWidthPx,
        center: containerWidthPx / 2,
        repositionJump: SCROLL_CONFIG_DAYS.repositionJumpDays * cellWidth,
        thresholdHigh: containerWidthPx * SCROLL_CONFIG_DAYS.repositionThreshold,
        thresholdLow: containerWidthPx * (1 - SCROLL_CONFIG_DAYS.repositionThreshold),
        dateShift: SCROLL_CONFIG_DAYS.repositionJumpDays,
        unit: "days" as const
      };
    }

    case 2: {
      const hoursInContainer = SCROLL_CONFIG_DAYS.containerDays * 24;
      const hoursToJump = SCROLL_CONFIG_DAYS.repositionJumpDays * 24;
      const containerWidthPx = hoursInContainer * cellWidth;

      return {
        containerWidth: containerWidthPx,
        center: containerWidthPx / 2,
        repositionJump: hoursToJump * cellWidth,
        thresholdHigh: containerWidthPx * SCROLL_CONFIG_DAYS.repositionThreshold,
        thresholdLow: containerWidthPx * (1 - SCROLL_CONFIG_DAYS.repositionThreshold),
        dateShift: hoursToJump,
        unit: "hours" as const
      };
    }

    default:
      return getScrollConfig(1); //Default to daily
  }
};

/**
 * Calculate date offset from scroll position
 * @param scrollLeft - Current scroll position
 * @param zoom - Current zoom level
 * @returns Number of units (weeks/days/hours) from scroll center
 */
export const getOffsetFromScroll = (scrollLeft: number, zoom: number): number => {
  const scrollConfig = getScrollConfig(zoom);
  const cellWidth = getCellWidth(zoom);
  const offsetPx = scrollLeft - scrollConfig.center;
  return Math.floor(offsetPx / cellWidth);
};

/**
 * Calculate visible date range from scroll position
 * @param scrollLeft - Current scroll position
 * @param referenceDate - Current reference date (center of scroll range)
 * @param zoom - Current zoom level
 * @param viewportWidth - Viewport width in pixels
 * @param bufferUnits - Buffer units to render outside viewport
 */
export const getVisibleRangeFromScroll = (
  scrollLeft: number,
  referenceDate: dayjs.Dayjs,
  zoom: number,
  viewportWidth: number,
  bufferUnits = 7
): { startDate: dayjs.Dayjs; endDate: dayjs.Dayjs } => {
  const cellWidth = getCellWidth(zoom);
  const offset = getOffsetFromScroll(scrollLeft, zoom);
  const visibleUnits = Math.ceil(viewportWidth / cellWidth);
  const unitsFromCenter = Math.floor(visibleUnits / 2) + bufferUnits;

  let currentCenter: dayjs.Dayjs;
  let startDate: dayjs.Dayjs;
  let endDate: dayjs.Dayjs;

  switch (zoom) {
    case 0: //Weekly
      currentCenter = referenceDate.add(offset, "weeks");
      startDate = currentCenter.subtract(unitsFromCenter, "weeks");
      endDate = currentCenter.add(unitsFromCenter, "weeks");
      break;
    case 1: //Daily
      currentCenter = referenceDate.add(offset, "days");
      startDate = referenceDate.subtract(unitsFromCenter, "days");
      endDate = referenceDate.add(unitsFromCenter, "days");
      break;
    case 2: //Hourly
      currentCenter = referenceDate.add(offset, "hours");
      startDate = currentCenter.subtract(unitsFromCenter, "hours");
      endDate = currentCenter.add(unitsFromCenter, "hours");
      break;
    default:
      currentCenter = referenceDate.add(offset, "days");
      startDate = referenceDate.subtract(unitsFromCenter, "days");
      endDate = referenceDate.add(unitsFromCenter, "days");
  }

  return { startDate, endDate };
};

/**
 * Calculate scroll position for a specific date
 */
export const getScrollPositionForDate = (
  targetDate: dayjs.Dayjs,
  referenceDate: dayjs.Dayjs,
  zoom: number
): number => {
  const scrollConfig = getScrollConfig(zoom);
  const cellWidth = getCellWidth(zoom);
  let offset: number;

  switch (zoom) {
    case 0:
      offset = targetDate.diff(referenceDate, "weeks");
      break;
    case 1:
      offset = targetDate.diff(referenceDate, "days");
      break;
    case 2:
      offset = targetDate.diff(referenceDate, "hours");
      break;
    default:
      offset = targetDate.diff(referenceDate, "days");
  }

  return scrollConfig.center + offset * cellWidth;
};

/**
 * Check if project is visible in date range
 */
export const isProjectVisible = (
  projectStart: Date,
  projectEnd: Date,
  rangeStart: dayjs.Dayjs,
  rangeEnd: dayjs.Dayjs
): boolean => {
  const start = dayjs(projectStart);
  const end = dayjs(projectEnd);

  return (
    (start.isBefore(rangeEnd) || start.isSame(rangeEnd)) &&
    (end.isAfter(rangeStart) || end.isSame(rangeStart))
  );
};
