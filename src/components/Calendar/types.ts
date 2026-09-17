import {
  Config,
  HolidayTileClickData,
  SchedulerData,
  SchedulerEmptyClickData,
  SchedulerItemClickData,
  SchedulerProjectData,
  SchedulerTileChange,
  SchedulerToolbar
} from "@/types/global";

export type CalendarProps<TMeta = unknown> = {
  config: Config;
  data: SchedulerData<TMeta>;
  topBarWidth: number;
  onTileClick?: (data: SchedulerProjectData<TMeta>) => void;
  onHolidayTileClick?: (data: HolidayTileClickData) => void;
  onItemClick?: (data: SchedulerItemClickData<TMeta>) => void;
  onEmptyClick?: (data: SchedulerEmptyClickData) => void;
  onTileChange?: (change: SchedulerTileChange, data: SchedulerProjectData<TMeta>) => void;
  toggleTheme?: () => void;
  toolbar?: SchedulerToolbar;
};

export type RowsData = {
  totalRows: number;
  rowsPerResource: number[];
};
