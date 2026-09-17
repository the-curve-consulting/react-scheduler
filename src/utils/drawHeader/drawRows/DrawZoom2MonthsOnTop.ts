import dayjs from "dayjs";
import { hoursInDay, topRowTextYPos, zoom2ColumnWidth, zoom2HeaderTopRowHeight } from "@/constants";
import { Theme } from "@/styles";
import { getHeaderLabel } from "../getHeaderLabel";
import { drawRow } from "../../drawRow";

export const drawZoom2MonthsOnTop = (
  ctx: CanvasRenderingContext2D,
  cols: number,
  centerDate: dayjs.Dayjs,
  theme: Theme
) => {
  const centerHour = centerDate.startOf("hour");
  const centerCol = Math.floor(cols / 2);
  const firstVisibleHour = centerHour.subtract(centerCol, "hours");

  const firstMonth = firstVisibleHour.startOf("month");
  const hoursBeforeVisible = firstVisibleHour.diff(firstMonth, "hours");
  let xPos = -hoursBeforeVisible * zoom2ColumnWidth + 0.5 * zoom2ColumnWidth;

  const monthsToShow = Math.ceil((cols + hoursBeforeVisible) / (hoursInDay * 28)) + 2;

  for (let i = 0; i < monthsToShow; i++) {
    const month = firstMonth.add(i, "months");
    const monthLabel = getHeaderLabel(month.format("MMMM"), theme);
    const daysInMonth = month.daysInMonth();
    const width = daysInMonth * hoursInDay * zoom2ColumnWidth;

    drawRow(
      {
        ctx,
        x: xPos,
        y: 0,
        width,
        height: zoom2HeaderTopRowHeight,
        textYPos: topRowTextYPos,
        label: monthLabel,
        font: theme.headerFonts.topRow
      },
      theme
    );

    xPos += width;
  }
};
