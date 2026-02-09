import dayjs from "dayjs";
import { boxHeight, weekWidth } from "@/constants";
import { Theme } from "@/styles";
import { drawCell } from "./drawCell";

export const drawYearlyView = (
  ctx: CanvasRenderingContext2D,
  rows: number,
  cols: number,
  centerDate: dayjs.Dayjs,
  theme: Theme
) => {
  // Round to discrete ISO week boundary (Monday start)
  const centerWeek = centerDate.startOf("isoWeek");
  const centerCol = Math.floor(cols / 2);

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j <= cols; j++) {
      const offsetFromCenter = j - centerCol;
      const week = centerWeek.add(offsetFromCenter, "weeks");

      const isCurrWeek = week.isSame(dayjs(), "week");

      drawCell(ctx, j * weekWidth, i * boxHeight, weekWidth, true, isCurrWeek, theme);
    }
  }
};
