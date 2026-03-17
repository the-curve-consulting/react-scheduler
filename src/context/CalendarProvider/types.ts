import { ReactNode } from "react";
import dayjs from "dayjs";
import { Config, Day, SchedulerData, SchedulerFetchLoadingState, ZoomLevel } from "@/types/global";
import { ParsedDatesRange } from "@/utils/getDatesRange";

export type CalendarContextType<TMeta = unknown> = {
  handleGoNext: () => void;
  handleGoPrev: () => void;
  handleGoToday: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  handleFilterData: () => void;
  onClearFilterData?: () => void;
  data?: SchedulerData<TMeta>;
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
  loadingState: SchedulerFetchLoadingState;
  cols: number;
  startDate: Day;
  dayOfYear: number;
  recordsThreshold: number;
  config: Config;
};

export type CalendarProviderProps<TMeta = unknown> = {
  children: ReactNode;
  isLoading: boolean;
  loadingState?: SchedulerFetchLoadingState;
  defaultStartDate?: dayjs.Dayjs;
  data?: SchedulerData<TMeta>;
  config: Config;
  onRangeChange?: (range: ParsedDatesRange) => void;
  onFilterData?: () => void;
  onClearFilterData?: () => void;
};
