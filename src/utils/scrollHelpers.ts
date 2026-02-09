import dayjs from "dayjs";
import { dayWidth, SCROLL_CONFIG_DAYS, weekWidth, zoom2ColumnWidth } from "@/constants";

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
 */
export const getVisibleRangeFromScroll = (
  scrollLeft: number,
  referenceDate: dayjs.Dayjs,
  zoom: number,
  viewportWidth: number
): { startDate: dayjs.Dayjs; endDate: dayjs.Dayjs } => {
  const cellWidth = getCellWidth(zoom);
  const offset = getOffsetFromScroll(scrollLeft, zoom);
  const visibleUnits = Math.ceil(viewportWidth / cellWidth);
  const unitsFromCenter = Math.floor(visibleUnits / 2);

  // Add buffer to prevent tiles from flickering at edges
  const buffer = 2;

  let currentCenter: dayjs.Dayjs;
  let startDate: dayjs.Dayjs;
  let endDate: dayjs.Dayjs;

  switch (zoom) {
    case 0: //Weekly
      currentCenter = referenceDate.add(offset, "weeks");
      startDate = currentCenter.subtract(unitsFromCenter + buffer, "weeks");
      endDate = currentCenter.add(unitsFromCenter + buffer, "weeks");
      break;
    case 1: //Daily
      currentCenter = referenceDate.add(offset, "days");
      startDate = currentCenter.subtract(unitsFromCenter + buffer, "days");
      endDate = currentCenter.add(unitsFromCenter + buffer, "days");
      break;
    case 2: //Hourly
      currentCenter = referenceDate.add(offset, "hours");
      startDate = currentCenter.subtract(unitsFromCenter + buffer, "hours");
      endDate = currentCenter.add(unitsFromCenter + buffer, "hours");
      break;
    default:
      currentCenter = referenceDate.add(offset, "days");
      startDate = currentCenter.subtract(unitsFromCenter + buffer, "days");
      endDate = currentCenter.add(unitsFromCenter + buffer, "days");
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

/**
 * Calculate tile position relative to current center date
 * @param tileDate - Date of the tile
 * @param currentCenterDate - Date currently at viewport center
 * @param zoom - Current zoom level
 * @param cols - Number of visible columns
 * @returns X position in pixels
 */
export const getTilePositionRelativeToCenter = (
  tileDate: dayjs.Dayjs,
  currentCenterDate: dayjs.Dayjs,
  zoom: number,
  cols: number
): number => {
  const cellWidth = getCellWidth(zoom);
  const centerCol = Math.floor(cols / 2);

  let offset: number;

  switch (zoom) {
    case 0:
      // Weekly view: use day-level precision with ISO weeks (Monday start)
      offset = tileDate.startOf("day").diff(currentCenterDate.startOf("isoWeek"), "weeks", true);
      return (centerCol + offset) * cellWidth;
    case 1:
      // Daily view: use day-level precision
      offset = tileDate.startOf("day").diff(currentCenterDate.startOf("day"), "days");
      return (centerCol + offset) * cellWidth;
    case 2:
      // Hourly view: use minute-level precision
      offset = tileDate.diff(currentCenterDate.startOf("hour"), "hours", true);
      // Add same offset as grid: cellWidth / 2 - 0.5 (for border alignment)
      return (centerCol + offset) * cellWidth + cellWidth / 2 - 0.5;
    default:
      offset = tileDate.startOf("day").diff(currentCenterDate.startOf("isoWeek"), "weeks", true);
      return (centerCol + offset) * cellWidth;
  }
};

/**
 * Calculate the current center date from scroll position using continuous pixel-to-time mapping
 * This provides accurate center date without discretization to cell boundaries
 * @param scrollLeft - Current scroll position
 * @param referenceDate - Reference date (center of scroll range)
 * @param zoom - Current zoom level
 * @returns Date at the viewport center
 */
export const getCurrentCenterDateFromScroll = (
  scrollLeft: number,
  referenceDate: dayjs.Dayjs,
  zoom: number
): dayjs.Dayjs => {
  const scrollConfig = getScrollConfig(zoom);
  const cellWidth = getCellWidth(zoom);
  const offsetPx = scrollLeft - scrollConfig.center;

  let centerDate: dayjs.Dayjs;

  switch (zoom) {
    case 0: {
      // Weekly - calculate in weeks (continuous for smooth scrolling)
      const offsetWeeks = offsetPx / cellWidth;
      centerDate = referenceDate.add(offsetWeeks, "weeks");
      break;
    }
    case 1: {
      // Daily - calculate in days (continuous for smooth scrolling)
      const offsetDays = offsetPx / cellWidth;
      centerDate = referenceDate.add(offsetDays, "days");
      break;
    }
    case 2: {
      // Hourly - calculate in hours (continuous for smooth scrolling)
      const offsetHours = offsetPx / cellWidth;
      centerDate = referenceDate.add(offsetHours, "hours");
      break;
    }
    default: {
      const offsetDays = offsetPx / cellWidth;
      centerDate = referenceDate.add(offsetDays, "days");
    }
  }

  return centerDate;
};
