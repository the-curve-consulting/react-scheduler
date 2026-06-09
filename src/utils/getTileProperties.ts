import dayjs from "dayjs";
import { boxHeight, tileYOffset } from "@/constants";
import { TileProperties } from "@/types/global";
import { getCellWidth, getTilePositionRelativeToCenter } from "@/utils/scrollHelpers";

/**
 * Calculates absolute tile geometry for one already-split tile segment.
 *
 * @param row Vertical resource row index.
 * @param startDate Segment start date.
 * @param endDate Segment end date.
 * @param currentCenterDate Date currently centered in the calendar viewport.
 * @param zoom Current zoom level.
 * @param cols Number of visible calendar columns.
 * @param working Whether the segment represents working time.
 * @returns Tile position, width, and working-state metadata.
 */
export const getTileProperties = (
  row: number,
  startDate: dayjs.Dayjs,
  endDate: dayjs.Dayjs,
  currentCenterDate: dayjs.Dayjs,
  zoom: number,
  cols: number,
  working: boolean
): TileProperties => {
  const y = row * boxHeight + tileYOffset;
  const tileStartDate = startDate.startOf("day");
  const x = getTilePositionRelativeToCenter(tileStartDate, currentCenterDate, zoom, cols);

  // Calculate width based on duration
  const tileEndDate = endDate.endOf("day");
  const cellWidth = getCellWidth(zoom);
  let duration: number;

  switch (zoom) {
    case 0: {
      const days = Math.ceil(tileEndDate.diff(tileStartDate, "days", true));
      duration = days / 7;
      break;
    }
    case 1:
      duration = Math.ceil(tileEndDate.diff(tileStartDate, "days", true));
      break;
    case 2:
      duration = tileEndDate.diff(tileStartDate, "hours");
      break;
    default:
      duration = tileEndDate.diff(tileStartDate, "days");
  }

  const width = duration * cellWidth;

  return { y, x, width, working };
};
