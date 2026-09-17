import dayjs from "dayjs";
import { SchedulerProjectData, SchedulerProjectDayData, SchedulerTileChange } from "@/types/global";
import { DayRun } from "@/utils/getTileSegments";

export type TileProps<TMeta = unknown> = {
  row: number;
  data: SchedulerProjectData<TMeta>;
  startDate: dayjs.Dayjs;
  endDate: dayjs.Dayjs;
  working: boolean;
  nonWorkingRuns: DayRun[];
  zoom: number;
  dragging?: boolean;
  onTileClick?: (data: SchedulerProjectData<TMeta>) => void;
  onGestureStart?: (event: React.PointerEvent, reason: SchedulerTileChange["reason"]) => void;
};

export type HourlyTileProps<TMeta = unknown> = {
  row: number;
  dayData: SchedulerProjectDayData<TMeta>;
  onTileClick?: (data: SchedulerProjectData<TMeta>) => void;
};

export type HolidayTileProps = {
  rowIndex: number;
  rowNo: number;
  startDate: dayjs.Dayjs;
  endDate: dayjs.Dayjs;
  zoom: number;
  onTileClick?: (startDate: dayjs.Dayjs, endDate: dayjs.Dayjs) => void;
};

export type StyledTextProps = {
  bold?: boolean;
};

export type StyledTintedProps = {
  $tinted?: boolean;
  $dragging?: boolean;
  $draggable?: boolean;
};

export type StyledStickyWrapperProps = {
  $offset: number;
};

export type TileComponent = <TMeta = unknown>(props: TileProps<TMeta>) => React.ReactElement | null;

export type HourlyTileComponent = <TMeta = unknown>(
  props: HourlyTileProps<TMeta>
) => React.ReactElement | null;

export type HolidayTileComponent = (props: HolidayTileProps) => React.ReactElement | null;
