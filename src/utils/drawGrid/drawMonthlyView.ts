import dayjs from "dayjs";
import { boxHeight, dayWidth } from "@/constants";
import { Theme } from "@/styles";
import { getIsBusinessDay } from "../dates";
import { drawCell } from "./drawCell";

export const drawMonthlyView = (
  ctx: CanvasRenderingContext2D,
  rows: number,
  cols: number,
  centerDate: dayjs.Dayjs,
  theme: Theme
) => {
  // Round to discrete day boundary
  const centerDay = centerDate.startOf("day");
  const centerCol = Math.floor(cols / 2);

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j <= cols; j++) {
      const offsetFromCenter = j - centerCol;
      const date = centerDay.add(offsetFromCenter, "days");

      const isCurrentDay = date.isSame(dayjs(), "day");

      drawCell(
        ctx,
        j * dayWidth,
        i * boxHeight,
        dayWidth,
        getIsBusinessDay(date),
        isCurrentDay,
        theme
      );
    }
  }
};
