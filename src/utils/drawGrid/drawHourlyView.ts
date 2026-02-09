import dayjs from "dayjs";
import { Theme } from "@/styles";
import { boxHeight, zoom2ColumnWidth } from "@/constants";
import { getIsBusinessDay } from "../dates";
import { drawCell } from "./drawCell";

export const drawHourlyView = (
  ctx: CanvasRenderingContext2D,
  rows: number,
  cols: number,
  centerDate: dayjs.Dayjs,
  theme: Theme
) => {
  // Round to discrete hour boundary to prevent jumping when scrolling
  const centerHour = centerDate.startOf("hour");
  const centerCol = Math.floor(cols / 2);

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j <= cols; j++) {
      const offsetFromCenter = j - centerCol;
      const hour = centerHour.add(offsetFromCenter, "hours");

      const isCurrentHour = hour.isSame(dayjs(), "hour");

      drawCell(
        ctx,
        j * zoom2ColumnWidth + zoom2ColumnWidth / 2 - 0.5, // -0.5 to make borders better aligned with hour axis
        i * boxHeight,
        zoom2ColumnWidth,
        getIsBusinessDay(hour),
        isCurrentHour,
        theme
      );
    }
  }
};
