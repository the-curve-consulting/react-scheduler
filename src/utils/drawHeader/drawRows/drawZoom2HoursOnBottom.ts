import dayjs from "dayjs";
import {
  zoom2ColumnWidth,
  zoom2HeaderBottomRowHeight,
  zoom2HeaderTopRowHeight,
  zoom2HeaderMiddleRowHeight
} from "@/constants";
import { Theme } from "@/styles";
import { drawRow } from "../../drawRow";

export const drawZoom2HoursOnBottom = (
  ctx: CanvasRenderingContext2D,
  cols: number,
  centerDate: dayjs.Dayjs,
  theme: Theme
) => {
  const yPos = zoom2HeaderTopRowHeight + zoom2HeaderMiddleRowHeight;
  const width = zoom2ColumnWidth;

  const centerHour = centerDate.startOf("hour");
  const centerCol = Math.floor(cols / 2);

  for (let i = 0; i < cols; i++) {
    const offsetFromCenter = i - centerCol;
    const hour = centerHour.add(offsetFromCenter, "hours");
    const hourLabel = hour.format("HH:00");

    drawRow(
      {
        ctx,
        x: i * zoom2ColumnWidth,
        y: yPos,
        width,
        height: zoom2HeaderBottomRowHeight,
        label: hourLabel,
        font: theme.headerFonts.bottomRowNumber,
        textYPos:
          zoom2HeaderTopRowHeight + zoom2HeaderMiddleRowHeight + zoom2HeaderBottomRowHeight / 2 + 2,
        labelBetweenCells: true
      },
      theme
    );
  }
};
