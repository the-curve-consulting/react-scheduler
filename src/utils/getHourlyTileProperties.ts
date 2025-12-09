import dayjs from "dayjs";
import { boxHeight, tileYOffset } from "@/constants";
import { TileProperties } from "@/types/global";
import { getTileXAndWidth } from "./getTileXAndWidth";

export const getHourlyTileProperties = (
  row: number,
  startDate: dayjs.Dayjs,
  endDate: dayjs.Dayjs,
  resourceStartDate: dayjs.Dayjs,
  resourceEndDate: dayjs.Dayjs
): TileProperties => {
  const y = row * boxHeight + tileYOffset;
  const rangeStartHour = startDate.hour();
  const rangeEndHour = endDate.hour();
  const parsedStartDate = dayjs(startDate).hour(rangeStartHour).minute(0);
  const parsedEndDate = dayjs(endDate).hour(rangeEndHour).minute(0);

  return {
    ...getTileXAndWidth(
      { startDate: resourceStartDate, endDate: resourceEndDate },
      { startDate: parsedStartDate, endDate: parsedEndDate },
      2
    ),
    y
  };
};
