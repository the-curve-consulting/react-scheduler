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
  prefetchDays: 60, // Load ±60 days when prefetching
  prefetchTriggerDays: 45, // Trigger when < X days ahead/behind
  prefetchTriggerRatio: 0.7, // Trigger prefetch near X% of cached range
  maxCachedDays: 120, // Garbage collect beyond ±X days
  requestDebounceMs: 80, // Debounce rapid range updates before requesting
  jumpWindowMultiplier: 3, // Hard jump fetch window vs visible range span
  minJumpWindowDays: 45 // Minimum fetch window for hard jumps
};

export const SCROLL_REBASE_CONFIG = {
  rearmFallbackPx: 200,
  rearmMinPx: 120,
  rearmMaxPx: 600,
  rearmViewportRatio: 0.25,
  rearmStreakGrowth: 0.75,
  rearmMaxViewportMultiplier: 1.5,
  rearmMaxFallbackPx: 1200,
  idleResetMs: 180
} as const;
