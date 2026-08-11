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
  /** Jump straight to a zoom level, for a control that is not a +/- pair. */
  setZoomLevel: (zoom: ZoomLevel) => void;
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
  centerDate?: dayjs.Dayjs;
  data?: SchedulerData<TMeta>;
  config: Config;
  onRangeChange?: (range: ParsedDatesRange) => void;
  onFilterData?: () => void;
  onClearFilterData?: () => void;
  /**
   * Width of the column beside the chart, subtracted from the wrapper to get
   * the timeline's own viewport. Defaults to the Scheduler's left column, so
   * existing callers are unaffected; <Gantt> passes its outline width, which
   * may be 0 when the host renders its own grid instead.
   */
  leftColumnWidth?: number;
};
