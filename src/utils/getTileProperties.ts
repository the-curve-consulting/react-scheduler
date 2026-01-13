import dayjs from "dayjs";
import { boxHeight, tileYOffset } from "@/constants";
import { SchedulerProjectData, TileProperties } from "@/types/global";
import { getCellWidth, getTilePositionRelativeToCenter } from "@/utils/scrollHelpers";

export const getTileProperties = (
  row: number,
  data: SchedulerProjectData,
  currentCenterDate: dayjs.Dayjs,
  zoom: number,
  viewportWidth: number
): TileProperties => {
  const y = row * boxHeight + tileYOffset;
  const tileStartDate = dayjs(data.startDate);
  const x = getTilePositionRelativeToCenter(tileStartDate, currentCenterDate, zoom, viewportWidth);

  // Calculate width based on duration
  const tileEndDate = dayjs(data.endDate);
  const cellWidth = getCellWidth(zoom);
  let duration: number;

  switch (zoom) {
    case 0:
      duration = tileEndDate.diff(tileStartDate, "weeks");
      break;
    case 1:
      duration = tileEndDate.diff(tileStartDate, "days");
      break;
    case 2:
      duration = tileEndDate.diff(tileStartDate, "hours");
      break;
    default:
      duration = tileEndDate.diff(tileStartDate, "days");
  }

  const width = duration * cellWidth;

  return { y, x, width };
};
