import dayjs from "dayjs";
import { boxHeight, tileYOffset, zoom2ColumnWidth } from "@/constants";
import { TileProperties } from "@/types/global";
import { getTilePositionRelativeToCenter } from "./scrollHelpers";

export const getHourlyTileProperties = (
  row: number,
  currentCenterDate: dayjs.Dayjs,
  cols: number,
  resourceStartDate: dayjs.Dayjs,
  resourceEndDate: dayjs.Dayjs
): TileProperties => {
  const y = row * boxHeight + tileYOffset;
  const x = getTilePositionRelativeToCenter(resourceStartDate, currentCenterDate, 2, cols);

  const durationHours = resourceEndDate.diff(resourceStartDate, "hours", true);
  const width = durationHours * zoom2ColumnWidth;

  return { y, x, width };
};
