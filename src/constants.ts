import { prefixId } from "./styles";

export const dayWidth = 50;
export const headerMonthHeight = 24;
export const headerWeekHeight = 16;
export const headerDayHeight = 40;
export const headerHeight = headerDayHeight + headerWeekHeight + headerMonthHeight;
export const weekWidth = 84;
export const boxHeight = 56;
export const leftColumnWidth = 196;
export const singleDayWidth = 12;
export const zoom2ColumnWidth = 50;
export const zoom2HeaderTopRowHeight = 24;
export const zoom2HeaderMiddleRowHeight = 16;
export const zoom2HeaderBottomRowHeight = 40;
export const zoom2HeaderHeight =
  zoom2HeaderTopRowHeight + zoom2HeaderMiddleRowHeight + zoom2HeaderBottomRowHeight;
export const navHeight = 44;
export const fonts = {
  topRow: "600 14px Inter",
  middleRow: "400 10px Inter",
  bottomRow: {
    name: "600 14px Inter",
    number: "600 10px Inter"
  }
};
export const dayNameYoffset = 1.6;
export const dayNumYOffset = 4.5;
export const monthsInYear = 12;
export const hoursInDay = 24;
export const canvasHeaderWrapperId = "reactSchedulerCanvasHeaderWrapper";
export const canvasWrapperId = "reactSchedulerCanvasWrapper";
export const gridInnerWrapperId = "reactSchedulerGridInnerWrapper";
export const canvasId = "reactSchedulerCanvas";
export const outsideWrapperId = prefixId;
export const tileYOffset = 4;
export const tileHeight = 48;
export const formFieldsIds = {
  peopleCount: "peopleCount",
  projectsPerYear: "projectsPerYear",
  yearsCovered: "yearsCovered",
  startDate: "startDate",
  maxRecordsPerPage: "maxRecordsPerPage",
  isFullscreen: "isFullscreen"
};
export const businessDays = 5;
export const dayStartHour = 9;
export const maxHoursPerWeek = 40;
export const maxHoursPerDay = 8;
export const topRowTextYPos = headerMonthHeight / 2 + 2;
export const middleRowTextYPos = headerWeekHeight / 2 + headerMonthHeight + 1;
export const minutesInHour = 60;

export const SCROLL_CONFIG_DAYS = {
  containerDays: 3650,
  repositionJumpDays: 180,
  repositionThreshold: 0.8 // Reposition at 80% scroll
};

// Data loading configuration
export const DATA_CONFIG = {
  initialLoadDays: 90, // ±90 days on mount (fills weekly view)
  prefetchDays: 30, // Load ±30 days when prefetching
  prefetchTriggerDays: 30, // Trigger when < 30 days ahead/behind
  prefetchTriggerRatio: 0.8, // Trigger prefetch near 80% of cached range
  maxCachedDays: 60 // Garbage collect beyond ±60 days
};
