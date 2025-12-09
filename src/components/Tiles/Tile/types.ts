import { SchedulerProjectData, SchedulerProjectDayData } from "@/types/global";
import { DatesRange } from "@/utils/getDatesRange";

export type TileProps = {
  row: number;
  data: SchedulerProjectData;
  zoom: number;
  datesRange: DatesRange;
  onTileClick?: (data: SchedulerProjectData) => void;
};

export type HourlyTileProps = {
  row: number;
  dayData: SchedulerProjectDayData;
  datesRange: DatesRange;
  onTileClick?: (data: SchedulerProjectData) => void;
};

export type StyledTextProps = {
  bold?: boolean;
};
