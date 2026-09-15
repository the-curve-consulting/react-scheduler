import {
  Config,
  HolidayTileClickData,
  SchedulerData,
  SchedulerItemClickData,
  SchedulerProjectData,
  SchedulerToolbar
} from "@/types/global";

export type CalendarProps<TMeta = unknown> = {
  config: Config;
  data: SchedulerData<TMeta>;
  topBarWidth: number;
  onTileClick?: (data: SchedulerProjectData<TMeta>) => void;
  onHolidayTileClick?: (data: HolidayTileClickData) => void;
  onItemClick?: (data: SchedulerItemClickData<TMeta>) => void;
  toggleTheme?: () => void;
  toolbar?: SchedulerToolbar;
};
