import dayjs from "dayjs";
import { boxHeight, tileYOffset, zoom2ColumnWidth } from "@/constants";
import { TileProperties } from "@/types/global";
import { getTilePositionRelativeToCenter } from "./scrollHelpers";

/**
 * Calculates absolute tile geometry for one hourly-view tile.
 *
 * @param row Vertical resource row index.
 * @param currentCenterDate Date currently centered in the calendar viewport.
 * @param cols Number of visible calendar columns.
 * @param resourceStartDate Exact start date-time of the hourly tile.
 * @param resourceEndDate Exact end date-time of the hourly tile.
 * @returns Tile position, width, and working-state metadata.
 */
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

  return { y, x, width, working: true };
};
