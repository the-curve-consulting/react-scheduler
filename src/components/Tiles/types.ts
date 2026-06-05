import type { ReactElement } from "react";
import dayjs from "dayjs";
import { PaginatedSchedulerData, SchedulerProjectData, WorkingDuration } from "@/types/global";

export type ResourceTilesProps<TMeta = unknown> = {
  zoom: number;
  data: SchedulerProjectData<TMeta>[][];
  rows: number;
  onTileClick?: (data: SchedulerProjectData<TMeta>) => void;
  visibleStart: number;
  visibleEnd: number;
  workingDurations: WorkingDuration[];
  defaultStartHour?: number;
};

export type ResourceTilesComponent = <TMeta = unknown>(
  props: ResourceTilesProps<TMeta>
) => React.ReactElement | null;

export type TilesProps<TMeta = unknown> = {
  zoom: number;
  data: PaginatedSchedulerData<TMeta>;
  onTileClick?: (data: SchedulerProjectData<TMeta>) => void;
  visibleRange: { startDate: dayjs.Dayjs; endDate: dayjs.Dayjs };
  workingDurationsPerPerson: WorkingDuration[][];
  defaultStartHour?: number;
};

export type TilesComponent = <TMeta = unknown>(
  props: TilesProps<TMeta>
) => React.ReactElement | null;

export type PlacedTiles = ReactElement[];
