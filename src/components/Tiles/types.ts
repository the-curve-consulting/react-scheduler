import type { ReactElement } from "react";
import { HolidayTileClickData, SchedulerProjectData } from "@/types/global";
import { VisibleLayoutResource, VisibleRange } from "@/utils/visibleGridLayout";
import {
  HourlyVisibleLayoutResource,
  RangeVisibleLayoutResource
} from "@/utils/visibleGridLayout/types";

export type HourlyResourceTilesProps<TMeta = unknown> = {
  visibleLayoutResource: HourlyVisibleLayoutResource<TMeta>;
  rowOffset: number;
  onTileClick?: (data: SchedulerProjectData<TMeta>) => void;
};

export type RangeResourceTilesProps<TMeta = unknown> = {
  visibleLayoutResource: RangeVisibleLayoutResource<TMeta>;
  zoom: number;
  rowOffset: number;
  visibleRange: VisibleRange;
  onTileClick?: (data: SchedulerProjectData<TMeta>) => void;
};

export type ResourceTilesProps<TMeta = unknown> = {
  visibleLayoutResource: VisibleLayoutResource<TMeta>;
  zoom: number;
  rowOffset: number;
  onTileClick?: (data: SchedulerProjectData<TMeta>) => void;
  onHolidayTileClick?: (data: HolidayTileClickData) => void;
  visibleRange: VisibleRange;
};

export type ResourceTilesComponent = <TMeta = unknown>(
  props: ResourceTilesProps<TMeta>
) => React.ReactElement | null;

export type TilesProps<TMeta = unknown> = {
  zoom: number;
  visibleLayoutsPerResource: VisibleLayoutResource<TMeta>[];
  onTileClick?: (data: SchedulerProjectData<TMeta>) => void;
  onHolidayTileClick?: (data: HolidayTileClickData) => void;
  visibleRange: VisibleRange;
};

export type TilesComponent = <TMeta = unknown>(
  props: TilesProps<TMeta>
) => React.ReactElement | null;

export type PlacedTiles = ReactElement[];
