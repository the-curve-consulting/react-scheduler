import dayjs from "dayjs";
import {
  dayWidth,
  fonts,
  headerMonthHeight,
  headerWeekHeight,
  middleRowTextYPos
} from "@/constants";
import { drawRow } from "@/utils/drawRow";
import { Theme } from "@/styles";

export const drawWeeksInMiddle = (
  ctx: CanvasRenderingContext2D,
  centerDate: dayjs.Dayjs,
  cols: number,
  weekLabel: string,
  theme: Theme
) => {
  const width = 7 * dayWidth;
  const yPos = headerMonthHeight;

  const centerDay = centerDate.startOf("day");
  const centerCol = Math.floor(cols / 2);

  const firstVisibleDay = centerDay.subtract(centerCol, "days");
  const firstWeekStart = firstVisibleDay.startOf("week").add(1, "day");
  const daysBeforeVisible = firstVisibleDay.diff(firstWeekStart, "days");
  let xPos = -daysBeforeVisible * dayWidth;
  const weeksToShow = Math.ceil((ctx.canvas.width + daysBeforeVisible * dayWidth) / width) + 1;

  for (let i = 0; i < weeksToShow; i++) {
    const weekStart = firstWeekStart.add(i, "weeks");
    const weekNumber = weekStart.week();

    drawRow(
      {
        ctx,
        x: xPos,
        y: yPos,
        width,
        height: headerWeekHeight,
        textYPos: middleRowTextYPos,
        label: `${weekLabel.toUpperCase()} ${weekNumber}`,
        font: fonts.middleRow
      },
      theme
    );

    xPos += width;
  }
};
