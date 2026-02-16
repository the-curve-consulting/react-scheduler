import { SchedulerProjectData, SchedulerProjectDayData } from "@/types/global";

export type TileProps = {
  row: number;
  data: SchedulerProjectData;
  zoom: number;
  onTileClick?: (data: SchedulerProjectData) => void;
};

export type HourlyTileProps = {
  row: number;
  dayData: SchedulerProjectDayData;
  onTileClick?: (data: SchedulerProjectData) => void;
};

export type StyledTextProps = {
  bold?: boolean;
};
