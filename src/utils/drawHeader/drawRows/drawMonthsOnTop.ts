import dayjs from "dayjs";
import { dayWidth, fonts, headerMonthHeight, topRowTextYPos } from "@/constants";
import { Theme } from "@/styles";
import { drawRow } from "../../drawRow";

export const drawMonthsOnTop = (
  ctx: CanvasRenderingContext2D,
  centerDate: dayjs.Dayjs,
  cols: number,
  theme: Theme
) => {
  const yPos = 0;

  // Round to start of day, then find the month start
  const centerDay = centerDate.startOf("day");
  const startDay = centerDay.subtract(cols / 2, "days");

  const firstMonth = startDay.startOf("month");
  const daysFromMonthStart = startDay.diff(firstMonth, "days");
  const monthsToShow = Math.ceil(cols / 28);
  let startPosX = -daysFromMonthStart * dayWidth;

  for (let i = 0; i <= monthsToShow; i++) {
    const month = firstMonth.add(i, "months");
    const daysInMonth = month.daysInMonth();
    const width = daysInMonth * dayWidth;

    drawRow(
      {
        ctx,
        x: startPosX,
        y: yPos,
        width,
        height: headerMonthHeight,
        textYPos: topRowTextYPos,
        label: `${month.format("MMMM").toUpperCase()} ${month.format("YYYY")}`,
        font: fonts.topRow
      },
      theme
    );

    startPosX += width;
  }
};
