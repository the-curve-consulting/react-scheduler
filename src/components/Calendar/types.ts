import {
  Config,
  HolidayRequest,
  SchedulerData,
  SchedulerItemClickData,
  SchedulerProjectData
} from "@/types/global";

export type CalendarProps<TMeta = unknown> = {
  config: Config;
  data: SchedulerData<TMeta>;
  topBarWidth: number;
  onTileClick?: (data: SchedulerProjectData<TMeta>) => void;
  onHolidayTileClick?: (data: HolidayRequest) => void;
  onItemClick?: (data: SchedulerItemClickData<TMeta>) => void;
  toggleTheme?: () => void;
};
