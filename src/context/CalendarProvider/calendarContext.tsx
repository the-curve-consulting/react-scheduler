import { createContext } from "react";
import dayjs from "dayjs";
import { dayStartHour } from "@/constants";
import { CalendarContextType } from "./types";

export const calendarContext = createContext<CalendarContextType>({
  handleGoNext: () => {},
  handleGoPrev: () => {},
  handleGoToday: () => {},
  zoomIn: () => {},
  zoomOut: () => {},
  handleFilterData: () => {},
  zoom: 0,
  isNextZoom: false,
  isPrevZoom: false,
  currentCenterDate: dayjs(),
  viewportWidth: 0,
  referenceDate: dayjs(),
  scrollPosition: 0,
  visibleRange: { startDate: dayjs(), endDate: dayjs() },
  handleScrollChange: () => {},
  isLoading: false,
  cols: 0,
  startDate: {
    hour: 0,
    dayName: "",
    dayOfMonth: 0,
    weekOfYear: 0,
    month: 0,
    monthName: "",
    isCurrentDay: false,
    isBusinessDay: false,
    year: 0
  },
  dayOfYear: 0,
  recordsThreshold: 0,
  config: {
    zoom: 0,
    defaultStartHour: dayStartHour
  }
});
