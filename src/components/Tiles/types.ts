import dayjs from "dayjs";
import { PaginatedSchedulerData, SchedulerProjectData } from "@/types/global";

export type TilesProps<TMeta = unknown> = {
  zoom: number;
  data: PaginatedSchedulerData<TMeta>;
  onTileClick?: (data: SchedulerProjectData<TMeta>) => void;
  visibleRange: { startDate: dayjs.Dayjs; endDate: dayjs.Dayjs };
  defaultStartHour?: number;
};

export type TilesComponent = <TMeta = unknown>(
  props: TilesProps<TMeta>
) => React.ReactElement | null;

export type PlacedTiles = JSX.Element[];
