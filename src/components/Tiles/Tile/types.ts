import { SchedulerProjectData, SchedulerProjectDayData } from "@/types/global";

export type TileProps<TMeta = unknown> = {
  row: number;
  data: SchedulerProjectData<TMeta>;
  zoom: number;
  onTileClick?: (data: SchedulerProjectData<TMeta>) => void;
};

export type HourlyTileProps<TMeta = unknown> = {
  row: number;
  dayData: SchedulerProjectDayData<TMeta>;
  onTileClick?: (data: SchedulerProjectData<TMeta>) => void;
};

export type StyledTextProps = {
  bold?: boolean;
};

export type StyledStickyWrapperProps = {
  $offset: number;
};

export type TileComponent = <TMeta = unknown>(props: TileProps<TMeta>) => React.ReactElement | null;

export type HourlyTileComponent = <TMeta = unknown>(
  props: HourlyTileProps<TMeta>
) => React.ReactElement | null;
