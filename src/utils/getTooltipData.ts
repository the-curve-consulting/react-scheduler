import dayjs from "dayjs";
import { boxHeight, zoom2ColumnWidth } from "@/constants";
import { Coords, SchedulerProjectData, TooltipData, ZoomLevel, Config } from "@/types/global";
import { getOccupancy } from "./getOccupancy";
import { getCellWidth } from "./scrollHelpers";

export const getTooltipData = (
  config: Config,
  cursorPosition: Coords,
  rowsPerPerson: number[],
  resourcesData: SchedulerProjectData[][][],
  zoom: ZoomLevel,
  includeTakenHoursOnWeekendsInDayView = false,
  currentCenterDate: dayjs.Dayjs,
  cols: number
): TooltipData => {
  let focusedDate: dayjs.Dayjs;
  const centerCol = Math.floor(cols / 2);
  const cellWidth = getCellWidth(zoom);

  let adjustedX = cursorPosition.x;
  let columnIndex = Math.floor(adjustedX / cellWidth);
  let xPos = columnIndex * cellWidth;
  switch (zoom) {
    case 0: {
      columnIndex = Math.floor(adjustedX / cellWidth);
      const centerWeek = currentCenterDate.startOf("isoWeek");
      const offsetFromCenter = columnIndex - centerCol;
      focusedDate = centerWeek.add(offsetFromCenter, "weeks");
      xPos = columnIndex * cellWidth;
      break;
    }

    case 1: {
      columnIndex = Math.floor(adjustedX / cellWidth);
      const centerDay = currentCenterDate.startOf("day");
      const offsetFromCenter = columnIndex - centerCol;
      focusedDate = centerDay.add(offsetFromCenter, "days");
      xPos = columnIndex * cellWidth;
      break;
    }

    case 2: {
      // Account for initial half cell offset in hourly grid
      adjustedX = cursorPosition.x - zoom2ColumnWidth / 2;
      columnIndex = Math.floor(adjustedX / zoom2ColumnWidth);

      const centerHour = currentCenterDate.startOf("hour");
      const offsetFromCenter = columnIndex - centerCol;
      focusedDate = centerHour.add(offsetFromCenter, "hours");
      xPos = columnIndex * zoom2ColumnWidth;
      break;
    }

    default: {
      const centerDay = currentCenterDate.startOf("day");
      const offsetFromCenter = columnIndex - centerCol;
      focusedDate = centerDay.add(offsetFromCenter, "days");
    }
  }

  // Calculate row index (0-based) for positioning
  const rowIndex = Math.floor(cursorPosition.y / boxHeight);
  const yPos = rowIndex * boxHeight;

  const rowPosition = rowIndex + 1;
  const resourceIndex = rowsPerPerson.findIndex((_, index, array) => {
    const sumOfRows = array.slice(0, index + 1).reduce((acc, cur) => acc + cur, 0);
    return sumOfRows >= rowPosition;
  });

  const disposition = getOccupancy(
    config,
    resourcesData[resourceIndex],
    resourceIndex,
    focusedDate,
    zoom,
    includeTakenHoursOnWeekendsInDayView
  );
  return { coords: { x: xPos, y: yPos }, resourceIndex, disposition };
};
