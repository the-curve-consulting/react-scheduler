import dayjs from "dayjs";
import {
  fonts,
  hoursInDay,
  zoom2ColumnWidth,
  zoom2HeaderMiddleRowHeight,
  zoom2HeaderTopRowHeight
} from "@/constants";
import { Theme } from "@/styles";
import { drawRow } from "../../drawRow";

export const drawZoom2DaysInMiddle = (
  ctx: CanvasRenderingContext2D,
  cols: number,
  centerDate: dayjs.Dayjs,
  theme: Theme
) => {
  const width = hoursInDay * zoom2ColumnWidth;
  const centerHour = centerDate.startOf("hour");
  const centerCol = Math.floor(cols / 2);

  const firstVisibleHour = centerHour.subtract(centerCol, "hours");
  const firstDay = firstVisibleHour.startOf("day");

  const hoursBeforeVisible = firstVisibleHour.diff(firstDay, "hours");
  const xPosOffset = -hoursBeforeVisible * zoom2ColumnWidth + 0.5 * zoom2ColumnWidth;

  const daysToShow = Math.ceil((cols + hoursBeforeVisible) / hoursInDay) + 1;

  for (let i = 0; i < daysToShow; i++) {
    const day = firstDay.add(i, "days");
    const dayLabel = day.format("dddd DD.MM.YYYY").toUpperCase();

    drawRow(
      {
        ctx,
        x: xPosOffset + i * width,
        y: zoom2HeaderTopRowHeight,
        width,
        height: zoom2HeaderMiddleRowHeight,
        textYPos: zoom2HeaderTopRowHeight + zoom2HeaderMiddleRowHeight / 2 + 2,
        label: dayLabel,
        font: fonts.bottomRow.number
      },
      theme
    );
  }
};
