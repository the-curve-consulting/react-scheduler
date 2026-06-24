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
 * @param precise Whether exact start/end timestamps should be preserved outside hourly zoom.
 * @returns Tile position, width, and working-state metadata.
 */
export const getTileProperties = (
  row: number,
  startDate: dayjs.Dayjs,
  endDate: dayjs.Dayjs,
  currentCenterDate: dayjs.Dayjs,
  zoom: number,
  cols: number,
  working: boolean,
  precise: boolean = false
): TileProperties => {
  const y = row * boxHeight + tileYOffset;
  const tileStartDate = !precise && zoom !== 2 ? startDate.startOf("day") : startDate;
  const tileEndDate = !precise && zoom !== 2 ? endDate.endOf("day") : endDate;
  const x = getTilePositionRelativeToCenter(tileStartDate, currentCenterDate, zoom, cols, precise);
  const cellWidth = getCellWidth(zoom);

  let duration: number;

  switch (zoom) {
    case 0: {
      const diff = tileEndDate.diff(tileStartDate, "days", true);
      duration = precise ? diff / 7 : Math.ceil(diff) / 7;
      break;
    }
    case 1: {
      const diff = tileEndDate.diff(tileStartDate, "days", true);
      duration = precise ? diff : Math.ceil(diff);
      break;
    }
    case 2:
      duration = tileEndDate.diff(tileStartDate, "hours", true);
      break;
    default:
      duration = tileEndDate.diff(tileStartDate, "days", true);
  }

  return { y, x, width: duration * cellWidth, working };
};
