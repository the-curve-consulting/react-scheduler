import dayjs from "dayjs";
import { PaginatedSchedulerData, SchedulerProjectData } from "@/types/global";

export type TilesProps = {
  zoom: number;
  data: PaginatedSchedulerData;
  onTileClick?: (data: SchedulerProjectData) => void;
  visibleRange: { startDate: dayjs.Dayjs; endDate: dayjs.Dayjs };
  defaultStartHour?: number;
};

export type PlacedTiles = JSX.Element[];
