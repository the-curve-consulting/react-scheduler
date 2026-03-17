import {
  Config,
  SchedulerData,
  SchedulerItemClickData,
  SchedulerProjectData
} from "@/types/global";

export type CalendarProps<TMeta = unknown> = {
  config: Config;
  data: SchedulerData<TMeta>;
  topBarWidth: number;
  onTileClick?: (data: SchedulerProjectData<TMeta>) => void;
  onItemClick?: (data: SchedulerItemClickData<TMeta>) => void;
  toggleTheme?: () => void;
};
