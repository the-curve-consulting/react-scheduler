import dayjs from "dayjs";
import { Theme } from "@/styles";
import { drawDaysOnBottom } from "./drawRows/drawDaysOnBottom";
import { drawMonthsInMiddle } from "./drawRows/drawMonthsInMiddle";
import { drawMonthsOnTop } from "./drawRows/drawMonthsOnTop";
import { drawWeeksInMiddle } from "./drawRows/drawWeeksInMiddle";
import { drawWeeksOnBottom } from "./drawRows/drawWeeksOnBottom";
import { drawYearsOnTop } from "./drawRows/drawYearsOnTop";
import { drawZoom2DaysInMiddle } from "./drawRows/drawZoom2DaysInMiddle";
import { drawZoom2MonthsOnTop } from "./drawRows/DrawZoom2MonthsOnTop";
import { drawZoom2HoursOnBottom } from "./drawRows/drawZoom2HoursOnBottom";

export const drawHeader = (
  ctx: CanvasRenderingContext2D,
  zoom: number,
  cols: number,
  currentCenterDate: dayjs.Dayjs,
  weekLabel: string,
  theme: Theme
) => {
  switch (zoom) {
    case 0:
      drawYearsOnTop(ctx, cols, currentCenterDate, theme);
      drawMonthsInMiddle(ctx, cols, currentCenterDate, theme);
      drawWeeksOnBottom(ctx, cols, currentCenterDate, weekLabel, theme);
      break;
    case 1:
      drawMonthsOnTop(ctx, currentCenterDate, cols, theme);
      drawWeeksInMiddle(ctx, currentCenterDate, cols, weekLabel, theme);
      drawDaysOnBottom(ctx, cols, currentCenterDate, theme);
      break;
    case 2:
      drawZoom2MonthsOnTop(ctx, cols, currentCenterDate, theme);
      drawZoom2DaysInMiddle(ctx, cols, currentCenterDate, theme);
      drawZoom2HoursOnBottom(ctx, cols, currentCenterDate, theme);
      break;
  }
};
