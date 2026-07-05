import dayjs from "dayjs";
import { boxHeight } from "@/constants";
import {
  Coords,
  SchedulerProjectData,
  TooltipData,
  ZoomLevel,
  Config,
  WorkingDuration,
  HolidayRequest
} from "@/types/global";
import { getOccupancy } from "./getOccupancy";
import { getCellDateRelativeToCenter } from "./scrollHelpers";

export const getTooltipData = <TMeta>(
  config: Config,
  cursorPosition: Coords,
  rowsPerPerson: number[],
  resourcesData: SchedulerProjectData<TMeta>[][][],
  zoom: ZoomLevel,
  currentCenterDate: dayjs.Dayjs,
  cols: number,
  workingDurationsPerPerson: WorkingDuration[][],
  holidayRequestsPerPerson: HolidayRequest[][]
): TooltipData => {
  const { alignedPos, cellDate } = getCellDateRelativeToCenter(
    cursorPosition.x,
    currentCenterDate,
    zoom,
    cols
  );
  const focusedDate = cellDate;

  // Calculate row index (0-based) for positioning
  const rowIndex = Math.floor(cursorPosition.y / boxHeight);
  const yPos = rowIndex * boxHeight;

  const rowPosition = rowIndex + 1;
  const resourceIndex = rowsPerPerson.findIndex((_, index, array) => {
    const sumOfRows = array.slice(0, index + 1).reduce((acc, cur) => acc + cur, 0);
    return sumOfRows >= rowPosition;
  });

  const disposition = getOccupancy<TMeta>(
    config,
    resourcesData[resourceIndex],
    resourceIndex,
    focusedDate,
    zoom,
    workingDurationsPerPerson[resourceIndex],
    holidayRequestsPerPerson[resourceIndex]
  );
  return { coords: { x: alignedPos, y: yPos }, resourceIndex, disposition };
};
