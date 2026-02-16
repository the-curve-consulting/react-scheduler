import { ReactNode } from "react";
import dayjs from "dayjs";
import { Config, Day, SchedulerData, ZoomLevel } from "@/types/global";
import { ParsedDatesRange } from "@/utils/getDatesRange";

export type CalendarContextType = {
  handleGoNext: () => void;
  handleGoPrev: () => void;
  handleGoToday: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  handleFilterData: () => void;
  onClearFilterData?: () => void;
  data?: SchedulerData;
  zoom: ZoomLevel;
  isNextZoom: boolean;
  isPrevZoom: boolean;
  currentCenterDate: dayjs.Dayjs;
  viewportWidth: number;
  referenceDate: dayjs.Dayjs;
  scrollPosition: number;
  visibleRange: { startDate: dayjs.Dayjs; endDate: dayjs.Dayjs };
  handleScrollChange: (newScrollLeft: number) => void;
  isLoading: boolean;
  cols: number;
  startDate: Day;
  dayOfYear: number;
  recordsThreshold: number;
  config: Config;
};

export type CalendarProviderProps = {
  children: ReactNode;
  isLoading: boolean;
  defaultStartDate?: dayjs.Dayjs;
  data?: SchedulerData;
  config: Config;
  onRangeChange?: (range: ParsedDatesRange) => void;
  onFilterData?: () => void;
  onClearFilterData?: () => void;
};
