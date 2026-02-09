import dayjs from "dayjs";
import {
  dayNameYoffset,
  dayNumYOffset,
  dayWidth,
  fonts,
  headerDayHeight,
  headerHeight,
  headerMonthHeight,
  headerWeekHeight
} from "@/constants";
import { parseDay } from "@/utils/dates";
import { Theme } from "@/styles";
import { drawRow } from "../../drawRow";
import { getBoxFillStyle } from "../../getBoxFillStyle";
import { getTextStyle } from "../../getTextStyle";

export const drawDaysOnBottom = (
  ctx: CanvasRenderingContext2D,
  cols: number,
  centerDate: dayjs.Dayjs,
  theme: Theme
) => {
  const dayNameYPos = headerHeight - headerDayHeight / dayNameYoffset;
  const dayNumYPos = headerHeight - headerDayHeight / dayNumYOffset;
  const yPos = headerMonthHeight + headerWeekHeight;
  let xPos = 0;

  const centerDay = centerDate.startOf("day");
  const centerCol = Math.floor(cols / 2);

  for (let i = 0; i < cols; i++) {
    const offsetFromCenter = i - centerCol;
    const day = parseDay(centerDay.add(offsetFromCenter, "days"));
    drawRow(
      {
        ctx,
        x: xPos,
        y: yPos,
        width: dayWidth,
        height: headerDayHeight,
        isBottomRow: true,
        fillStyle: getBoxFillStyle(
          {
            isCurrent: day.isCurrentDay,
            isBusinessDay: day.isBusinessDay
          },
          theme
        ),
        topText: {
          y: dayNameYPos,
          label: day.dayName.toUpperCase(),
          font: fonts.bottomRow.name,
          color: getTextStyle(
            { isCurrent: day.isCurrentDay, isBusinessDay: day.isBusinessDay },
            theme
          )
        },
        bottomText: {
          y: dayNumYPos,
          label: `${day.dayOfMonth}`,
          font: fonts.bottomRow.number,
          color: getTextStyle(
            {
              isCurrent: day.isCurrentDay,
              isBusinessDay: day.isBusinessDay,
              variant: "bottomRow"
            },
            theme
          )
        }
      },
      theme
    );

    xPos += dayWidth;
  }
};
